// src/services/movementService.js
import { supabase } from './supabase'

export const movementService = {
  async getMovements(filters = {}) {
    let query = supabase
      .from('movimientos')
      .select(`
        *,
        productos(nombre, laboratorio)
      `)
      .order('fecha', { ascending: false })

    if (filters.productoId) {
      query = query.eq('producto_id', filters.productoId)
    }
    
    if (filters.tipo) {
      query = query.eq('tipo', filters.tipo)
    }
    
    if (filters.fechaInicio) {
      query = query.gte('fecha', filters.fechaInicio)
    }
    
    if (filters.fechaFin) {
      query = query.lte('fecha', filters.fechaFin)
    }

    const { data, error } = await query
    return { data, error }
  },

  async createMovement(movement) {
    const { data, error } = await supabase
      .from('movimientos')
      .insert([movement])
      .select()
      .single()
    
    // Actualizar cantidad del producto
    if (!error && data) {
      await this.updateProductQuantity(movement.producto_id, movement.tipo, movement.cantidad)
    }
    
    return { data, error }
  },

  async updateProductQuantity(productoId, tipo, cantidad) {
    const { data: producto } = await supabase
      .from('productos')
      .select('cantidad')
      .eq('id', productoId)
      .single()
    
    if (producto) {
      const nuevaCantidad = tipo === 'entrada' 
        ? producto.cantidad + cantidad 
        : producto.cantidad - cantidad
      
      await supabase
        .from('productos')
        .update({ 
          cantidad: Math.max(0, nuevaCantidad),
          updated_at: new Date().toISOString()
        })
        .eq('id', productoId)
    }
  },

  async getRecentMovements(limit = 10) {
    const { data, error } = await supabase
      .from('movimientos')
      .select(`
        *,
        productos(nombre, laboratorio)
      `)
      .order('fecha', { ascending: false })
      .limit(limit)
    
    return { data, error }
  }
}