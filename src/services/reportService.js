// src/services/reportService.js
import { supabase } from './supabase'
import { productService } from './productService'
import { movementService } from './movementService'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const reportService = {
  // Generar reporte de inventario
  async generateInventoryReport(format = 'pdf') {
    try {
      const { data: products, error } = await productService.getProducts()
      if (error) throw error

      const reportData = products.map(product => ({
        'Nombre': product.nombre,
        'Laboratorio': product.laboratorio,
        'Proveedor': product.proveedor,
        'Lote': product.lote,
        'Cantidad': product.cantidad,
        'Presentación': product.presentacion,
        'Ubicación': product.ubicacion,
        'Vencimiento': new Date(product.fecha_vencimiento).toLocaleDateString('es-CO'),
        'Stock Mínimo': product.stock_minimo,
        'Refrigeración': product.necesita_refrigeracion ? 'Sí' : 'No',
        'Estado': this.getProductStatus(product)
      }))

      if (format === 'excel') {
        return this.exportToExcel(reportData, 'Inventario_Completo')
      } else if (format === 'pdf') {
        return this.exportInventoryToPDF(reportData)
      } else if (format === 'csv') {
        return this.exportToCSV(reportData, 'Inventario_Completo')
      }

      return { success: true, data: reportData }
    } catch (error) {
      console.error('Error generating inventory report:', error)
      return { success: false, error: error.message }
    }
  },

  // Generar reporte de movimientos
  async generateMovementsReport(startDate, endDate, format = 'excel') {
    try {
      const filters = {
        fechaInicio: startDate,
        fechaFin: endDate
      }
      
      const { data: movements, error } = await movementService.getMovements(filters)
      if (error) throw error

      const reportData = movements.map(movement => ({
        'Fecha': new Date(movement.fecha).toLocaleString('es-CO'),
        'Tipo': movement.tipo === 'entrada' ? 'Entrada' : 'Salida',
        'Producto': movement.productos?.nombre || 'N/A',
        'Laboratorio': movement.productos?.laboratorio || 'N/A',
        'Cantidad': movement.cantidad,
        'Usuario': movement.usuario,
        'Motivo': movement.motivo || 'No especificado'
      }))

      // Agregar resumen
      const summary = {
        totalMovimientos: movements.length,
        totalEntradas: movements.filter(m => m.tipo === 'entrada').length,
        totalSalidas: movements.filter(m => m.tipo === 'salida').length,
        unidadesEntrada: movements.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.cantidad, 0),
        unidadesSalida: movements.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + m.cantidad, 0)
      }

      if (format === 'excel') {
        return this.exportMovementsToExcel(reportData, summary, startDate, endDate)
      } else if (format === 'pdf') {
        return this.exportMovementsToPDF(reportData, summary, startDate, endDate)
      }

      return { success: true, data: reportData, summary }
    } catch (error) {
      console.error('Error generating movements report:', error)
      return { success: false, error: error.message }
    }
  },

  // Generar reporte de alertas
  async generateAlertsReport(format = 'pdf') {
    try {
      const [nearExpiryResult, lowStockResult] = await Promise.all([
        productService.getProductsNearExpiry(30),
        productService.getProductsLowStock()
      ])

      const alertsData = {
        nearExpiry: nearExpiryResult.data || [],
        lowStock: lowStockResult.data || [],
        expired: []
      }

      // Obtener productos vencidos
      const { data: products } = await productService.getProducts()
      if (products) {
        alertsData.expired = products.filter(p => new Date(p.fecha_vencimiento) < new Date())
      }

      if (format === 'pdf') {
        return this.exportAlertsToPDF(alertsData)
      } else if (format === 'excel') {
        return this.exportAlertsToExcel(alertsData)
      }

      return { success: true, data: alertsData }
    } catch (error) {
      console.error('Error generating alerts report:', error)
      return { success: false, error: error.message }
    }
  },

  // Exportar a Excel
  exportToExcel(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')

    // Ajustar anchos de columna
    const maxWidth = 20
    const wscols = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }))
    worksheet['!cols'] = wscols

    // Descargar archivo
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
    
    return { success: true }
  },

  // Exportar movimientos a Excel con múltiples hojas
  exportMovementsToExcel(data, summary, startDate, endDate) {
    const workbook = XLSX.utils.book_new()

    // Hoja de resumen
    const summaryData = [
      ['REPORTE DE MOVIMIENTOS'],
      [''],
      ['Período:', `${startDate} a ${endDate}`],
      [''],
      ['RESUMEN'],
      ['Total de movimientos:', summary.totalMovimientos],
      ['Total entradas:', summary.totalEntradas],
      ['Total salidas:', summary.totalSalidas],
      ['Unidades ingresadas:', summary.unidadesEntrada],
      ['Unidades retiradas:', summary.unidadesSalida],
      [''],
      ['Generado:', new Date().toLocaleString('es-CO')]
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')

    // Hoja de movimientos
    const movementsSheet = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, movementsSheet, 'Movimientos')

    // Descargar
    XLSX.writeFile(workbook, `Movimientos_${startDate}_${endDate}.xlsx`)
    
    return { success: true }
  },

  // Exportar a CSV
  exportToCSV(data, filename) {
    const headers = Object.keys(data[0] || {})
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    return { success: true }
  },

  // Exportar inventario a PDF
  exportInventoryToPDF(data) {
    const doc = new jsPDF('landscape')
    
    // Título
    doc.setFontSize(18)
    doc.text('Reporte de Inventario', 14, 20)
    
    // Fecha
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, 30)
    
    // Tabla
    doc.autoTable({
      head: [['Nombre', 'Laboratorio', 'Lote', 'Cantidad', 'Vencimiento', 'Ubicación', 'Estado']],
      body: data.map(item => [
        item.Nombre,
        item.Laboratorio,
        item.Lote,
        item.Cantidad,
        item.Vencimiento,
        item.Ubicación,
        item.Estado
      ]),
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    // Guardar
    doc.save(`Inventario_${new Date().toISOString().split('T')[0]}.pdf`)
    
    return { success: true }
  },

  // Exportar movimientos a PDF
  exportMovementsToPDF(data, summary, startDate, endDate) {
    const doc = new jsPDF()
    
    // Título
    doc.setFontSize(18)
    doc.text('Reporte de Movimientos', 14, 20)
    
    // Período
    doc.setFontSize(12)
    doc.text(`Período: ${startDate} a ${endDate}`, 14, 30)
    
    // Resumen
    doc.setFontSize(10)
    doc.text(`Total movimientos: ${summary.totalMovimientos}`, 14, 40)
    doc.text(`Entradas: ${summary.totalEntradas} (${summary.unidadesEntrada} unidades)`, 14, 47)
    doc.text(`Salidas: ${summary.totalSalidas} (${summary.unidadesSalida} unidades)`, 14, 54)
    
    // Tabla
    doc.autoTable({
      head: [['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Usuario', 'Motivo']],
      body: data.map(item => [
        item.Fecha,
        item.Tipo,
        item.Producto,
        item.Cantidad,
        item.Usuario,
        item.Motivo
      ]),
      startY: 65,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })
    
    // Guardar
    doc.save(`Movimientos_${startDate}_${endDate}.pdf`)
    
    return { success: true }
  },

  // Exportar alertas a PDF
  exportAlertsToPDF(alertsData) {
    const doc = new jsPDF()
    let yPosition = 20
    
    // Título
    doc.setFontSize(18)
    doc.text('Reporte de Alertas', 14, yPosition)
    yPosition += 15
    
    // Fecha
    doc.setFontSize(10)
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, yPosition)
    yPosition += 15
    
    // Productos vencidos
    if (alertsData.expired.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(220, 38, 38) // Rojo
      doc.text(`Productos Vencidos (${alertsData.expired.length})`, 14, yPosition)
      doc.setTextColor(0, 0, 0)
      yPosition += 10
      
      doc.autoTable({
        head: [['Producto', 'Laboratorio', 'Lote', 'Venció', 'Ubicación']],
        body: alertsData.expired.map(item => [
          item.nombre,
          item.laboratorio,
          item.lote,
          new Date(item.fecha_vencimiento).toLocaleDateString('es-CO'),
          item.ubicacion
        ]),
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 38, 38] }
      })
      
      yPosition = doc.lastAutoTable.finalY + 15
    }
    
    // Productos próximos a vencer
    if (alertsData.nearExpiry.length > 0) {
      doc.setFontSize(14)
      doc.setTextColor(245, 158, 11) // Amarillo
      doc.text(`Próximos a Vencer (${alertsData.nearExpiry.length})`, 14, yPosition)
      doc.setTextColor(0, 0, 0)
      yPosition += 10
      
      doc.autoTable({
        head: [['Producto', 'Laboratorio', 'Lote', 'Vence', 'Días restantes']],
        body: alertsData.nearExpiry.map(item => {
          const daysToExpiry = Math.ceil((new Date(item.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
          return [
            item.nombre,
            item.laboratorio,
            item.lote,
            new Date(item.fecha_vencimiento).toLocaleDateString('es-CO'),
            daysToExpiry
          ]
        }),
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [245, 158, 11] }
      })
      
      yPosition = doc.lastAutoTable.finalY + 15
    }
    
    // Productos con bajo stock
    if (alertsData.lowStock.length > 0 && yPosition < 250) {
      doc.setFontSize(14)
      doc.setTextColor(239, 68, 68) // Rojo
      doc.text(`Bajo Stock (${alertsData.lowStock.length})`, 14, yPosition)
      doc.setTextColor(0, 0, 0)
      yPosition += 10
      
      doc.autoTable({
        head: [['Producto', 'Laboratorio', 'Stock Actual', 'Stock Mínimo', 'Diferencia']],
        body: alertsData.lowStock.map(item => [
          item.nombre,
          item.laboratorio,
          item.cantidad,
          item.stock_minimo,
          item.stock_minimo - item.cantidad
        ]),
        startY: yPosition,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [239, 68, 68] }
      })
    }
    
    // Guardar
    doc.save(`Alertas_${new Date().toISOString().split('T')[0]}.pdf`)
    
    return { success: true }
  },

  // Exportar alertas a Excel
  exportAlertsToExcel(alertsData) {
    const workbook = XLSX.utils.book_new()

    // Hoja de productos vencidos
    if (alertsData.expired.length > 0) {
      const expiredData = alertsData.expired.map(item => ({
        'Producto': item.nombre,
        'Laboratorio': item.laboratorio,
        'Lote': item.lote,
        'Fecha Vencimiento': new Date(item.fecha_vencimiento).toLocaleDateString('es-CO'),
        'Ubicación': item.ubicacion,
        'Cantidad': item.cantidad
      }))
      const expiredSheet = XLSX.utils.json_to_sheet(expiredData)
      XLSX.utils.book_append_sheet(workbook, expiredSheet, 'Vencidos')
    }

    // Hoja de próximos a vencer
    if (alertsData.nearExpiry.length > 0) {
      const nearExpiryData = alertsData.nearExpiry.map(item => {
        const daysToExpiry = Math.ceil((new Date(item.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
        return {
          'Producto': item.nombre,
          'Laboratorio': item.laboratorio,
          'Lote': item.lote,
          'Fecha Vencimiento': new Date(item.fecha_vencimiento).toLocaleDateString('es-CO'),
          'Días para vencer': daysToExpiry,
          'Ubicación': item.ubicacion,
          'Cantidad': item.cantidad
        }
      })
      const nearExpirySheet = XLSX.utils.json_to_sheet(nearExpiryData)
      XLSX.utils.book_append_sheet(workbook, nearExpirySheet, 'Próximos a Vencer')
    }

    // Hoja de bajo stock
    if (alertsData.lowStock.length > 0) {
      const lowStockData = alertsData.lowStock.map(item => ({
        'Producto': item.nombre,
        'Laboratorio': item.laboratorio,
        'Stock Actual': item.cantidad,
        'Stock Mínimo': item.stock_minimo,
        'Diferencia': item.stock_minimo - item.cantidad,
        'Ubicación': item.ubicacion
      }))
      const lowStockSheet = XLSX.utils.json_to_sheet(lowStockData)
      XLSX.utils.book_append_sheet(workbook, lowStockSheet, 'Bajo Stock')
    }

    // Descargar
    XLSX.writeFile(workbook, `Alertas_${new Date().toISOString().split('T')[0]}.xlsx`)
    
    return { success: true }
  },

  // Obtener estado del producto
  getProductStatus(product) {
    const daysToExpiry = Math.ceil((new Date(product.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
    
    if (daysToExpiry <= 0) return 'Vencido'
    if (daysToExpiry <= 30) return 'Próximo a vencer'
    if (product.cantidad <= product.stock_minimo) return 'Bajo stock'
    return 'Normal'
  }
}