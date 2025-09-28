// src/store/usersStore.js - Corregido
import { create } from 'zustand'
import { userService } from '../services/userService'
import toast from 'react-hot-toast'

export const useUsersStore = create((set, get) => ({
  users: [],
  loading: false,
  hasAdminAccess: false,
  stats: {
    total: 0,
    admins: 0,
    operators: 0,
    recentUsers: 0
  },
  
  // Verificar acceso admin al inicializar
  checkAdminAccess: async () => {
    try {
      const hasAccess = await userService.checkAdminAccess()
      set({ hasAdminAccess: hasAccess })
      return hasAccess
    } catch (error) {
      set({ hasAdminAccess: false })
      return false
    }
  },

  // Obtener usuarios
  fetchUsers: async () => {
    set({ loading: true })
    try {
      // Intentar primero con la función completa
      let result = await userService.getUsers()
      
      // Si falla, intentar con la versión simplificada
      if (result.error || !result.data) {
        console.warn('Función getUsers falló, intentando versión simplificada')
        result = await userService.getUsersSimple()
      }
      
      if (result.error) throw result.error
      
      set({ users: result.data || [], loading: false })
    } catch (error) {
      console.error('Error fetching users:', error)
      
      // Mostrar mensaje más específico
      const message = error.message?.includes('admin') 
        ? 'Funcionalidad admin limitada en este entorno'
        : 'Error al cargar usuarios'
      
      toast.error(message)
      set({ loading: false, users: [] })
    }
  },

  // Crear usuario
  createUser: async (userData) => {
    try {
      const { data, error } = await userService.createUser(userData)
      if (error) throw error
      
      await get().fetchUsers()
      await get().fetchStats()
      toast.success('Usuario creado exitosamente')
      return { success: true, data }
    } catch (error) {
      console.error('Error creating user:', error)
      
      let message = 'Error al crear usuario'
      if (error.message?.includes('admin')) {
        message = 'Funcionalidad admin requerida para crear usuarios'
      } else if (error.message?.includes('email')) {
        message = 'Email ya está en uso o es inválido'
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
      return { success: false, error }
    }
  },

  // Actualizar usuario
  updateUser: async (userId, updates) => {
    try {
      const { data, error } = await userService.updateUser(userId, updates)
      if (error) throw error
      
      await get().fetchUsers()
      toast.success('Usuario actualizado exitosamente')
      return { success: true, data }
    } catch (error) {
      console.error('Error updating user:', error)
      const message = error.message || 'Error al actualizar usuario'
      toast.error(message)
      return { success: false, error }
    }
  },

  // Eliminar usuario
  deleteUser: async (userId) => {
    try {
      const { error } = await userService.deleteUser(userId)
      if (error) throw error
      
      await get().fetchUsers()
      await get().fetchStats()
      toast.success('Usuario eliminado exitosamente')
      return { success: true }
    } catch (error) {
      console.error('Error deleting user:', error)
      const message = error.message || 'Error al eliminar usuario'
      toast.error(message)
      return { success: false, error }
    }
  },

  // Resetear contraseña
  resetPassword: async (userId, newPassword) => {
    try {
      const { error } = await userService.resetUserPassword(userId, newPassword)
      if (error) throw error
      
      toast.success('Contraseña actualizada exitosamente')
      return { success: true }
    } catch (error) {
      console.error('Error resetting password:', error)
      
      let message = 'Error al resetear contraseña'
      if (error.message?.includes('admin')) {
        message = 'Funcionalidad admin requerida para resetear contraseñas'
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
      return { success: false, error }
    }
  },

  // Cambiar estado del usuario
  toggleUserStatus: async (userId, disabled) => {
    try {
      const { error } = await userService.toggleUserStatus(userId, disabled)
      if (error) throw error
      
      await get().fetchUsers()
      const action = disabled ? 'deshabilitado' : 'habilitado'
      toast.success(`Usuario ${action} exitosamente`)
      return { success: true }
    } catch (error) {
      console.error('Error toggling user status:', error)
      
      let message = 'Error al cambiar estado del usuario'
      if (error.message?.includes('admin')) {
        message = 'Funcionalidad admin requerida para cambiar estado'
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
      return { success: false, error }
    }
  },

  // Obtener estadísticas
  fetchStats: async () => {
    try {
      const { data, error } = await userService.getUserStats()
      if (error) throw error
      
      set({ stats: data || get().stats })
    } catch (error) {
      console.error('Error fetching user stats:', error)
      // No mostrar error para stats, es información secundaria
    }
  }
}))