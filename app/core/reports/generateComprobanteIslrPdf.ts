import jsPDF from "jspdf";

interface ComprobanteIslrData {
  companyName: string;
  companyRif: string;
  companyAddress: string;
  companyPhone: string;
  vendorName: string;
  vendorRif: string;
  vendorAddress: string;
  vendorPhone: string;
  fecha: string;
  periodoAno: string;
  periodoMes: string;
  numeroComprobante: string;
  numeroDocumento: string;
  numeroControl: string;
  fechaDocumento: string;
  codigo: string;
  conceptoPago: string;
  montoFactura: number;
  baseRetencion: number;
  sustraendoPN: number;
  porcentaje: number;
  montoRetenido: number;
}

export function generateComprobanteIslrPdf(data: ComprobanteIslrData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("COMPROBANTE DE RETENCION DE IMPUESTO SOBRE LA RENTA", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Reglamento Parcial de Ley de ISLR en Materia de Retenciones", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text("Aprobado el 12 de mayo de 1.977. Gaceta Oficial N 1.808.", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("FECHA: " + data.fecha, 15, y);
  doc.text("PERIODO FISCAL - Ano: " + data.periodoAno + "  Mes: " + data.periodoMes, 90, y);
  doc.text("N COMPROBANTE: " + data.numeroComprobante, pageWidth - 15, y, { align: "right" });
  y += 10;

  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, pageWidth - 30, 7, "F");
  doc.text("DATOS DEL AGENTE DE RETENCION", 18, y + 5);
  y += 11;
  doc.setFont("helvetica", "normal");
  doc.text("Nombre: " + data.companyName, 18, y); y += 5;
  doc.text("N de RIF: " + data.companyRif, 18, y); y += 5;
  doc.text("Direccion: " + data.companyAddress, 18, y, { maxWidth: pageWidth - 36 }); y += 5;
  doc.text("Telefonos: " + data.companyPhone, 18, y); y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, pageWidth - 30, 7, "F");
  doc.text("DATOS DEL BENEFICIARIO", 18, y + 5);
  y += 11;
  doc.setFont("helvetica", "normal");
  doc.text("Nombre: " + data.vendorName, 18, y); y += 5;
  doc.text("N de RIF: " + data.vendorRif, 18, y); y += 5;
  doc.text("Direccion: " + data.vendorAddress, 18, y, { maxWidth: pageWidth - 36 }); y += 5;
  doc.text("Telefonos: " + data.vendorPhone, 18, y); y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, pageWidth - 30, 7, "F");
  doc.text("DESCRIPCION DE LAS OPERACIONES", 18, y + 5);
  y += 12;

  doc.setFontSize(7);
  const headers = ["N Doc.", "N Control", "Fecha", "Cod.", "Concepto", "Monto Fact.", "Base Ret.", "Sustr. PN", "%", "Monto Ret."];
  const colX = [15, 32, 50, 68, 78, 108, 130, 152, 172, 182];
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  y += 4;
  doc.setDrawColor(200);
  doc.line(15, y, pageWidth - 15, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  const rowVals = [
    data.numeroDocumento, data.numeroControl, data.fechaDocumento, data.codigo, data.conceptoPago,
    data.montoFactura.toFixed(2), data.baseRetencion.toFixed(2), data.sustraendoPN.toFixed(2),
    data.porcentaje.toFixed(2), data.montoRetenido.toFixed(2)
  ];
  rowVals.forEach((v, i) => doc.text(String(v), colX[i], y, i === 4 ? { maxWidth: 28 } : undefined));
  y += 8;
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TOTALES", 78, y);
  doc.text(data.montoFactura.toFixed(2), 108, y);
  doc.text(data.baseRetencion.toFixed(2), 130, y);
  doc.text(data.montoRetenido.toFixed(2), 182, y);
  y += 25;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.line(20, y, 90, y);
  doc.line(pageWidth - 90, y, pageWidth - 20, y);
  y += 5;
  doc.text("Beneficiario", 20, y);
  doc.text("Sello y Firma del Agente de Retencion", pageWidth - 90, y);

  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text("Documento generado automaticamente. Verificar datos con la factura original.", pageWidth / 2, 285, { align: "center" });

  return doc;
}