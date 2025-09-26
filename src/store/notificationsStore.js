// src/store/notificationsStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'

export const useNotificationsStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      
      // Agregar nueva notificación
      addNotification: (notification) => {
        const newNotification = {
          id: Date.now().toString(),
          ...notification,
          read: false,
          createdAt: new Date().toISOString()
        }
        
        set(state => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50) // Máximo 50 notificaciones
        }))
        
        // Mostrar toast según el tipo
        switch (notification.type) {
          case 'error':
            toast.error(notification.title)
            break
          case 'warning':
            toast(notification.title, { icon: '⚠️' })
            break
          case 'success':
            toast.success(notification.title)
            break
          default:
            toast(notification.title)
        }
        
        return newNotification
      },
      
      // Marcar como leída
      markAsRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
        }))
      },
      
      // Marcar todas como leídas
      markAllAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }))
      },
      
      // Eliminar notificación
      deleteNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      },
      
      // Limpiar todas
      clearAll: () => {
        set({ notifications: [] })
      },
      
      // Obtener cantidad de no leídas
      get unreadCount() {
        return get().notifications.filter(n => !n.read).length
      },
      
      // Crear notificaciones de sistema
      createSystemNotification: (type, data) => {
        const notifications = {
          low_stock: {
            title: '⚠️ Producto con bajo stock',
            message: `${data.productName} tiene solo ${data.currentStock} unidades disponibles`,
            type: 'warning',
            actionUrl: '/productos',
            actionText: 'Ver inventario'
          },
          near_expiry: {
            title: '📅 Producto próximo a vencer',
            message: `${data.productName} vence en ${data.daysToExpiry} días`,
            type: 'warning',
            actionUrl: '/productos',
            actionText: 'Ver producto'
          },
          expired: {
            title: '❌ Producto vencido',
            message: `${data.productName} ha vencido`,
            type: 'error',
            actionUrl: '/productos',
            actionText: 'Gestionar'
          },
          movement_success: {
            title: '✅ Movimiento registrado',
            message: `${data.type === 'entrada' ? 'Entrada' : 'Salida'} de ${data.quantity} unidades de ${data.productName}`,
            type: 'success'
          },
          report_generated: {
            title: '📊 Reporte generado',
            message: `El reporte ${data.reportName} se ha generado exitosamente`,
            type: 'success',
            actionUrl: '/reportes',
            actionText: 'Ver reportes'
          },
          success: {
            title: data.title || '✅ Éxito',
            message: data.message || 'Operación completada exitosamente',
            type: 'success'
          },
          error: {
            title: '❌ Error',
            message: data.message || 'Ha ocurrido un error',
            type: 'error'
          }
        }
        
        const notification = notifications[type]
        if (notification) {
          get().addNotification(notification)
        }
      }
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({ 
        notifications: state.notifications.slice(0, 20) // Solo persistir las últimas 20
      })
    }
  )
)