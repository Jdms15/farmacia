// src/components/dashboard/AlertsPanel.jsx
import React from 'react'
import { AlertTriangle, TrendingDown, Calendar } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

const AlertsPanel = ({ alerts }) => {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Productos próximos a vencer */}
      <Card title="Próximos a Vencer" className="h-96">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {alerts.nearExpiry.length > 0 ? (
            alerts.nearExpiry.map((product) => {
              const daysToExpiry = getDaysToExpiry(product.fecha_vencimiento)
              return (
                <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle size={20} className="text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">{product.nombre}</p>
                      <p className="text-sm text-gray-600">{product.laboratorio}</p>
                      <p className="text-xs text-gray-500">
                        Lote: {product.lote}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={daysToExpiry <= 7 ? 'danger' : 'warning'}>
                      {daysToExpiry <= 0 ? 'Vencido' : `${daysToExpiry} días`}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(product.fecha_vencimiento)}
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={48} className="mx-auto mb-2 opacity-50" />
              <p>No hay productos próximos a vencer</p>
            </div>
          )}
        </div>
      </Card>

      {/* Productos con bajo stock */}
      <Card title="Bajo Stock" className="h-96">
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {alerts.lowStock.length > 0 ? (
            alerts.lowStock.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <TrendingDown size={20} className="text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">{product.nombre}</p>
                    <p className="text-sm text-gray-600">{product.laboratorio}</p>
                    <p className="text-xs text-gray-500">
                      Ubicación: {product.ubicacion}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="danger">
                    {product.cantidad} / {product.stock_minimo}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Stock disponible
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingDown size={48} className="mx-auto mb-2 opacity-50" />
              <p>Todos los productos tienen stock suficiente</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default AlertsPanel