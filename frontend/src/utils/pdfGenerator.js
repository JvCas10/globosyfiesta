// frontend/src/utils/pdfGenerator.js
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Configuración de colores del tema
const colors = {
  primary: '#1e3a5f',
  secondary: '#3498db',
  success: '#27ae60',
  warning: '#e67e22',
  danger: '#e74c3c',
  text: '#2d3748',
  lightGray: '#f8f9fa'
};

// Configurar header común para todos los PDFs
const addHeader = (doc, title) => {
  doc.setFillColor(colors.primary);
  doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
  
  // Agregar logo
  try {
    // El logo debe estar en la carpeta public
    doc.addImage('/LogoGlobosFiesta2.jpg', 'JPEG', 15, 5, 30, 30);
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }
  
  // Texto del header (movido hacia la derecha para dar espacio al logo)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Globos y Fiesta', 55, 18);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 55, 28);
};

// Configurar footer común
const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.height;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleString('es-GT')}`,
      doc.internal.pageSize.width / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
};

// Generar PDF del Dashboard
export const generarPDFDashboard = (dashboardData, isOwner) => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Dashboard - Resumen General');
  
  let yPos = 45;
  
  // Resumen del día
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.text);
  doc.text('Resumen del Día', 15, yPos);
  yPos += 10;
  
  const resumenDiarioData = [
    ['Ventas Hoy', dashboardData.resumenDiario.ventasHoy.toString()],
    ['Ingresos Hoy', `Q${dashboardData.resumenDiario.montoHoy.toFixed(2)}`]
  ];
  
  if (isOwner && dashboardData.resumenDiario.gananciaHoy !== null) {
    resumenDiarioData.push(['Ganancia Hoy', `Q${dashboardData.resumenDiario.gananciaHoy.toFixed(2)}`]);
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: resumenDiarioData,
    theme: 'grid',
    headStyles: { fillColor: colors.primary, textColor: 255 },
    margin: { left: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Resumen del mes
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen del Mes', 15, yPos);
  yPos += 10;
  
  const resumenMensualData = [
    ['Ventas del Mes', dashboardData.resumenMensual.ventasMes.toString()],
    ['Ingresos del Mes', `Q${dashboardData.resumenMensual.montoMes.toFixed(2)}`]
  ];
  
  if (isOwner && dashboardData.resumenMensual.gananciaMes !== null) {
    resumenMensualData.push(['Ganancia del Mes', `Q${dashboardData.resumenMensual.gananciaMes.toFixed(2)}`]);
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: resumenMensualData,
    theme: 'grid',
    headStyles: { fillColor: colors.success, textColor: 255 },
    margin: { left: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Verificar si necesitamos nueva página
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }
  
  // Productos con stock bajo
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Productos con Stock Bajo', 15, yPos);
  yPos += 10;
  
  if (dashboardData.inventario.listaBajo.length === 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.success);
    doc.text('Todos los productos tienen stock suficiente', 15, yPos);
    yPos += 10;
  } else {
    const stockBajoData = dashboardData.inventario.listaBajo.map(p => [
      p.nombre,
      p.stock.toString(),
      p.stockMinimo.toString()
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Producto', 'Stock', 'Mínimo']],
      body: stockBajoData,
      theme: 'grid',
      headStyles: { fillColor: colors.danger, textColor: 255 },
      margin: { left: 15 }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  }
  
  // Top productos vendidos
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.text);
  doc.text('Productos Más Vendidos', 15, yPos);
  yPos += 10;
  
  if (dashboardData.topProductos.length > 0) {
    const topProductosData = dashboardData.topProductos.map(p => [
      p.nombreProducto,
      p.cantidadVendida.toString(),
      `Q${p.ingresoTotal.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Producto', 'Cantidad Vendida', 'Total Ventas']],
      body: topProductosData,
      theme: 'grid',
      headStyles: { fillColor: colors.warning, textColor: 255 },
      margin: { left: 15 }
    });
  }
  
  addFooter(doc);
  doc.save(`Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Generar PDF de Ventas
export const generarPDFVentas = (reporteVentas, isOwner) => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Reporte de Ventas');
  
  let yPos = 45;
  
  // Información del período
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.text);
  doc.text(
    `Período: ${new Date(reporteVentas.periodo.fechaInicio).toLocaleDateString('es-GT')} - ${new Date(reporteVentas.periodo.fechaFin).toLocaleDateString('es-GT')}`,
    15,
    yPos
  );
  yPos += 15;
  
  // Resumen del período
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen del Período', 15, yPos);
  yPos += 10;
  
  const resumenData = [
    ['Total de Ventas', reporteVentas.resumen.totalVentas.toString()],
    ['Monto Total', `Q${reporteVentas.resumen.montoTotal.toFixed(2)}`],
    ['Promedio por Venta', `Q${reporteVentas.resumen.promedioVenta.toFixed(2)}`]
  ];
  
  if (isOwner && reporteVentas.resumen.gananciaTotal !== null) {
    resumenData.push(['Ganancia Total', `Q${reporteVentas.resumen.gananciaTotal.toFixed(2)}`]);
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: resumenData,
    theme: 'grid',
    headStyles: { fillColor: colors.primary, textColor: 255 },
    margin: { left: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Ventas por día
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ventas por Día', 15, yPos);
  yPos += 10;
  
  const ventasPorDiaData = reporteVentas.ventasPorDia.map(dia => [
    new Date(dia.fecha).toLocaleDateString('es-GT'),
    dia.cantidad.toString(),
    `Q${dia.monto.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Fecha', 'Número de Ventas', 'Monto Total']],
    body: ventasPorDiaData,
    theme: 'striped',
    headStyles: { fillColor: colors.secondary, textColor: 255 },
    margin: { left: 15 }
  });
  
  addFooter(doc);
  doc.save(`Reporte_Ventas_${reporteVentas.periodo.fechaInicio}_${reporteVentas.periodo.fechaFin}.pdf`);
};

