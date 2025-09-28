// src/services/userService.js - Versión optimizada
import { supabase } from './supabase'

// Cache para evitar múltiples verificaciones
let adminAccessCache = null
let adminAccessChecked = false

export const userService = {
  // Verificar acceso admin una sola vez
  async checkAdminAccess() {
    if (adminAccessChecked) {
      return adminAccessCache
    }
    
    try {
      // Intentar una operación simple del admin API
      await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
      adminAccessCache = true
    } catch (error) {
      // Silenciar el error, es esperado en muchos entornos
      adminAccessCache = false
    }
    
    adminAccessChecked = true
    return adminAccessCache
  },

  // Obtener todos los usuarios - versión optimizada
  async getUsers() {
    try {
      // Verificar acceso admin primero
      const hasAdminAccess = await this.checkAdminAccess()
      
      // Obtener perfiles básicos
      const { data: profiles, error: profilesError } = await supabase
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (profilesError) throw profilesError

      // Si no hay admin access, usar versión simplificada
      if (!hasAdminAccess) {
        return this.getUsersSimple(profiles)
      }

      // Si hay admin access, intentar obtener datos adicionales
      const usersWithDetails = await Promise.all(
        profiles.map(async (profile) => {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
            
            return {
              ...profile,
              email: authUser?.user?.email || 'No disponible',
              last_sign_in_at: authUser?.user?.last_sign_in_at || null,
              email_confirmed_at: authUser?.user?.email_confirmed_at || null,
              banned_until: authUser?.user?.banned_until || null
            }
          } catch {
            // Si falla para un usuario específico, usar datos básicos
            return {
              ...profile,
              email: 'No disponible',
              last_sign_in_at: null,
              email_confirmed_at: null,
              banned_until: null
            }
          }
        })
      )
      
      return { data: usersWithDetails, error: null }
    } catch (error) {
      // Fallback a versión simple
      console.warn('Admin API no disponible, usando versión básica')
      return this.getUsersSimple()
    }
  },

  // Versión simplificada que solo usa datos públicos
  async getUsersSimple(profiles = null) {
    try {
      // Si no se pasaron perfiles, obtenerlos
      if (!profiles) {
        const { data, error } = await supabase
          .from('perfiles')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        profiles = data
      }

      // Obtener usuario actual para mostrar su email si es posible
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      const usersWithBasicInfo = profiles.map(profile => ({
        ...profile,
        email: currentUser?.id === profile.id ? currentUser.email : 'No disponible',
        last_sign_in_at: null,
        email_confirmed_at: null,
        banned_until: null
      }))
      
      return { data: usersWithBasicInfo, error: null }
    } catch (error) {
      console.error('Error en getUsersSimple:', error)
      return { data: null, error }
    }
  },

  // Crear usuario - versión optimizada
  async createUser(userData) {
    try {
      const { email, password, nombre, rol } = userData
      const hasAdminAccess = await this.checkAdminAccess()
      
      let userId, userEmail
      
      if (hasAdminAccess) {
        // Intentar usar Admin API
        try {
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
          })
          
          if (authError) throw authError
          userId = authData.user.id
          userEmail = authData.user.email
        } catch (adminError) {
          // Si falla admin API, usar signUp normal
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password
          })
          
          if (signUpError) throw signUpError
          if (!signUpData.user) throw new Error('No se pudo crear el usuario')
          
          userId = signUpData.user.id
          userEmail = signUpData.user.email
        }
      } else {
        // Usar signUp normal directamente
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        })
        
        if (signUpError) throw signUpError
        if (!signUpData.user) throw new Error('No se pudo crear el usuario')
        
        userId = signUpData.user.id
        userEmail = signUpData.user.email
      }
      
      // Crear perfil
      const { data: profileData, error: profileError } = await supabase
        .from('perfiles')
        .insert([{
          id: userId,
          nombre,
          rol,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (profileError) {
        // Intentar limpiar el usuario creado
        if (hasAdminAccess) {
          try {
            await supabase.auth.admin.deleteUser(userId)
          } catch {}
        }
        throw profileError
      }
      
      return { 
        data: { ...profileData, email: userEmail }, 
        error: null 
      }
    } catch (error) {
      console.error('Error creating user:', error)
      return { data: null, error }
    }
  },

  // Actualizar usuario
  async updateUser(userId, updates) {
    try {
      const { nombre, rol, email } = updates
      
      // Actualizar perfil
      const { data: profileData, error: profileError } = await supabase
        .from('perfiles')
        .update({
          nombre,
          rol,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()
      
      if (profileError) throw profileError
      
      // Actualizar email solo si hay admin access
      if (email && email !== 'No disponible') {
        const hasAdminAccess = await this.checkAdminAccess()
        
        if (hasAdminAccess) {
          try {
            await supabase.auth.admin.updateUserById(userId, { email })
          } catch (emailError) {
            console.warn('No se pudo actualizar email:', emailError.message)
          }
        }
      }
      
      return { data: { ...profileData, email }, error: null }
    } catch (error) {
      console.error('Error updating user:', error)
      return { data: null, error }
    }
  },

  // Eliminar usuario
  async deleteUser(userId) {
    try {
      // Verificar relaciones
      const [{ data: productos }, { data: movimientos }] = await Promise.all([
        supabase.from('productos').select('id').eq('user_id', userId).limit(1),
        supabase.from('movimientos').select('id').eq('user_id', userId).limit(1)
      ])
      
      if (productos?.length > 0) {
        throw new Error('No se puede eliminar: el usuario tiene productos registrados')
      }
      
      if (movimientos?.length > 0) {
        throw new Error('No se puede eliminar: el usuario tiene movimientos registrados')
      }
      
      // Eliminar perfil
      const { error: profileError } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', userId)
      
      if (profileError) throw profileError
      
      // Intentar eliminar de auth si hay acceso admin
      const hasAdminAccess = await this.checkAdminAccess()
      if (hasAdminAccess) {
        try {
          await supabase.auth.admin.deleteUser(userId)
        } catch (authError) {
          console.warn('Usuario eliminado del perfil, pero no de auth:', authError.message)
        }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Error deleting user:', error)
      return { error }
    }
  },

  // Resetear contraseña - requiere admin access
  async resetUserPassword(userId, newPassword) {
    try {
      const hasAdminAccess = await this.checkAdminAccess()
      
      if (!hasAdminAccess) {
        throw new Error('Esta función requiere permisos de administrador del servidor')
      }
      
      const { error } = await supabase.auth.admin.updateUserById(userId, { 
        password: newPassword 
      })
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error resetting password:', error)
      return { error }
    }
  },

  // Cambiar estado - requiere admin access  
  async toggleUserStatus(userId, disabled) {
    try {
      const hasAdminAccess = await this.checkAdminAccess()
      
      if (!hasAdminAccess) {
        throw new Error('Esta función requiere permisos de administrador del servidor')
      }
      
      const { error } = await supabase.auth.admin.updateUserById(userId, { 
        banned_until: disabled ? '2099-12-31T23:59:59.999Z' : null
      })
      
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error toggling user status:', error)
      return { error }
    }
  },

  // Obtener estadísticas
  async getUserStats() {
    try {
      const { data: users, error } = await supabase
        .from('perfiles')
        .select('rol, created_at')
      
      if (error) throw error
      
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const stats = {
        total: users.length,
        admins: users.filter(u => u.rol === 'admin').length,
        operators: users.filter(u => u.rol === 'operador').length,
        recentUsers: users.filter(u => new Date(u.created_at) > weekAgo).length
      }
      
      return { data: stats, error: null }
    } catch (error) {
      console.error('Error getting user stats:', error)
      return { data: null, error }
    }
  },

  // Obtener capacidades disponibles
  async getCapabilities() {
    const hasAdminAccess = await this.checkAdminAccess()
    
    return {
      canViewUsers: true,
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      canResetPasswords: hasAdminAccess,
      canToggleUserStatus: hasAdminAccess,
      canViewEmails: hasAdminAccess,
      canViewLastSignIn: hasAdminAccess,
      hasFullAdminAccess: hasAdminAccess
    }
  }
}