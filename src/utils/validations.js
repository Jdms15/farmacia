// src/utils/validations.js
import * as yup from 'yup'

export const productValidationSchema = yup.object({
  nombre: yup.string().required('Nombre es requerido'),
  laboratorio: yup.string().required('Laboratorio es requerido'),
  proveedor: yup.string().required('Proveedor es requerido'),
  cantidad: yup.number().min(0, 'La cantidad debe ser mayor o igual a 0').required('Cantidad es requerida'),
  presentacion: yup.string().required('Presentación es requerida'),
  lote: yup.string().required('Lote es requerido'),
  fecha_entrada: yup.date().required('Fecha de entrada es requerida'),
  fecha_fabricacion: yup.date().required('Fecha de fabricación es requerida'),
  fecha_vencimiento: yup.date()
    .min(yup.ref('fecha_fabricacion'), 'La fecha de vencimiento debe ser posterior a la fabricación')
    .required('Fecha de vencimiento es requerida'),
  ubicacion: yup.string().required('Ubicación es requerida'),
  stock_minimo: yup.number().min(1, 'Stock mínimo debe ser mayor a 0').required('Stock mínimo es requerido')
})

export const movementValidationSchema = yup.object({
  producto_id: yup.string().required('Producto es requerido'),
  tipo: yup.string().oneOf(['entrada', 'salida']).required('Tipo es requerido'),
  cantidad: yup.number().min(1, 'La cantidad debe ser mayor a 0').required('Cantidad es requerida'),
  motivo: yup.string()
})

export const loginValidationSchema = yup.object({
  email: yup.string().email('Email inválido').required('Email es requerido'),
  password: yup.string().min(6, 'La contraseña debe tener al menos 6 caracteres').required('Contraseña es requerida')
})