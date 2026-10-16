import jsPDF from "jspdf";

// Recibo de pago (payslip) individual, una pagina por empleado por
// corrida de nomina. Parte de "profundidad de Nomina" (roadmap QuickBooks
// + KPMG): hasta ahora Nomina procesaba el pago y el asiento contable,
// pero no generaba ningun comprobante entregable al empleado -- cada
// corrida (payroll_runs) y su detalle por empleado (payroll_details) ya
// existian, solo faltaba el PDF. Reutiliza la misma paleta que
// generateProfessionalDiarioPdf.ts para que todo el papeleo contable se
// vea consistente.
//
// Formato ajustado a partir de 3 modelos de recibo de pago venezolano
// que Javiel compartio como referencia: encabezado empresa/RIF, datos
// del trabajador (cedula, cargo, fecha de ingreso), tabla de conceptos
// con codigo (001 Salario Basico, 152 Seguro Social Obligatorio, 153
// Regimen Prestacional del Empleo, 154 FAOV), totales y neto a pagar.
//
// Nota de alcance deliberada: NO se incluyen conceptos como Cestaticket
// Socialista, Bono de Guerra Economica, horas extra o ISLR porque
// payroll_details hoy no captura esos montos por separado (solo
// gross_amount = sueldo basico por dias trabajados). Agregarlos
// inventando un monto seria incorrecto -- requiere primero capturarlos
// como campos propios al procesar la nomina. El desglose de deducciones
// (employeeDeductionsBreakdown) solo existe para corridas procesadas
// DESPUES de que payroll_details empezo a persistirlo por clave; si no
// viene (recibos de corridas anteriores), el PDF cae de vuelta a un
// monto unico de deducciones en vez de inventar un desglose que nunca
// se guardo -- recalcular con tasas actuales podria no coincidir con lo
// realmente pagado.

interface PayslipData {
  companyName: string;
  companyRif?: string;
  employeeName: string;
  employeeCedula?: string;
  employeePosition?: string;
  employeeHireDate?: string;
  dailySalary?: number;
  periodStart: string;
  periodEnd: string;
  daysWorked: number;
  grossAmount: number;
  socialSecurity: number;
  employeeDeductionsBreakdown?: Record<string, number>;
  otherDeductions: number;
  netAmount: number;
  patronalAmount: number;
  currency?: string;
}

// Codigo + nombre tal como se usan en un recibo de pago venezolano
// estandar (los codigos 001/152/153/154 son los que Javiel uso como
// referencia). Si aparece una clave de employee_pct sin entrada aqui
// (otra jurisdiccion, u otra carga agregada mas adelante), se cae a un
// codigo generico "-" y una version legible de la clave en vez de
// omitirla del recibo.
const DEDUCTION_META: Record<string, { code: string; label: string }> = {
  ivss_empleado: { code: "152", label: "Seguro Social Obligatorio" },
  paro_forzoso_empleado: { code: "153", label: "Regimen Prestacional del Empleo" },
  lph_empleado: { code: "154", label: "Fondo de Ahorro Obligatorio para la Vivienda" },
};
function deductionMeta(key: string): { code: string; label: string } {
  if (DEDUCTION_META[key]) return DEDUCTION_META[key];
  const spaced = key.replace(/_/g, " ");
  return { code: "-", label: spaced.charAt(0).toUpperCase() + spaced.slice(1) };
}

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value.length === 10 ? value + "T00:00:00" : value);
  if (isNaN(d.getTime())) return value;
  return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
}

const NAVY: [number, number, number] = [30, 58, 95];
const SOFT_GRAY: [number, number, number] = [90, 106, 133];
const INK: [number, number, number] = [20, 20, 20];
const GOLD: [number, number, number] = [202, 138, 4];
const LIGHT_BG: [number, number, number] = [245, 247, 250];
const NET_BG: [number, number, number] = [255, 249, 219];
const RED: [number, number, number] = [180, 40, 40];

