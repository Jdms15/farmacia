// src/components/layout/Header.jsx
import React, { useState } from 'react'
import { Bell, User, LogOut, Package, Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAlerts } from '../../hooks/useAlerts'
import Button from '../ui/Button'

// Panel de notificaciones simplificado integrado
const SimpleNotificationsPanel = () => {
  const { alerts } = useAlerts()
  const [isOpen, setIsOpen] = useState(false)
  const totalAlerts = alerts.nearExpiry.length + alerts.lowStock.length

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Alertas"
      >
        <Bell size={20} />
        {totalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {totalAlerts > 99 ? '99+' : totalAlerts}
          </span>
        )}
      </button>

      {/* Panel de alertas */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Alertas Activas
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {totalAlerts} alerta{totalAlerts !== 1 ? 's' : ''} requiere{totalAlerts === 1 ? '' : 'n'} atención
            </p>
          </div>

          {/* Lista de alertas */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Productos próximos a vencer */}
            {alerts.nearExpiry.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-yellow-700 mb-2">
                  ⚠️ Próximos a vencer ({alerts.nearExpiry.length})
                </h4>
                <div className="space-y-2">
                  {alerts.nearExpiry.slice(0, 5).map((product) => {
                    const daysToExpiry = Math.ceil(
                      (new Date(product.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <div key={product.id} className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="font-medium text-sm text-gray-900">{product.nombre}</p>
                        <p className="text-xs text-gray-600">{product.laboratorio}</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Vence en {daysToExpiry} día{daysToExpiry !== 1 ? 's' : ''} - Lote: {product.lote}
                        </p>
                      </div>
                    )
                  })}
                  {alerts.nearExpiry.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      ... y {alerts.nearExpiry.length - 5} más
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Productos con bajo stock */}
            {alerts.lowStock.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2">
                  📉 Bajo stock ({alerts.lowStock.length})
                </h4>
                <div className="space-y-2">
                  {alerts.lowStock.slice(0, 5).map((product) => (
                    <div key={product.id} className="p-2 bg-red-50 rounded-lg border border-red-200">
                      <p className="font-medium text-sm text-gray-900">{product.nombre}</p>
                      <p className="text-xs text-gray-600">{product.laboratorio}</p>
                      <p className="text-xs text-red-700 mt-1">
                        Stock: {product.cantidad}/{product.stock_minimo} - {product.ubicacion}
                      </p>
                    </div>
                  ))}
                  {alerts.lowStock.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      ... y {alerts.lowStock.length - 5} más
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sin alertas */}
            {totalAlerts === 0 && (
              <div className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No hay alertas activas</p>
                <p className="text-sm text-gray-400 mt-1">
                  Todo está bajo control
                </p>
              </div>
            )}
          </div>

          {/* Footer con acciones */}
          {totalAlerts > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <a
                href="/productos"
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                Ver inventario completo
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const Header = ({ onMenuToggle }) => {
  const { user, profile, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Lado izquierdo - Logo y menú hamburguesa */}
        <div className="flex items-center space-x-3">
          {/* Botón menú móvil */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Logo y título */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                Inventario Farmacéutico
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden md:block">
                Sistema de gestión de medicamentos
              </p>
            </div>
            <div className="block sm:hidden">
              <h1 className="text-base font-bold text-gray-900">
                InvFarm
              </h1>
            </div>
          </div>
        </div>

        {/* Lado derecho - Acciones del usuario */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Panel de notificaciones simplificado */}
          <SimpleNotificationsPanel />

          {/* Info del usuario - Desktop */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {profile?.nombre || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {profile?.rol || 'Usuario'}
              </p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={16} className="text-blue-600" />
            </div>
          </div>

          {/* Menú de usuario móvil */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center"
            >
              <User size={16} className="text-blue-600" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile?.nombre || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {profile?.rol || 'Usuario'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    signOut()
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <LogOut size={14} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>

          {/* Cerrar sesión - Desktop */}
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="hidden sm:flex items-center space-x-2"
          >
            <LogOut size={16} />
            <span className="hidden lg:inline">Salir</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header