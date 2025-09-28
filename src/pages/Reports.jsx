// src/pages/Reports.jsx
import React, { useState } from 'react'
import { Download, FileText, BarChart3, AlertTriangle } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { useAlerts } from '../hooks/useAlerts'
import { reportService } from '../services/reportService'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'

const Reports = () => {
  const { products } = useProducts()
  const { alerts } = useAlerts()
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [generating, setGenerating] = useState(false)

  const handleExportInventory = async (format = 'excel') => {
    setGenerating(true)
    try {
      const result = await reportService.generateInventoryReport(format)
      
      if (result.success) {
        toast.success(`Reporte de inventario generado exitosamente (${format.toUpperCase()})`)
      } else {
        throw new Error(result.error || 'Error al generar reporte')
      }
    } catch (error) {
      console.error('Error generating inventory report:', error)
      toast.error('Error al generar reporte de inventario: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleExportMovements = async (format = 'excel') => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Selecciona un rango de fechas válido')
      return
    }

    if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
      toast.error('La fecha de inicio debe ser anterior a la fecha de fin')
      return
    }

    setGenerating(true)
    try {
      const result = await reportService.generateMovementsReport(
        dateRange.startDate, 
        dateRange.endDate, 
        format
      )
      
      if (result.success) {
        toast.success(`Reporte de movimientos generado exitosamente (${format.toUpperCase()})`)
      } else {
        throw new Error(result.error || 'Error al generar reporte')
      }
    } catch (error) {
      console.error('Error generating movements report:', error)
      toast.error('Error al generar reporte de movimientos: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleExportAlerts = async (format = 'excel') => {
    setGenerating(true)
    try {
      const result = await reportService.generateAlertsReport(format)
      
      if (result.success) {
        toast.success(`Reporte de alertas generado exitosamente (${format.toUpperCase()})`)
      } else {
        throw new Error(result.error || 'Error al generar reporte')
      }
    } catch (error) {
      console.error('Error generating alerts report:', error)
      toast.error('Error al generar reporte de alertas: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  // Establecer fechas por defecto (último mes)
  const setDefaultDateRange = () => {
    const today = new Date()
    const lastMonth = new Date()
    lastMonth.setMonth(today.getMonth() - 1)
    
    setDateRange({
      startDate: lastMonth.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    })
  }

  const setCurrentWeek = () => {
    const today = new Date()
    const lastWeek = new Date()
    lastWeek.setDate(today.getDate() - 7)
    
    setDateRange({
      startDate: lastWeek.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    })
  }

  const setCurrentMonth = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    
    setDateRange({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600">Genera y exporta reportes del inventario farmacéutico</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Reporte de Inventario */}
        <Card title="Inventario Completo" className="h-auto">
          <div className="flex flex-col h-full">
            <div className="flex-1 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-medium">Inventario Actual</h4>
                  <p className="text-sm text-gray-600">
                    Listado completo de productos
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {products.length}
                </p>
                <p className="text-sm text-gray-600">productos registrados</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={() => handleExportInventory('excel')}
                loading={generating}
                disabled={generating}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Download size={16} />
                <span>Exportar Excel</span>
              </Button>
              
              <Button
                onClick={() => handleExportInventory('csv')}
                loading={generating}
                disabled={generating}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Download size={16} />
                <span>Exportar CSV</span>
              </Button>
              
              <Button
                onClick={() => handleExportInventory('pdf')}
                loading={generating}
                disabled={generating}
                variant="secondary"
                className="w-full flex items-center justify-center space-x-2"
              >
                <FileText size={16} />
                <span>Ver/Imprimir PDF</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Reporte de Movimientos */}
        <Card title="Movimientos" className="h-auto">
          <div className="flex flex-col h-full">
            <div className="flex-1 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div>
                  <h4 className="font-medium">Entradas y Salidas</h4>
                  <p className="text-sm text-gray-600">
                    Historial por rango de fechas
                  </p>
                </div>
              </div>
              
              {/* Botones de rango rápido */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Button
                  onClick={setCurrentWeek}
                  variant="outline"
                  size="sm"
                  disabled={generating}
                >
                  Semana
                </Button>
                <Button
                  onClick={setCurrentMonth}
                  variant="outline"
                  size="sm"
                  disabled={generating}
                >
                  Mes
                </Button>
                <Button
                  onClick={setDefaultDateRange}
                  variant="outline"
                  size="sm"
                  disabled={generating}
                >
                  30 días
                </Button>
              </div>
              
              <div className="space-y-3 mb-4">
                <Input
                  label="Fecha inicio"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }))}
                  disabled={generating}
                  className="text-sm"
                />
                <Input
                  label="Fecha fin"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({
                    ...prev,
                    endDate: e.target.value
                  }))}
                  disabled={generating}
                  className="text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={() => handleExportMovements('excel')}
                loading={generating}
                disabled={generating || !dateRange.startDate || !dateRange.endDate}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Download size={16} />
                <span>Exportar Excel</span>
              </Button>
              
              <Button
                onClick={() => handleExportMovements('pdf')}
                loading={generating}
                disabled={generating || !dateRange.startDate || !dateRange.endDate}
                variant="secondary"
                className="w-full flex items-center justify-center space-x-2"
              >
                <FileText size={16} />
                <span>Ver/Imprimir PDF</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Reporte de Alertas */}
        <Card title="Alertas y Vencimientos" className="h-auto">
          <div className="flex flex-col h-full">
            <div className="flex-1 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <h4 className="font-medium">Productos en Alerta</h4>
                  <p className="text-sm text-gray-600">
                    Vencimientos y bajo stock
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Próximos a vencer:</span>
                    <span className="font-medium text-yellow-600">
                      {alerts.nearExpiry?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bajo stock:</span>
                    <span className="font-medium text-red-600">
                      {alerts.lowStock?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium text-gray-700">Total alertas:</span>
                    <span className="font-bold text-gray-900">
                      {(alerts.nearExpiry?.length || 0) + (alerts.lowStock?.length || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={() => handleExportAlerts('excel')}
                loading={generating}
                disabled={generating}
                variant="danger"
                className="w-full flex items-center justify-center space-x-2"
              >
                <Download size={16} />
                <span>Exportar Excel</span>
              </Button>
              
              <Button
                onClick={() => handleExportAlerts('pdf')}
                loading={generating}
                disabled={generating}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2"
              >
                <FileText size={16} />
                <span>Ver/Imprimir PDF</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Información adicional */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">Formatos de exportación</h3>
            <div className="mt-2 text-sm text-blue-800">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Excel:</strong> Archivo .xlsx con múltiples hojas y formato</li>
                <li><strong>CSV:</strong> Archivo de texto separado por comas</li>
                <li><strong>PDF:</strong> Documento imprimible con formato profesional</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Estado de generación */}
      {generating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-900">Generando reporte...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reports