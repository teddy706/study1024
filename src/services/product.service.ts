import { supabase } from '../config/supabase'
import type { Database } from '../types/supabase'

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export class ProductService {
  /**
   * 사용자의 모든 상품 조회
   */
  async getProducts(): Promise<Product[]> {
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('상품 조회 오류:', error)
      throw error
    }

    return data || []
  }

  /**
   * 특정 상품 조회
   */
  async getProduct(id: string): Promise<Product | null> {
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('상품 상세 조회 오류:', error)
      throw error
    }

    return data
  }

  /**
   * 상품 등록
   */
  async createProduct(product: Omit<ProductInsert, 'user_id'>): Promise<Product> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user?.id) {
      throw new Error('로그인이 필요합니다.')
    }

    const { data, error } = await (supabase as any)
      .from('products')
      .insert({
        ...product,
        user_id: user.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('상품 등록 오류:', error)
      throw error
    }

    return data as Product
  }

  /**
   * 상품 수정
   */
  async updateProduct(id: string, updates: ProductUpdate): Promise<Product> {
    const { data, error } = await (supabase as any)
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('상품 수정 오류:', error)
      throw error
    }

    return data
  }

  /**
   * 상품 삭제 (soft delete - is_active를 false로 변경)
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('products')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('상품 삭제 오류:', error)
      throw error
    }
  }

  /**
   * 고객 관심사 기반 상품 추천
   * @param interests 고객 관심사 키워드들
   * @param limit 추천할 상품 개수 (기본값: 3)
   */
  async getRecommendedProducts(interests: string, limit = 3): Promise<Product[]> {
    if (!interests || interests.trim() === '') {
      // 관심사가 없으면 최신 상품 반환
      const { data, error } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('기본 상품 추천 오류:', error)
        return []
      }

      return data || []
    }

    // 관심사 키워드 추출 (쉼표, 공백으로 분리)
    const keywords = interests
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(k => k.length > 1)

    if (keywords.length === 0) {
      return this.getRecommendedProducts('', limit)
    }

    try {
      // 키워드 매칭 상품 조회
      let query = (supabase as any)
        .from('products')
        .select('*')
        .eq('is_active', true)

      // 각 키워드에 대해 OR 조건으로 검색
      const orConditions = keywords.map(keyword => 
        `target_keywords.cs.{${keyword}},name.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%`
      ).join(',')

      const { data, error } = await query
        .or(orConditions)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('키워드 기반 상품 추천 오류:', error)
        // 오류 시 기본 상품 반환
        return this.getRecommendedProducts('', limit)
      }

      return data || []
    } catch (error) {
      console.error('상품 추천 처리 오류:', error)
      return this.getRecommendedProducts('', limit)
    }
  }

  /**
   * 카테고리별 상품 조회
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('카테고리별 상품 조회 오류:', error)
      throw error
    }

    return data || []
  }

  /**
   * 상품 검색
   */
  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('상품 검색 오류:', error)
      throw error
    }

    return data || []
  }
}

// 싱글톤 인스턴스 생성
export const productService = new ProductService()