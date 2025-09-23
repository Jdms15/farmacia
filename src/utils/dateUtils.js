// src/utils/dateUtils.js
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  }
  
  return new Date(date).toLocaleDateString('es-CO', defaultOptions)
}

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const getDaysUntilExpiry = (expiryDate) => {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export const isExpired = (expiryDate) => {
  return getDaysUntilExpiry(expiryDate) <= 0
}

export const isNearExpiry = (expiryDate, days = 30) => {
  const daysUntil = getDaysUntilExpiry(expiryDate)
  return daysUntil > 0 && daysUntil <= days
}