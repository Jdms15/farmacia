// src/components/dashboard/ProductRotationWithFilters.jsx - Con filtros de fecha
import React, { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, BarChart3, Package, AlertCircle, Activity, Calendar, Filter } from 'lucide-react'
import { statsService } from '../../services/statsService'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Input from '../ui/Input'
import Button from '../ui/Button'

const ProductRotation = () => {
  const [topProducts, setTopProducts] = useState([])
  const [lowProducts, setLowProducts] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('top')
  
  // Estados para filtros de fecha
  const [dateFilters, setDateFilters] = useState({
    fechaInicio: '',
    fechaFin: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchRotationData()
  }, [dateFilters])

  const fetchRotationData = async () => {
    setLoading(true)
    try {
      const [topResult, lowResult, summaryResult] = await Promise.all([
        statsService.getTopRotatingProducts(10, dateFilters),
        statsService.getLowRotatingProducts(10, dateFilters),
        statsService.getRotationSummary(dateFilters)
      ])

      if (topResult.data) setTopProducts(topResult.data)
      if (lowResult.data) setLowProducts(lowResult.data)
      if (summaryResult.data) setSummary(summaryResult.data)
    } catch (error) {
      console.error('Error fetching rotation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateFilterChange = (field, value) => {
    setDateFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const clearFilters = () => {
    setDateFilters({
      fechaInicio: '',
      fechaFin: ''
    })
  }

  const setQuickFilter = (days) => {
    const today = new Date()
    const startDate = new Date()
    startDate.setDate(today.getDate() - days)
    
    setDateFilters({
      fechaInicio: startDate.toISOString().split('T')[0],
      fechaFin: today.toISOString().split('T')[0]
    })
  }

  const hasActiveFilters = dateFilters.fechaInicio || dateFilters.fechaFin

  if (loading) {
    return (
      <Card title="Rotación de Productos" className="h-96">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros de fecha */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Filtros de Período</h3>
            {hasActiveFilters && (
              <Badge variant="info" size="sm">
                Filtrado
              </Badge>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* Botones rápidos */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 font-medium self-center">Período rápido:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickFilter(7)}
              >
                Últimos 7 días
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickFilter(30)}
              >
                Últimos 30 días
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickFilter(90)}
              >
                Últimos 3 meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickFilter(180)}
              >
                Últimos 6 meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickFilter(365)}
              >
                Último año
              </Button>
            </div>

            {/* Campos de fecha personalizados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha inicio"
                type="date"
                value={dateFilters.fechaInicio}
                onChange={(e) => handleDateFilterChange('fechaInicio', e.target.value)}
                max={dateFilters.fechaFin || new Date().toISOString().split('T')[0]}
              />
              <Input
                label="Fecha fin"
                type="date"
                value={dateFilters.fechaFin}
                onChange={(e) => handleDateFilterChange('fechaFin', e.target.value)}
                min={dateFilters.fechaInicio}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Botón limpiar */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center space-x-2"
                >
                  <Filter size={16} />
                  <span>Limpiar filtros</span>
                </Button>
              </div>
            )}

            {/* Información del período */}
            {hasActiveFilters && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Período analizado:</strong>{' '}
                  {dateFilters.fechaInicio ? new Date(dateFilters.fechaInicio).toLocaleDateString('es-CO') : 'Desde el inicio'} 
                  {' hasta '}
                  {dateFilters.fechaFin ? new Date(dateFilters.fechaFin).toLocaleDateString('es-CO') : 'hoy'}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Resumen General */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Package size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalProductos}</p>
                <p className="text-xs text-gray-500">en inventario</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <Activity size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Con Movimientos</p>
                <p className="text-2xl font-bold text-gray-900">{summary.productosConMovimientos}</p>
                <p className="text-xs text-gray-500">{summary.porcentajeConMovimientos}% del total</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <AlertCircle size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sin Movimientos</p>
                <p className="text-2xl font-bold text-gray-900">{summary.productosSinMovimientos}</p>
                <p className="text-xs text-gray-500">productos estáticos</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <BarChart3 size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Movimientos</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalMovimientos}</p>
                <p className="text-xs text-gray-500">
                  {hasActiveFilters ? 'en el período' : 'registrados'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs y Lista */}
      <Card>
        {/* Tabs Header */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 px-6 pt-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('top')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'top'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp size={16} />
                <span>Top 10 - Más Rotación</span>
                {topProducts.length > 0 && (
                  <Badge variant="success" size="sm">
                    {topProducts.length}
                  </Badge>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('low')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'low'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingDown size={16} />
                <span>Top 10 - Menos Rotación</span>
                {lowProducts.length > 0 && (
                  <Badge variant="warning" size="sm">
                    {lowProducts.length}
                  </Badge>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Tabs Content */}
        <div className="p-6">
          {activeTab === 'top' && (
            <div className="space-y-3">
              {topProducts.length > 0 ? (
                <>
                  {topProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-500 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Ranking */}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' :
                            'bg-green-600'
                          }`}>
                            #{index + 1}
                          </div>
                        </div>

                        {/* Información del producto */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {product.nombre}
                          </p>
                          <p className="text-sm text-gray-600">
                            {product.laboratorio} • {product.presentacion}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {product.ubicacion}
                          </p>
                        </div>

                        {/* Estadísticas */}
                        <div className="flex-shrink-0 text-right">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600">Rotación Total:</span>
                              <Badge variant="success">
                                {product.rotacionTotal} unidades
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 space-y-0.5">
                              <p>📥 Entradas: <span className="font-medium text-green-600">{product.totalEntradas}</span></p>
                              <p>📤 Salidas: <span className="font-medium text-red-600">{product.totalSalidas}</span></p>
                              <p>🔄 Movimientos: <span className="font-medium text-blue-600">{product.totalMovimientos}</span></p>
                              <p>⚡ Velocidad: <span className="font-medium text-purple-600">{product.velocidadRotacion} u/día</span></p>
                            </div>
                          </div>
                        </div>

                        {/* Stock actual */}
                        <div className="flex-shrink-0 text-center">
                          <p className="text-xs text-gray-600 mb-1">Stock actual</p>
                          <p className="text-2xl font-bold text-green-600">
                            {product.cantidad}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600">No hay datos de rotación disponibles</p>
                  {hasActiveFilters && (
                    <p className="text-sm text-gray-500 mt-2">
                      Intenta ampliar el rango de fechas
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'low' && (
            <div className="space-y-3">
              {lowProducts.length > 0 ? (
                <>
                  {lowProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-l-4 border-yellow-500 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Ranking */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-orange-600">
                            #{index + 1}
                          </div>
                        </div>

                        {/* Información del producto */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {product.nombre}
                          </p>
                          <p className="text-sm text-gray-600">
                            {product.laboratorio} • {product.presentacion}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {product.ubicacion}
                          </p>
                        </div>

                        {/* Estadísticas */}
                        <div className="flex-shrink-0 text-right">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-600">Rotación Total:</span>
                              <Badge variant={product.rotacionTotal === 0 ? 'danger' : 'warning'}>
                                {product.rotacionTotal} unidades
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-600 space-y-0.5">
                              {product.rotacionTotal > 0 ? (
                                <>
                                  <p>📥 Entradas: <span className="font-medium text-green-600">{product.totalEntradas}</span></p>
                                  <p>📤 Salidas: <span className="font-medium text-red-600">{product.totalSalidas}</span></p>
                                  <p>🔄 Movimientos: <span className="font-medium text-blue-600">{product.totalMovimientos}</span></p>
                                  <p>⚡ Velocidad: <span className="font-medium text-purple-600">{product.velocidadRotacion} u/día</span></p>
                                </>
                              ) : (
                                <p className="text-red-600 font-medium">❌ Sin movimientos</p>
                              )}
                              <p>📆 Días en inventario: <span className="font-medium text-gray-700">{product.diasDesdeEntrada}</span></p>
                            </div>
                          </div>
                        </div>

                        {/* Stock actual */}
                        <div className="flex-shrink-0 text-center">
                          <p className="text-xs text-gray-600 mb-1">Stock actual</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {product.cantidad}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-12">
                  <TrendingDown size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600">No hay datos de rotación disponibles</p>
                  {hasActiveFilters && (
                    <p className="text-sm text-gray-500 mt-2">
                      Intenta ampliar el rango de fechas
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ProductRotation