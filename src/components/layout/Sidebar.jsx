// src/components/layout/Sidebar.jsx
import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  ArrowLeftRight, 
  FileText, 
  Settings,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useAlerts } from '../../hooks/useAlerts'

const Sidebar = () => {
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

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        {/* Alertas */}
        {totalAlerts > 0 && (
          <div className="mb-6 p-3 bg-red-600 rounded-lg">
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
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
