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
// Nota de alcance: el desglose de la retencion al trabajador
// (employeeDeductionsBreakdown) solo existe para corridas procesadas
// DESPUES de que payroll_details empezo a persistirlo -- se guarda tal
// cual se calculo en ese momento con las tasas vigentes de
// jurisdiction_modules, nunca se recalcula aqui. Si el campo no viene
// (recibos de corridas anteriores), el PDF cae de vuelta a mostrar
// socialSecurity como un solo monto agregado en vez de inventar un
// desglose que no se guardo: recalcular con las tasas actuales podria
// mostrar numeros distintos a los que realmente se pagaron.

interface PayslipData {
  companyName: string;
  companyRif?: string;
  employeeName: string;
  employeePosition?: string;
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

// Nombres tal como se usan cotidianamente en un recibo de pago
// venezolano. Si aparece una clave sin entrada aqui (otra jurisdiccion,
// u otra carga agregada mas adelante), se cae a una version legible de
// la clave en vez de omitirla del recibo.
const DEDUCTION_LABELS: Record<string, string> = {
  ivss_empleado: "I.V.S.S.",
  lph_empleado: "L.P.H. (Pol. Habitacional / FAOV)",
  paro_forzoso_empleado: "Paro Forzoso (R.P.E.)",
};
function deductionLabel(key: string): string {
  if (DEDUCTION_LABELS[key]) return DEDUCTION_LABELS[key];
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const NAVY: [number, number, number] = [30, 58, 95];
const SOFT_GRAY: [number, number, number] = [90, 106, 133];
const INK: [number, number, number] = [20, 20, 20];
const GOLD: [number, number, number] = [202, 138, 4];
const LIGHT_BG: [number, number, number] = [245, 247, 250];
const NET_BG: [number, number, number] = [255, 249, 219];

export function generatePayslipPdf(data: PayslipData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const currency = data.currency || "USD";
  let y = 20;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 3, "F");

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
  doc.text("RECIBO DE PAGO", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SOFT_GRAY);
  doc.text("Periodo " + data.periodStart + " a " + data.periodEnd + "  ·  Expresado en " + currency, pageWidth / 2, y, { align: "center" });
  y += 12;

  // Datos del empleado
  doc.setFillColor(...LIGHT_BG);
  doc.rect(15, y - 5, pageWidth - 30, 20, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("EMPLEADO", 18, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK);
  doc.text(data.employeeName, 18, y + 6);
  if (data.employeePosition) {
    doc.setTextColor(...SOFT_GRAY);
    doc.text(data.employeePosition, 18, y + 11.5);
  }
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("DIAS TRABAJADOS", pageWidth - 18, y, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK);
  doc.text(String(data.daysWorked), pageWidth - 18, y + 6, { align: "right" });
  y += 24;

  function row(label: string, value: number, opts?: { bold?: boolean; negative?: boolean }) {
    doc.setFontSize(10);
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setTextColor(...INK);
    doc.text(label, 18, y);
    doc.setTextColor(opts?.negative ? 180 : 20, opts?.negative ? 40 : 20, opts?.negative ? 40 : 20);
    const text = (opts?.negative ? "- " : "") + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    doc.text(text, pageWidth - 18, y, { align: "right" });
    y += 7;
    doc.setDrawColor(230);
    doc.setLineWidth(0.2);
    doc.line(18, y - 2.5, pageWidth - 18, y - 2.5);
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("ASIGNACIONES", 18, y);
  y += 7;
  row("Sueldo Bruto del Periodo", data.grossAmount);

  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("DEDUCCIONES", 18, y);
  y += 7;
  const breakdown = data.employeeDeductionsBreakdown;
  const breakdownEntries = breakdown ? Object.entries(breakdown).filter(([, amount]) => amount > 0) : [];
  if (breakdownEntries.length > 0) {
    for (const [key, amount] of breakdownEntries) {
      row(deductionLabel(key), amount, { negative: true });
    }
  } else {
    row("Seguridad Social y Aportes de Ley", data.socialSecurity, { negative: true });
  }
  if (data.otherDeductions > 0) {
    row("Otras Deducciones", data.otherDeductions, { negative: true });
  }

  y += 4;
  doc.setFillColor(...NET_BG);
  doc.rect(15, y - 5, pageWidth - 30, 11, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("NETO A PAGAR", 18, y + 2);
  doc.setTextColor(...INK);
  doc.text(data.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - 18, y + 2, { align: "right" });
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

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(18, y + 12, 80, y + 12);
  doc.setFontSize(8);
  doc.setTextColor(...SOFT_GRAY);
  doc.text("Firma del Empleado (recibido conforme)", 18, y + 16);

  return doc;
}
