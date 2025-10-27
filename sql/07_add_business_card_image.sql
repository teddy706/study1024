-- Add business_card_image_url column to contacts table
ALTER TABLE contacts 
ADD COLUMN business_card_image_url TEXT;

COMMENT ON COLUMN contacts.business_card_image_url IS '명함 이미지 Supabase Storage URL';
