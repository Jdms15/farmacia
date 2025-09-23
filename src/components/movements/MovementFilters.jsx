// src/components/movements/MovementFilters.jsx
import React from 'react'
import { Filter, X } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Card from '../ui/Card'

const MovementFilters = ({ filters, onFiltersChange, products }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      productoId: '',
      tipo: '',
      fechaInicio: '',
      fechaFin: ''
    })
  }

  const hasActiveFilters = filters.productoId || filters.tipo || filters.fechaInicio || filters.fechaFin

  return (
    <Card className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* Producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Producto
          </label>
          <select
            value={filters.productoId}
            onChange={(e) => handleFilterChange('productoId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los productos</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.nombre} - {product.laboratorio}
              </option>
            ))}
          </select>
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
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
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
          <Filter size={20} className="text-gray-500" />
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
    </Card>
  )
}

export default MovementFilters