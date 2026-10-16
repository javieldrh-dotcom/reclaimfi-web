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
// Formato ajustado a partir de los modelos de recibo de pago venezolano
// que Javiel compartio como referencia: encabezado empresa/RIF, datos
// del trabajador (documento de identidad, cargo, fecha de ingreso),
// tabla de conceptos con codigo, totales y neto a pagar.
//
// Generico por jurisdiccion: idDocumentLabel, conceptLabels y
// deductionCodeMap vienen de jurisdiction_modules (PAYROLL_CHARGES,
// campo "labels") para que cada pais use su propio nombre de documento
// de identidad, su propia numeracion de conceptos (VE usa 001/002/009/
// 101/151/152/153/154; otro pais puede usar otra) y el nombre de su
// retencion de impuesto a la renta (I.S.L.R. en VE, Retencion en la
// Fuente en CO, etc). Si no vienen, se asume el valor por defecto de
// Venezuela en cada uno -- ningun recibo existente cambia.
//
// extraConcepts e islrAmount solo existen para corridas procesadas
// DESPUES de que payroll_details empezo a persistirlos (igual que
// employeeDeductionsBreakdown) -- se guardan tal cual se calcularon al
// momento de procesar esa corrida especifica, nunca se recalculan aqui.
// Si no vienen (recibos de corridas anteriores), esos renglones
// simplemente no aparecen en vez de inventar un monto que nunca se pago.

interface ConceptLabel {
  code: string;
  label: string;
}

interface PayslipData {
  companyName: string;
  companyRif?: string;
  employeeName: string;
  idDocumentLabel?: string;
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
  deductionCodeMap?: Record<string, ConceptLabel>;
  extraConcepts?: {
    base_salary_amount?: number;
    horas_extra_diurnas_horas?: number;
    horas_extra_diurnas_monto?: number;
    horas_extra_nocturnas_horas?: number;
    horas_extra_nocturnas_monto?: number;
    feriados_descanso_dias?: number;
    feriados_descanso_monto?: number;
    faltas_dias?: number;
    faltas_monto?: number;
  };
  conceptLabels?: {
    baseSalary?: ConceptLabel;
    overtimeDay?: ConceptLabel;
    overtimeNight?: ConceptLabel;
    holidayWorked?: ConceptLabel;
    absence?: ConceptLabel;
    incomeTax?: ConceptLabel;
  };
  islrAmount?: number;
  otherDeductions: number;
  netAmount: number;
  patronalAmount: number;
  currency?: string;
}

