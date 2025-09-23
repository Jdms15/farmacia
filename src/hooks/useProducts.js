import { useEffect } from 'react'
import { useProductsStore } from '../store/productsStore'

export const useProducts = () => {
  const {
    products,
    loading,
    filters,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    setFilters,
    clearFilters
  } = useProductsStore()

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    loading,
    filters,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    setFilters,
    clearFilters
  }
}