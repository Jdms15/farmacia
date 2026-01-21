// src/services/permisosService.js
import { supabase } from './supabase'

export const permisosService = {
  // Obtener permisos de un usuario
  async getPermisos(userId) {
    try {
      const { data, error } = await supabase
        .from('permisos_usuarios')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Si no existen permisos, crearlos con valores por defecto
      if (error && error.code === 'PGRST116') {
        return await this.createPermisosDefault(userId)
      }

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error obteniendo permisos:', error)
      return { data: null, error }
    }
  },

  // Crear permisos por defecto para un usuario
  async createPermisosDefault(userId) {
    try {
      const { data, error } = await supabase
        .from('permisos_usuarios')
        .insert([{
          user_id: userId,
          puede_solicitar_medicamentos: true,
          puede_aprobar_solicitudes: false,
          puede_entregar_medicamentos: false,
          puede_gestionar_usuarios: false
        }])
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error creando permisos:', error)
      return { data: null, error }
    }
  },

  // Actualizar permisos de un usuario (solo admin)
  async updatePermisos(userId, permisos) {
    try {
      const { data, error } = await supabase
        .from('permisos_usuarios')
        .update({
          ...permisos,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error actualizando permisos:', error)
      return { data: null, error }
    }
  },

  // Obtener todos los permisos (solo admin)
  async getAllPermisos() {
    try {
      const { data, error } = await supabase
        .from('permisos_usuarios')
        .select(`
          *,
          perfiles(nombre, rol)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error obteniendo todos los permisos:', error)
      return { data: null, error }
    }
  },

  // Verificar si un usuario tiene un permiso específico
  async verificarPermiso(userId, permiso) {
    try {
      const { data, error } = await this.getPermisos(userId)

      if (error) return false

      return data?.[permiso] === true
    } catch (error) {
      console.error('Error verificando permiso:', error)
      return false
    }
  }
}