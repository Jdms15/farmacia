// src/components/layout/Sidebar.jsx
import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  FileText, 
  Settings,
  AlertTriangle,
  X
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAlerts } from '../../hooks/useAlerts'

const Sidebar = ({ onClose, isMobile }) => {
  const { isAdmin } = useAuth()
  const { totalAlerts } = useAlerts()

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      exact: true
    },
    {
      name: 'Productos',
      href: '/productos',
      icon: Package
    },
    {
      name: 'Movimientos',
      href: '/movimientos',
      icon: ArrowLeftRight
    },
    {
      name: 'Reportes',
      href: '/reportes',
      icon: FileText
    }
  ]

  if (isAdmin) {
    navigationItems.push({
      name: 'Configuración',
      href: '/configuracion',
      icon: Settings
    })
  }

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Header del sidebar con botón cerrar en móvil */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Menú</h2>
          {isMobile && (
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Alertas */}
        {totalAlerts > 0 && (
          <div className="mb-4 p-3 bg-red-600 rounded-lg animate-pulse">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">
                {totalAlerts} alerta{totalAlerts > 1 ? 's' : ''} activa{totalAlerts > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Navegación */}
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.exact}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
              {item.name === 'Productos' && totalAlerts > 0 && (
                <span className="ml-auto bg-red-500 text-xs rounded-full px-2 py-1">
                  {totalAlerts}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer del sidebar */}
      <div className="mt-auto p-4 border-t border-gray-800">
        <div className="text-xs text-gray-400 text-center">
          <p>© 2024 InvFarm</p>
          <p>Versión 1.0.0</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar