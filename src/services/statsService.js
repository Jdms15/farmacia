// src/services/statsService.js - ACTUALIZADO con filtros de fecha
import { supabase } from './supabase'

export const statsService = {
  // Obtener productos con más rotación CON FILTROS DE FECHA
  async getTopRotatingProducts(limit = 10, dateFilters = {}) {
    try {
      // Construir query con filtros
      let movimientosQuery = supabase
        .from('movimientos')
        .select('producto_id, cantidad, tipo, fecha')

      // Aplicar filtros de fecha si existen
      if (dateFilters.fechaInicio) {
        movimientosQuery = movimientosQuery.gte('fecha', dateFilters.fechaInicio)
      }
      if (dateFilters.fechaFin) {
        const fechaFinAjustada = new Date(dateFilters.fechaFin)
        fechaFinAjustada.setHours(23, 59, 59, 999)
        movimientosQuery = movimientosQuery.lte('fecha', fechaFinAjustada.toISOString())
      }

      const { data: movimientos, error: movError } = await movimientosQuery

      if (movError) throw movError

      // Obtener todos los productos
      const { data: productos, error: prodError } = await supabase
        .from('productos')
        .select('id, nombre, laboratorio, presentacion, cantidad, ubicacion')
        .order('nombre', { ascending: true })

      if (prodError) throw prodError

      // Calcular rotación para cada producto
      const productosConRotacion = productos.map(producto => {
        const movimientosProducto = movimientos?.filter(m => m.producto_id === producto.id) || []
        
        const totalMovimientos = movimientosProducto.length
        const totalEntradas = movimientosProducto
          .filter(m => m.tipo === 'entrada')
          .reduce((sum, m) => sum + m.cantidad, 0)
        const totalSalidas = movimientosProducto
          .filter(m => m.tipo === 'salida')
          .reduce((sum, m) => sum + m.cantidad, 0)
        
        const rotacionTotal = totalEntradas + totalSalidas
        
        // Calcular velocidad de rotación
        let velocidadRotacion = 0
        if (movimientosProducto.length > 0) {
          const fechas = movimientosProducto.map(m => new Date(m.fecha).getTime())
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

      // Ordenar por rotación total y tomar el top
      const topProductos = productosConRotacion
        .sort((a, b) => b.rotacionTotal - a.rotacionTotal)
        .slice(0, limit)

      return { data: topProductos, error: null }
    } catch (error) {
      console.error('Error obteniendo productos con más rotación:', error)
      return { data: [], error }
    }
  },

  // Obtener productos con menos rotación CON FILTROS DE FECHA
  async getLowRotatingProducts(limit = 10, dateFilters = {}) {
    try {
      // Construir query con filtros
      let movimientosQuery = supabase
        .from('movimientos')
        .select('producto_id, cantidad, tipo, fecha')

      // Aplicar filtros de fecha
      if (dateFilters.fechaInicio) {
        movimientosQuery = movimientosQuery.gte('fecha', dateFilters.fechaInicio)
      }
      if (dateFilters.fechaFin) {
        const fechaFinAjustada = new Date(dateFilters.fechaFin)
        fechaFinAjustada.setHours(23, 59, 59, 999)
        movimientosQuery = movimientosQuery.lte('fecha', fechaFinAjustada.toISOString())
      }

      const { data: movimientos, error: movError } = await movimientosQuery

      if (movError) throw movError

      // Obtener todos los productos
      const { data: productos, error: prodError } = await supabase
        .from('productos')
        .select('id, nombre, laboratorio, presentacion, cantidad, ubicacion, fecha_entrada')
        .order('nombre', { ascending: true })

      if (prodError) throw prodError

      const productosConRotacion = productos.map(producto => {
        const movimientosProducto = movimientos?.filter(m => m.producto_id === producto.id) || []
        
        const totalMovimientos = movimientosProducto.length
        const totalEntradas = movimientosProducto
          .filter(m => m.tipo === 'entrada')
          .reduce((sum, m) => sum + m.cantidad, 0)
        const totalSalidas = movimientosProducto
          .filter(m => m.tipo === 'salida')
          .reduce((sum, m) => sum + m.cantidad, 0)
        
        const rotacionTotal = totalEntradas + totalSalidas
        
        // Calcular días desde entrada
        const diasDesdeEntrada = Math.floor(
          (new Date() - new Date(producto.fecha_entrada)) / (1000 * 60 * 60 * 24)
        )

        let velocidadRotacion = 0
        if (movimientosProducto.length > 0) {
          const fechas = movimientosProducto.map(m => new Date(m.fecha).getTime())
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

  // Obtener resumen general CON FILTROS DE FECHA
  async getRotationSummary(dateFilters = {}) {
    try {
      // Construir query con filtros
      let movimientosQuery = supabase
        .from('movimientos')
        .select('producto_id, cantidad, tipo')

      // Aplicar filtros de fecha
      if (dateFilters.fechaInicio) {
        movimientosQuery = movimientosQuery.gte('fecha', dateFilters.fechaInicio)
      }
      if (dateFilters.fechaFin) {
        const fechaFinAjustada = new Date(dateFilters.fechaFin)
        fechaFinAjustada.setHours(23, 59, 59, 999)
        movimientosQuery = movimientosQuery.lte('fecha', fechaFinAjustada.toISOString())
      }

      const { data: movimientos, error: movError } = await movimientosQuery

      if (movError) throw movError

      // Obtener todos los productos
      const { data: productos, error: prodError } = await supabase
        .from('productos')
        .select('id')

      if (prodError) throw prodError

      // Identificar productos con y sin movimientos
      const productosConMovimientos = new Set(movimientos?.map(m => m.producto_id) || [])
      const productosSinMovimientos = productos.filter(p => !productosConMovimientos.has(p.id))

      const totalMovimientos = movimientos?.length || 0
      const totalEntradas = movimientos
        ?.filter(m => m.tipo === 'entrada')
        .reduce((sum, m) => sum + m.cantidad, 0) || 0
      const totalSalidas = movimientos
        ?.filter(m => m.tipo === 'salida')
        .reduce((sum, m) => sum + m.cantidad, 0) || 0

      return {
        data: {
          totalProductos: productos.length,
          productosConMovimientos: productosConMovimientos.size,
          productosSinMovimientos: productosSinMovimientos.length,
          totalMovimientos,
          totalEntradas,
          totalSalidas,
          porcentajeConMovimientos: productos.length > 0 
            ? ((productosConMovimientos.size / productos.length) * 100).toFixed(1)
            : '0.0'
        },
        error: null
      }
    } catch (error) {
      console.error('Error obteniendo resumen de rotación:', error)
      return { data: null, error }
    }
  }
}