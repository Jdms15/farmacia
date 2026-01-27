// src/services/reportService.js - CON PRECIOS Y DOCUMENTO DE DESPACHO
import { supabase } from './supabase'
import { productService } from './productService'
import { movementService } from './movementService'

export const reportService = {
  // Generar reporte de inventario CON PRECIOS
  async generateInventoryReport(format = 'csv') {
    try {
      const { data: products, error } = await productService.getProducts()
      if (error) throw error

      const reportData = products.map(product => {
        const precioUnitario = product.precio || 0
        const valorTotal = product.cantidad * precioUnitario
        
        return {
          'Nombre': product.nombre,
          'Laboratorio': product.laboratorio,
          'Proveedor': product.proveedor,
          'Lote': product.lote,
          'Cantidad': product.cantidad,
          'Precio Unitario': `$${precioUnitario.toFixed(2)}`,
          'Valor Total': `$${valorTotal.toFixed(2)}`,
          'Presentación': product.presentacion,
          'Ubicación': product.ubicacion,
          'Vencimiento': new Date(product.fecha_vencimiento).toLocaleDateString('es-CO'),
          'Stock Mínimo': product.stock_minimo,
          'Refrigeración': product.necesita_refrigeracion ? 'Sí' : 'No',
          'Estado': this.getProductStatus(product)
        }
      })

      // Calcular totales generales
      const valorTotalInventario = products.reduce((sum, p) => 
        sum + (p.cantidad * (p.precio || 0)), 0
      )

      if (format === 'excel' || format === 'csv') {
        return this.exportInventoryToCSV(reportData, valorTotalInventario)
      } else if (format === 'pdf') {
        return this.exportInventoryToPDF(reportData, valorTotalInventario)
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

      const summary = {
        totalMovimientos: movements.length,
        totalEntradas: movements.filter(m => m.tipo === 'entrada').length,
        totalSalidas: movements.filter(m => m.tipo === 'salida').length,
        unidadesEntrada: movements.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.cantidad, 0),
        unidadesSalida: movements.filter(m => m.tipo === 'salida').reduce((sum, m) => sum + m.cantidad, 0)
      }
      
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

  // ✨ NUEVO: Generar documento de despacho/entrega
  async generateDeliveryDocument(solicitudId) {
    try {
      // Obtener información completa de la solicitud
      const { data: solicitud, error } = await supabase
        .from('solicitudes_medicamentos')
        .select(`
          *,
          productos(nombre, laboratorio, presentacion, precio, lote)
        `)
        .eq('id', solicitudId)
        .single()

      if (error) throw error
      if (!solicitud) throw new Error('Solicitud no encontrada')

      const now = new Date()
      const precioUnitario = solicitud.precio_unitario || solicitud.productos?.precio || 0
      const subtotal = solicitud.cantidad * precioUnitario
      
      // Generar HTML para el documento
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Comprobante de Despacho #${solicitud.id.substring(0, 8).toUpperCase()}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              padding: 40px;
              line-height: 1.6;
              color: #1F2937;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #1F2937;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #1F2937;
              font-size: 28px;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .header .doc-number {
              color: #1F2937;
              font-size: 20px;
              font-weight: bold;
              background-color: #F3F4F6;
              padding: 8px 16px;
              border-radius: 4px;
              display: inline-block;
            }
            .info-section {
              margin-bottom: 30px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
              border-bottom: 1px solid #E5E7EB;
              padding-bottom: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #4B5563;
              min-width: 180px;
            }
            .info-value {
              color: #1F2937;
              flex: 1;
            }
            .products-table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
              border: 2px solid #1F2937;
            }
            .products-table th {
              background-color: #1F2937;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              border: 1px solid #1F2937;
            }
            .products-table td {
              padding: 12px;
              border: 1px solid #9CA3AF;
            }
            .products-table tr:nth-child(even) {
              background-color: #F9FAFB;
            }
            .total-section {
              margin-top: 30px;
              padding: 20px;
              background-color: #F3F4F6;
              border: 2px solid #1F2937;
              border-radius: 4px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .total-row.grand-total {
              font-size: 24px;
              font-weight: bold;
              color: #1F2937;
              border-top: 2px solid #1F2937;
              padding-top: 15px;
              margin-top: 15px;
            }
            .signatures {
              margin-top: 80px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 45%;
              text-align: center;
            }
            .signature-line {
              border-top: 2px solid #1F2937;
              margin-bottom: 10px;
              padding-top: 5px;
              margin-top: 60px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 11px;
              color: #6B7280;
              border-top: 1px solid #E5E7EB;
              padding-top: 20px;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border: 2px solid #1F2937;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .priority-badge {
              display: inline-block;
              padding: 4px 8px;
              border: 1px solid #6B7280;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            h2 {
              color: #1F2937;
              border-bottom: 2px solid #E5E7EB;
              padding-bottom: 8px;
              margin-bottom: 15px;
              text-transform: uppercase;
              font-size: 16px;
              letter-spacing: 0.5px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>COMPROBANTE DE DESPACHO</h1>
            <p class="doc-number">N° ${solicitud.id.substring(0, 8).toUpperCase()}</p>
            <p style="color: #6B7280; margin-top: 10px; font-size: 13px;">
              Fecha de emisión: ${now.toLocaleDateString('es-CO', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div class="info-section">
            <h2>Información General</h2>
            
            <div class="info-row">
              <span class="info-label">Estado:</span>
              <span class="info-value">
                <span class="status-badge">ENTREGADA</span>
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Prioridad:</span>
              <span class="info-value">
                <span class="priority-badge">
                  ${solicitud.prioridad.toUpperCase()}
                </span>
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Solicitante:</span>
              <span class="info-value">${solicitud.solicitante_nombre || 'No especificado'}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Fecha de Solicitud:</span>
              <span class="info-value">${new Date(solicitud.fecha_solicitud).toLocaleString('es-CO')}</span>
            </div>

            ${solicitud.aprobado_por_nombre ? `
            <div class="info-row">
              <span class="info-label">Aprobado por:</span>
              <span class="info-value">${solicitud.aprobado_por_nombre}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha de Aprobación:</span>
              <span class="info-value">${new Date(solicitud.fecha_aprobacion).toLocaleString('es-CO')}</span>
            </div>
            ` : ''}

            ${solicitud.entregado_por_nombre ? `
            <div class="info-row">
              <span class="info-label">Entregado por:</span>
              <span class="info-value">${solicitud.entregado_por_nombre}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha de Entrega:</span>
              <span class="info-value">${new Date(solicitud.fecha_entrega).toLocaleString('es-CO')}</span>
            </div>
            ` : ''}

            ${solicitud.motivo ? `
            <div class="info-row">
              <span class="info-label">Motivo:</span>
              <span class="info-value">${solicitud.motivo}</span>
            </div>
            ` : ''}

            ${solicitud.notas_aprobacion ? `
            <div class="info-row">
              <span class="info-label">Notas de Aprobación:</span>
              <span class="info-value">${solicitud.notas_aprobacion}</span>
            </div>
            ` : ''}

            ${solicitud.notas_entrega ? `
            <div class="info-row">
              <span class="info-label">Notas de Entrega:</span>
              <span class="info-value">${solicitud.notas_entrega}</span>
            </div>
            ` : ''}
          </div>

          <h2>Detalle del Despacho</h2>
          
          <table class="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Laboratorio</th>
                <th>Presentación</th>
                <th>Lote</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio Unit.</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${solicitud.productos?.nombre || 'N/A'}</strong></td>
                <td>${solicitud.productos?.laboratorio || 'N/A'}</td>
                <td>${solicitud.productos?.presentacion || 'N/A'}</td>
                <td>${solicitud.productos?.lote || 'N/A'}</td>
                <td style="text-align: center; font-weight: bold;">${solicitud.cantidad}</td>
                <td style="text-align: right;">$${precioUnitario.toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold;">$${subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Cantidad Total de Unidades:</span>
              <span><strong>${solicitud.cantidad} unidad${solicitud.cantidad !== 1 ? 'es' : ''}</strong></span>
            </div>
            <div class="total-row grand-total">
              <span>VALOR TOTAL DEL DESPACHO:</span>
              <span>$${subtotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
            </div>
          </div>

          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line">
                ${solicitud.entregado_por_nombre || '_______________________'}
              </div>
              <p><strong>Firma de quien entrega</strong></p>
              <p style="font-size: 11px; color: #6B7280;">Farmacia</p>
            </div>

            <div class="signature-box">
              <div class="signature-line">
                ${solicitud.solicitante_nombre || '_______________________'}
              </div>
              <p><strong>Firma de quien recibe</strong></p>
              <p style="font-size: 11px; color: #6B7280;">Solicitante</p>
            </div>
          </div>

          <div class="footer">
            <p><strong>Sistema de Inventario Farmacéutico</strong></p>
            <p>Documento generado automáticamente el ${now.toLocaleString('es-CO')}</p>
            <p style="margin-top: 10px; font-size: 10px;">Este documento es válido sin firma ni sello</p>
          </div>
        </body>
        </html>
      `

      // Abrir ventana de impresión/vista previa
      const printWindow = window.open('', '', 'height=800,width=900')
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.focus()

      // Esperar un momento antes de imprimir
      setTimeout(() => {
        // El usuario puede decidir si imprime o guarda como PDF
        printWindow.print()
      }, 500)

      return { 
        success: true, 
        message: 'Documento de despacho generado',
        data: {
          solicitudId: solicitud.id,
          numeroDespacho: solicitud.id.substring(0, 8).toUpperCase(),
          total: subtotal
        }
      }
    } catch (error) {
      console.error('Error generando documento de despacho:', error)
      return { success: false, error: error.message }
    }
  },

  // Exportar inventario a CSV CON TOTALES
  exportInventoryToCSV(data, valorTotal) {
    try {
      let csvContent = 'REPORTE DE INVENTARIO\n'
      csvContent += `Generado,${new Date().toLocaleString('es-CO')}\n\n`
      csvContent += `VALOR TOTAL DEL INVENTARIO,$${valorTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n\n`
      csvContent += this.convertToCSV(data)
      
      const blob = new Blob(['\uFEFF' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      })
      this.downloadFile(blob, `Inventario_${this.getDateString()}.csv`)
      return { success: true }
    } catch (error) {
      console.error('Error exporting inventory to CSV:', error)
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
      let csvContent = 'REPORTE DE MOVIMIENTOS\n\n'
      csvContent += `Período,${startDate} a ${endDate}\n`
      
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
      
      if (alertsData.expired.length > 0) {
        csvContent += `PRODUCTOS VENCIDOS (${alertsData.expired.length})\n`
        csvContent += 'Producto,Laboratorio,Lote,Fecha Vencimiento,Ubicación,Cantidad\n'
        alertsData.expired.forEach(item => {
          csvContent += `"${item.nombre}","${item.laboratorio}","${item.lote}","${new Date(item.fecha_vencimiento).toLocaleDateString('es-CO')}","${item.ubicacion}",${item.cantidad}\n`
        })
        csvContent += '\n'
      }
      
      if (alertsData.nearExpiry.length > 0) {
        csvContent += `PRÓXIMOS A VENCER (${alertsData.nearExpiry.length})\n`
        csvContent += 'Producto,Laboratorio,Lote,Fecha Vencimiento,Días para vencer,Ubicación,Cantidad\n'
        alertsData.nearExpiry.forEach(item => {
          const daysToExpiry = Math.ceil((new Date(item.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24))
          csvContent += `"${item.nombre}","${item.laboratorio}","${item.lote}","${new Date(item.fecha_vencimiento).toLocaleDateString('es-CO')}",${daysToExpiry},"${item.ubicacion}",${item.cantidad}\n`
        })
        csvContent += '\n'
      }
      
      if (alertsData.lowStock.length > 0) {
        csvContent += `BAJO STOCK (${alertsData.lowStock.length})\n`
        csvContent += 'Producto,Laboratorio,Stock Actual,Stock Mínimo,Diferencia,Ubicación\n'
        alertsData.lowStock.forEach(item => {
          csvContent += `"${item.nombre}","${item.laboratorio}",${item.cantidad},${item.stock_minimo},${item.stock_minimo - item.cantidad},"${item.ubicacion}"\n`
        })
      }
      
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

  // Exportar inventario a PDF CON PRECIOS
  exportInventoryToPDF(data, valorTotal) {
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
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #3B82F6; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .date { color: #666; font-size: 14px; }
            .summary { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .total { font-size: 20px; font-weight: bold; color: #059669; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reporte de Inventario Farmacéutico</h1>
            <p class="date">Generado: ${new Date().toLocaleString('es-CO')}</p>
            <div class="summary">
              <strong>Total de productos: ${data.length}</strong><br>
              <span class="total">Valor Total del Inventario: $${valorTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
            </div>
          </div>
          <table>
            <tr>
              <th>Nombre</th>
              <th>Laboratorio</th>
              <th>Lote</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Valor Total</th>
              <th>Vencimiento</th>
              <th>Ubicación</th>
              <th>Estado</th>
            </tr>
            ${data.map(item => `
              <tr>
                <td>${item.Nombre}</td>
                <td>${item.Laboratorio}</td>
                <td>${item.Lote}</td>
                <td class="text-right">${item.Cantidad}</td>
                <td class="text-right">${item['Precio Unitario']}</td>
                <td class="text-right"><strong>${item['Valor Total']}</strong></td>
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

  // Exportar movimientos a PDF
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