import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface FileUploadRecord {
  bucket_name: string;
  file_path: string;
  file_size: number;
  file_type?: string;
}

export const useStorage = () => {
  const { user } = useAuth();
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [storageLimit, setStorageLimit] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const fetchStorage = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('storage_used, storage_limit')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setStorageUsed(data.storage_used || 0);
        setStorageLimit(data.storage_limit || 1);
      }
    } catch (error) {
      console.error('Error fetching storage:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshStorage = useCallback(() => {
    fetchStorage();
  }, [fetchStorage]);

  // Check if user can upload a file of given size (in bytes)
  const canUpload = useCallback(async (fileSizeBytes: number): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('can_user_upload', {
        p_user_id: user.id,
        p_file_size_bytes: fileSizeBytes
      });
      
      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error checking upload permission:', error);
      return false;
    }
  }, [user]);

  // Register a file upload to track storage
  const registerUpload = useCallback(async (record: FileUploadRecord): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if can upload first
      const canUploadFile = await canUpload(record.file_size);
      if (!canUploadFile) {
        toast.error("Limite de armazenamento atingido! Faça upgrade do seu plano.");
        return false;
      }

      const { error } = await supabase
        .from('user_file_uploads')
        .upsert({
          user_id: user.id,
          bucket_name: record.bucket_name,
          file_path: record.file_path,
          file_size: record.file_size,
          file_type: record.file_type
        }, {
          onConflict: 'bucket_name,file_path'
        });

      if (error) throw error;
      
      // Refresh storage after successful upload
      await fetchStorage();
      return true;
    } catch (error) {
      console.error('Error registering upload:', error);
      return false;
    }
  }, [user, canUpload, fetchStorage]);

  // Remove a file upload record when file is deleted
  const unregisterUpload = useCallback(async (bucketName: string, filePath: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_file_uploads')
        .delete()
        .eq('user_id', user.id)
        .eq('bucket_name', bucketName)
        .eq('file_path', filePath);

      if (error) throw error;
      
      // Refresh storage after deletion
      await fetchStorage();
      return true;
    } catch (error) {
      console.error('Error unregistering upload:', error);
      return false;
    }
  }, [user, fetchStorage]);

  // Get remaining storage in bytes
  const getRemainingBytes = useCallback((): number => {
    const usedBytes = storageUsed * 1073741824; // GB to bytes
    const limitBytes = storageLimit * 1073741824;
    return Math.max(0, limitBytes - usedBytes);
  }, [storageUsed, storageLimit]);

  // Format bytes to human readable
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  useEffect(() => {
    if (user) {
      fetchStorage();
    }
  }, [user, fetchStorage]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStorage();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshStorage]);

  const usagePercent = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;

  return {
    storageUsed,
    storageLimit,
    usagePercent,
    loading,
    refreshStorage,
    canUpload,
    registerUpload,
    unregisterUpload,
    getRemainingBytes,
    formatBytes,
  };
};
