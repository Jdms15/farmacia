// src/components/dashboard/RecentMovements.jsx
import React from 'react'
import { ArrowUp, ArrowDown, Clock, Eye } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

const RecentMovements = ({ movements, onViewAll, loading = false }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Hace un momento'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Hace ${diffInHours}h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
  }

  const getMovementIcon = (tipo) => {
    return tipo === 'entrada' ? (
      <ArrowUp size={16} />
    ) : (
      <ArrowDown size={16} />
    )
  }

  const getMovementColor = (tipo) => {
    return tipo === 'entrada' 
      ? 'bg-green-100 text-green-600' 
      : 'bg-red-100 text-red-600'
  }

  if (loading) {
    return (
      <Card title="Movimientos Recientes" className="mt-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center space-x-3 p-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card title="Movimientos Recientes" className="mt-6">
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {movements.length > 0 ? (
          <>
            {movements.map((movement) => (
              <div 
                key={movement.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* Icono del tipo de movimiento */}
                  <div className={`p-2 rounded-full ${getMovementColor(movement.tipo)}`}>
                    {getMovementIcon(movement.tipo)}
                  </div>
                  
                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {movement.productos?.nombre || 'Producto no encontrado'}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {movement.productos?.laboratorio || 'Laboratorio desconocido'}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-gray-500">
                        Por: {movement.usuario}
                      </p>
                      <span className="text-gray-300">•</span>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(movement.fecha)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cantidad y fecha */}
                <div className="text-right flex flex-col items-end space-y-1">
                  <Badge variant={movement.tipo === 'entrada' ? 'success' : 'danger'}>
                    {movement.tipo === 'entrada' ? '+' : '-'}{movement.cantidad}
                  </Badge>
                  <p className="text-xs text-gray-500">
                    {formatDate(movement.fecha)}
                  </p>
                  {movement.motivo && (
                    <p className="text-xs text-gray-400 max-w-20 truncate" title={movement.motivo}>
                      {movement.motivo}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Botón para ver todos */}
            {movements.length >= 5 && onViewAll && (
              <div className="pt-3 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewAll}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  <Eye size={16} />
                  <span>Ver todos los movimientos</span>
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock size={48} className="mx-auto mb-2 opacity-50" />
            <p className="font-medium">No hay movimientos recientes</p>
            <p className="text-sm mt-1">
              Los movimientos aparecerán aquí cuando registres entradas o salidas
            </p>
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      {movements.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {movements.filter(m => m.tipo === 'entrada').length}
              </p>
              <p className="text-xs text-gray-500">Entradas hoy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {movements.filter(m => m.tipo === 'salida').length}
              </p>
              <p className="text-xs text-gray-500">Salidas hoy</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default RecentMovements