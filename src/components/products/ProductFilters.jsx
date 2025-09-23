// src/components/products/ProductFilters.jsx
import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import Card from '../ui/Card'

const ProductFilters = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({ [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      proximosVencer: false,
      bajoStock: false,
      refrigeracion: undefined
    })
  }

  const hasActiveFilters = filters.search || filters.proximosVencer || filters.bajoStock || filters.refrigeracion !== undefined

  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Búsqueda */}
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Buscar por nombre, laboratorio, lote o ubicación..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-gray-500" />
          
          <Button
            variant={filters.proximosVencer ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('proximosVencer', !filters.proximosVencer)}
          >
            Próximos a vencer
          </Button>

          <Button
            variant={filters.bajoStock ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('bajoStock', !filters.bajoStock)}
          >
            Bajo stock
          </Button>

          <Button
            variant={filters.refrigeracion === true ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleFilterChange('refrigeracion', 
              filters.refrigeracion === true ? undefined : true
            )}
          >
            Refrigeración
          </Button>

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

export default ProductFilters