// src/pages/Movements.jsx - CON PROTECCIÓN ANTI-DOBLE-SUBMIT
import React, { useState, useEffect, useRef } from 'react'
import { Plus, Download } from 'lucide-react'
import { movementService } from '../services/movementService'
import { useProducts } from '../hooks/useProducts'
import MovementForm from '../components/forms/MovementForm'
import MovementList from '../components/movements/MovementList'
import MovementFilters from '../components/movements/MovementFilters'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import toast from 'react-hot-toast'

const Movements = () => {
  const { products, fetchProducts } = useProducts()
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [filters, setFilters] = useState({
    productoId: '',
    tipo: '',
    fechaInicio: '',
    fechaFin: ''
  })

  // ✅ Ref para prevenir doble submit
  const lastSubmitTime = useRef(0)
  const lastSubmitData = useRef(null)

  useEffect(() => {
    fetchMovements()
  }, [filters])

  const fetchMovements = async () => {
    setLoading(true)
    try {
      const { data, error } = await movementService.getMovements(filters)
      if (error) throw error
      setMovements(data || [])
    } catch (error) {
      console.error('Error fetching movements:', error)
      toast.error('Error al cargar movimientos')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMovement = async (movementData) => {
    // ✅ PROTECCIÓN 1: Prevenir si ya está procesando
    if (isCreating) {
      console.warn('⚠️ Ya se está procesando un movimiento, ignorando...')
      return { success: false, error: 'Ya se está procesando un movimiento' }
    }

    // ✅ PROTECCIÓN 2: Prevenir doble submit en menos de 2 segundos
    const now = Date.now()
    const timeSinceLastSubmit = now - lastSubmitTime.current
    
    // Comparar datos para detectar duplicados exactos
    const dataString = JSON.stringify(movementData)
    const isDuplicate = 
      dataString === lastSubmitData.current && 
      timeSinceLastSubmit < 2000 // 2 segundos

    if (isDuplicate) {
      console.warn('⚠️ Movimiento duplicado detectado, ignorando...')
      toast.error('Por favor espera antes de crear otro movimiento')
      return { success: false, error: 'Movimiento duplicado' }
    }

    // Actualizar referencias
    lastSubmitTime.current = now
    lastSubmitData.current = dataString

    // Marcar como procesando
    setIsCreating(true)
    
    try {
      console.log('📦 Creando movimiento (protegido):', movementData)
      
      const result = await movementService.createMovement(movementData)
      
      if (result.error) {
        throw result.error
      }

      console.log('✅ Movimiento creado exitosamente')
      toast.success('Movimiento registrado exitosamente')
      
      // Cerrar modal
      setIsModalOpen(false)
      
      // Refrescar datos
      await Promise.all([
        fetchMovements(),
        fetchProducts()
      ])
      
      return { success: true, data: result.data }
    } catch (error) {
      console.error('❌ Error creating movement:', error)
      
      const errorMessage = error.message || 'Error al registrar movimiento'
      toast.error(errorMessage)
      
      return { success: false, error }
    } finally {
      // ✅ Pequeño delay antes de permitir otro submit
      setTimeout(() => {
        setIsCreating(false)
      }, 500)
    }
  }

  const handleExport = () => {
    toast.info('Función de exportación en desarrollo')
  }

  const handleCloseModal = () => {
    if (!isCreating) {
      setIsModalOpen(false)
      // Limpiar referencias al cerrar
      lastSubmitTime.current = 0
      lastSubmitData.current = null
    }
  }

  const handleOpenModal = () => {
    // Limpiar referencias al abrir
    lastSubmitTime.current = 0
    lastSubmitData.current = null
    setIsModalOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimientos</h1>
          <p className="text-gray-600">Registro de entradas y salidas</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={handleExport} 
            className="flex items-center space-x-2"
            disabled={isCreating}
          >
            <Download size={20} />
            <span>Exportar</span>
          </Button>
          <Button 
            onClick={handleOpenModal} 
            className="flex items-center space-x-2"
            disabled={isCreating}
          >
            <Plus size={20} />
            <span>Nuevo Movimiento</span>
          </Button>
        </div>
      </div>

      <MovementFilters 
        filters={filters} 
        onFiltersChange={setFilters}
        products={products}
      />

      <MovementList movements={movements} loading={loading} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Nuevo Movimiento"
        size="md"
        showCloseButton={!isCreating}
      >
        <MovementForm
          products={products}
          onSave={handleCreateMovement}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Overlay para prevenir clicks durante procesamiento */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div>
                <p className="font-semibold text-gray-900">Procesando movimiento...</p>
                <p className="text-sm text-gray-600">Por favor espera</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Movements