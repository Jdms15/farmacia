// src/components/layout/Header.jsx
import React, { useState } from 'react'
import { Bell, User, LogOut, Package, Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAlerts } from '../../hooks/useAlerts'
import Button from '../ui/Button'
import NotificationsPanel from './NotificationsPanel'

const Header = ({ onMenuToggle }) => {
  const { user, profile, signOut } = useAuth()
  const { totalAlerts } = useAlerts()
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
          {/* Notificaciones */}
          <NotificationsPanel />

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