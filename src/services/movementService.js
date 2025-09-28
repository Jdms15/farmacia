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
    try {
      // Validar stock disponible ANTES de crear el movimiento (solo para salidas)
      if (movement.tipo === 'salida') {
        const stockValidation = await this.validateStock(movement.producto_id, movement.cantidad)
        if (!stockValidation.valid) {
          throw new Error(stockValidation.message)
        }
      }

      // Solo crear el movimiento - NO actualizar el stock directamente
      const { data: movementData, error: movementError } = await supabase
        .from('movimientos')
        .insert([{
          ...movement,
          fecha: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (movementError) {
        throw movementError
      }
      
      return { data: movementData, error: null }
    } catch (error) {
      console.error('Error creating movement:', error)
      return { data: null, error }
    }
  },

  // Nueva función para validar stock disponible
  async validateStock(productoId, cantidadSalida) {
    try {
      const stockActual = await this.getProductCurrentStock(productoId)
      
      if (stockActual < cantidadSalida) {
        return {
          valid: false,
          message: `Stock insuficiente. Stock disponible: ${stockActual}, intentando retirar: ${cantidadSalida}`
        }
      }
      
      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        message: 'Error al validar stock: ' + error.message
      }
    }
  },

  // Función para obtener el stock actual calculado desde movimientos
  async getProductCurrentStock(productoId) {
    try {
      // Obtener cantidad inicial del producto
      const { data: producto, error: productoError } = await supabase
        .from('productos')
        .select('cantidad')
        .eq('id', productoId)
        .single()
      
      if (productoError || !producto) {
        throw new Error('Producto no encontrado')
      }

      // Obtener todos los movimientos del producto
      const { data: movimientos, error: movimientosError } = await supabase
        .from('movimientos')
        .select('tipo, cantidad')
        .eq('producto_id', productoId)
      
      if (movimientosError) {
        throw new Error('Error al obtener movimientos')
      }

      // Calcular stock actual
      let stockCalculado = producto.cantidad // Cantidad inicial

      if (movimientos && movimientos.length > 0) {
        const totalEntradas = movimientos
          .filter(m => m.tipo === 'entrada')
          .reduce((sum, m) => sum + m.cantidad, 0)
        
        const totalSalidas = movimientos
          .filter(m => m.tipo === 'salida')
          .reduce((sum, m) => sum + m.cantidad, 0)
        
        stockCalculado = producto.cantidad + totalEntradas - totalSalidas
      }

      return Math.max(0, stockCalculado) // No permitir stock negativo
    } catch (error) {
      console.error('Error calculating current stock:', error)
      throw error
    }
  },

  // ELIMINAR la función updateProductQuantity ya que no la necesitamos
  // El stock se calcula dinámicamente desde los movimientos

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