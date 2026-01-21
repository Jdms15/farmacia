// src/services/reportService.js - Versión con filtro de producto
import { supabase } from './supabase'
import { productService } from './productService'
import { movementService } from './movementService'

export const reportService = {
  // Generar reporte de inventario
  async generateInventoryReport(format = 'csv') {
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

      if (format === 'excel' || format === 'csv') {
        return this.exportToCSV(reportData, 'Inventario_Completo')
      } else if (format === 'pdf') {
        return this.exportInventoryToPDF(reportData)
      }

      return { success: true, data: reportData }
    } catch (error) {
      console.error('Error generating inventory report:', error)
      return { success: false, error: error.message }
    }
  },

  // Generar reporte de movimientos con filtro de producto
  async generateMovementsReport(startDate, endDate, productoId = '', format = 'csv') {
    try {
      const filters = {
        fechaInicio: startDate,
        fechaFin: endDate
      }
      
      // Agregar filtro de producto si existe
      if (productoId) {
        filters.productoId = productoId
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
      
      // Obtener nombre del producto si hay filtro
      let productName = ''
      if (productoId) {
        const { data: product } = await supabase
          .from('productos')
          .select('nombre')
          .eq('id', productoId)
          .single()
        
        productName = product?.nombre || ''
      }

      if (format === 'excel' || format === 'csv') {
        return this.exportMovementsToCSV(reportData, summary, startDate, endDate, productName)
      } else if (format === 'pdf') {
        return this.exportMovementsToPDF(reportData, summary, startDate, endDate, productName)
      }

      return { success: true, data: reportData, summary }
    } catch (error) {
      console.error('Error generating movements report:', error)
      return { success: false, error: error.message }
    }
  },

  // Generar reporte de alertas
  async generateAlertsReport(format = 'csv') {
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

      if (format === 'excel' || format === 'csv') {
        return this.exportAlertsToCSV(alertsData)
      } else if (format === 'pdf') {
        return this.exportAlertsToPDF(alertsData)
      }

      return { success: true, data: alertsData }
    } catch (error) {
      console.error('Error generating alerts report:', error)
      return { success: false, error: error.message }
    }
  },

  // Exportar a CSV
  exportToCSV(data, filename) {
    try {
      const csvContent = this.convertToCSV(data)
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      })
      this.downloadFile(blob, `${filename}_${this.getDateString()}.csv`)
      return { success: true }
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      return { success: false, error: error.message }
    }
  },

  // Exportar movimientos a CSV con resumen y filtro de producto
  exportMovementsToCSV(data, summary, startDate, endDate, productName = '') {
    try {
      // Crear contenido CSV con resumen al inicio
      let csvContent = 'REPORTE DE MOVIMIENTOS\n\n'
      csvContent += `Período,${startDate} a ${endDate}\n`
      
      // Agregar filtro de producto si existe
      if (productName) {
        csvContent += `Producto,${productName}\n`
      } else {
        csvContent += `Producto,Todos los productos\n`
      }
      
      csvContent += '\nRESUMEN\n'
      csvContent += `Total de movimientos,${summary.totalMovimientos}\n`
      csvContent += `Total entradas,${summary.totalEntradas}\n`
      csvContent += `Total salidas,${summary.totalSalidas}\n`
      csvContent += `Unidades ingresadas,${summary.unidadesEntrada}\n`
      csvContent += `Unidades retiradas,${summary.unidadesSalida}\n\n`
      csvContent += 'DETALLE DE MOVIMIENTOS\n'
      csvContent += this.convertToCSV(data)
      
      const blob = new Blob(['\uFEFF' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      })
      
      let filename = 'Movimientos'
      if (productName) {
        filename += `_${productName.replace(/[^a-zA-Z0-9]/g, '_')}`
      }
      filename += `_${startDate}_${endDate}.csv`
      
      this.downloadFile(blob, filename)
      
      return { success: true }
    } catch (error) {
      console.error('Error exporting movements to CSV:', error)
      return { success: false, error: error.message }
    }
  },

  // Exportar alertas a CSV
  exportAlertsToCSV(alertsData) {
    try {
      let csvContent = 'REPORTE DE ALERTAS\n'
      csvContent += `Generado,${new Date().toLocaleString('es-CO')}\n\n`
      
      // Productos vencidos
      if (alertsData.expired.length > 0) {
        csvContent += `PRODUCTOS VENCIDOS (${alertsData.expired.length})\n`
        csvContent += 'Producto,Laboratorio,Lote,Fecha Vencimiento,Ubicación,Cantidad\n'
        alertsData.expired.forEach(item => {
          csvContent += `"${item.nombre}","${item.laboratorio}","${item.lote}","${new Date(item.fecha_vencimiento).toLocaleDateString('es-CO')}","${item.ubicacion}",${item.cantidad}\n`
        })
        csvContent += '\n'
      }
      
      // Próximos a vencer
      if (alertsData.nearExpiry.length > 0) {
        csvContent += `PRÓXIMOS A VENCER (${alertsData.nearExpiry.length})\n`
        csvContent += 'Producto,Laboratorio,Lote,Fecha Vencimiento,Días para vencer,Ubicación,Cantidad\n'
        alertsData.nearExpiry.forEach(item => {
          const daysToExpiry = Math.ceil((new Date(item.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
          csvContent += `"${item.nombre}","${item.laboratorio}","${item.lote}","${new Date(item.fecha_vencimiento).toLocaleDateString('es-CO')}",${daysToExpiry},"${item.ubicacion}",${item.cantidad}\n`
        })
        csvContent += '\n'
      }
      
      // Bajo stock
      if (alertsData.lowStock.length > 0) {
        csvContent += `BAJO STOCK (${alertsData.lowStock.length})\n`
        csvContent += 'Producto,Laboratorio,Stock Actual,Stock Mínimo,Diferencia,Ubicación\n'
        alertsData.lowStock.forEach(item => {
          csvContent += `"${item.nombre}","${item.laboratorio}",${item.cantidad},${item.stock_minimo},${item.stock_minimo - item.cantidad},"${item.ubicacion}"\n`
        })
      }
      
      // Si no hay alertas
      if (alertsData.expired.length === 0 && alertsData.nearExpiry.length === 0 && alertsData.lowStock.length === 0) {
        csvContent += 'No hay alertas activas en este momento\n'
      }
      
      const blob = new Blob(['\uFEFF' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      })
      this.downloadFile(blob, `Alertas_${this.getDateString()}.csv`)
      
      return { success: true }
    } catch (error) {
      console.error('Error exporting alerts to CSV:', error)
      return { success: false, error: error.message }
    }
  },

  // Convertir datos a CSV
  convertToCSV(data) {
    if (!data || data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escapar valores con comas, comillas o saltos de línea
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        }).join(',')
      )
    ].join('\n')
    
    return csvContent
  },

  // Función para descargar archivos
  downloadFile(blob, filename) {
    try {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 1000)
      
      console.log(`Archivo descargado: ${filename}`)
    } catch (error) {
      console.error('Error downloading file:', error)
      throw error
    }
  },

  // Obtener string de fecha
  getDateString() {
    return new Date().toISOString().split('T')[0]
  },

  // Exportar inventario a PDF
  exportInventoryToPDF(data) {
    try {
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte de Inventario</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; text-align: center; }
            .header { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #3B82F6; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .date { color: #666; font-size: 14px; }
            .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte de Inventario Farmacéutico</h1>
            <p class="date">Generado: ${new Date().toLocaleString('es-CO')}</p>
            <div class="summary">
              <strong>Total de productos: ${data.length}</strong>
            </div>
          </div>
          <table>
            <tr>
              <th>Nombre</th>
              <th>Laboratorio</th>
              <th>Lote</th>
              <th>Cantidad</th>
              <th>Vencimiento</th>
              <th>Ubicación</th>
              <th>Estado</th>
            </tr>
            ${data.map(item => `
              <tr>
                <td>${item.Nombre}</td>
                <td>${item.Laboratorio}</td>
                <td>${item.Lote}</td>
                <td>${item.Cantidad}</td>
                <td>${item.Vencimiento}</td>
                <td>${item.Ubicación}</td>
                <td>${item.Estado}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `
      
      const printWindow = window.open('', '', 'height=600,width=800')
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      
      setTimeout(() => {
        printWindow.print()
      }, 500)
      
      return { success: true }
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      return { success: false, error: error.message }
    }
  },

  // Exportar movimientos a PDF con filtro de producto
  exportMovementsToPDF(data, summary, startDate, endDate, productName = '') {
    try {
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte de Movimientos</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; text-align: center; }
            .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #3B82F6; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Reporte de Movimientos</h1>
          <p style="text-align: center;">Período: ${startDate} a ${endDate}</p>
          ${productName ? `<p style="text-align: center;"><strong>Producto: ${productName}</strong></p>` : '<p style="text-align: center;"><strong>Todos los productos</strong></p>'}
          
          <div class="summary">
            <h3>Resumen</h3>
            <p>Total movimientos: ${summary.totalMovimientos}</p>
            <p>Entradas: ${summary.totalEntradas} (${summary.unidadesEntrada} unidades)</p>
            <p>Salidas: ${summary.totalSalidas} (${summary.unidadesSalida} unidades)</p>
          </div>
          
          <table>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Usuario</th>
              <th>Motivo</th>
            </tr>
            ${data.map(item => `
              <tr>
                <td>${item.Fecha}</td>
                <td>${item.Tipo}</td>
                <td>${item.Producto}</td>
                <td>${item.Cantidad}</td>
                <td>${item.Usuario}</td>
                <td>${item.Motivo}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `
      
      const printWindow = window.open('', '', 'height=600,width=800')
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      
      setTimeout(() => {
        printWindow.print()
      }, 500)
      
      return { success: true }
    } catch (error) {
      console.error('Error exporting to PDF:', error)
      return { success: false, error: error.message }
    }
  },

  // Exportar alertas a PDF
  exportAlertsToPDF(alertsData) {
    try {
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte de Alertas</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; text-align: center; }
            h2 { margin-top: 30px; }
            .expired { color: #DC2626; }
            .warning { color: #F59E0B; }
            .danger { color: #EF4444; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { color: white; }
            .expired-table th { background-color: #DC2626; }
            .warning-table th { background-color: #F59E0B; }
            .danger-table th { background-color: #EF4444; }
          </style>
        </head>
        <body>
          <h1>Reporte de Alertas</h1>
          <p style="text-align: center;">Generado: ${new Date().toLocaleString('es-CO')}</p>
      `
      
      // Productos vencidos
      if (alertsData.expired.length > 0) {
        htmlContent += `
          <h2 class="expired">Productos Vencidos (${alertsData.expired.length})</h2>
          <table class="expired-table">
            <tr>
              <th>Producto</th>
              <th>Laboratorio</th>
              <th>Lote</th>
              <th>Venció</th>
              <th>Ubicación</th>
            </tr>
            ${alertsData.expired.map(item => `
              <tr>
                <td>${item.nombre}</td>
                <td>${item.laboratorio}</td>
                <td>${item.lote}</td>
                <td>${new Date(item.fecha_vencimiento).toLocaleDateString('es-CO')}</td>
                <td>${item.ubicacion}</td>
              </tr>
            `).join('')}
          </table>
        `
      }
      
      // Próximos a vencer
      if (alertsData.nearExpiry.length > 0) {
        htmlContent += `
          <h2 class="warning">Próximos a Vencer (${alertsData.nearExpiry.length})</h2>
          <table class="warning-table">
            <tr>
              <th>Producto</th>
              <th>Laboratorio</th>
              <th>Lote</th>
              <th>Vence</th>
              <th>Días restantes</th>
            </tr>
            ${alertsData.nearExpiry.map(item => {
              const daysToExpiry = Math.ceil((new Date(item.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
              return `
                <tr>
                  <td>${item.nombre}</td>
                  <td>${item.laboratorio}</td>
                  <td>${item.lote}</td>
                  <td>${new Date(item.fecha_vencimiento).toLocaleDateString('es-CO')}</td>
                  <td>${daysToExpiry}</td>
                </tr>
              `
            }).join('')}
          </table>
        `
      }
      
      // Bajo stock
      if (alertsData.lowStock.length > 0) {
        htmlContent += `
          <h2 class="danger">Bajo Stock (${alertsData.lowStock.length})</h2>
          <table class="danger-table">
            <tr>
              <th>Producto</th>
              <th>Laboratorio</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Diferencia</th>
            </tr>
            ${alertsData.lowStock.map(item => `
              <tr>
                <td>${item.nombre}</td>
                <td>${item.laboratorio}</td>
                <td>${item.cantidad}</td>
                <td>${item.stock_minimo}</td>
                <td>${item.stock_minimo - item.cantidad}</td>
              </tr>
            `).join('')}
          </table>
        `
      }
      
      // Si no hay alertas
      if (alertsData.expired.length === 0 && alertsData.nearExpiry.length === 0 && alertsData.lowStock.length === 0) {
        htmlContent += '<p style="text-align: center; margin-top: 50px; color: #059669; font-size: 18px;"><strong>🎉 No hay alertas activas en este momento</strong></p>'
      }
      
      htmlContent += '</body></html>'
      
      const printWindow = window.open('', '', 'height=600,width=800')
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()
      
      setTimeout(() => {
        printWindow.print()
      }, 500)
      
      return { success: true }
    } catch (error) {
      console.error('Error exporting alerts to PDF:', error)
      return { success: false, error: error.message }
    }
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