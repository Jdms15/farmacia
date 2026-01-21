// src/components/forms/SolicitudForm.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Search, X, Package, DollarSign } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'

const schema = yup.object({
  producto_id: yup.string().required('Producto es requerido'),
  cantidad: yup.number().min(1, 'La cantidad debe ser mayor a 0').required('Cantidad es requerida'),
  motivo: yup.string().required('Motivo es requerido'),
  prioridad: yup.string().required('Prioridad es requerida')
})

const SolicitudForm = ({ products, onSave, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      prioridad: 'media',
      cantidad: 1,
      producto_id: ''
    }
  })

  const selectedProductId = watch('producto_id')
  const cantidad = watch('cantidad')
  const selectedProduct = products.find(p => p.id === selectedProductId)

  // Calcular total
  const total = selectedProduct && cantidad 
    ? (selectedProduct.precio || 0) * (Number(cantidad) || 0)
    : 0

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products
    
    const search = searchTerm.toLowerCase().trim()
    return products.filter(product => {
      return (
        product.nombre.toLowerCase().includes(search) ||
        product.laboratorio.toLowerCase().includes(search) ||
        product.lote.toLowerCase().includes(search) ||
        product.ubicacion.toLowerCase().includes(search)
      )
    })
  }, [products, searchTerm])

  const handleProductSelect = (product) => {
    setValue('producto_id', product.id, { shouldValidate: true })
    setShowDropdown(false)
    setSearchTerm('')
  }

  const handleClearSelection = () => {
    setValue('producto_id', '', { shouldValidate: false })
    setSearchTerm('')
  }

  const onSubmit = async (data) => {
    try {
      const result = await onSave(data)
      if (result?.success) {
        return
      }
    } catch (error) {
      console.error('Error en onSubmit:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Selector de Producto */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Producto <span className="text-red-500">*</span>
        </label>
        
        {!selectedProduct ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar medicamento..."
                className="w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {showDropdown && (
              <div className="relative z-50">
                <div className="absolute w-full mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-2xl max-h-96 overflow-auto">
                  {filteredProducts.length > 0 ? (
                    <div className="py-2">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleProductSelect(product)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{product.nombre}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {product.laboratorio} • {product.presentacion}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Lote: {product.lote} • {product.ubicacion}
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-lg font-bold text-green-600">
                                ${(product.precio || 0).toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Stock: {product.cantidad}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <Package size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-600">No se encontraron productos</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
            <button
              type="button"
              onClick={handleClearSelection}
              className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-100 rounded-lg"
            >
              <X size={20} />
            </button>
            <div className="pr-10">
              <p className="font-bold text-gray-900 text-lg">{selectedProduct.nombre}</p>
              <p className="text-sm text-gray-700 mt-1">
                {selectedProduct.laboratorio} • {selectedProduct.presentacion}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <span className="text-xs text-gray-600">Precio unitario:</span>
                  <p className="text-lg font-bold text-green-600">
                    ${(selectedProduct.precio || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-600">Stock disponible:</span>
                  <p className="text-lg font-bold text-blue-600">
                    {selectedProduct.cantidad} unidades
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <input type="hidden" {...register('producto_id')} />
        {errors.producto_id && (
          <p className="text-sm text-red-600 mt-2">{errors.producto_id.message}</p>
        )}
      </div>

      {/* Cantidad y Prioridad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Cantidad solicitada"
          type="number"
          min="1"
          max={selectedProduct?.cantidad || 999}
          {...register('cantidad', { valueAsNumber: true })}
          error={errors.cantidad?.message}
          required
          helperText={selectedProduct ? `Máximo disponible: ${selectedProduct.cantidad}` : ''}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prioridad <span className="text-red-500">*</span>
          </label>
          <select
            {...register('prioridad')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="baja">🟢 Baja</option>
            <option value="media">🟡 Media</option>
            <option value="alta">🟠 Alta</option>
            <option value="urgente">🔴 Urgente</option>
          </select>
          {errors.prioridad && (
            <p className="text-sm text-red-600 mt-1">{errors.prioridad.message}</p>
          )}
        </div>
      </div>

      {/* Motivo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Motivo <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('motivo')}
          rows={3}
          placeholder="Describe el motivo de la solicitud..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.motivo && (
          <p className="text-sm text-red-600 mt-1">{errors.motivo.message}</p>
        )}
      </div>

      {/* Resumen del total */}
      {selectedProduct && (
        <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="text-blue-600" size={24} />
              <span className="text-sm font-medium text-gray-700">Total estimado:</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              ${total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {cantidad} unidad(es) × ${(selectedProduct.precio || 0).toFixed(2)} = ${total.toFixed(2)}
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
          disabled={isSubmitting || !selectedProduct}
        >
          Enviar Solicitud
        </Button>
      </div>
    </form>
  )
}

export default SolicitudForm