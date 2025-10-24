import { processBusinessCard } from './index';
import { createClient } from '@supabase/supabase-js';
import vision from '@google-cloud/vision';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('@google-cloud/vision');

describe('Business Card OCR Processing', () => {
  const mockImagePath = 'test/sample-card.jpg';
  const mockUserId = 'test-user-123';
  const mockImageBuffer = Buffer.from('mock-image-data');
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock Supabase storage download
    const mockSupabase = {
      storage: {
        from: jest.fn().mockReturnThis(),
        download: jest.fn().mockResolvedValue({
          data: mockImageBuffer,
          error: null
        })
      },
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null })
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    
    // Mock Vision API response
    const mockVisionClient = {
      textDetection: jest.fn().mockResolvedValue([{
        textAnnotations: [{
          description: 'John Doe\nSenior Developer\nTech Corp\njohn@tech.com\n02-1234-5678'
        }]
      }])
    };
    (vision.ImageAnnotatorClient as jest.Mock).mockImplementation(() => mockVisionClient);
  });

  test('should successfully process a business card image', async () => {
    const result = await processBusinessCard(mockImagePath, mockUserId);
    
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      name: 'John Doe',
      title: 'Senior Developer',
      company: 'Tech Corp',
      email: 'john@tech.com',
      phone: '02-1234-5678'
    });
  });

  test('should handle image download errors', async () => {
    const mockSupabase = {
      storage: {
        from: jest.fn().mockReturnThis(),
        download: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Download failed')
        })
      }
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    const result = await processBusinessCard(mockImagePath, mockUserId);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to download image');
  });

  test('should handle OCR processing errors', async () => {
    const mockVisionClient = {
      textDetection: jest.fn().mockRejectedValue(new Error('OCR failed'))
    };
    (vision.ImageAnnotatorClient as jest.Mock).mockImplementation(() => mockVisionClient);

    const result = await processBusinessCard(mockImagePath, mockUserId);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('OCR failed');
  });

  test('should handle empty OCR results', async () => {
    const mockVisionClient = {
      textDetection: jest.fn().mockResolvedValue([{
        textAnnotations: []
      }])
    };
    (vision.ImageAnnotatorClient as jest.Mock).mockImplementation(() => mockVisionClient);

    const result = await processBusinessCard(mockImagePath, mockUserId);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('No text detected in the image');
  });
});