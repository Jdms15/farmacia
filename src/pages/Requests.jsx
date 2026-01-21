// src/pages/Solicitudes.jsx
import React, { useState, useEffect } from 'react'
import { Plus, Filter, CheckCircle, XCircle, Package, Clock } from 'lucide-react'
import { solicitudService } from '../services/requestsService'
import { useProducts } from '../hooks/useProducts'
import { useAuth } from '../hooks/useAuth'
import SolicitudForm from '../components/forms/RequestForm'
import SolicitudList from '../components/requests/RequestsList'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Card from '../components/ui/Card'
import toast from 'react-hot-toast'

const Requests = () => {
  const { products } = useProducts()
  const { profile, isAdmin } = useAuth()
  const [solicitudes, setSolicitudes] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState({ estado: '' })

  useEffect(() => {
    fetchSolicitudes()
    fetchStats()
  }, [filters])

  const fetchSolicitudes = async () => {
    setLoading(true)
    try {
      const { data, error } = await solicitudService.getSolicitudes(filters)
      if (error) throw error
      setSolicitudes(data || [])
    } catch (error) {
      console.error('Error fetching solicitudes:', error)
      toast.error('Error al cargar solicitudes')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data, error } = await solicitudService.getEstadisticas()
      if (error) throw error
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleCreateSolicitud = async (solicitudData) => {
    try {
      const { data, error } = await solicitudService.createSolicitud(solicitudData)
      
      if (error) {
        throw error
      }

      toast.success('Solicitud creada exitosamente')
      setIsModalOpen(false)
      await fetchSolicitudes()
      await fetchStats()
      
      return { success: true, data }
    } catch (error) {
      console.error('Error creating solicitud:', error)
      toast.error(error.message || 'Error al crear solicitud')
      return { success: false, error }
    }
  }

  const handleAprobar = async (solicitudId) => {
    const notas = prompt('Notas de aprobación (opcional):')
    if (notas === null) return // Cancelado

    try {
      const { error } = await solicitudService.aprobarSolicitud(solicitudId, notas)
      if (error) throw error
      
      toast.success('Solicitud aprobada')
      await fetchSolicitudes()
      await fetchStats()
    } catch (error) {
      console.error('Error aprobando solicitud:', error)
      toast.error('Error al aprobar solicitud')
    }
  }

  const handleRechazar = async (solicitudId) => {
    const razon = prompt('Razón del rechazo (requerido):')
    if (!razon || razon.trim() === '') {
      toast.error('Debe especificar una razón')
      return
    }

    try {
      const { error } = await solicitudService.rechazarSolicitud(solicitudId, razon)
      if (error) throw error
      
      toast.success('Solicitud rechazada')
      await fetchSolicitudes()
      await fetchStats()
    } catch (error) {
      console.error('Error rechazando solicitud:', error)
      toast.error('Error al rechazar solicitud')
    }
  }

  const handleEntregar = async (solicitudId) => {
    const notas = prompt('Notas de entrega (opcional):')
    if (notas === null) return // Cancelado

    try {
      const { error } = await solicitudService.entregarSolicitud(solicitudId, notas)
      if (error) throw error
      
      toast.success('Medicamento entregado exitosamente')
      await fetchSolicitudes()
      await fetchStats()
    } catch (error) {
      console.error('Error entregando medicamento:', error)
      toast.error(error.message || 'Error al entregar medicamento')
    }
  }

  const handleCancelar = async (solicitudId) => {
    if (!confirm('¿Está seguro de cancelar esta solicitud?')) return

    try {
      const { error } = await solicitudService.cancelarSolicitud(solicitudId)
      if (error) throw error
      
      toast.success('Solicitud cancelada')
      await fetchSolicitudes()
      await fetchStats()
    } catch (error) {
      console.error('Error cancelando solicitud:', error)
      toast.error('Error al cancelar solicitud')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Medicamentos</h1>
          <p className="text-gray-600">Gestiona las solicitudes de medicamentos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2">
          <Plus size={20} />
          <span>Nueva Solicitud</span>
        </Button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <Package size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                <Clock size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendientes}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <CheckCircle size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.aprobadas}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <Package size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Entregadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.entregadas}</p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100 text-red-600">
                <XCircle size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rechazadas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rechazadas}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <div className="flex items-center space-x-4">
          <Filter size={20} className="text-gray-500" />
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por estado
            </label>
            <select
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">⏳ Pendiente</option>
              <option value="aprobada">✅ Aprobada</option>
              <option value="rechazada">❌ Rechazada</option>
              <option value="entregada">📦 Entregada</option>
              <option value="cancelada">🚫 Cancelada</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de solicitudes */}
      <SolicitudList
        solicitudes={solicitudes}
        loading={loading}
        onAprobar={handleAprobar}
        onRechazar={handleRechazar}
        onEntregar={handleEntregar}
        onCancelar={handleCancelar}
        isAdmin={isAdmin}
        currentUserId={profile?.id}
      />

      {/* Modal de formulario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nueva Solicitud de Medicamento"
        size="lg"
      >
        <SolicitudForm
          products={products.filter(p => p.cantidad > 0)} // Solo productos con stock
          onSave={handleCreateSolicitud}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

export default Requests