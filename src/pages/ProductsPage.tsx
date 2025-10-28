import React, { useState, useEffect } from 'react'
import { productService } from '../services/product.service'
import type { Product } from '../services/product.service'
import Navbar from '../components/dashboard/Navbar'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    currency: 'KRW',
    image_url: '',
    target_keywords: '',
    sales_pitch: ''
  })

  const categories = [
    'Software', 'Hardware', 'Service', 'Consulting', 
    'Training', 'Support', 'License', 'Other'
  ]

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.getProducts()
      setProducts(data)
    } catch (error) {
      console.error('상품 로딩 오류:', error)
      alert('상품 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.category.trim()) {
      alert('상품명과 카테고리는 필수입니다.')
      return
    }

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category.trim(),
        price: formData.price ? parseFloat(formData.price) : null,
        currency: formData.currency,
        image_url: formData.image_url.trim() || null,
        target_keywords: formData.target_keywords.trim() 
          ? formData.target_keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
          : null,
        sales_pitch: formData.sales_pitch.trim() || null
      }

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productData)
        alert('상품이 수정되었습니다!')
      } else {
        await productService.createProduct(productData)
        alert('상품이 등록되었습니다!')
      }

      resetForm()
      loadProducts()
    } catch (error) {
      console.error('상품 저장 오류:', error)
      alert('상품 저장에 실패했습니다.')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price?.toString() || '',
      currency: product.currency,
      image_url: product.image_url || '',
      target_keywords: product.target_keywords?.join(', ') || '',
      sales_pitch: product.sales_pitch || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`"${product.name}" 상품을 삭제하시겠습니까?`)) return

    try {
      await productService.deleteProduct(product.id)
      alert('상품이 삭제되었습니다.')
      loadProducts()
    } catch (error) {
      console.error('상품 삭제 오류:', error)
      alert('상품 삭제에 실패했습니다.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      currency: 'KRW',
      image_url: '',
      target_keywords: '',
      sales_pitch: ''
    })
    setEditingProduct(null)
    setShowForm(false)
  }

  const formatPrice = (price: number | null, currency: string) => {
    if (!price) return '문의'
    return `${price.toLocaleString()}${currency === 'KRW' ? '원' : currency}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">상품 관리</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">영업용 상품을 등록하고 관리하세요</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-medium text-sm sm:text-base"
          >
            ➕ 새 상품 등록
          </button>
        </div>

          {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {editingProduct ? '상품 수정' : '새 상품 등록'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상품명 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="상품명을 입력하세요"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      카테고리 *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">카테고리 선택</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        가격
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        통화
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="KRW">KRW</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상품 설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="상품에 대한 자세한 설명을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연관 키워드 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={formData.target_keywords}
                    onChange={(e) => setFormData({ ...formData, target_keywords: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예: CRM, 고객관리, 영업, 마케팅"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    고객 관심사와 매칭하여 상품을 추천할 때 사용됩니다
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    영업 멘트
                  </label>
                  <textarea
                    value={formData.sales_pitch}
                    onChange={(e) => setFormData({ ...formData, sales_pitch: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="스몰톡에서 사용할 자연스러운 상품 소개 멘트"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이미지 URL (선택)
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/product-image.jpg"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    className="w-full sm:flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {editingProduct ? '수정하기' : '등록하기'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg shadow-gray-200/50 overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              {product.image_url && (
                <div className="h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full whitespace-nowrap ml-2">
                    {product.category}
                  </span>
                </div>

                {product.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {product.description}
                  </p>
                )}

                <div className="mb-4">
                  <div className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
                    {formatPrice(product.price, product.currency)}
                  </div>
                  
                  {product.target_keywords && product.target_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.target_keywords.slice(0, 3).map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                      {product.target_keywords.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{product.target_keywords.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {product.sales_pitch && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                      <p className="text-blue-700 text-sm italic">
                        "{product.sales_pitch}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="sm:w-auto px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">등록된 상품이 없습니다</h3>
            <p className="text-gray-500 mb-6">첫 번째 상품을 등록하여 스몰톡에서 추천해보세요!</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              상품 등록하기
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default ProductsPage