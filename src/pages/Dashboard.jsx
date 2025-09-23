// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useAlerts } from '../hooks/useAlerts'
import { movementService } from '../services/movementService'
import MetricsCards from '../components/dashboard/MetricsCards'
import Charts from '../components/dashboard/Charts'
import AlertsPanel from '../components/dashboard/AlertsPanel'
import RecentMovements from '../components/dashboard/RecentMovements'
import _ from 'lodash'

const Dashboard = () => {
  const { products } = useProducts()
  const { alerts } = useAlerts()
  const [recentMovements, setRecentMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentMovements = async () => {
      try {
        const { data } = await movementService.getRecentMovements(10)
        setRecentMovements(data || [])
      } catch (error) {
        console.error('Error fetching recent movements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentMovements()
  }, [])

  // Calcular métricas
  const metrics = {
    totalProducts: products.length,
    nearExpiry: alerts.nearExpiry.length,
    lowStock: alerts.lowStock.length,
    refrigeration: products.filter(p => p.necesita_refrigeracion).length
  }

  // Datos para gráficas
  const productsByLaboratory = _.chain(products)
    .groupBy('laboratorio')
    .map((products, laboratorio) => ({
      laboratorio,
      cantidad: products.length
    }))
    .orderBy('cantidad', 'desc')
    .take(5)
    .value()

  const expirationData = [
    {
      name: 'Vencidos',
      value: products.filter(p => new Date(p.fecha_vencimiento) < new Date()).length
    },
    {
      name: 'Próximos (30 días)',
      value: alerts.nearExpiry.length
    },
    {
      name: 'Buenos',
      value: products.filter(p => {
        const daysToExpiry = Math.ceil(
          (new Date(p.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
        )
        return daysToExpiry > 30
      }).length
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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen del inventario farmacéutico</p>
      </div>

      <MetricsCards metrics={metrics} />
      <Charts 
        productsByLaboratory={productsByLaboratory}
        expirationData={expirationData}
      />
      <AlertsPanel alerts={alerts} />
      <RecentMovements movements={recentMovements} />
    </div>
  )
}

export default Dashboard