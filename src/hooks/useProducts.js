// src/hooks/useProducts.js
import { useEffect } from 'react'
import { useProductsStore } from '../store/productsStore'

export const useProducts = () => {
  const {
    products,
    filteredProducts,
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
    filteredProducts,
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