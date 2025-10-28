// src/components/forms/MovementForm.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../hooks/useAuth'
import { Search, X, Package } from 'lucide-react'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      tipo: 'entrada',
      cantidad: 1,
      producto_id: ''
    }
  })

  const selectedProductId = watch('producto_id')
  const selectedProduct = products.find(p => p.id === selectedProductId)

  // Filtrar productos basado en búsqueda
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products
    
    const search = searchTerm.toLowerCase().trim()
    return products.filter(product => {
      return (
        product.nombre.toLowerCase().includes(search) ||
        product.presentacion.toLowerCase().includes(search) ||
        product.proveedor.toLowerCase().includes(search) ||
        product.lote.toLowerCase().includes(search) ||
        product.laboratorio.toLowerCase().includes(search) ||
        product.ubicacion.toLowerCase().includes(search)
      )
    })
  }, [products, searchTerm])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('keydown', handleEsc)
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [showDropdown])

  const handleProductSelect = (product) => {
    setValue('producto_id', product.id, { shouldValidate: true })
    setShowDropdown(false)
    setSearchTerm('')
  }

  const handleClearSelection = () => {
    setValue('producto_id', '', { shouldValidate: false })
    setSearchTerm('')
    setShowDropdown(false)
    // Enfocar el input de búsqueda
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }

  const handleSearchFocus = () => {
    setShowDropdown(true)
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setShowDropdown(true)
  }

  const onSubmit = async (data) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      const movementData = {
        ...data,
        usuario: profile?.nombre || 'Usuario'
      }
      
      const result = await onSave(movementData)
      
      if (result?.success) {
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
      {/* Selector de Producto con búsqueda */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Producto <span className="text-red-500">*</span>
        </label>
        
        {!selectedProduct ? (
          <div className="space-y-2">
            {/* Campo de búsqueda */}
            <div className="relative" ref={searchInputRef}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder="Buscar por nombre, presentación, proveedor, lote o ubicación..."
                className="w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={isSubmitting}
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setShowDropdown(true)
                    searchInputRef.current?.focus()
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Texto de ayuda */}
            <p className="text-xs text-gray-500 flex items-center">
              <Package size={14} className="mr-1" />
              {searchTerm 
                ? `${filteredProducts.length} producto(s) encontrado(s)`
                : `${products.length} productos disponibles - Escribe para buscar`
              }
            </p>

            {/* Dropdown de resultados */}
            {showDropdown && (
              <div className="relative" ref={dropdownRef}>
                <div className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-2xl max-h-96 overflow-auto">
                  {filteredProducts.length > 0 ? (
                    <div className="py-2">
                      {filteredProducts.map((product, index) => {
                        const isLowStock = product.cantidad <= product.stock_minimo
                        const daysToExpiry = Math.ceil(
                          (new Date(product.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
                        )
                        const isNearExpiry = daysToExpiry > 0 && daysToExpiry <= 30

                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleProductSelect(product)}
                            className={`w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors ${
                              index !== filteredProducts.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                {/* Nombre del producto */}
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-semibold text-gray-900 text-base">
                                    {product.nombre}
                                  </span>
                                  {isLowStock && (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                      Bajo Stock
                                    </span>
                                  )}
                                  {isNearExpiry && (
                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                                      Por Vencer
                                    </span>
                                  )}
                                </div>

                                {/* Detalles del producto */}
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center text-gray-600">
                                    <span className="font-medium min-w-[80px]">Presentación:</span>
                                    <span className="text-gray-800">{product.presentacion}</span>
                                  </div>
                                  <div className="flex items-center text-gray-600">
                                    <span className="font-medium min-w-[80px]">Proveedor:</span>
                                    <span className="text-gray-800">{product.proveedor}</span>
                                  </div>
                                  <div className="flex items-center text-gray-600 space-x-4">
                                    <div>
                                      <span className="font-medium">Lote:</span>
                                      <span className="text-gray-800 ml-1">{product.lote}</span>
                                    </div>
                                    <div>
                                      <span className="font-medium">Ubicación:</span>
                                      <span className="text-gray-800 ml-1">{product.ubicacion}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Stock */}
                              <div className="ml-4 text-right flex-shrink-0">
                                <div className={`text-2xl font-bold ${
                                  isLowStock ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {product.cantidad}
                                </div>
                                <div className="text-xs text-gray-500">
                                  unidades
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <Package size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-600 font-medium">
                        No se encontraron productos
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {searchTerm ? `No hay resultados para "${searchTerm}"` : 'No hay productos disponibles'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Producto seleccionado - Vista compacta */
          <div className="relative">
            <div className="flex items-start p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Package size={20} className="text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">{selectedProduct.nombre}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Presentación:</span> {selectedProduct.presentacion}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Proveedor:</span> {selectedProduct.proveedor}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Lote: {selectedProduct.lote} • {selectedProduct.ubicacion}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="ml-3 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                    title="Cambiar producto"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campo oculto para el formulario */}
        <input type="hidden" {...register('producto_id')} />

        {errors.producto_id && (
          <p className="text-sm text-red-600 mt-2 flex items-center">
            <span className="mr-1">⚠️</span>
            {errors.producto_id.message}
          </p>
        )}
      </div>

      {/* Información detallada del producto seleccionado */}
      {selectedProduct && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">
              ℹ️
            </span>
            Información detallada
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
              <span className="text-gray-600 block text-xs font-medium mb-1">Laboratorio:</span>
              <p className="font-semibold text-gray-900">{selectedProduct.laboratorio}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
              <span className="text-gray-600 block text-xs font-medium mb-1">Stock actual:</span>
              <p className={`font-bold text-lg ${
                selectedProduct.cantidad <= selectedProduct.stock_minimo 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                {selectedProduct.cantidad} unidades
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
              <span className="text-gray-600 block text-xs font-medium mb-1">Stock mínimo:</span>
              <p className="font-semibold text-gray-900">{selectedProduct.stock_minimo}</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
              <span className="text-gray-600 block text-xs font-medium mb-1">Vencimiento:</span>
              <p className="font-semibold text-gray-900">
                {new Date(selectedProduct.fecha_vencimiento).toLocaleDateString('es-CO')}
              </p>
            </div>
          </div>
          
          {/* Alertas */}
          {selectedProduct.cantidad <= selectedProduct.stock_minimo && (
            <div className="mt-3 p-3 bg-red-100 border-l-4 border-red-500 rounded text-sm text-red-800">
              <strong>⚠️ Alerta de Stock:</strong> Este producto está por debajo del stock mínimo ({selectedProduct.stock_minimo} unidades)
            </div>
          )}
          
          {(() => {
            const daysToExpiry = Math.ceil(
              (new Date(selectedProduct.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
            )
            if (daysToExpiry > 0 && daysToExpiry <= 30) {
              return (
                <div className="mt-3 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded text-sm text-yellow-800">
                  <strong>📅 Alerta de Vencimiento:</strong> Este producto vence en {daysToExpiry} día(s)
                </div>
              )
            }
            return null
          })()}
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
            <option value="entrada">📥 Entrada</option>
            <option value="salida">📤 Salida</option>
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
          disabled={isSubmitting || !selectedProduct}
        >
          Registrar Movimiento
        </Button>
      </div>
    </form>
  )
}

export default MovementForm