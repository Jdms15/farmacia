// src/hooks/useAuth.js
import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const { user, profile, loading, initialize, signIn, signUp, signOut, isAdmin } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: isAdmin(),
    isAuthenticated: !!user
  }
}