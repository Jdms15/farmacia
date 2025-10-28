// src/components/forms/ProductForm.jsx
import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../hooks/useAuth'
import Input from '../ui/Input'
import Button from '../ui/Button'

const schema = yup.object({
  nombre: yup.string().required('Nombre es requerido'),
  laboratorio: yup.string().required('Laboratorio es requerido'),
  proveedor: yup.string().required('Proveedor es requerido'),
  cantidad: yup.number().min(0, 'La cantidad debe ser mayor a 0').required('Cantidad es requerida'),
  presentacion: yup.string().required('Presentación es requerida'),
  lote: yup.string().required('Lote es requerido'),
  fecha_entrada: yup.date().required('Fecha de entrada es requerida'),
  registro_invima: yup.string(),
  fecha_fabricacion: yup.date().required('Fecha de fabricación es requerida'),
  fecha_vencimiento: yup.date()
    .min(yup.ref('fecha_fabricacion'), 'La fecha de vencimiento debe ser posterior a la fabricación')
    .required('Fecha de vencimiento es requerida'),
  ubicacion: yup.string().required('Ubicación es requerida'),
  stock_minimo: yup.number().min(1, 'Stock mínimo debe ser mayor a 0').required('Stock mínimo es requerido')
})

const ProductForm = ({ product, onSave, onCancel }) => {
  const { user } = useAuth()
  
  // Función para formatear fecha para input type="date"
  const formatDateForInput = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  // Preparar valores por defecto
  const defaultValues = product ? {
    ...product,
    fecha_entrada: formatDateForInput(product.fecha_entrada),
    fecha_fabricacion: formatDateForInput(product.fecha_fabricacion),
    fecha_vencimiento: formatDateForInput(product.fecha_vencimiento),
    cantidad: Number(product.cantidad) || 0,
    stock_minimo: Number(product.stock_minimo) || 10,
    necesita_refrigeracion: Boolean(product.necesita_refrigeracion)
  } : {
    cantidad: 0,
    necesita_refrigeracion: false,
    stock_minimo: 10,
    fecha_entrada: new Date().toISOString().split('T')[0]
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues
  })

  const onSubmit = async (data) => {
    try {
      // Limpiar y preparar datos
      const productData = {
        nombre: data.nombre.trim(),
        laboratorio: data.laboratorio.trim(),
        proveedor: data.proveedor.trim(),
        cantidad: Number(data.cantidad),
        presentacion: data.presentacion.trim(),
        lote: data.lote.trim(),
        fecha_entrada: data.fecha_entrada,
        registro_invima: data.registro_invima?.trim() || null,
        fecha_fabricacion: data.fecha_fabricacion,
        fecha_vencimiento: data.fecha_vencimiento,
        ubicacion: data.ubicacion.trim(),
        stock_minimo: Number(data.stock_minimo),
        necesita_refrigeracion: Boolean(data.necesita_refrigeracion)
      }

      // Solo agregar user_id si es un producto nuevo
      if (!product) {
        productData.user_id = user.id
      }

      console.log('Datos a guardar:', productData)
      await onSave(productData)
    } catch (error) {
      console.error('Error en onSubmit:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre del producto"
          {...register('nombre')}
          error={errors.nombre?.message}
          required
          placeholder="Ej: Acetaminofén"
        />

        <Input
          label="Laboratorio"
          {...register('laboratorio')}
          error={errors.laboratorio?.message}
          required
          placeholder="Ej: Bayer"
        />

        <Input
          label="Proveedor"
          {...register('proveedor')}
          error={errors.proveedor?.message}
          required
          placeholder="Ej: Droguería Central"
        />

        <Input
          label="Cantidad inicial"
          type="number"
          min="0"
          {...register('cantidad', { valueAsNumber: true })}
          error={errors.cantidad?.message}
          required
          placeholder="0"
        />

        <Input
          label="Presentación"
          placeholder="ej. Caja x 20 tabletas de 500mg"
          {...register('presentacion')}
          error={errors.presentacion?.message}
          required
        />

        <Input
          label="Lote"
          {...register('lote')}
          error={errors.lote?.message}
          required
          placeholder="Ej: LOT-2024-001"
        />

        <Input
          label="Fecha de entrada"
          type="date"
          {...register('fecha_entrada')}
          error={errors.fecha_entrada?.message}
          required
        />

        <Input
          label="Registro INVIMA"
          {...register('registro_invima')}
          error={errors.registro_invima?.message}
          placeholder="Opcional"
        />

        <Input
          label="Fecha de fabricación"
          type="date"
          {...register('fecha_fabricacion')}
          error={errors.fecha_fabricacion?.message}
          required
        />

        <Input
          label="Fecha de vencimiento"
          type="date"
          {...register('fecha_vencimiento')}
          error={errors.fecha_vencimiento?.message}
          required
        />

        <Input
          label="Ubicación"
          placeholder="ej. Estante A1, Refrigerador 2"
          {...register('ubicacion')}
          error={errors.ubicacion?.message}
          required
        />

        <Input
          label="Stock mínimo"
          type="number"
          min="1"
          {...register('stock_minimo', { valueAsNumber: true })}
          error={errors.stock_minimo?.message}
          required
          placeholder="10"
        />
      </div>

      {/* Checkbox para refrigeración */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="necesita_refrigeracion"
          {...register('necesita_refrigeracion')}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="necesita_refrigeracion" className="text-sm font-medium text-gray-700">
          ¿Necesita refrigeración?
        </label>
      </div>

      {/* Información del producto editado */}
      {product && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Editando:</strong> {product.nombre} - Lote: {product.lote}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Creado: {new Date(product.created_at).toLocaleDateString('es-CO')}
          </p>
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
          {product ? 'Actualizar' : 'Crear'} Producto
        </Button>
      </div>
    </form>
  )
}

export default ProductForm