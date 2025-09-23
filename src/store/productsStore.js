// src/store/productsStore.js
import { create } from 'zustand'
import { productService } from '../services/productService'
import toast from 'react-hot-toast'

export const useProductsStore = create((set, get) => ({
  products: [],
  loading: false,
  filters: {
    search: '',
    proximosVencer: false,
    bajoStock: false,
    refrigeracion: undefined
  },
  
  // Obtener productos
  fetchProducts: async (customFilters = null) => {
    set({ loading: true })
    try {
      const filtersToUse = customFilters || get().filters
      const { data, error } = await productService.getProducts(filtersToUse)
      
      if (error) throw error
      
      // Calcular inventario disponible y próximo vencimiento
      const processedProducts = data.map(product => {
        const entradas = product.movimientos
          ?.filter(m => m.tipo === 'entrada')
          ?.reduce((sum, m) => sum + m.cantidad, 0) || 0
        
        const salidas = product.movimientos
          ?.filter(m => m.tipo === 'salida')
          ?.reduce((sum, m) => sum + m.cantidad, 0) || 0
        
        return {
          ...product,
          inventarioDisponible: entradas - salidas,
          diasParaVencer: Math.ceil(
            (new Date(product.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
          )
        }
      })
      
      set({ products: processedProducts, loading: false })
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Error al cargar productos')
      set({ loading: false })
    }
  },

  // Crear producto
  createProduct: async (productData) => {
    try {
      const { data, error } = await productService.createProduct(productData)
      if (error) throw error
      
      await get().fetchProducts()
      toast.success('Producto creado exitosamente')
      return { success: true, data }
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Error al crear producto')
      return { success: false, error }
    }
  },

  // Actualizar producto
  updateProduct: async (id, updates) => {
    try {
      const { data, error } = await productService.updateProduct(id, updates)
      if (error) throw error
      
      await get().fetchProducts()
      toast.success('Producto actualizado exitosamente')
      return { success: true, data }
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Error al actualizar producto')
      return { success: false, error }
    }
  },

  // Eliminar producto
  deleteProduct: async (id) => {
    try {
      const { error } = await productService.deleteProduct(id)
      if (error) throw error
      
      await get().fetchProducts()
      toast.success('Producto eliminado exitosamente')
      return { success: true }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Error al eliminar producto')
      return { success: false, error }
    }
  },

  // Actualizar filtros
  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } })
  },

  // Limpiar filtros
  clearFilters: () => {
    set({ 
      filters: {
        search: '',
        proximosVencer: false,
        bajoStock: false,
        refrigeracion: undefined
      }
    })
  }
}))