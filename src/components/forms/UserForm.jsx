// src/components/forms/UserForm.jsx
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Eye, EyeOff } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'

const schema = yup.object({
  nombre: yup.string().required('Nombre es requerido').min(2, 'Mínimo 2 caracteres'),
  email: yup.string().email('Email inválido').required('Email es requerido'),
  password: yup.string().when('isEditing', {
    is: false,
    then: () => yup.string().min(6, 'Mínimo 6 caracteres').required('Contraseña es requerida'),
    otherwise: () => yup.string().min(6, 'Mínimo 6 caracteres').nullable()
  }),
  rol: yup.string().oneOf(['admin', 'operador']).required('Rol es requerido')
})

const UserForm = ({ user, onSave, onCancel }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!user

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: user || {
      nombre: '',
      email: '',
      password: '',
      rol: 'operador'
    },
    context: { isEditing }
  })

  const watchedPassword = watch('password')

  const onSubmit = async (data) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      // Si es edición y no hay password, no incluirlo
      const userData = { ...data }
      if (isEditing && !userData.password) {
        delete userData.password
      }
      
      const result = await onSave(userData)
      
      if (result?.success) {
        // El padre manejará el cierre del modal
        return
      }
    } catch (error) {
      console.error('Error en onSubmit:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre completo"
          {...register('nombre')}
          error={errors.nombre?.message}
          disabled={isSubmitting}
          required
          placeholder="Ej: Juan Pérez"
        />

        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          disabled={isSubmitting}
          required
          placeholder="usuario@ejemplo.com"
        />
      </div>

      {/* Contraseña */}
      <div>
        <Input
          label={isEditing ? "Nueva contraseña (opcional)" : "Contraseña"}
          type={showPassword ? 'text' : 'password'}
          {...register('password')}
          error={errors.password?.message}
          disabled={isSubmitting}
          required={!isEditing}
          placeholder={isEditing ? "Dejar vacío para mantener actual" : "Mínimo 6 caracteres"}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
          onRightIconClick={() => setShowPassword(!showPassword)}
        />
        
        {/* Indicador de fortaleza de contraseña */}
        {watchedPassword && watchedPassword.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    watchedPassword.length < 6
                      ? 'w-1/3 bg-red-500'
                      : watchedPassword.length < 8
                      ? 'w-2/3 bg-yellow-500'
                      : 'w-full bg-green-500'
                  }`}
                />
              </div>
              <span className="text-xs text-gray-500">
                {watchedPassword.length < 6
                  ? 'Débil'
                  : watchedPassword.length < 8
                  ? 'Media'
                  : 'Fuerte'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Rol */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rol <span className="text-red-500">*</span>
        </label>
        <select
          {...register('rol')}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="operador">Operador</option>
          <option value="admin">Administrador</option>
        </select>
        {errors.rol && (
          <p className="text-sm text-red-600 mt-1">{errors.rol.message}</p>
        )}
        
        {/* Descripción de roles */}
        <div className="mt-2 text-xs text-gray-500">
          <p><strong>Operador:</strong> Puede gestionar productos y movimientos</p>
          <p><strong>Administrador:</strong> Acceso completo al sistema</p>
        </div>
      </div>

      {/* Información adicional para edición */}
      {isEditing && user && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Información de la cuenta</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">ID:</span>
              <span className="font-mono ml-2 text-xs">{user.id}</span>
            </div>
            <div>
              <span className="text-gray-600">Creado:</span>
              <span className="ml-2">
                {user.created_at 
                  ? new Date(user.created_at).toLocaleDateString('es-CO')
                  : 'No disponible'
                }
              </span>
            </div>
            <div>
              <span className="text-gray-600">Último acceso:</span>
              <span className="ml-2">
                {user.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleDateString('es-CO')
                  : 'Nunca'
                }
              </span>
            </div>
            <div>
              <span className="text-gray-600">Estado:</span>
              <span className={`ml-2 font-medium ${
                user.banned_until ? 'text-red-600' : 'text-green-600'
              }`}>
                {user.banned_until ? 'Deshabilitado' : 'Activo'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isEditing ? 'Actualizar' : 'Crear'} Usuario
        </Button>
      </div>
    </form>
  )
}

export default UserForm