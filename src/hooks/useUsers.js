// src/hooks/useUsers.js - Versión segura
import { useEffect } from 'react'
import { useUsersStore } from '../store/usersStore'
import { useAuth } from './useAuth'

export const useUsers = () => {
  const { isAdmin } = useAuth()
  const {
    users,
    loading,
    stats,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    fetchStats
  } = useUsersStore()

  useEffect(() => {
    // Solo cargar si es admin
    if (isAdmin) {
      const initializeUsers = async () => {
        await fetchUsers()
        await fetchStats()
      }
      
      initializeUsers()
    }
  }, [isAdmin, fetchUsers, fetchStats])

  return {
    users,
    loading,
    stats,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    fetchStats,
    canManageUsers: isAdmin
  }
}