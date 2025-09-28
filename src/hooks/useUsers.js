// src/hooks/useUsers.js
import { useEffect } from 'react'
import { useUsersStore } from '../store/usersStore'
import { useAuth } from './useAuth'

export const useUsers = () => {
  const { isAdmin } = useAuth()
  const {
    users,
    loading,
    stats,
    hasAdminAccess,
    checkAdminAccess,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    toggleUserStatus,
    fetchStats
  } = useUsersStore()

  useEffect(() => {
    // Solo cargar si es admin
    if (isAdmin) {
      const initializeAdmin = async () => {
        await checkAdminAccess()
        await fetchUsers()
        await fetchStats()
      }
      
      initializeAdmin()
    }
  }, [isAdmin, checkAdminAccess, fetchUsers, fetchStats])

  return {
    users,
    loading,
    stats,
    hasAdminAccess,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    toggleUserStatus,
    fetchStats,
    canManageUsers: isAdmin
  }
}