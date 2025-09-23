// src/components/layout/Header.jsx
import React from 'react'
import { Bell, User, LogOut, Package } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAlerts } from '../../hooks/useAlerts'
import Button from '../ui/Button'

const Header = () => {
  const { user, profile, signOut } = useAuth()
  const { totalAlerts } = useAlerts()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo y título */}
        <div className="flex items-center space-x-3">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Inventario Farmacéutico
            </h1>
            <p className="text-sm text-gray-500">
              Sistema de gestión de medicamentos
            </p>
          </div>
        </div>

        {/* Acciones del usuario */}
        <div className="flex items-center space-x-4">
          {/* Notificaciones */}
          <div className="relative">
            <button className="p-2 text-gray-600 hover:text-gray-900 relative">
              <Bell size={20} />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalAlerts}
                </span>
              )}
            </button>
          </div>

          {/* Info del usuario */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {profile?.nombre || user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {profile?.rol || 'Usuario'}
              </p>
            </div>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={16} className="text-blue-600" />
            </div>
          </div>

          {/* Cerrar sesión */}
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="flex items-center space-x-2"
          >
            <LogOut size={16} />
            <span>Salir</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default Header