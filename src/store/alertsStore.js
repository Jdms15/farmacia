// src/store/alertsStore.js
import { create } from 'zustand'
import { productService } from '../services/productService'

export const useAlertsStore = create((set, get) => ({
  alerts: {
    nearExpiry: [],
    lowStock: []
  },
  loading: false,
  error: null,
  
  // Obtener todas las alertas
  fetchAlerts: async () => {
    set({ loading: true, error: null })
    try {
      const [nearExpiryResult, lowStockResult] = await Promise.all([
        productService.getProductsNearExpiry(30),
        productService.getProductsLowStock()
      ])
      
      // Verificar errores en las respuestas
      if (nearExpiryResult.error) {
        console.error('Error fetching near expiry products:', nearExpiryResult.error)
      }
      
      if (lowStockResult.error) {
        console.error('Error fetching low stock products:', lowStockResult.error)
      }
      
      set({
        alerts: {
          nearExpiry: nearExpiryResult.data || [],
          lowStock: lowStockResult.data || []
        },
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching alerts:', error)
      set({ 
        loading: false, 
        error: error.message || 'Error al cargar alertas',
        alerts: {
          nearExpiry: [],
          lowStock: []
        }
      })
    }
  },

  // Función alternativa más robusta
  fetchAlertsRobust: async () => {
    set({ loading: true, error: null })
    
    try {
      // Obtener todos los productos y calcular alertas en el cliente
      const { data: productos, error } = await productService.getProducts()
      
      if (error) throw error
      
      const today = new Date()
      const in30Days = new Date()
      in30Days.setDate(today.getDate() + 30)
      
      const nearExpiry = productos.filter(product => {
        const expiryDate = new Date(product.fecha_vencimiento)
        return expiryDate <= in30Days && expiryDate > today
      })
      
      const lowStock = productos.filter(product => 
        product.cantidad <= product.stock_minimo
      )
      
      set({
        alerts: {
          nearExpiry,
          lowStock
        },
        loading: false,
        error: null
      })
      
    } catch (error) {
      console.error('Error fetching alerts:', error)
      set({ 
        loading: false, 
        error: error.message || 'Error al cargar alertas',
        alerts: {
          nearExpiry: [],
          lowStock: []
        }
      })
    }
  },

  // Obtener conteo total de alertas
  getTotalAlerts: () => {
    const { alerts } = get()
    return alerts.nearExpiry.length + alerts.lowStock.length
  },

  // Verificar si un producto tiene alerta de vencimiento
  isNearExpiry: (productId) => {
    const { alerts } = get()
    return alerts.nearExpiry.some(product => product.id === productId)
  },

  // Verificar si un producto tiene alerta de bajo stock
  isLowStock: (productId) => {
    const { alerts } = get()
    return alerts.lowStock.some(product => product.id === productId)
  },

  // Limpiar errores
  clearError: () => {
    set({ error: null })
  },

  // Refrescar alertas manualmente
  refreshAlerts: () => {
    const { fetchAlerts } = get()
    fetchAlerts()
  }
}))

// Función helper para formatear alertas
export const formatAlertMessage = (alerts) => {
  const { nearExpiry, lowStock } = alerts
  const messages = []
  
  if (nearExpiry.length > 0) {
    messages.push(`${nearExpiry.length} producto(s) próximo(s) a vencer`)
  }
  
  if (lowStock.length > 0) {
    messages.push(`${lowStock.length} producto(s) con bajo stock`)
  }
  
  return messages.join(' • ')
}