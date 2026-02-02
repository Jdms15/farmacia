// src/components/forms/MultiRequestForm.jsx - Formulario para múltiples productos
import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, Package, Plus, Trash2, DollarSign } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'

const MultiRequestForm = ({ products, onSave, onCancel }) => {
  const [selectedProducts, setSelectedProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [prioridad, setPrioridad] = useState('media')
  const [errors, setErrors] = useState({})
  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)

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

  // Calcular total
  const valorTotal = selectedProducts.reduce((sum, item) => {
    return sum + (item.cantidad * item.precio_unitario)
  }, 0)

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

  const handleAddProduct = (product) => {
    // Verificar si ya está agregado
    if (selectedProducts.find(p => p.producto_id === product.id)) {
      alert('Este producto ya está en la lista')
      return
    }

    setSelectedProducts([
      ...selectedProducts,
      {
        producto_id: product.id,
        nombre: product.nombre,
        laboratorio: product.laboratorio,
        presentacion: product.presentacion,
        precio_unitario: product.precio || 0,
        cantidad: 1,
        stock_disponible: product.cantidad
      }
    ])
    
    setSearchTerm('')
    setShowDropdown(false)
  }

  const handleRemoveProduct = (productoId) => {
    setSelectedProducts(selectedProducts.filter(p => p.producto_id !== productoId))
  }

  const handleQuantityChange = (productoId, cantidad) => {
    const product = selectedProducts.find(p => p.producto_id === productoId)
    
    if (cantidad > product.stock_disponible) {
      alert(`Stock insuficiente. Máximo disponible: ${product.stock_disponible}`)
      return
    }

    setSelectedProducts(
      selectedProducts.map(p =>
        p.producto_id === productoId
          ? { ...p, cantidad: Math.max(1, parseInt(cantidad) || 1) }
          : p
      )
    )
  }

  const validateForm = () => {
    const newErrors = {}

    if (selectedProducts.length === 0) {
      newErrors.productos = 'Debe agregar al menos un producto'
    }

    if (!motivo.trim()) {
      newErrors.motivo = 'El motivo es requerido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const result = await onSave({
        productos: selectedProducts.map(p => ({
          producto_id: p.producto_id,
          cantidad: p.cantidad
        })),
        motivo,
        prioridad
      })

      if (result?.success) {
        return
      }
    } catch (error) {
      console.error('Error en submit:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Buscador de productos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Buscar y agregar productos <span className="text-red-500">*</span>
        </label>
        
        <div className="relative" ref={searchInputRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Buscar medicamento por nombre, laboratorio, lote..."
            className="w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Dropdown de productos */}
        {showDropdown && (
          <div ref={dropdownRef} className="relative z-50">
            <div className="absolute w-full mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-2xl max-h-80 overflow-auto">
              {filteredProducts.length > 0 ? (
                <div className="py-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
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

        {errors.productos && (
          <p className="text-sm text-red-600 mt-2">{errors.productos}</p>
        )}
      </div>

      {/* Lista de productos seleccionados */}
      {selectedProducts.length > 0 && (
        <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Package size={20} className="mr-2 text-blue-600" />
            Productos en la solicitud ({selectedProducts.length})
          </h3>
          
          <div className="space-y-3">
            {selectedProducts.map((product) => (
              <div
                key={product.producto_id}
                className="bg-white p-4 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{product.nombre}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {product.laboratorio} • {product.presentacion}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Precio unitario: ${product.precio_unitario.toFixed(2)}
                    </div>
                  </div>

                  <div className="ml-4 flex items-center space-x-3">
                    {/* Cantidad */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        max={product.stock_disponible}
                        value={product.cantidad}
                        onChange={(e) => handleQuantityChange(product.producto_id, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Máx: {product.stock_disponible}
                      </p>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Subtotal</p>
                      <p className="text-lg font-bold text-green-600">
                        ${(product.cantidad * product.precio_unitario).toFixed(2)}
                      </p>
                    </div>

                    {/* Botón eliminar */}
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.producto_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total general */}
          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="text-green-600" size={24} />
                <span className="text-lg font-medium text-gray-700">Total de la solicitud:</span>
              </div>
              <span className="text-3xl font-bold text-green-600">
                ${valorTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-right">
              {selectedProducts.reduce((sum, p) => sum + p.cantidad, 0)} unidades en total
            </p>
          </div>
        </div>
      )}

      {/* Prioridad y Motivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prioridad <span className="text-red-500">*</span>
          </label>
          <select
            value={prioridad}
            onChange={(e) => setPrioridad(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="baja">🟢 Baja</option>
            <option value="media">🟡 Media</option>
            <option value="alta">🟠 Alta</option>
            <option value="urgente">🔴 Urgente</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Motivo <span className="text-red-500">*</span>
        </label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          placeholder="Describe el motivo de la solicitud..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.motivo && (
          <p className="text-sm text-red-600 mt-1">{errors.motivo}</p>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={selectedProducts.length === 0}
        >
          Enviar Solicitud
        </Button>
      </div>
    </form>
  )
}

export default MultiRequestForm