// src/services/multiRequestsService.js - Solicitudes con múltiples productos
import { supabase } from './supabase'

export const multiRequestsService = {
  // Crear solicitud con múltiples productos
  async createMultiProductSolicitud(solicitudData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre')
        .eq('id', user.id)
        .single()

      // Validar que haya productos
      if (!solicitudData.productos || solicitudData.productos.length === 0) {
        throw new Error('Debe incluir al menos un producto')
      }

      // Validar stock y calcular total para cada producto
      const productosValidados = []
      let valorTotal = 0

      for (const item of solicitudData.productos) {
        const { data: producto } = await supabase
          .from('productos')
          .select('precio, cantidad, nombre')
          .eq('id', item.producto_id)
          .single()

        if (!producto) {
          throw new Error(`Producto ${item.producto_id} no encontrado`)
        }

        if (producto.cantidad < item.cantidad) {
          throw new Error(
            `Stock insuficiente de "${producto.nombre}". Disponible: ${producto.cantidad}, solicitado: ${item.cantidad}`
          )
        }

        const subtotal = item.cantidad * producto.precio
        valorTotal += subtotal

        productosValidados.push({
          producto_id: item.producto_id,
          producto_nombre: producto.nombre,
          cantidad: item.cantidad,
          precio_unitario: producto.precio,
          subtotal
        })
      }

      // Crear solicitud principal
      const { data: solicitud, error: solicitudError } = await supabase
        .from('solicitudes_medicamentos_multi')
        .insert([{
          solicitante_id: user.id,
          solicitante_nombre: profile?.nombre || user.email?.split('@')[0],
          motivo: solicitudData.motivo,
          prioridad: solicitudData.prioridad,
          estado: 'pendiente',
          valor_total: valorTotal
        }])
        .select()
        .single()

      if (solicitudError) throw solicitudError

      // Crear detalles (items de la solicitud)
      const detalles = productosValidados.map(p => ({
        solicitud_id: solicitud.id,
        producto_id: p.producto_id,
        producto_nombre: p.producto_nombre,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario,
        subtotal: p.subtotal
      }))

      const { error: detallesError } = await supabase
        .from('solicitudes_detalles')
        .insert(detalles)

      if (detallesError) {
        // Rollback: eliminar solicitud si falla al crear detalles
        await supabase
          .from('solicitudes_medicamentos_multi')
          .delete()
          .eq('id', solicitud.id)
        throw detallesError
      }

      return { data: { ...solicitud, detalles: productosValidados }, error: null }
    } catch (error) {
      console.error('Error creating multi-product solicitud:', error)
      return { data: null, error }
    }
  },

  // Obtener solicitudes con sus detalles
  async getSolicitudesConDetalles(filters = {}) {
    let query = supabase
      .from('solicitudes_medicamentos_multi')
      .select(`
        *,
        solicitudes_detalles(
          *,
          productos(nombre, laboratorio, presentacion)
        )
      `)
      .order('fecha_solicitud', { ascending: false })

    if (filters.estado) {
      query = query.eq('estado', filters.estado)
    }

    if (filters.prioridad) {
      query = query.eq('prioridad', filters.prioridad)
    }

    if (filters.solicitante_id) {
      query = query.eq('solicitante_id', filters.solicitante_id)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Aprobar solicitud multi-producto
  async aprobarSolicitudMulti(solicitudId, notas = '') {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre')
        .eq('id', user.id)
        .single()

      const { data, error } = await supabase
        .from('solicitudes_medicamentos_multi')
        .update({
          estado: 'aprobada',
          aprobado_por: user.id,
          aprobado_por_nombre: profile?.nombre || user.email?.split('@')[0],
          notas_aprobacion: notas,
          fecha_aprobacion: new Date().toISOString()
        })
        .eq('id', solicitudId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error aprobando solicitud multi:', error)
      return { data: null, error }
    }
  },

  // Rechazar solicitud
  async rechazarSolicitudMulti(solicitudId, razon) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre')
        .eq('id', user.id)
        .single()

      const { data, error } = await supabase
        .from('solicitudes_medicamentos_multi')
        .update({
          estado: 'rechazada',
          aprobado_por: user.id,
          aprobado_por_nombre: profile?.nombre || user.email?.split('@')[0],
          razon_rechazo: razon,
          fecha_aprobacion: new Date().toISOString()
        })
        .eq('id', solicitudId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error rechazando solicitud multi:', error)
      return { data: null, error }
    }
  },

  // Entregar solicitud multi-producto
  async entregarSolicitudMulti(solicitudId, notas = '') {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Obtener solicitud con detalles
      const { data: solicitud } = await supabase
        .from('solicitudes_medicamentos_multi')
        .select(`
          *,
          solicitudes_detalles(
            producto_id,
            producto_nombre,
            cantidad
          )
        `)
        .eq('id', solicitudId)
        .single()

      if (!solicitud) throw new Error('Solicitud no encontrada')
      if (solicitud.estado !== 'aprobada') throw new Error('La solicitud debe estar aprobada')

      // Verificar stock de todos los productos
      for (const detalle of solicitud.solicitudes_detalles) {
        const { data: producto } = await supabase
          .from('productos')
          .select('cantidad, nombre')
          .eq('id', detalle.producto_id)
          .single()

        if (!producto) throw new Error(`Producto ${detalle.producto_nombre} no encontrado`)
        if (producto.cantidad < detalle.cantidad) {
          throw new Error(
            `Stock insuficiente de "${producto.nombre}". Disponible: ${producto.cantidad}, requerido: ${detalle.cantidad}`
          )
        }
      }

      const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre')
        .eq('id', user.id)
        .single()

      // Actualizar solicitud
      const { data, error } = await supabase
        .from('solicitudes_medicamentos_multi')
        .update({
          estado: 'entregada',
          entregado_por: user.id,
          entregado_por_nombre: profile?.nombre || user.email?.split('@')[0],
          notas_entrega: notas,
          fecha_entrega: new Date().toISOString()
        })
        .eq('id', solicitudId)
        .select()
        .single()

      if (error) throw error

      // Crear movimientos de salida para cada producto
      const movimientos = solicitud.solicitudes_detalles.map(detalle => ({
        producto_id: detalle.producto_id,
        tipo: 'salida',
        cantidad: detalle.cantidad,
        motivo: `Solicitud Multi #${solicitudId.substring(0, 8)} - ${solicitud.motivo || 'Solicitud de medicamentos'}`,
        usuario: profile?.nombre || user.email?.split('@')[0],
        user_id: user.id
      }))

      await supabase.from('movimientos').insert(movimientos)

      return { data, error: null }
    } catch (error) {
      console.error('Error entregando solicitud multi:', error)
      return { data: null, error }
    }
  },

  // Cancelar solicitud
  async cancelarSolicitudMulti(solicitudId) {
    try {
      const { data, error } = await supabase
        .from('solicitudes_medicamentos_multi')
        .update({
          estado: 'cancelada'
        })
        .eq('id', solicitudId)
        .eq('estado', 'pendiente')
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error cancelando solicitud multi:', error)
      return { data: null, error }
    }
  },

  // Obtener estadísticas
  async getEstadisticasMulti() {
    try {
      const { data, error } = await supabase
        .from('solicitudes_medicamentos_multi')
        .select('estado, valor_total')

      if (error) throw error

      const stats = {
        total: data.length,
        pendientes: data.filter(s => s.estado === 'pendiente').length,
        aprobadas: data.filter(s => s.estado === 'aprobada').length,
        entregadas: data.filter(s => s.estado === 'entregada').length,
        rechazadas: data.filter(s => s.estado === 'rechazada').length,
        valorTotal: data
          .filter(s => s.estado === 'entregada')
          .reduce((sum, s) => sum + (s.valor_total || 0), 0)
      }

      return { data: stats, error: null }
    } catch (error) {
      console.error('Error obteniendo estadísticas multi:', error)
      return { data: null, error }
    }
  }
}