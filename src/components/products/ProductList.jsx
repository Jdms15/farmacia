// src/components/products/ProductList.jsx - Actualizado
import React from 'react'
import { Edit, Trash2, AlertTriangle, Refrigerator, Shield } from 'lucide-react'
import Table from '../ui/Table'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'

const ProductList = ({ products, loading, onEdit, onDelete }) => {
  const { isAdmin } = useAuth()

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO')
  }

  const getDaysToExpiry = (dateString) => {
    const today = new Date()
    const expiryDate = new Date(dateString)
    const diffTime = expiryDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getExpiryBadgeVariant = (days) => {
    if (days <= 0) return 'danger'
    if (days <= 7) return 'danger'
    if (days <= 30) return 'warning'
    return 'success'
  }

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

  const columns = [
    {
      header: 'Producto',
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
      header: 'Lote',
      key: 'lote',
      render: (value) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      header: 'Stock',
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
      header: 'Vencimiento',
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
      header: 'Ubicación',
      key: 'ubicacion',
      render: (value) => (
        <span className="text-sm text-gray-700">{value}</span>
      )
    },
    {
      header: 'Proveedor',
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
          {/* Editar - Todos los usuarios */}
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

          {/* Eliminar - Solo administradores */}
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
      {/* Información de permisos para eliminar */}
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

      <Table
        columns={columns}
        data={products}
        className="min-h-96"
      />

      {/* Estadísticas del inventario */}
      {products.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{products.length}</p>
              <p className="text-xs text-gray-500">Total productos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.cantidad > p.stock_minimo).length}
              </p>
              <p className="text-xs text-gray-500">Stock normal</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {products.filter(p => {
                  const days = getDaysToExpiry(p.fecha_vencimiento)
                  return days > 0 && days <= 30
                }).length}
              </p>
              <p className="text-xs text-gray-500">Próximos a vencer</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {products.filter(p => p.cantidad <= p.stock_minimo).length}
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