// src/pages/PermisosAdmin.jsx
import React, { useState, useEffect } from 'react'
import { Shield, Users, CheckCircle, XCircle } from 'lucide-react'
import { permisosService } from '../services/permissionsService'
import { userService } from '../services/userService'
import { useAuth } from '../hooks/useAuth'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

const AdminPermissions = () => {
  const { isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [permisos, setPermisos] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    if (isAdmin) {
      fetchData()
    }
  }, [isAdmin])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersResult, permisosResult] = await Promise.all([
        userService.getUsers(),
        permisosService.getAllPermisos()
      ])

      if (usersResult.data) {
        setUsers(usersResult.data)
      }

      if (permisosResult.data) {
        // Crear mapa de permisos por user_id
        const permisosMap = {}
        permisosResult.data.forEach(p => {
          permisosMap[p.user_id] = p
        })
        setPermisos(permisosMap)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePermiso = async (userId, permiso) => {
    setSaving(userId)
    try {
      const currentPermisos = permisos[userId] || {}
      const newValue = !currentPermisos[permiso]

      // Si no existen permisos, crearlos
      if (!currentPermisos.id) {
        await permisosService.createPermisosDefault(userId)
      }

      const { error } = await permisosService.updatePermisos(userId, {
        [permiso]: newValue
      })

      if (error) throw error

      toast.success('Permiso actualizado')
      await fetchData()
    } catch (error) {
      console.error('Error updating permiso:', error)
      toast.error('Error al actualizar permiso')
    } finally {
      setSaving(null)
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600">
            Solo los administradores pueden gestionar permisos.
          </p>
        </div>
      </div>
    )
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Permisos</h1>
        <p className="text-gray-600">Administra los permisos de los usuarios del sistema</p>
      </div>

      {/* Información de permisos */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">📋 Solicitar Medicamentos</h3>
            <p className="text-sm text-gray-600">
              Permite al usuario crear solicitudes de medicamentos
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">✅ Aprobar Solicitudes</h3>
            <p className="text-sm text-gray-600">
              Permite aprobar o rechazar solicitudes de medicamentos
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">📦 Entregar Medicamentos</h3>
            <p className="text-sm text-gray-600">
              Permite marcar solicitudes como entregadas
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">👥 Gestionar Usuarios</h3>
            <p className="text-sm text-gray-600">
              Permite crear, editar y eliminar usuarios (solo admin)
            </p>
          </div>
        </div>
      </Card>

      {/* Lista de usuarios con permisos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Usuario
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                📋 Solicitar
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                ✅ Aprobar
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                📦 Entregar
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                👥 Gestionar Usuarios
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const userPermisos = permisos[user.id] || {}
              const isCurrentUserSaving = saving === user.id

              return (
                <tr key={user.id} className={isCurrentUserSaving ? 'opacity-50' : ''}>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{user.nombre}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Rol: <span className="font-medium">{user.rol}</span>
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleTogglePermiso(user.id, 'puede_solicitar_medicamentos')}
                      disabled={isCurrentUserSaving}
                      className="inline-flex items-center justify-center"
                    >
                      {userPermisos.puede_solicitar_medicamentos ? (
                        <CheckCircle className="text-green-600" size={24} />
                      ) : (
                        <XCircle className="text-gray-300 hover:text-red-600" size={24} />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleTogglePermiso(user.id, 'puede_aprobar_solicitudes')}
                      disabled={isCurrentUserSaving || user.rol !== 'admin' && user.rol !== 'operador'}
                      className="inline-flex items-center justify-center"
                    >
                      {userPermisos.puede_aprobar_solicitudes ? (
                        <CheckCircle className="text-green-600" size={24} />
                      ) : (
                        <XCircle className="text-gray-300 hover:text-red-600" size={24} />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleTogglePermiso(user.id, 'puede_entregar_medicamentos')}
                      disabled={isCurrentUserSaving || user.rol !== 'admin' && user.rol !== 'operador'}
                      className="inline-flex items-center justify-center"
                    >
                      {userPermisos.puede_entregar_medicamentos ? (
                        <CheckCircle className="text-green-600" size={24} />
                      ) : (
                        <XCircle className="text-gray-300 hover:text-red-600" size={24} />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleTogglePermiso(user.id, 'puede_gestionar_usuarios')}
                      disabled={isCurrentUserSaving || user.rol !== 'admin'}
                      className="inline-flex items-center justify-center"
                    >
                      {userPermisos.puede_gestionar_usuarios ? (
                        <CheckCircle className="text-green-600" size={24} />
                      ) : (
                        <XCircle className="text-gray-300 hover:text-red-600" size={24} />
                      )}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Notas */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield size={20} className="text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Notas importantes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Los permisos de <strong>Aprobar</strong> y <strong>Entregar</strong> solo están disponibles para Admin y Operadores</li>
              <li>El permiso de <strong>Gestionar Usuarios</strong> solo está disponible para Administradores</li>
              <li>Los cambios se aplican inmediatamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPermissions