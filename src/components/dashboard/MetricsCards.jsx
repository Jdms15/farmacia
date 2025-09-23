// src/components/dashboard/MetricsCards.jsx
import React from 'react'
import { Package, AlertTriangle, TrendingDown, Refrigerator } from 'lucide-react'
import Card from '../ui/Card'

const MetricsCards = ({ metrics }) => {
  const cards = [
    {
      title: 'Total Productos',
      value: metrics.totalProducts,
      icon: Package,
      color: 'blue',
      description: 'Productos en inventario'
    },
    {
      title: 'Próximos a Vencer',
      value: metrics.nearExpiry,
      icon: AlertTriangle,
      color: 'yellow',
      description: 'En los próximos 30 días'
    },
    {
      title: 'Bajo Stock',
      value: metrics.lowStock,
      icon: TrendingDown,
      color: 'red',
      description: 'Por debajo del mínimo'
    },
    {
      title: 'Refrigeración',
      value: metrics.refrigeration,
      icon: Refrigerator,
      color: 'blue',
      description: 'Productos que requieren frío'
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    green: 'bg-green-100 text-green-600'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${colorClasses[card.color]}`}>
                <Icon size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {card.value}
                </p>
                <p className="text-xs text-gray-500">
                  {card.description}
                </p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export default MetricsCards