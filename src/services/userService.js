// src/services/userService.js - Versión segura sin Service Role Key
import { supabase } from './supabase'

export const userService = {
  // Verificar si el usuario actual es admin
  async isCurrentUserAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { data: profile } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single()

      return profile?.rol === 'admin'
    } catch (error) {
      console.error('Error verificando admin:', error)
      return false
    }
  },

  // Obtener todos los usuarios (RLS permite a admins ver todos)
  async getUsers() {
    try {
      console.log('📋 Obteniendo usuarios...')
      
      const { data: profiles, error: profilesError } = await supabase
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (profilesError) throw profilesError

      console.log(`✅ Usuarios encontrados: ${profiles?.length || 0}`)

      // Sin Service Role Key, NO podemos obtener emails de auth
      // Los usuarios solo verán "No disponible" excepto para su propio email
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      const usersWithLimitedInfo = profiles.map((profile) => {
        return {
          ...profile,
          email: currentUser?.id === profile.id ? currentUser.email : 'No disponible',
          last_sign_in_at: null,
          banned_until: null
        }
      })

      return { data: usersWithLimitedInfo, error: null }
    } catch (error) {
      console.error('Error obteniendo usuarios:', error)
      return { data: [], error }
    }
  },

  // Crear usuario usando el auth de Supabase
  async createUser(userData) {
    try {
      const { email, password, nombre, rol } = userData
      
      console.log('🔧 Creando usuario...', { email, nombre, rol })

      // Verificar que el usuario actual es admin
      const isAdmin = await this.isCurrentUserAdmin()
      if (!isAdmin) {
        throw new Error('Solo los administradores pueden crear usuarios')
      }

      // Registrar nuevo usuario con signUp
      // El trigger automáticamente creará el perfil
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            rol
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario')

      console.log('✅ Usuario creado:', authData.user.id)

      // Esperar un momento para que el trigger cree el perfil
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Obtener el perfil recién creado
      const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        console.warn('Perfil no encontrado inmediatamente, reintentando...')
        // Reintentar después de otro segundo
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { data: retryProfile } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()
        
        return {
          data: { ...retryProfile, email: authData.user.email },
          error: null
        }
      }

      return {
        data: { ...profile, email: authData.user.email },
        error: null
      }
    } catch (error) {
      console.error('❌ Error creando usuario:', error)
      return { data: null, error }
    }
  },

  // Actualizar usuario
  async updateUser(userId, updates) {
    try {
      const { nombre, rol } = updates
      
      console.log('🔧 Actualizando usuario:', userId)

      // Verificar permisos de admin
      const isAdmin = await this.isCurrentUserAdmin()
      if (!isAdmin) {
        throw new Error('Solo los administradores pueden actualizar usuarios')
      }

      // Actualizar perfil (RLS permitirá solo a admins)
      const { data, error } = await supabase
        .from('perfiles')
        .update({
          nombre,
          rol,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Usuario actualizado')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Error actualizando usuario:', error)
      return { data: null, error }
    }
  },

  // Eliminar usuario (usando función RPC)
  async deleteUser(userId) {
    try {
      console.log('🔧 Eliminando usuario:', userId)

      // Verificar que el usuario actual es admin
      const isAdmin = await this.isCurrentUserAdmin()
      if (!isAdmin) {
        throw new Error('Solo los administradores pueden eliminar usuarios')
      }

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

      // Llamar a función RPC para eliminar (la crearemos)
      const { error } = await supabase.rpc('delete_user_profile', {
        user_id: userId
      })

      if (error) throw error

      console.log('✅ Usuario eliminado')
      return { error: null }
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error)
      return { error }
    }
  },

  // Resetear contraseña (limitado - requiere email)
  async sendPasswordResetEmail(email) {
    try {
      console.log('📧 Enviando email de reseteo a:', email)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      console.log('✅ Email enviado')
      return { error: null }
    } catch (error) {
      console.error('❌ Error enviando email:', error)
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

      console.log('📊 Estadísticas:', stats)
      return { data: stats, error: null }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return { data: null, error }
    }
  }
}