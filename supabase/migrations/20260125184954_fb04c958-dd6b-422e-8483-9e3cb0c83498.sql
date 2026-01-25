-- Create storage bucket for generated audios
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-audios', 'generated-audios', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own audios
CREATE POLICY "Users can upload their own audios"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated-audios' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own audios
CREATE POLICY "Users can read their own audios"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-audios' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to audios (since bucket is public)
CREATE POLICY "Public can read audios"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'generated-audios');

-- Allow users to delete their own audios
CREATE POLICY "Users can delete their own audios"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-audios' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);