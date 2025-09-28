// src/components/forms/MovementForm.jsx
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../hooks/useAuth'
import Input from '../ui/Input'
import Button from '../ui/Button'

const schema = yup.object({
  producto_id: yup.string().required('Producto es requerido'),
  tipo: yup.string().oneOf(['entrada', 'salida']).required('Tipo es requerido'),
  cantidad: yup.number().min(1, 'La cantidad debe ser mayor a 0').required('Cantidad es requerida'),
  motivo: yup.string()
})

const MovementForm = ({ products, onSave, onCancel }) => {
  const { profile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      tipo: 'entrada',
      cantidad: 1
    }
  })

  const selectedProductId = watch('producto_id')
  const selectedProduct = products.find(p => p.id === selectedProductId)

  const onSubmit = async (data) => {
    // Prevenir doble envío
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      const movementData = {
        ...data,
        usuario: profile?.nombre || 'Usuario'
      }
      
      const result = await onSave(movementData)
      
      // Solo proceder si fue exitoso
      if (result?.success) {
        // El componente padre manejará el cierre del modal
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
      {/* Producto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Producto <span className="text-red-500">*</span>
        </label>
        <select
          {...register('producto_id')}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">Selecciona un producto</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.nombre} - {product.laboratorio} (Stock: {product.cantidad})
            </option>
          ))}
        </select>
        {errors.producto_id && (
          <p className="text-sm text-red-600 mt-1">{errors.producto_id.message}</p>
        )}
      </div>

      {/* Información del producto seleccionado */}
      {selectedProduct && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Información del producto</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Stock actual:</span>
              <span className="font-medium ml-2">{selectedProduct.cantidad}</span>
            </div>
            <div>
              <span className="text-gray-600">Ubicación:</span>
              <span className="font-medium ml-2">{selectedProduct.ubicacion}</span>
            </div>
            <div>
              <span className="text-gray-600">Lote:</span>
              <span className="font-medium ml-2">{selectedProduct.lote}</span>
            </div>
            <div>
              <span className="text-gray-600">Vencimiento:</span>
              <span className="font-medium ml-2">
                {new Date(selectedProduct.fecha_vencimiento).toLocaleDateString('es-CO')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de movimiento <span className="text-red-500">*</span>
          </label>
          <select
            {...register('tipo')}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>
          {errors.tipo && (
            <p className="text-sm text-red-600 mt-1">{errors.tipo.message}</p>
          )}
        </div>

        {/* Cantidad */}
        <Input
          label="Cantidad"
          type="number"
          min="1"
          disabled={isSubmitting}
          {...register('cantidad', { valueAsNumber: true })}
          error={errors.cantidad?.message}
          required
        />
      </div>

      {/* Motivo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Motivo
        </label>
        <textarea
          {...register('motivo')}
          disabled={isSubmitting}
          rows={3}
          placeholder="Describe el motivo del movimiento (opcional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
        {errors.motivo && (
          <p className="text-sm text-red-600 mt-1">{errors.motivo.message}</p>
        )}
      </div>

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
          Registrar Movimiento
        </Button>
      </div>
    </form>
  )
}

export default MovementForm