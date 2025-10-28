// src/store/productsStore.js
import { create } from 'zustand'
import { productService } from '../services/productService'
import toast from 'react-hot-toast'

export const useProductsStore = create((set, get) => ({
  products: [],
  filteredProducts: [],
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
      // Obtener todos los productos sin filtros de búsqueda
      const { data, error } = await productService.getProducts({})
      
      if (error) throw error
      
      // Procesar productos
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
      
      // Aplicar filtros si existen
      const filtersToUse = customFilters || get().filters
      get().applyFilters(filtersToUse)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Error al cargar productos')
      set({ loading: false })
    }
  },

  // Aplicar filtros en el cliente
  applyFilters: (filters) => {
    const { products } = get()
    
    let filtered = [...products]
    
    // Filtro de búsqueda
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase().trim()
      filtered = filtered.filter(product => 
        product.nombre.toLowerCase().includes(searchLower) ||
        product.laboratorio.toLowerCase().includes(searchLower) ||
        product.lote.toLowerCase().includes(searchLower) ||
        product.ubicacion.toLowerCase().includes(searchLower) ||
        product.proveedor.toLowerCase().includes(searchLower) ||
        product.presentacion.toLowerCase().includes(searchLower)
      )
    }
    
    // Filtro próximos a vencer
    if (filters.proximosVencer) {
      filtered = filtered.filter(product => {
        const days = product.diasParaVencer
        return days > 0 && days <= 30
      })
    }
    
    // Filtro bajo stock
    if (filters.bajoStock) {
      filtered = filtered.filter(product => 
        product.cantidad <= product.stock_minimo
      )
    }
    
    // Filtro refrigeración
    if (filters.refrigeracion !== undefined) {
      filtered = filtered.filter(product => 
        product.necesita_refrigeracion === filters.refrigeracion
      )
    }
    
    set({ filteredProducts: filtered, filters })
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
    const updatedFilters = { ...get().filters, ...newFilters }
    get().applyFilters(updatedFilters)
  },

  // Limpiar filtros
  clearFilters: () => {
    const defaultFilters = {
      search: '',
      proximosVencer: false,
      bajoStock: false,
      refrigeracion: undefined
    }
    get().applyFilters(defaultFilters)
  }
}))