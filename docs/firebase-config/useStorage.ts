// Firebase Storage Hook - Copie para src/hooks/useStorage.ts no novo projeto
import { useState, useCallback } from 'react';
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { toast } from 'sonner';

interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

// ============================================
// Hook: useStorage - Upload e gerenciamento de arquivos
// ============================================
export function useStorage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Upload simples (sem progresso)
  const uploadFile = useCallback(async (
    file: File,
    path: string,
    fileName?: string
  ): Promise<UploadResult> => {
    setUploading(true);
    setError(null);

    try {
      const finalName = fileName || `${Date.now()}-${file.name}`;
      const fullPath = `${path}/${finalName}`;
      const storageRef = ref(storage, fullPath);

      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      const result: UploadResult = {
        url,
        path: fullPath,
        name: finalName,
        size: file.size,
        type: file.type,
      };

      return result;
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setError(err);
      toast.error('Erro ao fazer upload do arquivo.');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  // Upload com progresso
  const uploadFileWithProgress = useCallback(async (
    file: File,
    path: string,
    fileName?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    setProgress({ progress: 0, bytesTransferred: 0, totalBytes: file.size });

    return new Promise((resolve, reject) => {
      const finalName = fileName || `${Date.now()}-${file.name}`;
      const fullPath = `${path}/${finalName}`;
      const storageRef = ref(storage, fullPath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progressData: UploadProgress = {
            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
          };
          setProgress(progressData);
          onProgress?.(progressData);
        },
        (err) => {
          console.error('Erro no upload:', err);
          setError(err);
          setUploading(false);
          setProgress(null);
          toast.error('Erro ao fazer upload do arquivo.');
          reject(err);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            
            const result: UploadResult = {
              url,
              path: fullPath,
              name: finalName,
              size: file.size,
              type: file.type,
            };

            setUploading(false);
            setProgress(null);
            resolve(result);
          } catch (err: any) {
            setError(err);
            setUploading(false);
            setProgress(null);
            reject(err);
          }
        }
      );
    });
  }, []);

  // Deletar arquivo
  const deleteFile = useCallback(async (path: string): Promise<void> => {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (err: any) {
      console.error('Erro ao deletar arquivo:', err);
      toast.error('Erro ao deletar arquivo.');
      throw err;
    }
  }, []);

  // Listar arquivos em um diretório
  const listFiles = useCallback(async (path: string): Promise<{
    name: string;
    fullPath: string;
    url: string;
  }[]> => {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);

      const files = await Promise.all(
        result.items.map(async (itemRef) => ({
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url: await getDownloadURL(itemRef),
        }))
      );

      return files;
    } catch (err: any) {
      console.error('Erro ao listar arquivos:', err);
      throw err;
    }
  }, []);

  // Obter URL de download
  const getFileUrl = useCallback(async (path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    return getDownloadURL(storageRef);
  }, []);

  // Obter metadados do arquivo
  const getFileMetadata = useCallback(async (path: string) => {
    const storageRef = ref(storage, path);
    return getMetadata(storageRef);
  }, []);

  return {
    uploadFile,
    uploadFileWithProgress,
    deleteFile,
    listFiles,
    getFileUrl,
    getFileMetadata,
    uploading,
    progress,
    error,
  };
}

// ============================================
// Helpers para organização de pastas
// ============================================

// Gerar path para uploads de usuário
export function getUserUploadPath(userId: string, folder: string): string {
  return `users/${userId}/${folder}`;
}

// Gerar path para imagens geradas
export function getGeneratedImagesPath(userId: string): string {
  return `users/${userId}/generated-images`;
}

// Gerar path para áudios
export function getAudioPath(userId: string): string {
  return `users/${userId}/audio`;
}

// Gerar path para thumbnails
export function getThumbnailsPath(userId: string): string {
  return `users/${userId}/thumbnails`;
}

// Gerar path para avatares
export function getAvatarPath(userId: string): string {
  return `users/${userId}/avatar`;
}

// Validar tipo de arquivo
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// Validar tamanho de arquivo (em bytes)
export function validateFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}

// Formatar tamanho de arquivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
