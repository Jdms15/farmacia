// src/components/products/ProductList.jsx
import React from 'react'
import { Edit, Trash2, AlertTriangle, Refrigerator } from 'lucide-react'
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
                <Refrigerator size={14} className="text-blue-500" />
              )}
              {getDaysToExpiry(row.fecha_vencimiento) <= 30 && (
                <AlertTriangle size={14} className="text-yellow-500" />
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Lote',
      key: 'lote'
    },
    {
      header: 'Stock',
      key: 'cantidad',
      render: (value, row) => (
        <div className="text-center">
          <p className="font-medium">{value}</p>
          <p className="text-xs text-gray-500">{row.presentacion}</p>
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
              {days <= 0 ? 'Vencido' : `${days} días`}
            </Badge>
          </div>
        )
      }
    },
    {
      header: 'Ubicación',
      key: 'ubicacion'
    },
    {
      header: 'Proveedor',
      key: 'proveedor'
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
          >
            <Edit size={14} />
          </Button>
          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(row.id)
              }}
            >
              <Trash2 size={14} />
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
      <Table
        columns={columns}
        data={products}
        className="min-h-96"
      />
    </div>
  )
}

export default ProductList