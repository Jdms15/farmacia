// src/pages/Reports.jsx
import React, { useState } from 'react'
import { Download, FileText, BarChart3 } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'

const Reports = () => {
  const { products } = useProducts()
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [generating, setGenerating] = useState(false)

  const handleExportInventory = async () => {
    setGenerating(true)
    try {
      // Simular generación de reporte
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Reporte de inventario generado exitosamente')
    } catch (error) {
      toast.error('Error al generar reporte')
    } finally {
      setGenerating(false)
    }
  }

  const handleExportMovements = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Selecciona un rango de fechas')
      return
    }

    setGenerating(true)
    try {
      // Simular generación de reporte
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Reporte de movimientos generado exitosamente')
    } catch (error) {
      toast.error('Error al generar reporte')
    } finally {
      setGenerating(false)
    }
  }

  const handleExportAlerts = async () => {
    setGenerating(true)
    try {
      // Simular generación de reporte
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Reporte de alertas generado exitosamente')
    } catch (error) {
      toast.error('Error al generar reporte')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600">Genera y exporta reportes del inventario</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Reporte de Inventario */}
        <Card title="Inventario Completo" className="h-64">
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-medium">Inventario Actual</h4>
                  <p className="text-sm text-gray-600">
                    Listado completo de productos
                  </p>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {products.length}
              </p>
              <p className="text-sm text-gray-600">productos registrados</p>
            </div>
            <Button
              onClick={handleExportInventory}
              loading={generating}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Download size={16} />
              <span>Exportar PDF</span>
            </Button>
          </div>
        </Card>

        {/* Reporte de Movimientos */}
        <Card title="Movimientos" className="h-64">
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div>
                  <h4 className="font-medium">Entradas y Salidas</h4>
                  <p className="text-sm text-gray-600">
                    Historial por rango de fechas
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }))}
                  className="text-xs"
                />
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({
                    ...prev,
                    endDate: e.target.value
                  }))}
                  className="text-xs"
                />
              </div>
            </div>
            <Button
              onClick={handleExportMovements}
              loading={generating}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Download size={16} />
              <span>Exportar Excel</span>
            </Button>
          </div>
        </Card>

        {/* Reporte de Alertas */}
        <Card title="Alertas" className="h-64">
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="h-8 w-8 text-red-600" />
                <div>
                  <h4 className="font-medium">Productos en Alerta</h4>
                  <p className="text-sm text-gray-600">
                    Vencimientos y bajo stock
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Próximos a vencer:</span>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bajo stock:</span>
                  <span className="font-medium">--</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleExportAlerts}
              loading={generating}
              variant="danger"
              className="w-full flex items-center justify-center space-x-2"
            >
              <Download size={16} />
              <span>Exportar PDF</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Reports