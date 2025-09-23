// src/utils/constants.js
export const PRODUCT_LOCATIONS = [
  'Estante A1',
  'Estante A2',
  'Estante B1',
  'Estante B2',
  'Refrigerador 1',
  'Refrigerador 2',
  'Bodega Principal',
  'Área de Cuarentena'
]

export const MOVEMENT_REASONS = {
  entrada: [
    'Compra nueva',
    'Devolución de cliente',
    'Ajuste de inventario',
    'Transferencia desde otra sede'
  ],
  salida: [
    'Venta al público',
    'Dispensación médica',
    'Producto vencido',
    'Transferencia a otra sede',
    'Ajuste de inventario'
  ]
}

export const ALERT_TYPES = {
  NEAR_EXPIRY: 'near_expiry',
  LOW_STOCK: 'low_stock',
  EXPIRED: 'expired'
}