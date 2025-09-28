// src/pages/Movements.jsx
import React, { useState, useEffect } from 'react'
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
    // Prevenir múltiples envíos
    if (isCreating) {
      return { success: false, error: 'Ya se está procesando un movimiento' }
    }

    setIsCreating(true)
    
    try {
      console.log('Creando movimiento:', movementData)
      
      const result = await movementService.createMovement(movementData)
      
      if (result.error) {
        throw result.error
      }

      toast.success('Movimiento registrado exitosamente')
      
      // Cerrar modal y actualizar datos
      setIsModalOpen(false)
      
      // Refrescar tanto movimientos como productos
      await Promise.all([
        fetchMovements(),
        fetchProducts()
      ])
      
      return { success: true, data: result.data }
    } catch (error) {
      console.error('Error creating movement:', error)
      
      // Mostrar mensaje de error específico
      const errorMessage = error.message || 'Error al registrar movimiento'
      toast.error(errorMessage)
      
      return { success: false, error }
    } finally {
      setIsCreating(false)
    }
  }

  const handleExport = () => {
    // Implementar exportación
    toast.info('Función de exportación en desarrollo')
  }

  const handleCloseModal = () => {
    if (!isCreating) {
      setIsModalOpen(false)
    }
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
            onClick={() => setIsModalOpen(true)} 
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
    </div>
  )
}

export default Movements