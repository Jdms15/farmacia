// src/components/movements/MovementFilters.jsx - MEJORADO con dropdown y búsqueda
import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Filter, X, Search, Package, ChevronDown } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Card from '../ui/Card'

const MovementFilters = ({ filters, onFiltersChange, products }) => {
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [productSearchTerm, setProductSearchTerm] = useState('')
  const productDropdownRef = useRef(null)
  const productButtonRef = useRef(null)

  // Producto seleccionado
  const selectedProduct = products.find(p => p.id === filters.productoId)

  // Filtrar productos basado en búsqueda
  const filteredProducts = useMemo(() => {
    if (!productSearchTerm.trim()) return products
    
    const search = productSearchTerm.toLowerCase().trim()
    return products.filter(product => {
      return (
        product.nombre.toLowerCase().includes(search) ||
        product.laboratorio.toLowerCase().includes(search) ||
        product.lote.toLowerCase().includes(search) ||
        product.ubicacion.toLowerCase().includes(search) ||
        product.proveedor.toLowerCase().includes(search)
      )
    })
  }, [products, productSearchTerm])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        productDropdownRef.current && 
        !productDropdownRef.current.contains(event.target) &&
        productButtonRef.current &&
        !productButtonRef.current.contains(event.target)
      ) {
        setShowProductDropdown(false)
      }
    }

    if (showProductDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProductDropdown])

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowProductDropdown(false)
      }
    }

    if (showProductDropdown) {
      document.addEventListener('keydown', handleEsc)
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [showProductDropdown])

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const handleProductSelect = (productId) => {
    handleFilterChange('productoId', productId)
    setShowProductDropdown(false)
    setProductSearchTerm('')
  }

  const handleClearProductFilter = () => {
    handleFilterChange('productoId', '')
    setProductSearchTerm('')
  }

  const clearFilters = () => {
    onFiltersChange({
      productoId: '',
      tipo: '',
      fechaInicio: '',
      fechaFin: ''
    })
    setProductSearchTerm('')
  }

  const hasActiveFilters = filters.productoId || filters.tipo || filters.fechaInicio || filters.fechaFin

  return (
    <Card className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* Producto con Dropdown y Búsqueda */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Producto
          </label>
          
          {/* Botón principal */}
          <button
            ref={productButtonRef}
            type="button"
            onClick={() => setShowProductDropdown(!showProductDropdown)}
            className={`w-full px-3 py-2 text-left border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              selectedProduct 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-300 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <Package size={16} className={selectedProduct ? 'text-blue-600' : 'text-gray-400'} />
                <span className={`truncate ${selectedProduct ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {selectedProduct 
                    ? `${selectedProduct.nombre} - ${selectedProduct.laboratorio}`
                    : 'Todos los productos'
                  }
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {selectedProduct && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClearProductFilter()
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
                <ChevronDown 
                  size={16} 
                  className={`text-gray-400 transition-transform ${
                    showProductDropdown ? 'transform rotate-180' : ''
                  }`}
                />
              </div>
            </div>
          </button>

          {/* Dropdown */}
          {showProductDropdown && (
            <div 
              ref={productDropdownRef}
              className="absolute z-50 w-full mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-2xl"
            >
              {/* Campo de búsqueda dentro del dropdown */}
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  {productSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setProductSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredProducts.length} producto(s) encontrado(s)
                </p>
              </div>

              {/* Lista de productos */}
              <div className="max-h-80 overflow-y-auto">
                {/* Opción "Todos" */}
                <button
                  type="button"
                  onClick={() => handleProductSelect('')}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                    !filters.productoId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Package size={16} className="text-gray-400" />
                    <span className="font-medium text-gray-700">Todos los productos</span>
                  </div>
                </button>

                {/* Lista de productos filtrados */}
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    // Calcular stock real
                    const entradas = product.movimientos?.filter(m => m.tipo === 'entrada')
                      ?.reduce((sum, m) => sum + m.cantidad, 0) || 0
                    const salidas = product.movimientos?.filter(m => m.tipo === 'salida')
                      ?.reduce((sum, m) => sum + m.cantidad, 0) || 0
                    const stockActual = product.cantidad + entradas - salidas

                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductSelect(product.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                          filters.productoId === product.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-gray-900 text-sm">
                                {product.nombre}
                              </span>
                              {stockActual <= product.stock_minimo && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                  Bajo Stock
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 space-y-0.5">
                              <p>
                                <span className="font-medium">Laboratorio:</span> {product.laboratorio}
                              </p>
                              <p>
                                <span className="font-medium">Lote:</span> {product.lote} • {product.ubicacion}
                              </p>
                            </div>
                          </div>
                          <div className="ml-3 text-right flex-shrink-0">
                            <div className={`text-lg font-bold ${
                              stockActual === 0
                                ? 'text-gray-400'
                                : stockActual <= product.stock_minimo 
                                ? 'text-red-600' 
                                : 'text-green-600'
                            }`}>
                              {stockActual}
                            </div>
                            <div className="text-xs text-gray-500">unidades</div>
                          </div>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Package size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-600">No se encontraron productos</p>
                    {productSearchTerm && (
                      <p className="text-xs text-gray-500 mt-1">
                        para "{productSearchTerm}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            value={filters.tipo}
            onChange={(e) => handleFilterChange('tipo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="entrada">📥 Entrada</option>
            <option value="salida">📤 Salida</option>
          </select>
        </div>

        {/* Fecha inicio */}
        <Input
          label="Fecha inicio"
          type="date"
          value={filters.fechaInicio}
          onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
        />

        {/* Fecha fin */}
        <Input
          label="Fecha fin"
          type="date"
          value={filters.fechaFin}
          onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
        />

        {/* Botón limpiar */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-500" />
            {hasActiveFilters && (
              <span className="text-xs font-medium text-blue-600">
                {Object.values(filters).filter(v => v).length} activo(s)
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center space-x-1"
            >
              <X size={16} />
              <span>Limpiar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Resumen de filtros activos */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {selectedProduct && (
              <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                <Package size={14} className="mr-1" />
                {selectedProduct.nombre}
                <button
                  type="button"
                  onClick={() => handleClearProductFilter()}
                  className="ml-2 hover:text-blue-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.tipo && (
              <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                {filters.tipo === 'entrada' ? '📥' : '📤'} {filters.tipo}
                <button
                  type="button"
                  onClick={() => handleFilterChange('tipo', '')}
                  className="ml-2 hover:text-gray-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.fechaInicio && (
              <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                Desde: {new Date(filters.fechaInicio).toLocaleDateString('es-CO')}
                <button
                  type="button"
                  onClick={() => handleFilterChange('fechaInicio', '')}
                  className="ml-2 hover:text-gray-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.fechaFin && (
              <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                Hasta: {new Date(filters.fechaFin).toLocaleDateString('es-CO')}
                <button
                  type="button"
                  onClick={() => handleFilterChange('fechaFin', '')}
                  className="ml-2 hover:text-gray-900"
                >
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

export default MovementFilters