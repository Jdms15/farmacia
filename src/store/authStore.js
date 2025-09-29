// src/store/authStore.js - Versión segura
import { create } from 'zustand'
import { supabase } from '../services/supabase'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  
  // Inicializar autenticación
  initialize: async () => {
    // Evitar re-inicialización
    if (get().initialized) return
    
    try {
      set({ loading: true })
      
      // Obtener sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        set({ user: null, profile: null, loading: false, initialized: true })
        return
      }
      
      if (session?.user) {
        // Obtener perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          console.error('Error getting profile:', profileError)
          // Si no hay perfil, crear uno por defecto
          const { data: newProfile } = await supabase
            .from('perfiles')
            .insert([
              { 
                id: session.user.id, 
                nombre: session.user.email?.split('@')[0] || 'Usuario',
                rol: 'operador' 
              }
            ])
            .select()
            .single()
          
          set({ 
            user: session.user, 
            profile: newProfile || null, 
            loading: false,
            initialized: true 
          })
        } else {
          set({ 
            user: session.user, 
            profile, 
            loading: false,
            initialized: true 
          })
        }
      } else {
        set({ 
          user: null, 
          profile: null, 
          loading: false,
          initialized: true 
        })
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ 
        user: null, 
        profile: null, 
        loading: false,
        initialized: true,
        error: error.message 
      })
    }
  },

  // Iniciar sesión
  signIn: async (email, password) => {
    try {
      set({ loading: true })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('Sign in error:', error)
        set({ loading: false })
        return { 
          success: false, 
          error: {
            message: error.message || 'Error al iniciar sesión'
          }
        }
      }
      
      if (data?.user) {
        // Obtener o crear perfil
        let profile = null
        const { data: existingProfile, error: profileError } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
        
        if (profileError || !existingProfile) {
          // Crear perfil si no existe
          const { data: newProfile } = await supabase
            .from('perfiles')
            .insert([
              { 
                id: data.user.id, 
                nombre: data.user.email?.split('@')[0] || 'Usuario',
                rol: 'operador' 
              }
            ])
            .select()
            .single()
          
          profile = newProfile
        } else {
          profile = existingProfile
        }
        
        set({ 
          user: data.user, 
          profile,
          loading: false 
        })
        
        return { success: true }
      }
      
      set({ loading: false })
      return { 
        success: false, 
        error: { message: 'Error desconocido al iniciar sesión' }
      }
    } catch (error) {
      console.error('Sign in exception:', error)
      set({ loading: false })
      return { 
        success: false, 
        error: { message: error.message || 'Error inesperado' }
      }
    }
  },

  // Registrarse
  signUp: async (email, password, nombre) => {
    try {
      set({ loading: true })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            rol: 'operador'
          }
        }
      })
      
      set({ loading: false })
      return { success: !error, error }
    } catch (error) {
      console.error('Sign up error:', error)
      set({ loading: false })
      return { success: false, error }
    }
  },

  // Cerrar sesión
  signOut: async () => {
    try {
      set({ loading: true })
      await supabase.auth.signOut()
      set({ 
        user: null, 
        profile: null,
        loading: false 
      })
    } catch (error) {
      console.error('Sign out error:', error)
      set({ loading: false })
    }
  },

  // Verificar si es admin
  isAdmin: () => {
    const { profile } = get()
    return profile?.rol === 'admin'
  },

  // Resetear el store
  reset: () => {
    set({
      user: null,
      profile: null,
      loading: false,
      initialized: false
    })
  }
}))

// Configurar listener de cambios de autenticación
let authListener = null

export const setupAuthListener = () => {
  // Limpiar listener anterior si existe
  if (authListener) {
    authListener.unsubscribe()
  }

  // Crear nuevo listener
  authListener = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth event:', event)
    
    const currentUser = useAuthStore.getState().user
    
    if (event === 'SIGNED_IN' && session?.user) {
      // Solo actualizar si el usuario cambió
      if (currentUser?.id !== session.user.id) {
        const { data: profile } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        useAuthStore.setState({ 
          user: session.user, 
          profile,
          loading: false 
        })
      }
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ 
        user: null, 
        profile: null,
        loading: false 
      })
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      // Actualizar usuario sin cambiar el loading state
      useAuthStore.setState({ 
        user: session.user 
      })
    }
  })
  
  return authListener
}