// Firestore Hooks - Copie para src/hooks/useFirestore.ts no novo projeto
import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  QueryConstraint,
  DocumentData,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============================================
// Hook: useDocument - Buscar documento único
// ============================================
export function useDocument<T = DocumentData>(
  collectionName: string,
  documentId: string | null
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setData(null);
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, documentId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao buscar documento:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, documentId]);

  return { data, loading, error };
}

// ============================================
// Hook: useCollection - Buscar coleção
// ============================================
export function useCollection<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  enabled: boolean = true
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao buscar coleção:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(constraints), enabled]);

  return { data, loading, error };
}

// ============================================
// Hook: useUserCollection - Coleção filtrada por usuário
// ============================================
export function useUserCollection<T = DocumentData>(
  collectionName: string,
  userId: string | null,
  additionalConstraints: QueryConstraint[] = []
) {
  const constraints = userId
    ? [where('user_id', '==', userId), ...additionalConstraints]
    : [];

  return useCollection<T>(collectionName, constraints, !!userId);
}

// ============================================
// Funções CRUD
// ============================================

// Criar documento
export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: Omit<T, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const collectionRef = collection(db, collectionName);
  
  const docRef = await addDoc(collectionRef, {
    ...data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  
  return docRef.id;
}

// Atualizar documento
export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionName, documentId);
  
  await updateDoc(docRef, {
    ...data,
    updated_at: serverTimestamp(),
  });
}

// Deletar documento
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  const docRef = doc(db, collectionName, documentId);
  await deleteDoc(docRef);
}

// Buscar documento único (sem realtime)
export async function getDocument<T = DocumentData>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  const docRef = doc(db, collectionName, documentId);
  const snapshot = await getDoc(docRef);
  
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as T;
  }
  
  return null;
}

// Buscar coleção (sem realtime)
export async function getCollection<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
}

// Batch write - múltiplas operações atômicas
export async function batchWrite(
  operations: Array<{
    type: 'create' | 'update' | 'delete';
    collection: string;
    id?: string;
    data?: DocumentData;
  }>
): Promise<void> {
  const batch = writeBatch(db);

  for (const op of operations) {
    if (op.type === 'create' && op.data) {
      const docRef = doc(collection(db, op.collection));
      batch.set(docRef, {
        ...op.data,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } else if (op.type === 'update' && op.id && op.data) {
      const docRef = doc(db, op.collection, op.id);
      batch.update(docRef, {
        ...op.data,
        updated_at: serverTimestamp(),
      });
    } else if (op.type === 'delete' && op.id) {
      const docRef = doc(db, op.collection, op.id);
      batch.delete(docRef);
    }
  }

  await batch.commit();
}

// ============================================
// Helpers para queries
// ============================================
export { where, orderBy, limit, query, collection, doc, Timestamp };

// Exemplo de uso:
// const constraints = [
//   where('status', '==', 'active'),
//   orderBy('created_at', 'desc'),
//   limit(10)
// ];
// const { data, loading } = useCollection('posts', constraints);