// Respaldo VE para cuando conceptLabels/deductionCodeMap no vienen
// (recibos de corridas de antes de este cambio, o jurisdicciones que
// aun no configuraron sus propias etiquetas). Son los mismos
// codigos/nombres que ya se usaban antes de generalizar esto.
const VE_CONCEPT_FALLBACK = {
  baseSalary: { code: "001", label: "Salario Basico por dias trabajados" },
  overtimeDay: { code: "002", label: "Horas Extras Diurnas Autorizadas" },
  overtimeNight: { code: "004", label: "Horas Extras Nocturnas Autorizadas" },
  holidayWorked: { code: "009", label: "Dias de Descanso y Feriados Trabajados" },
  absence: { code: "101", label: "Dias de Faltas al Trabajo" },
  incomeTax: { code: "151", label: "Impuesto Sobre la Renta (I.S.L.R.)" },
};
const VE_DEDUCTION_FALLBACK: Record<string, ConceptLabel> = {
  ivss_empleado: { code: "152", label: "Seguro Social Obligatorio" },
  paro_forzoso_empleado: { code: "153", label: "Regimen Prestacional del Empleo" },
  lph_empleado: { code: "154", label: "Fondo de Ahorro Obligatorio para la Vivienda" },
};
function deductionMeta(key: string, map?: Record<string, ConceptLabel>): ConceptLabel {
  if (map?.[key]) return map[key];
  if (VE_DEDUCTION_FALLBACK[key]) return VE_DEDUCTION_FALLBACK[key];
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
  const idLabel = data.idDocumentLabel || "CEDULA";
  const cl = {
    baseSalary: data.conceptLabels?.baseSalary ?? VE_CONCEPT_FALLBACK.baseSalary,
    overtimeDay: data.conceptLabels?.overtimeDay ?? VE_CONCEPT_FALLBACK.overtimeDay,
    overtimeNight: data.conceptLabels?.overtimeNight ?? VE_CONCEPT_FALLBACK.overtimeNight,
    holidayWorked: data.conceptLabels?.holidayWorked ?? VE_CONCEPT_FALLBACK.holidayWorked,
    absence: data.conceptLabels?.absence ?? VE_CONCEPT_FALLBACK.absence,
    incomeTax: data.conceptLabels?.incomeTax ?? VE_CONCEPT_FALLBACK.incomeTax,
  };
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
  label(rightX, ly, idLabel);
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
    // employees.daily_salary siempre esta denominado en USD (es la tasa
    // de referencia del empleado); la corrida se paga en la moneda que
    // se haya elegido (USD o VES con tasa del dia), pero este renglon
    // especifico SIEMPRE se expresa en USD sin importar esa moneda --
    // por eso no usa la variable "currency" del resto del recibo.
    label(rightX, ly, "SALARIO DIARIO (REFERENCIA)");
    value(rightX, ly, data.dailySalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " USD");
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

  conceptRow(cl.baseSalary.code, cl.baseSalary.label, data.grossAmount, 0);

  const ec = data.extraConcepts;
  let extraAsignaciones = 0;
  if (ec?.horas_extra_diurnas_monto && ec.horas_extra_diurnas_monto > 0) {
    conceptRow(cl.overtimeDay.code, cl.overtimeDay.label + " (" + ec.horas_extra_diurnas_horas + "h)", ec.horas_extra_diurnas_monto, 0);
    extraAsignaciones += ec.horas_extra_diurnas_monto;
  }
  if (ec?.horas_extra_nocturnas_monto && ec.horas_extra_nocturnas_monto > 0) {
    conceptRow(cl.overtimeNight.code, cl.overtimeNight.label + " (" + ec.horas_extra_nocturnas_horas + "h)", ec.horas_extra_nocturnas_monto, 0);
    extraAsignaciones += ec.horas_extra_nocturnas_monto;
  }
  if (ec?.feriados_descanso_monto && ec.feriados_descanso_monto > 0) {
    conceptRow(cl.holidayWorked.code, cl.holidayWorked.label + " (" + ec.feriados_descanso_dias + "d)", ec.feriados_descanso_monto, 0);
    extraAsignaciones += ec.feriados_descanso_monto;
  }

  const breakdown = data.employeeDeductionsBreakdown;
  const breakdownEntries = breakdown ? Object.entries(breakdown).filter(([, amount]) => amount > 0) : [];
  if (breakdownEntries.length > 0) {
    for (const [key, amount] of breakdownEntries) {
      const meta = deductionMeta(key, data.deductionCodeMap);
      conceptRow(meta.code, meta.label, 0, amount);
    }
  } else if (data.socialSecurity > 0) {
    conceptRow("-", "Seguridad Social y Aportes de Ley", 0, data.socialSecurity);
  }
  if (ec?.faltas_monto && ec.faltas_monto > 0) {
    conceptRow(cl.absence.code, cl.absence.label + " (" + ec.faltas_dias + "d)", 0, ec.faltas_monto);
  }
  if (data.islrAmount && data.islrAmount > 0) {
    conceptRow(cl.incomeTax.code, cl.incomeTax.label, 0, data.islrAmount);
  }
  if (data.otherDeductions > 0) {
    conceptRow("900", "Otras Deducciones", 0, data.otherDeductions);
  }

  const totalAsignaciones = data.grossAmount + extraAsignaciones;
  const socialSecurityTotal = breakdownEntries.length > 0
    ? breakdownEntries.reduce((s, [, amount]) => s + amount, 0)
    : data.socialSecurity;
  const totalDeducciones = socialSecurityTotal + (ec?.faltas_monto || 0) + (data.islrAmount || 0) + (data.otherDeductions || 0);

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
  doc.text("Firma del Trabajador" + (data.employeeCedula ? "  (" + idLabel + " " + data.employeeCedula + ")" : ""), 18, y);
  doc.text("Sello y Firma de la Empresa", pageWidth - 95, y);

  return doc;
}
