// src/services/movementService.js - Versión simplificada con trigger
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
      console.log('📦 Creando movimiento:', movement)

      // Validar stock disponible ANTES de crear el movimiento (solo para salidas)
      // El trigger de la BD actualizará el stock automáticamente
      if (movement.tipo === 'salida') {
        const { data: producto, error: productoError } = await supabase
          .from('productos')
          .select('cantidad, nombre')
          .eq('id', movement.producto_id)
          .single()
        
        if (productoError || !producto) {
          throw new Error('Producto no encontrado')
        }
        
        console.log(`📊 Stock actual de "${producto.nombre}": ${producto.cantidad}`)
        console.log(`📤 Intentando retirar: ${movement.cantidad}`)
        
        if (producto.cantidad < movement.cantidad) {
          throw new Error(
            `Stock insuficiente de "${producto.nombre}". ` +
            `Disponible: ${producto.cantidad}, intentando retirar: ${movement.cantidad}`
          )
        }
      }

      // Crear el movimiento - El trigger actualizará el stock automáticamente
      const { data: movementData, error: movementError } = await supabase
        .from('movimientos')
        .insert([{
          ...movement,
          fecha: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (movementError) {
        console.error('❌ Error en insert:', movementError)
        throw movementError
      }
      
      console.log('✅ Movimiento creado exitosamente. ID:', movementData.id)
      console.log('🔄 El trigger actualizará el stock automáticamente.')
      
      return { data: movementData, error: null }
    } catch (error) {
      console.error('❌ Error creating movement:', error)
      return { 
        data: null, 
        error: {
          message: error.message || 'Error al crear movimiento'
        }
      }
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