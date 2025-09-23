// src/components/forms/LoginForm.jsx
import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../hooks/useAuth'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Card from '../ui/Card'
import toast from 'react-hot-toast'

const schema = yup.object({
  email: yup
    .string()
    .email('Email inválido')
    .required('Email es requerido'),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('Contraseña es requerida')
})

const LoginForm = () => {
  const { signIn } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data) => {
    try {
      const result = await signIn(data.email, data.password)
      
      if (!result.success) {
        toast.error(result.error?.message || 'Error al iniciar sesión')
      }
    } catch (error) {
      toast.error('Error inesperado')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card title="Iniciar Sesión" subtitle="Accede a tu cuenta del inventario farmacéutico">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              required
            />
            
            <Input
              label="Contraseña"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              required
            />

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full"
            >
              Iniciar Sesión
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default LoginForm
