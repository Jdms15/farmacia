// src/components/users/UserList.jsx
import React, { useState } from 'react'
import { 
  Edit, 
  Trash2, 
  Shield, 
  User, 
  Key, 
  UserX, 
  UserCheck,
  MoreVertical 
} from 'lucide-react'
import Table from '../ui/Table'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import { useAuth } from '../../hooks/useAuth'

const UserList = ({ users, loading, onEdit, onDelete, onResetPassword, onToggleStatus }) => {
  const { user: currentUser } = useAuth()
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)

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
    if (!newPassword || newPassword.length < 6) {
      return
    }

    setIsResetting(true)
    try {
      await onResetPassword(selectedUser.id, newPassword)
      setShowResetModal(false)
      setSelectedUser(null)
      setNewPassword('')
    } finally {
      setIsResetting(false)
    }
  }

  const openResetModal = (user) => {
    setSelectedUser(user)
    setNewPassword('')
    setShowResetModal(true)
  }

  const closeResetModal = () => {
    setShowResetModal(false)
    setSelectedUser(null)
    setNewPassword('')
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
      header: 'Estado',
      key: 'banned_until',
      render: (value) => (
        <Badge variant={value ? 'danger' : 'success'}>
          {value ? 'Deshabilitado' : 'Activo'}
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
        const isCurrentUser = currentUser?.id === row.id
        const isDisabled = !!row.banned_until
        
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

            {/* Resetear contraseña */}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                openResetModal(row)
              }}
              title="Resetear contraseña"
            >
              <Key size={14} />
            </Button>

            {/* Habilitar/Deshabilitar */}
            {!isCurrentUser && (
              <Button
                variant={isDisabled ? "success" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleStatus(row.id, !isDisabled)
                }}
                title={isDisabled ? "Habilitar usuario" : "Deshabilitar usuario"}
              >
                {isDisabled ? <UserCheck size={14} /> : <UserX size={14} />}
              </Button>
            )}

            {/* Eliminar */}
            {!isCurrentUser && (
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
        <Table
          columns={columns}
          data={users}
          className="min-h-96"
        />
      </div>

      {/* Modal para resetear contraseña */}
      <Modal
        isOpen={showResetModal}
        onClose={closeResetModal}
        title="Resetear Contraseña"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Se cambiará la contraseña de <strong>{selectedUser?.nombre}</strong>
              </p>
            </div>
          </div>

          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            disabled={isResetting}
            required
          />

          {/* Indicador de fortaleza */}
          {newPassword && (
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    newPassword.length < 6
                      ? 'w-1/3 bg-red-500'
                      : newPassword.length < 8
                      ? 'w-2/3 bg-yellow-500'
                      : 'w-full bg-green-500'
                  }`}
                />
              </div>
              <span className="text-xs text-gray-500">
                {newPassword.length < 6
                  ? 'Débil'
                  : newPassword.length < 8
                  ? 'Media'
                  : 'Fuerte'}
              </span>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeResetModal}
              disabled={isResetting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              loading={isResetting}
              disabled={isResetting || newPassword.length < 6}
            >
              Cambiar Contraseña
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default UserList