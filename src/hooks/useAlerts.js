// src/hooks/useAlerts.js
import { useEffect } from 'react'
import { useAlertsStore } from '../store/alertsStore'

export const useAlerts = () => {
  const {
    alerts,
    loading,
    error,
    fetchAlerts,
    fetchAlertsRobust,
    getTotalAlerts,
    isNearExpiry,
    isLowStock,
    clearError,
    refreshAlerts
  } = useAlertsStore()

  useEffect(() => {
    // Intentar primero con la función normal, si falla usar la robusta
    const loadAlerts = async () => {
      try {
        await fetchAlerts()
      } catch (error) {
        console.warn('fetchAlerts falló, intentando con fetchAlertsRobust:', error)
        await fetchAlertsRobust()
      }
    }

    loadAlerts()

    // Actualizar alertas cada 5 minutos
    const interval = setInterval(() => {
      loadAlerts()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [fetchAlerts, fetchAlertsRobust])

  // Función para reintentar en caso de error
  const retryFetchAlerts = async () => {
    clearError()
    try {
      await fetchAlertsRobust()
    } catch (error) {
      console.error('Error al reintentar cargar alertas:', error)
    }
  }

  return {
    alerts,
    loading,
    error,
    totalAlerts: getTotalAlerts(),
    isNearExpiry,
    isLowStock,
    refreshAlerts,
    retryFetchAlerts,
    clearError
  }
}