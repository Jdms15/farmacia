// src/store/authStore.js
import { create } from 'zustand'
import { supabase } from '../services/supabase'
import { authService } from '../services/authService'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  
  // Inicializar autenticación
  initialize: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await authService.getUserProfile(user.id)
        set({ user, profile, loading: false })
      } else {
        set({ user: null, profile: null, loading: false })
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false })
    }
  },

  // Iniciar sesión
  signIn: async (email, password) => {
    const { data, error } = await authService.signIn(email, password)
    
    if (data.user && !error) {
      const { data: profile } = await authService.getUserProfile(data.user.id)
      set({ user: data.user, profile })
      return { success: true }
    }
    
    return { success: false, error }
  },

  // Registrarse
  signUp: async (email, password, nombre) => {
    const { data, error } = await authService.signUp(email, password, nombre)
    return { success: !error, error }
  },

  // Cerrar sesión
  signOut: async () => {
    await authService.signOut()
    set({ user: null, profile: null })
  },

  // Verificar si es admin
  isAdmin: () => {
    const { profile } = get()
    return profile?.rol === 'admin'
  }
}))

// Escuchar cambios de autenticación
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    const { data: profile } = await authService.getUserProfile(session.user.id)
    useAuthStore.setState({ user: session.user, profile })
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, profile: null })
  }
})