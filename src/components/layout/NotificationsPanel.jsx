// src/components/layout/NotificationsPanel.jsx
import React, { useState, useEffect, useRef } from 'react'
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  Check,
  Info,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react'
import { useNotificationsStore } from '../../store/notificationsStore'
import { formatDistanceToNow } from '../../utils/dateUtils'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

const NotificationsPanel = () => {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotificationsStore()

  // Cerrar panel al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="text-yellow-600" size={20} />
      case 'error':
        return <AlertCircle className="text-red-600" size={20} />
      case 'success':
        return <CheckCircle className="text-green-600" size={20} />
      case 'low_stock':
        return <TrendingDown className="text-red-600" size={20} />
      case 'near_expiry':
        return <AlertTriangle className="text-yellow-600" size={20} />
      default:
        return <Info className="text-blue-600" size={20} />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'warning':
      case 'near_expiry':
        return 'bg-yellow-50 border-yellow-200'
      case 'error':
      case 'low_stock':
        return 'bg-red-50 border-red-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notificaciones
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="danger" size="sm">
                    {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Acciones rápidas */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between mt-3 text-sm">
                <button
                  onClick={markAllAsRead}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  disabled={unreadCount === 0}
                >
                  Marcar todas como leídas
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('¿Eliminar todas las notificaciones?')) {
                      clearAll()
                    }
                  }}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  Limpiar todas
                </button>
              </div>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icono */}
                      <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)} border`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(notification.createdAt)}
                        </p>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center space-x-1">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Marcar como leída"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Acciones adicionales */}
                    {notification.actionUrl && (
                      <div className="mt-3 pl-11">
                        <a
                          href={notification.actionUrl}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          onClick={() => setIsOpen(false)}
                        >
                          {notification.actionText || 'Ver detalles'} →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No hay notificaciones</p>
                <p className="text-sm text-gray-400 mt-1">
                  Las alertas y mensajes aparecerán aquí
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsPanel