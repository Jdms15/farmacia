// src/services/statsService.js - Servicio para estadísticas y rotación de productos
import { supabase } from './supabase'

export const statsService = {
  // Obtener productos con más rotación (más movimientos)
  async getTopRotatingProducts(limit = 10) {
    try {
      // Obtener todos los productos con sus movimientos
      const { data: productos, error } = await supabase
        .from('productos')
        .select(`
          id,
          nombre,
          laboratorio,
          presentacion,
          cantidad,
          ubicacion,
          movimientos(cantidad, tipo, fecha)
        `)
        .order('nombre', { ascending: true })

      if (error) throw error

      // Calcular rotación para cada producto
      const productosConRotacion = productos.map(producto => {
        const totalMovimientos = producto.movimientos?.length || 0
        const totalEntradas = producto.movimientos
          ?.filter(m => m.tipo === 'entrada')
          .reduce((sum, m) => sum + m.cantidad, 0) || 0
        const totalSalidas = producto.movimientos
          ?.filter(m => m.tipo === 'salida')
          .reduce((sum, m) => sum + m.cantidad, 0) || 0
        
        // Calcular rotación total (entradas + salidas)
        const rotacionTotal = totalEntradas + totalSalidas
        
        // Calcular velocidad de rotación (movimientos por día desde el primer movimiento)
        let velocidadRotacion = 0
        if (producto.movimientos && producto.movimientos.length > 0) {
          const fechas = producto.movimientos.map(m => new Date(m.fecha).getTime())
          const fechaMasAntigua = Math.min(...fechas)
          const fechaMasReciente = Math.max(...fechas)
          const diasTranscurridos = Math.max(1, (fechaMasReciente - fechaMasAntigua) / (1000 * 60 * 60 * 24))
          velocidadRotacion = rotacionTotal / diasTranscurridos
        }

        return {
          id: producto.id,
          nombre: producto.nombre,
          laboratorio: producto.laboratorio,
          presentacion: producto.presentacion,
          cantidad: producto.cantidad,
          ubicacion: producto.ubicacion,
          totalMovimientos,
          totalEntradas,
          totalSalidas,
          rotacionTotal,
          velocidadRotacion: velocidadRotacion.toFixed(2)
        }
      })

      // Ordenar por rotación total (descendente) y tomar el top
      const topProductos = productosConRotacion
        .sort((a, b) => b.rotacionTotal - a.rotacionTotal)
        .slice(0, limit)

      return { data: topProductos, error: null }
    } catch (error) {
      console.error('Error obteniendo productos con más rotación:', error)
      return { data: [], error }
    }
  },

  // Obtener productos con menos rotación
  async getLowRotatingProducts(limit = 10) {
    try {
      const { data: productos, error } = await supabase
        .from('productos')
        .select(`
          id,
          nombre,
          laboratorio,
          presentacion,
          cantidad,
          ubicacion,
          fecha_entrada,
          movimientos(cantidad, tipo, fecha)
        `)
        .order('nombre', { ascending: true })

      if (error) throw error

      const productosConRotacion = productos.map(producto => {
        const totalMovimientos = producto.movimientos?.length || 0
        const totalEntradas = producto.movimientos
          ?.filter(m => m.tipo === 'entrada')
          .reduce((sum, m) => sum + m.cantidad, 0) || 0
        const totalSalidas = producto.movimientos
          ?.filter(m => m.tipo === 'salida')
          .reduce((sum, m) => sum + m.cantidad, 0) || 0
        
        const rotacionTotal = totalEntradas + totalSalidas
        
        // Calcular días desde entrada
        const diasDesdeEntrada = Math.floor(
          (new Date() - new Date(producto.fecha_entrada)) / (1000 * 60 * 60 * 24)
        )

        let velocidadRotacion = 0
        if (producto.movimientos && producto.movimientos.length > 0) {
          const fechas = producto.movimientos.map(m => new Date(m.fecha).getTime())
          const fechaMasAntigua = Math.min(...fechas)
          const fechaMasReciente = Math.max(...fechas)
          const diasTranscurridos = Math.max(1, (fechaMasReciente - fechaMasAntigua) / (1000 * 60 * 60 * 24))
          velocidadRotacion = rotacionTotal / diasTranscurridos
        }

        return {
          id: producto.id,
          nombre: producto.nombre,
          laboratorio: producto.laboratorio,
          presentacion: producto.presentacion,
          cantidad: producto.cantidad,
          ubicacion: producto.ubicacion,
          totalMovimientos,
          totalEntradas,
          totalSalidas,
          rotacionTotal,
          velocidadRotacion: velocidadRotacion.toFixed(2),
          diasDesdeEntrada
        }
      })

      // Ordenar por rotación total (ascendente) y tomar los que menos rotan
      const lowProductos = productosConRotacion
        .sort((a, b) => a.rotacionTotal - b.rotacionTotal)
        .slice(0, limit)

      return { data: lowProductos, error: null }
    } catch (error) {
      console.error('Error obteniendo productos con menos rotación:', error)
      return { data: [], error }
    }
  },

  // Obtener resumen general de rotación
  async getRotationSummary() {
    try {
      const { data: productos, error } = await supabase
        .from('productos')
        .select(`
          id,
          movimientos(cantidad, tipo)
        `)

      if (error) throw error

      const productosConMovimientos = productos.filter(p => p.movimientos && p.movimientos.length > 0)
      const productosSinMovimientos = productos.filter(p => !p.movimientos || p.movimientos.length === 0)

      const totalMovimientos = productos.reduce((sum, p) => {
        return sum + (p.movimientos?.length || 0)
      }, 0)

      const totalEntradas = productos.reduce((sum, p) => {
        return sum + (p.movimientos
          ?.filter(m => m.tipo === 'entrada')
          .reduce((s, m) => s + m.cantidad, 0) || 0)
      }, 0)

      const totalSalidas = productos.reduce((sum, p) => {
        return sum + (p.movimientos
          ?.filter(m => m.tipo === 'salida')
          .reduce((s, m) => s + m.cantidad, 0) || 0)
      }, 0)

      return {
        data: {
          totalProductos: productos.length,
          productosConMovimientos: productosConMovimientos.length,
          productosSinMovimientos: productosSinMovimientos.length,
          totalMovimientos,
          totalEntradas,
          totalSalidas,
          porcentajeConMovimientos: ((productosConMovimientos.length / productos.length) * 100).toFixed(1)
        },
        error: null
      }
    } catch (error) {
      console.error('Error obteniendo resumen de rotación:', error)
      return { data: null, error }
    }
  }
}