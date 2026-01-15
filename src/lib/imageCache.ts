// IndexedDB helper for caching generated scene images

const DB_NAME = 'scene-images-cache';
const DB_VERSION = 2;
const STORE_NAME = 'images';
const BATCH_STORE_NAME = 'batch-images';

interface CachedImage {
  sceneNumber: number;
  imageData: string; // base64
  prompt: string;
  timestamp: number;
}

interface BatchCachedImage {
  id: string;
  imageData: string;
  prompt: string;
  timestamp: number;
  wasRewritten?: boolean;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'sceneNumber' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains(BATCH_STORE_NAME)) {
        const batchStore = db.createObjectStore(BATCH_STORE_NAME, { keyPath: 'id' });
        batchStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

export const saveImageToCache = async (sceneNumber: number, imageData: string, prompt: string): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const cachedImage: CachedImage = {
      sceneNumber,
      imageData,
      prompt,
      timestamp: Date.now(),
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(cachedImage);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.error('Error saving image to cache:', error);
  }
};

export const getImageFromCache = async (sceneNumber: number): Promise<string | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    const result = await new Promise<CachedImage | undefined>((resolve, reject) => {
      const request = store.get(sceneNumber);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    return result?.imageData || null;
  } catch (error) {
    console.error('Error getting image from cache:', error);
    return null;
  }
};

export const getAllCachedImages = async (): Promise<Map<number, string>> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    const results = await new Promise<CachedImage[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    
    const imageMap = new Map<number, string>();
    results.forEach(item => {
      imageMap.set(item.sceneNumber, item.imageData);
    });
    
    return imageMap;
  } catch (error) {
    console.error('Error getting all cached images:', error);
    return new Map();
  }
};

export const getCacheStats = async (): Promise<{ count: number; lastUpdated: Date | null }> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    
    const results = await new Promise<CachedImage[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    
    if (results.length === 0) {
      return { count: 0, lastUpdated: null };
    }
    
    const latestTimestamp = Math.max(...results.map(r => r.timestamp));
    return { 
      count: results.length, 
      lastUpdated: new Date(latestTimestamp) 
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { count: 0, lastUpdated: null };
  }
};

export const clearImageCache = async (): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.error('Error clearing image cache:', error);
  }
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export const cleanupOldCacheEntries = async (): Promise<number> => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    const results = await new Promise<CachedImage[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    
    const now = Date.now();
    const oldEntries = results.filter(item => (now - item.timestamp) > THREE_DAYS_MS);
    
    for (const entry of oldEntries) {
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(entry.sceneNumber);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    db.close();
    
    if (oldEntries.length > 0) {
      console.log(`Cache cleanup: removed ${oldEntries.length} entries older than 3 days`);
    }
    
    return oldEntries.length;
  } catch (error) {
    console.error('Error cleaning up old cache entries:', error);
    return 0;
  }
};

// ========== BATCH IMAGE CACHE FUNCTIONS ==========

export const saveBatchImageToCache = async (id: string, imageData: string, prompt: string, wasRewritten?: boolean): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(BATCH_STORE_NAME, 'readwrite');
    const store = tx.objectStore(BATCH_STORE_NAME);
    
    const cachedImage: BatchCachedImage = {
      id,
      imageData,
      prompt,
      timestamp: Date.now(),
      wasRewritten,
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(cachedImage);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.error('Error saving batch image to cache:', error);
  }
};

export const getBatchImageFromCache = async (id: string): Promise<BatchCachedImage | null> => {
  try {
    const db = await openDB();
    const tx = db.transaction(BATCH_STORE_NAME, 'readonly');
    const store = tx.objectStore(BATCH_STORE_NAME);

    const result = await new Promise<BatchCachedImage | undefined>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return result || null;
  } catch (error) {
    console.error('Error getting batch image from cache:', error);
    return null;
  }
};

export const getAllBatchCachedImages = async (): Promise<BatchCachedImage[]> => {
  try {
    const db = await openDB();
    const tx = db.transaction(BATCH_STORE_NAME, 'readonly');
    const store = tx.objectStore(BATCH_STORE_NAME);
    
    const results = await new Promise<BatchCachedImage[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    
    // Sort by timestamp to maintain order
    return results.sort((a, b) => {
      // Extract index from id (img-timestamp-index)
      const indexA = parseInt(a.id.split('-').pop() || '0');
      const indexB = parseInt(b.id.split('-').pop() || '0');
      return indexA - indexB;
    });
  } catch (error) {
    console.error('Error getting batch cached images:', error);
    return [];
  }
};

export const getBatchCacheStats = async (): Promise<{ count: number; lastUpdated: Date | null }> => {
  try {
    const db = await openDB();
    const tx = db.transaction(BATCH_STORE_NAME, 'readonly');
    const store = tx.objectStore(BATCH_STORE_NAME);
    
    const results = await new Promise<BatchCachedImage[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    
    db.close();
    
    if (results.length === 0) {
      return { count: 0, lastUpdated: null };
    }
    
    const latestTimestamp = Math.max(...results.map(r => r.timestamp));
    return { 
      count: results.length, 
      lastUpdated: new Date(latestTimestamp) 
    };
  } catch (error) {
    console.error('Error getting batch cache stats:', error);
    return { count: 0, lastUpdated: null };
  }
};

export const clearBatchImageCache = async (): Promise<void> => {
  try {
    const db = await openDB();
    const tx = db.transaction(BATCH_STORE_NAME, 'readwrite');
    const store = tx.objectStore(BATCH_STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    db.close();
  } catch (error) {
    console.error('Error clearing batch image cache:', error);
  }
};
