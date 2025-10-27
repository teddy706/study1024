-- Create storage bucket for business cards
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-cards', 'business-cards', false);

-- Enable RLS for business-cards bucket
CREATE POLICY "Users can upload their own business cards"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-cards' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own business cards"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-cards' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own business cards"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-cards' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
