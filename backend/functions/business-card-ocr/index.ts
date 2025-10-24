import { createClient } from '@supabase/supabase-js';
import vision from '@google-cloud/vision';
import { Buffer } from 'buffer';

interface BusinessCard {
  name?: string;
  company?: string;
  title?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}

interface OCRResult {
  success: boolean;
  data?: BusinessCard;
  error?: string;
}

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Google Cloud Vision 클라이언트 초기화
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

export async function processBusinessCard(
  imagePath: string,
  userId: string
): Promise<OCRResult> {
  try {
    // 1. Supabase Storage에서 이미지 다운로드
    const { data: imageData, error: downloadError } = await supabase
      .storage
      .from('business-cards')
      .download(imagePath);

    if (downloadError) {
      throw new Error(`Failed to download image: ${downloadError.message}`);
    }

    // 2. Google Cloud Vision API로 OCR 수행
    const [result] = await visionClient.textDetection(
      Buffer.from(await imageData.arrayBuffer())
    );

    const textAnnotations = result.textAnnotations || [];
    if (textAnnotations.length === 0) {
      throw new Error('No text detected in the image');
    }

    // 3. 명함 정보 추출
    const fullText = textAnnotations[0].description || '';
    const businessCard = extractBusinessCardInfo(fullText);

    // 4. Supabase Database에 결과 저장
    const { error: insertError } = await supabase
      .from('business_cards')
      .insert({
        user_id: userId,
        image_path: imagePath,
        raw_text: fullText,
        extracted_info: businessCard,
        status: 'completed'
      });

    if (insertError) {
      throw new Error(`Failed to save results: ${insertError.message}`);
    }

    return {
      success: true,
      data: businessCard
    };

  } catch (error) {
    console.error('Error processing business card:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

function extractBusinessCardInfo(text: string): BusinessCard {
  const lines = text.split('\n');
  const info: BusinessCard = {};

  // 이메일 주소 추출
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    info.email = emailMatch[0];
  }

  // 전화번호 추출
  const phoneRegex = /(\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4}|\+\d{2,3}\s?\d{2,3}[-\s]?\d{3,4}[-\s]?\d{4})/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    info.phone = phoneMatch[0].replace(/\s+/g, '-');
  }

  // 웹사이트 추출
  const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i;
  const websiteMatch = text.match(websiteRegex);
  if (websiteMatch) {
    info.website = websiteMatch[0];
  }

  // 이름과 직함 추출 (첫 번째/두 번째 줄 기준)
  if (lines.length > 0) {
    info.name = lines[0].trim();
  }
  if (lines.length > 1) {
    info.title = lines[1].trim();
  }

  // 회사명 추출 (일반적으로 세 번째 줄이나 굵은 글씨)
  if (lines.length > 2) {
    info.company = lines[2].trim();
  }

  // 주소 추출 (가장 긴 줄 또는 우편번호 포함된 줄)
  const addressLine = lines.find(line => 
    line.match(/\d{5}/) || // 우편번호 패턴
    line.match(/[가-힣]+시\s*[가-힣]+구?/) || // 시/구 패턴
    line.length > 20 // 긴 텍스트 패턴
  );
  if (addressLine) {
    info.address = addressLine.trim();
  }

  return info;
}