// src/services/solicitudService.js
import { supabase } from './supabase'

export const solicitudService = {
  // Obtener todas las solicitudes (filtradas por RLS según el rol)
  async getSolicitudes(filters = {}) {
    let query = supabase
      .from('solicitudes_medicamentos')
      .select(`
        *,
        productos(nombre, laboratorio, precio, cantidad, presentacion),
        perfiles!solicitudes_medicamentos_solicitante_id_fkey(nombre),
        aprobador:perfiles!solicitudes_medicamentos_aprobado_por_fkey(nombre),
        entregador:perfiles!solicitudes_medicamentos_entregado_por_fkey(nombre)
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

  // Crear nueva solicitud
  async createSolicitud(solicitudData) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre')
        .eq('id', user.id)
        .single()

      // Obtener precio del producto
      const { data: producto } = await supabase
        .from('productos')
        .select('precio, cantidad')
        .eq('id', solicitudData.producto_id)
        .single()

      if (!producto) throw new Error('Producto no encontrado')

      // Verificar stock disponible
      if (producto.cantidad < solicitudData.cantidad) {
        throw new Error(`Stock insuficiente. Disponible: ${producto.cantidad}`)
      }

      const newSolicitud = {
        ...solicitudData,
        solicitante_id: user.id,
        solicitante_nombre: profile?.nombre || user.email?.split('@')[0],
        precio_unitario: producto.precio,
        estado: 'pendiente'
      }

      const { data, error } = await supabase
        .from('solicitudes_medicamentos')
        .insert([newSolicitud])
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error creating solicitud:', error)
      return { data: null, error }
    }
  },

  // Aprobar solicitud
  async aprobarSolicitud(solicitudId, notas = '') {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre')
        .eq('id', user.id)
        .single()

      const { data, error } = await supabase
        .from('solicitudes_medicamentos')
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
      console.error('Error aprobando solicitud:', error)
      return { data: null, error }
    }
  },

  // Rechazar solicitud
  async rechazarSolicitud(solicitudId, razon) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre')
        .eq('id', user.id)
        .single()

      const { data, error } = await supabase
        .from('solicitudes_medicamentos')
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
      console.error('Error rechazando solicitud:', error)
      return { data: null, error }
    }
  },

  // Marcar como entregada
  async entregarSolicitud(solicitudId, notas = '') {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      // Obtener la solicitud
      const { data: solicitud } = await supabase
        .from('solicitudes_medicamentos')
        .select('*, productos(cantidad)')
        .eq('id', solicitudId)
        .single()

      if (!solicitud) throw new Error('Solicitud no encontrada')
      if (solicitud.estado !== 'aprobada') throw new Error('La solicitud debe estar aprobada')

      // Verificar stock disponible
      if (solicitud.productos.cantidad < solicitud.cantidad) {
        throw new Error(`Stock insuficiente. Disponible: ${solicitud.productos.cantidad}`)
      }

      const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre')
        .eq('id', user.id)
        .single()

      // Actualizar solicitud
      const { data, error } = await supabase
        .from('solicitudes_medicamentos')
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

      // Crear movimiento de salida
      await supabase.from('movimientos').insert([{
        producto_id: solicitud.producto_id,
        tipo: 'salida',
        cantidad: solicitud.cantidad,
        motivo: `Solicitud #${solicitudId.substring(0, 8)} - ${solicitud.motivo || 'Solicitud de medicamento'}`,
        usuario: profile?.nombre || user.email?.split('@')[0],
        user_id: user.id
      }])

      return { data, error: null }
    } catch (error) {
      console.error('Error entregando solicitud:', error)
      return { data: null, error }
    }
  },

  // Cancelar solicitud (solo el solicitante)
  async cancelarSolicitud(solicitudId) {
    try {
      const { data, error } = await supabase
        .from('solicitudes_medicamentos')
        .update({
          estado: 'cancelada'
        })
        .eq('id', solicitudId)
        .eq('estado', 'pendiente') // Solo se pueden cancelar pendientes
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error cancelando solicitud:', error)
      return { data: null, error }
    }
  },

  // Obtener estadísticas de solicitudes
  async getEstadisticas() {
    try {
      const { data, error } = await supabase
        .from('solicitudes_medicamentos')
        .select('estado, cantidad, subtotal')

      if (error) throw error

      const stats = {
        total: data.length,
        pendientes: data.filter(s => s.estado === 'pendiente').length,
        aprobadas: data.filter(s => s.estado === 'aprobada').length,
        entregadas: data.filter(s => s.estado === 'entregada').length,
        rechazadas: data.filter(s => s.estado === 'rechazada').length,
        valorTotal: data
          .filter(s => s.estado === 'entregada')
          .reduce((sum, s) => sum + (s.subtotal || 0), 0)
      }

      return { data: stats, error: null }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return { data: null, error }
    }
  }
}