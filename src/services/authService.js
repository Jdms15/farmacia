import { supabase } from './supabase'

export const authService = {
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signUp(email, password, nombre) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (data.user && !error) {
      await supabase
        .from('perfiles')
        .insert([
          { 
            id: data.user.id, 
            nombre,
            rol: 'operador' 
          }
        ])
    }
    
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  }
}