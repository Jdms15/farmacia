// src/components/users/UserList.jsx - Versión segura
import React, { useState } from 'react'
import { 
  Edit, 
  Trash2, 
  Shield, 
  User, 
  Mail
} from 'lucide-react'
import Table from '../ui/Table'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { userService } from '../../services/userService'
import toast from 'react-hot-toast'

const UserList = ({ users, loading, onEdit, onDelete }) => {
  const { user: currentUser } = useAuth()
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleResetPassword = async () => {
    if (!selectedUser?.email || selectedUser.email === 'No disponible') {
      toast.error('Email no disponible para este usuario')
      return
    }

    setIsSendingEmail(true)
    try {
      const { error } = await userService.sendPasswordResetEmail(selectedUser.email)
      
      if (error) throw error
      
      toast.success(`Email de reseteo enviado a ${selectedUser.email}`)
      setShowResetModal(false)
      setSelectedUser(null)
    } catch (error) {
      toast.error('Error enviando email: ' + error.message)
    } finally {
      setIsSendingEmail(false)
    }
  }

  const columns = [
    {
      header: 'Usuario',
      key: 'nombre',
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            row.rol === 'admin' 
              ? 'bg-purple-100 text-purple-600' 
              : 'bg-blue-100 text-blue-600'
          }`}>
            {row.rol === 'admin' ? (
              <Shield size={16} />
            ) : (
              <User size={16} />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-600">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Rol',
      key: 'rol',
      render: (value) => (
        <Badge variant={value === 'admin' ? 'info' : 'default'}>
          {value === 'admin' ? 'Administrador' : 'Operador'}
        </Badge>
      )
    },
    {
      header: 'Creado',
      key: 'created_at',
      render: (value) => (
        <div className="text-sm">
          <p>{formatDate(value)}</p>
        </div>
      )
    },
    {
      header: 'Último acceso',
      key: 'last_sign_in_at',
      render: (value) => (
        <div className="text-sm text-gray-600">
          {formatDate(value)}
        </div>
      )
    },
    {
      header: 'Acciones',
      key: 'actions',
      render: (_, row) => {
        const isCurrentUserRow = currentUser?.id === row.id
        
        return (
          <div className="flex items-center space-x-2">
            {/* Editar */}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(row)
              }}
              title="Editar usuario"
            >
              <Edit size={14} />
            </Button>

            {/* Resetear contraseña (enviar email) */}
            {row.email && row.email !== 'No disponible' && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedUser(row)
                  setShowResetModal(true)
                }}
                title="Enviar email para resetear contraseña"
              >
                <Mail size={14} />
              </Button>
            )}

            {/* Eliminar */}
            {!isCurrentUserRow && (
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(
                    `¿Estás seguro de que quieres eliminar a ${row.nombre}?\n\nEsta acción no se puede deshacer.`
                  )) {
                    onDelete(row.id)
                  }
                }}
                title="Eliminar usuario"
              >
                <Trash2 size={14} />
              </Button>
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
    <>
      <div className="bg-white rounded-lg shadow">
        {/* Información sobre limitaciones */}
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-start space-x-3">
            <Shield size={16} className="text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p><strong>Nota de seguridad:</strong> En esta versión segura, el reseteo de contraseña se hace mediante email. El usuario recibirá un link para crear una nueva contraseña.</p>
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          data={users}
          className="min-h-96"
        />
      </div>

      {/* Modal para confirmar envío de email de reseteo */}
      <Modal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false)
          setSelectedUser(null)
        }}
        title="Resetear Contraseña"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                Se enviará un email de recuperación a:
              </p>
            </div>
            <p className="text-sm font-semibold text-blue-900 mt-2">
              {selectedUser?.email}
            </p>
            <p className="text-xs text-blue-700 mt-2">
              El usuario <strong>{selectedUser?.nombre}</strong> recibirá un link para crear una nueva contraseña.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowResetModal(false)
                setSelectedUser(null)
              }}
              disabled={isSendingEmail}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              loading={isSendingEmail}
              disabled={isSendingEmail}
            >
              Enviar Email
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default UserList