// src/components/requests/RequestsList.jsx - CON DOCUMENTO DE DESPACHO
import React from 'react'
import { CheckCircle, XCircle, Package, Clock, AlertCircle, FileText } from 'lucide-react'
import { reportService } from '../../services/reportService'
import Table from '../ui/Table'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const RequestsList = ({ 
  solicitudes, 
  loading, 
  onAprobar, 
  onRechazar, 
  onEntregar,
  onCancelar,
  isAdmin,
  currentUserId 
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEstadoBadge = (estado) => {
    const estados = {
      pendiente: { variant: 'warning', icon: '⏳', text: 'Pendiente' },
      aprobada: { variant: 'success', icon: '✅', text: 'Aprobada' },
      rechazada: { variant: 'danger', icon: '❌', text: 'Rechazada' },
      entregada: { variant: 'info', icon: '📦', text: 'Entregada' },
      cancelada: { variant: 'default', icon: '🚫', text: 'Cancelada' }
    }
    const config = estados[estado] || estados.pendiente
    return (
      <Badge variant={config.variant}>
        {config.icon} {config.text}
      </Badge>
    )
  }

  const getPrioridadBadge = (prioridad) => {
    const prioridades = {
      baja: { variant: 'success', icon: '🟢' },
      media: { variant: 'warning', icon: '🟡' },
      alta: { variant: 'danger', icon: '🟠' },
      urgente: { variant: 'danger', icon: '🔴' }
    }
    const config = prioridades[prioridad] || prioridades.media
    return (
      <Badge variant={config.variant} size="sm">
        {config.icon} {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
      </Badge>
    )
  }

  // ✨ NUEVA FUNCIÓN: Generar documento de despacho
  const handleGenerateDeliveryDoc = async (solicitudId) => {
    try {
      toast.loading('Generando documento de despacho...', { id: 'delivery-doc' })
      
      const result = await reportService.generateDeliveryDocument(solicitudId)
      
      if (result.success) {
        toast.success('Documento generado exitosamente', { id: 'delivery-doc' })
      } else {
        throw new Error(result.error || 'Error al generar documento')
      }
    } catch (error) {
      console.error('Error generando documento:', error)
      toast.error('Error: ' + error.message, { id: 'delivery-doc' })
    }
  }

  const columns = [
    {
      header: 'Fecha',
      key: 'fecha_solicitud',
      render: (value) => (
        <div className="text-sm">
          {formatDate(value)}
        </div>
      )
    },
    {
      header: 'Solicitante',
      key: 'solicitante_nombre',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          <div className="mt-1">{getPrioridadBadge(row.prioridad)}</div>
        </div>
      )
    },
    {
      header: 'Producto',
      key: 'productos',
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-900">{value?.nombre}</p>
          <p className="text-sm text-gray-600">{value?.laboratorio}</p>
          <p className="text-xs text-gray-500 mt-1">
            {row.cantidad} unidad(es) × ${(row.precio_unitario || 0).toFixed(2)}
          </p>
        </div>
      )
    },
    {
      header: 'Total',
      key: 'subtotal',
      render: (value) => (
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">
            ${(value || 0).toFixed(2)}
          </p>
        </div>
      )
    },
    {
      header: 'Estado',
      key: 'estado',
      render: (value) => getEstadoBadge(value)
    },
    {
      header: 'Motivo',
      key: 'motivo',
      render: (value, row) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-700 line-clamp-2">{value}</p>
          {row.notas_aprobacion && (
            <p className="text-xs text-blue-600 mt-1">
              <strong>Notas:</strong> {row.notas_aprobacion}
            </p>
          )}
          {row.razon_rechazo && (
            <p className="text-xs text-red-600 mt-1">
              <strong>Razón rechazo:</strong> {row.razon_rechazo}
            </p>
          )}
          {row.notas_entrega && (
            <p className="text-xs text-green-600 mt-1">
              <strong>Notas entrega:</strong> {row.notas_entrega}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Acciones',
      key: 'actions',
      render: (_, row) => {
        const isSolicitante = currentUserId === row.solicitante_id

        return (
          <div className="flex flex-col space-y-2">
            {/* Botones para farmacia (admin/operador) */}
            {(isAdmin || row.estado !== 'cancelada') && (
              <>
                {row.estado === 'pendiente' && isAdmin && (
                  <div className="flex space-x-2">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => onAprobar(row.id)}
                      title="Aprobar solicitud"
                    >
                      <CheckCircle size={14} />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onRechazar(row.id)}
                      title="Rechazar solicitud"
                    >
                      <XCircle size={14} />
                    </Button>
                  </div>
                )}

                {row.estado === 'aprobada' && isAdmin && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onEntregar(row.id)}
                    title="Marcar como entregada"
                    className="flex items-center space-x-1"
                  >
                    <Package size={14} />
                    <span>Entregar</span>
                  </Button>
                )}

                {/* ✨ NUEVO: Botón para generar documento de despacho */}
                {row.estado === 'entregada' && (
                  <div className="space-y-2">
                    <Badge variant="success" size="sm">
                      ✓ Completada
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateDeliveryDoc(row.id)}
                      className="flex items-center space-x-1 text-blue-600 hover:bg-blue-50"
                      title="Generar documento de despacho"
                    >
                      <FileText size={14} />
                      <span>Doc. Despacho</span>
                    </Button>
                  </div>
                )}

                {/* Botones para solicitante */}
                {row.estado === 'pendiente' && isSolicitante && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancelar(row.id)}
                    title="Cancelar solicitud"
                    className="text-red-600 hover:bg-red-50"
                  >
                    Cancelar
                  </Button>
                )}
              </>
            )}
          </div>
        )
      }
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
    <div className="bg-white rounded-lg shadow">
      {solicitudes.length === 0 ? (
        <div className="p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay solicitudes
          </h3>
          <p className="text-gray-600">
            Crea una nueva solicitud para comenzar
          </p>
        </div>
      ) : (
        <>
          {/* Info sobre documento de despacho */}
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-start space-x-3">
              <FileText size={16} className="text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p><strong>Documento de Despacho:</strong> Para solicitudes entregadas, puedes generar un comprobante con el detalle del despacho y el costo total.</p>
              </div>
            </div>
          </div>

          <Table
            columns={columns}
            data={solicitudes}
            className="min-h-96"
          />
        </>
      )}
    </div>
  )
}

export default RequestsList