// Generar PDF de Inventario
export const generarPDFInventario = (reporteInventario, isOwner) => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Reporte de Inventario');
  
  let yPos = 45;
  
  // Resumen
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.text);
  doc.text('Resumen de Inventario', 15, yPos);
  yPos += 10;
  
  const resumenData = [
    ['Total de Productos', reporteInventario.resumen.totalProductos.toString()],
    ['Productos con Stock Bajo', reporteInventario.resumen.productosStockBajo.toString()]
  ];
  
  if (isOwner && reporteInventario.resumen.valorInventarioTotal !== null) {
    resumenData.push(['Valor Total', `Q${reporteInventario.resumen.valorInventarioTotal.toFixed(2)}`]);
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: resumenData,
    theme: 'grid',
    headStyles: { fillColor: colors.primary, textColor: 255 },
    margin: { left: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Productos por categoría
  reporteInventario.productosPorCategoria.forEach((categoria, index) => {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`${categoria.categoria}`, 15, yPos);
    yPos += 8;
    
    const productosData = categoria.productos.map(p => {
      const row = [
        p.nombre,
        p.stock.toString(),
        `Q${p.precioVenta.toFixed(2)}`,
        p.stockBajo ? 'Stock Bajo ' : 'Normal'
      ];
      
      if (isOwner) {
        row.splice(3, 0, `${p.margen}%`);
      }
      
      return row;
    });
    
    const headers = isOwner 
      ? ['Producto', 'Stock', 'Precio', 'Margen', 'Estado']
      : ['Producto', 'Stock', 'Precio', 'Estado'];
    
    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: productosData,
      theme: 'striped',
      headStyles: { fillColor: colors.secondary, textColor: 255 },
      margin: { left: 15 },
      didParseCell: function(data) {
        if (data.column.index === (isOwner ? 4 : 3) && data.section === 'body') {
          if (data.cell.raw.includes('Stock Bajo')) {
            data.cell.styles.textColor = [231, 76, 60];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 12;
  });
  
  addFooter(doc);
  doc.save(`Reporte_Inventario_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Generar PDF de Clientes
export const generarPDFClientes = (reporteClientes) => {
  const doc = new jsPDF();
  
  addHeader(doc, 'Reporte de Clientes');
  
  let yPos = 45;
  
  // Resumen
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.text);
  doc.text('Resumen de Clientes', 15, yPos);
  yPos += 10;
  
  const resumenData = [
    ['Total de Clientes', reporteClientes.resumen.totalClientes.toString()],
    ['Clientes Activos', reporteClientes.resumen.clientesActivos.toString()],
    ['Clientes Frecuentes', reporteClientes.resumen.clientesFrecuentes.toString()],
    ['Clientes Nuevos', reporteClientes.resumen.clientesNuevos.toString()]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Métrica', 'Valor']],
    body: resumenData,
    theme: 'grid',
    headStyles: { fillColor: colors.primary, textColor: 255 },
    margin: { left: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Clientes por tipo
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Clientes por Tipo', 15, yPos);
  yPos += 10;
  
  const clientesPorTipoData = reporteClientes.clientesPorTipo.map(tipo => [
    tipo.tipo,
    tipo.cantidad.toString(),
    tipo.ventasTotal.toString(),
    `Q${tipo.montosTotal.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Tipo', 'Cantidad', 'Ventas', 'Monto Total']],
    body: clientesPorTipoData,
    theme: 'striped',
    headStyles: { fillColor: colors.secondary, textColor: 255 },
    margin: { left: 15 }
  });
  
  yPos = doc.lastAutoTable.finalY + 15;
  
  // Top clientes
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 10 Clientes', 15, yPos);
  yPos += 10;
  
  if (reporteClientes.topClientes && reporteClientes.topClientes.length > 0) {
    const topClientesData = reporteClientes.topClientes.map(cliente => [
      cliente.nombre,
      cliente.telefono || 'N/A',
      cliente.numeroVentas.toString(),
      `Q${cliente.totalCompras.toFixed(2)}`
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Cliente', 'Teléfono', 'Compras', 'Total Gastado']],
      body: topClientesData,
      theme: 'striped',
      headStyles: { fillColor: colors.warning, textColor: 255 },
      margin: { left: 15 }
    });
  }
  
  addFooter(doc);
  doc.save(`Reporte_Clientes_${new Date().toISOString().split('T')[0]}.pdf`);
};