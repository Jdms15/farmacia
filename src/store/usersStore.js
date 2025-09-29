// src/store/usersStore.js - Versión segura
import { create } from 'zustand'
import { userService } from '../services/userService'
import toast from 'react-hot-toast'

export const useUsersStore = create((set, get) => ({
  users: [],
  loading: false,
  stats: {
    total: 0,
    admins: 0,
    operators: 0,
    recentUsers: 0
  },

  // Obtener usuarios
  fetchUsers: async () => {
    set({ loading: true })
    try {
      const result = await userService.getUsers()
      
      if (result.error) {
        console.error('Error fetching users:', result.error)
        throw result.error
      }
      
      console.log('Usuarios cargados:', result.data?.length || 0)
      set({ users: result.data || [], loading: false })
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Error al cargar usuarios: ' + error.message)
      set({ loading: false, users: [] })
    }
  },

  // Crear usuario
  createUser: async (userData) => {
    try {
      console.log('Creando usuario:', userData)
      const { data, error } = await userService.createUser(userData)
      
      if (error) {
        console.error('Error del servicio:', error)
        throw error
      }
      
      console.log('Usuario creado exitosamente:', data)
      
      // Recargar usuarios
      await get().fetchUsers()
      await get().fetchStats()
      
      toast.success('Usuario creado exitosamente. Se ha enviado un email de confirmación.')
      return { success: true, data }
    } catch (error) {
      console.error('Error creating user:', error)
      
      let message = 'Error al crear usuario'
      
      if (error.message?.includes('admin')) {
        message = 'Solo los administradores pueden crear usuarios'
      } else if (error.message?.includes('already registered')) {
        message = 'Este email ya está registrado'
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