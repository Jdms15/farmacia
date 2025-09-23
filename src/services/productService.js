// src/services/productService.js
import { supabase } from './supabase'

export const productService = {
  async getProducts(filters = {}) {
    let query = supabase
      .from('productos')
      .select(`
        *,
        movimientos(*)
      `)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filters.search) {
      query = query.or(`nombre.ilike.%${filters.search}%,laboratorio.ilike.%${filters.search}%,lote.ilike.%${filters.search}%`)
    }
    
    if (filters.proximosVencer) {
      const fechaLimite = new Date()
      fechaLimite.setDate(fechaLimite.getDate() + 30)
      query = query.lte('fecha_vencimiento', fechaLimite.toISOString().split('T')[0])
    }
    
    if (filters.bajoStock) {
      // Usar una consulta más simple para bajo stock
      query = query.lt('cantidad', 10) // Usar un valor fijo o filtrar después
    }
    
    if (filters.refrigeracion !== undefined) {
      query = query.eq('necesita_refrigeracion', filters.refrigeracion)
    }

    const { data, error } = await query
    
    // Filtrar bajo stock en el cliente si es necesario
    if (filters.bajoStock && data) {
      const filteredData = data.filter(product => product.cantidad <= product.stock_minimo)
      return { data: filteredData, error }
    }
    
    return { data, error }
  },

  async getProductById(id) {
    const { data, error } = await supabase
      .from('productos')
      .select(`
        *,
        movimientos(*)
      `)
      .eq('id', id)
      .single()
    
    return { data, error }
  },

  async createProduct(product) {
    const { data, error } = await supabase
      .from('productos')
      .insert([product])
      .select()
      .single()
    
    return { data, error }
  },

  async updateProduct(id, updates) {
    const { data, error } = await supabase
      .from('productos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  async deleteProduct(id) {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id)
    
    return { error }
  },

  async getProductsNearExpiry(days = 30) {
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() + days)
    
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .lte('fecha_vencimiento', fechaLimite.toISOString().split('T')[0])
      .gt('fecha_vencimiento', new Date().toISOString().split('T')[0]) // No incluir vencidos
      .order('fecha_vencimiento', { ascending: true })
    
    return { data, error }
  },

  async getProductsLowStock() {
    // Obtener todos los productos y filtrar en el cliente
    const { data, error } = await supabase
      .from('productos')
      .select('*')
    
    if (error) return { data: null, error }
    
    // Filtrar productos con bajo stock
    const lowStockProducts = data.filter(product => product.cantidad <= product.stock_minimo)
    
    return { data: lowStockProducts, error: null }
  },

  // Función alternativa usando vista si está disponible
  async getProductsLowStockWithView() {
    const { data, error } = await supabase
      .from('vista_productos_stock')
      .select('*')
      .eq('bajo_stock', true)
    
    return { data, error }
  },

  // Función para obtener estadísticas del dashboard
  async getDashboardStats() {
    try {
      // Obtener todos los productos
      const { data: productos, error: productosError } = await supabase
        .from('productos')
        .select('*')
      
      if (productosError) throw productosError

      const today = new Date()
      const in30Days = new Date()
      in30Days.setDate(today.getDate() + 30)

      const stats = {
        totalProducts: productos.length,
        lowStock: productos.filter(p => p.cantidad <= p.stock_minimo).length,
        nearExpiry: productos.filter(p => {
          const expiryDate = new Date(p.fecha_vencimiento)
          return expiryDate <= in30Days && expiryDate > today
        }).length,
        refrigeration: productos.filter(p => p.necesita_refrigeracion).length,
        expired: productos.filter(p => new Date(p.fecha_vencimiento) <= today).length
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}