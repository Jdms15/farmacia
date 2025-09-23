// src/components/movements/MovementList.jsx
import React from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import Table from '../ui/Table'
import Badge from '../ui/Badge'

const MovementList = ({ movements, loading }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const columns = [
    {
      header: 'Tipo',
      key: 'tipo',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-full ${
            value === 'entrada' 
              ? 'bg-green-100 text-green-600' 
              : 'bg-red-100 text-red-600'
          }`}>
            {value === 'entrada' ? (
              <ArrowUp size={16} />
            ) : (
              <ArrowDown size={16} />
            )}
          </div>
          <Badge variant={value === 'entrada' ? 'success' : 'danger'}>
            {value === 'entrada' ? 'Entrada' : 'Salida'}
          </Badge>
        </div>
      )
    },
    {
      header: 'Producto',
      key: 'productos',
      render: (value) => (
        <div>
          <p className="font-medium text-gray-900">{value?.nombre}</p>
          <p className="text-sm text-gray-600">{value?.laboratorio}</p>
        </div>
      )
    },
    {
      header: 'Cantidad',
      key: 'cantidad',
      render: (value, row) => (
        <div className="text-center">
          <p className={`font-bold ${
            row.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
          }`}>
            {row.tipo === 'entrada' ? '+' : '-'}{value}
          </p>
        </div>
      )
    },
    {
      header: 'Fecha',
      key: 'fecha',
      render: (value) => formatDate(value)
    },
    {
      header: 'Usuario',
      key: 'usuario'
    },
    {
      header: 'Motivo',
      key: 'motivo',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value || 'No especificado'}
        </span>
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
        data={movements}
        className="min-h-96"
      />
    </div>
  )
}

export default MovementList