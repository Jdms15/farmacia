// src/pages/UsersAdmin.jsx
import React, { useState } from 'react'
import { Plus, Users, Shield, UserCheck, Clock } from 'lucide-react'
import { useUsers } from '../hooks/useUsers'
import { useAuth } from '../hooks/useAuth'
import UserForm from '../components/forms/UserForm'
import UserList from '../components/users/UserList'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

const UsersAdmin = () => {
  const { isAdmin } = useAuth()
  const {
    users,
    loading,
    stats,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    toggleUserStatus,
    canManageUsers
  } = useUsers()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  // Verificar permisos
  if (!isAdmin || !canManageUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600">
            No tienes permisos para administrar usuarios.
          </p>
        </div>
      </div>
    )
  }

  const handleCreate = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleSave = async (userData) => {
    let result
    if (editingUser) {
      result = await updateUser(editingUser.id, userData)
    } else {
      result = await createUser(userData)
    }

    if (result.success) {
      setIsModalOpen(false)
      setEditingUser(null)
    }

    return result
  }

  const handleDelete = async (userId) => {
    await deleteUser(userId)
  }

  const handleResetPassword = async (userId, newPassword) => {
    await resetPassword(userId, newPassword)
  }

  const handleToggleStatus = async (userId, disabled) => {
    await toggleUserStatus(userId, disabled)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administración de Usuarios</h1>
          <p className="text-gray-600">Gestiona usuarios y permisos del sistema</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center space-x-2">
          <Plus size={20} />
          <span>Nuevo Usuario</span>
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Users size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Usuarios
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
              <p className="text-xs text-gray-500">
                usuarios registrados
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Shield size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Administradores
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.admins}
              </p>
              <p className="text-xs text-gray-500">
                con permisos completos
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <UserCheck size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Operadores
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.operators}
              </p>
              <p className="text-xs text-gray-500">
                usuarios estándar
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <Clock size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Nuevos (7 días)
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.recentUsers}
              </p>
              <p className="text-xs text-gray-500">
                usuarios recientes
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Información de permisos */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Niveles de acceso</h3>
            <div className="mt-2 text-sm text-blue-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">👤 Operador:</p>
                  <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                    <li>Gestionar productos</li>
                    <li>Registrar movimientos</li>
                    <li>Ver reportes básicos</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">🛡️ Administrador:</p>
                  <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                    <li>Todos los permisos de operador</li>
                    <li>Administrar usuarios</li>
                    <li>Eliminar productos</li>
                    <li>Acceso completo a reportes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de usuarios */}
      <UserList
        users={users}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onResetPassword={handleResetPassword}
        onToggleStatus={handleToggleStatus}
      />

      {/* Modal de formulario */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        size="md"
      >
        <UserForm
          user={editingUser}
          onSave={handleSave}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  )
}

export default UsersAdmin