export function generatePayslipPdf(data: PayslipData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const currency = data.currency || "USD";
  let y = 18;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 3, "F");

  // Encabezado: empresa / RIF
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text(data.companyName || "Empresa", pageWidth / 2, y, { align: "center" });
  y += 6;
  if (data.companyRif) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SOFT_GRAY);
    doc.text("RIF: " + data.companyRif, pageWidth / 2, y, { align: "center" });
    y += 6;
  }
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("RECIBO DE PAGO DE NOMINA", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SOFT_GRAY);
  doc.text(
    "Periodo " + formatDate(data.periodStart) + " al " + formatDate(data.periodEnd) +
      "  ·  Fecha de Emision: " + formatDate(new Date().toISOString().slice(0, 10)) +
      "  ·  Expresado en " + currency,
    pageWidth / 2, y, { align: "center" }
  );
  y += 10;

  // Datos del trabajador, en dos columnas
  const boxTop = y - 5;
  const boxHeight = 30;
  doc.setFillColor(...LIGHT_BG);
  doc.rect(15, boxTop, pageWidth - 30, boxHeight, "F");
  const leftX = 18;
  const rightX = pageWidth / 2 + 4;
  let ly = y;

  function label(x: number, yy: number, text: string) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(text, x, yy);
  }
  function value(x: number, yy: number, text: string) {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    doc.text(text || "-", x, yy + 4.5);
  }

  label(leftX, ly, "TRABAJADOR(A)");
  value(leftX, ly, data.employeeName);
  label(rightX, ly, "CEDULA");
  value(rightX, ly, data.employeeCedula || "-");
  ly += 10;

  label(leftX, ly, "CARGO");
  value(leftX, ly, data.employeePosition || "-");
  label(rightX, ly, "FECHA DE INGRESO");
  value(rightX, ly, data.employeeHireDate ? formatDate(data.employeeHireDate) : "-");
  ly += 10;

  label(leftX, ly, "DIAS TRABAJADOS");
  value(leftX, ly, String(data.daysWorked));
  if (data.dailySalary) {
    label(rightX, ly, "SALARIO DIARIO");
    value(rightX, ly, data.dailySalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency);
  }
  y = boxTop + boxHeight + 10;

  // Tabla de conceptos: codigo / descripcion / asignaciones / deducciones
  const colCode = 18;
  const colDesc = 35;
  const colAsig = pageWidth - 65;
  const colDed = pageWidth - 18;

  function tableHeader() {
    doc.setFillColor(...NAVY);
    doc.rect(15, y - 5, pageWidth - 30, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("COD.", colCode, y);
    doc.text("CONCEPTO", colDesc, y);
    doc.text("ASIGNACIONES", colAsig, y, { align: "right" });
    doc.text("DEDUCCIONES", colDed, y, { align: "right" });
    y += 8;
  }
  tableHeader();

  let rowIdx = 0;
  function conceptRow(code: string, concept: string, asignacion: number, deduccion: number) {
    if (rowIdx % 2 === 0) {
      doc.setFillColor(250, 251, 252);
      doc.rect(15, y - 4.5, pageWidth - 30, 7, "F");
    }
    rowIdx++;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SOFT_GRAY);
    doc.text(code, colCode, y);
    doc.setTextColor(...INK);
    doc.text(concept, colDesc, y, { maxWidth: colAsig - colDesc - 8 });
    if (asignacion > 0) {
      doc.text(asignacion.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), colAsig, y, { align: "right" });
    }
    if (deduccion > 0) {
      doc.setTextColor(...RED);
      doc.text(deduccion.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), colDed, y, { align: "right" });
      doc.setTextColor(...INK);
    }
    y += 7;
  }

  conceptRow("001", "Salario Basico por dias trabajados", data.grossAmount, 0);

  const breakdown = data.employeeDeductionsBreakdown;
  const breakdownEntries = breakdown ? Object.entries(breakdown).filter(([, amount]) => amount > 0) : [];
  if (breakdownEntries.length > 0) {
    for (const [key, amount] of breakdownEntries) {
      const meta = deductionMeta(key);
      conceptRow(meta.code, meta.label, 0, amount);
    }
  } else if (data.socialSecurity > 0) {
    conceptRow("-", "Seguridad Social y Aportes de Ley", 0, data.socialSecurity);
  }
  if (data.otherDeductions > 0) {
    conceptRow("900", "Otras Deducciones", 0, data.otherDeductions);
  }

  const totalAsignaciones = data.grossAmount;
  const totalDeducciones = breakdownEntries.length > 0
    ? breakdownEntries.reduce((s, [, amount]) => s + amount, 0) + (data.otherDeductions || 0)
    : data.socialSecurity + (data.otherDeductions || 0);

  doc.setDrawColor(210);
  doc.setLineWidth(0.3);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("TOTALES", colDesc, y);
  doc.setTextColor(...INK);
  doc.text(totalAsignaciones.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), colAsig, y, { align: "right" });
  doc.setTextColor(...RED);
  doc.text(totalDeducciones.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), colDed, y, { align: "right" });
  y += 12;

  doc.setFillColor(...NET_BG);
  doc.rect(15, y - 5, pageWidth - 30, 11, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("NETO A PAGAR", 18, y + 2);
  doc.setTextColor(...INK);
  doc.text(data.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency, pageWidth - 18, y + 2, { align: "right" });
  y += 20;

  if (data.patronalAmount > 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...SOFT_GRAY);
    doc.text(
      "Costo patronal adicional de este periodo (no se descuenta del sueldo): " +
        data.patronalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + currency,
      18, y
    );
    y += 10;
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...SOFT_GRAY);
  doc.text("Certifico el pago por los conceptos mencionados anteriormente, quedando conforme.", 18, y);
  y += 14;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(18, y, 95, y);
  doc.line(pageWidth - 95, y, pageWidth - 18, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(...SOFT_GRAY);
  doc.text("Firma del Trabajador" + (data.employeeCedula ? "  (C.I. " + data.employeeCedula + ")" : ""), 18, y);
  doc.text("Sello y Firma de la Empresa", pageWidth - 95, y);

  return doc;
}
