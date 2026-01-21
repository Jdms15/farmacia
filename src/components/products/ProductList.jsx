// src/components/products/ProductList.jsx - MEJORADO con paginación y controles
import React, { useState, useMemo } from 'react'
import { Edit, Trash2, AlertTriangle, Refrigerator, Shield, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import Table from '../ui/Table'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'

const ProductList = ({ products, loading, onEdit, onDelete }) => {
  const { isAdmin } = useAuth()
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  // Función para formatear fechas
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO')
  }

  // Calcular días para vencimiento
  const getDaysToExpiry = (dateString) => {
    const today = new Date()
    const expiryDate = new Date(dateString)
    const diffTime = expiryDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Función para obtener variante del badge
  const getExpiryBadgeVariant = (days) => {
    if (days <= 0) return 'danger'
    if (days <= 7) return 'danger'
    if (days <= 30) return 'warning'
    return 'success'
  }

  // Función para manejar eliminación
  const handleDelete = (productId, productName) => {
    if (!isAdmin) {
      alert('Solo los administradores pueden eliminar productos')
      return
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar "${productName}"?\n\n` +
      `Esta acción no se puede deshacer y eliminará:\n` +
      `• El producto del inventario\n` +
      `• Todos los movimientos asociados\n` +
      `• Los registros históricos\n\n` +
      `Escribe "ELIMINAR" para confirmar:`
    )

    if (confirmed) {
      const confirmation = prompt(
        `Para confirmar la eliminación de "${productName}", escribe: ELIMINAR`
      )
      
      if (confirmation === 'ELIMINAR') {
        onDelete(productId)
      } else if (confirmation !== null) {
        alert('Confirmación incorrecta. El producto no fue eliminado.')
      }
    }
  }

  // Ordenar productos
  const sortedProducts = useMemo(() => {
    let sortableProducts = [...products]
    
    if (sortConfig.key) {
      sortableProducts.sort((a, b) => {
        let aValue = a[sortConfig.key]
        let bValue = b[sortConfig.key]
        
        // Manejar casos especiales
        if (sortConfig.key === 'fecha_vencimiento') {
          aValue = new Date(aValue)
          bValue = new Date(bValue)
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    
    return sortableProducts
  }, [products, sortConfig])

  // Paginación
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProducts = sortedProducts.slice(startIndex, endIndex)

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Manejar cambio de items por página
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value === 'all' ? sortedProducts.length : Number(value))
    setCurrentPage(1)
  }

  // Manejar ordenamiento
  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Función para renderizar indicador de ordenamiento
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
  }

  const columns = [
    {
      header: (
        <button 
          onClick={() => handleSort('nombre')} 
          className="font-medium hover:text-blue-600"
        >
          Producto{getSortIndicator('nombre')}
        </button>
      ),
      key: 'nombre',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-600">{row.laboratorio}</p>
            <div className="flex items-center space-x-1 mt-1">
              {row.necesita_refrigeracion && (
                <div className="flex items-center space-x-1" title="Requiere refrigeración">
                  <Refrigerator size={14} className="text-blue-500" />
                  <span className="text-xs text-blue-600">Frío</span>
                </div>
              )}
              {getDaysToExpiry(row.fecha_vencimiento) <= 30 && (
                <div className="flex items-center space-x-1" title="Próximo a vencer">
                  <AlertTriangle size={14} className="text-yellow-500" />
                  <span className="text-xs text-yellow-600">Alerta</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      header: (
        <button 
          onClick={() => handleSort('lote')} 
          className="font-medium hover:text-blue-600"
        >
          Lote{getSortIndicator('lote')}
        </button>
      ),
      key: 'lote',
      render: (value) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      header: (
        <button 
          onClick={() => handleSort('cantidad')} 
          className="font-medium hover:text-blue-600"
        >
          Stock{getSortIndicator('cantidad')}
        </button>
      ),
      key: 'cantidad',
      render: (value, row) => (
        <div className="text-center">
          <p className={`font-medium ${
            value <= row.stock_minimo 
              ? 'text-red-600' 
              : value <= row.stock_minimo * 1.5 
              ? 'text-yellow-600' 
              : 'text-green-600'
          }`}>
            {value}
          </p>
          <p className="text-xs text-gray-500">{row.presentacion}</p>
          <p className="text-xs text-gray-400">
            Mín: {row.stock_minimo}
          </p>
        </div>
      )
    },
    {
      header: (
        <button 
          onClick={() => handleSort('fecha_vencimiento')} 
          className="font-medium hover:text-blue-600"
        >
          Vencimiento{getSortIndicator('fecha_vencimiento')}
        </button>
      ),
      key: 'fecha_vencimiento',
      render: (value) => {
        const days = getDaysToExpiry(value)
        return (
          <div className="text-center">
            <p className="text-sm">{formatDate(value)}</p>
            <Badge variant={getExpiryBadgeVariant(days)} size="sm">
              {days <= 0 ? 'Vencido' : days === 1 ? '1 día' : `${days} días`}
            </Badge>
          </div>
        )
      }
    },
    {
      header: (
        <button 
          onClick={() => handleSort('ubicacion')} 
          className="font-medium hover:text-blue-600"
        >
          Ubicación{getSortIndicator('ubicacion')}
        </button>
      ),
      key: 'ubicacion',
      render: (value) => (
        <span className="text-sm text-gray-700">{value}</span>
      )
    },
    {
      header: (
        <button 
          onClick={() => handleSort('proveedor')} 
          className="font-medium hover:text-blue-600"
        >
          Proveedor{getSortIndicator('proveedor')}
        </button>
      ),
      key: 'proveedor',
      render: (value) => (
        <span className="text-sm text-gray-600">{value}</span>
      )
    },
    {
      header: 'Acciones',
      key: 'actions',
      render: (_, row) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(row)
            }}
            title="Editar producto"
          >
            <Edit size={14} />
          </Button>

          {isAdmin ? (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(row.id, row.nombre)
              }}
              title="Eliminar producto (Solo administradores)"
            >
              <Trash2 size={14} />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              title="Solo administradores pueden eliminar productos"
              className="opacity-50 cursor-not-allowed"
            >
              <Shield size={14} />
            </Button>
          )}
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Controles superiores */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Selector de items por página */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700 font-medium">
              Mostrar:
            </label>
            <select
              value={itemsPerPage === sortedProducts.length ? 'all' : itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="all">Todos ({sortedProducts.length})</option>
            </select>
            <span className="text-sm text-gray-600">
              productos por página
            </span>
          </div>

          {/* Información de registros */}
          <div className="text-sm text-gray-600">
            Mostrando <span className="font-medium text-gray-900">{startIndex + 1}</span> a{' '}
            <span className="font-medium text-gray-900">
              {Math.min(endIndex, sortedProducts.length)}
            </span>{' '}
            de <span className="font-medium text-gray-900">{sortedProducts.length}</span> productos
          </div>
        </div>
      </div>

      {/* Información de permisos */}
      {!isAdmin && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center space-x-2">
            <Shield size={16} className="text-yellow-600" />
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Solo los administradores pueden eliminar productos del inventario.
            </p>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          data={currentProducts}
          className="min-h-96"
        />
      </div>

      {/* Controles inferiores - Paginación */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Información de página */}
            <div className="text-sm text-gray-600">
              Página <span className="font-medium text-gray-900">{currentPage}</span> de{' '}
              <span className="font-medium text-gray-900">{totalPages}</span>
            </div>

            {/* Botones de navegación */}
            <div className="flex items-center space-x-2">
              {/* Primera página */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Primera página"
              >
                <ChevronsLeft size={18} />
              </button>

              {/* Página anterior */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Números de página */}
              <div className="hidden sm:flex items-center space-x-1">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1
                  
                  // Mostrar solo páginas cercanas a la actual
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className="px-2">...</span>
                  }
                  return null
                })}
              </div>

              {/* Página siguiente */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Página siguiente"
              >
                <ChevronRight size={18} />
              </button>

              {/* Última página */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Última página"
              >
                <ChevronsRight size={18} />
              </button>
            </div>

            {/* Ir a página específica */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700">Ir a:</label>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value)
                  if (page >= 1 && page <= totalPages) {
                    handlePageChange(page)
                  }
                }}
                className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-center focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas del inventario */}
      {sortedProducts.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{sortedProducts.length}</p>
              <p className="text-xs text-gray-500">Total productos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {sortedProducts.filter(p => p.cantidad > p.stock_minimo).length}
              </p>
              <p className="text-xs text-gray-500">Stock normal</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {sortedProducts.filter(p => {
                  const days = getDaysToExpiry(p.fecha_vencimiento)
                  return days > 0 && days <= 30
                }).length}
              </p>
              <p className="text-xs text-gray-500">Próximos a vencer</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {sortedProducts.filter(p => p.cantidad <= p.stock_minimo).length}
              </p>
              <p className="text-xs text-gray-500">Bajo stock</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductList