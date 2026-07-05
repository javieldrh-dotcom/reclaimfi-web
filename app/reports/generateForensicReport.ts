import jsPDF from "jspdf";

interface CaseData {
  id: string;
  case_code: string;
  title: string | null;
  description: string | null;
  risk_level: string | null;
  status: string | null;
  created_at: string;
}

interface LedgerEntry {
  event_type: string;
  event_hash: string;
  previous_hash: string | null;
  actor: string;
  created_at: string;
}

interface AuditEntry {
  module: string;
  action: string;
  created_at: string;
}

export function generateForensicReport(
  caseData: CaseData,
  ledgerEntries: LedgerEntry[],
  auditEntries: AuditEntry[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE FORENSE — CADENA DE CUSTODIA", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Generado por ReclaimFi — Audit Global Intelligence", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 12;

  doc.setDrawColor(200);
  doc.line(15, y, pageWidth - 15, y);
  y += 10;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("1. Información del Caso", 15, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const caseFields: [string, string][] = [
    ["Código de caso", caseData.case_code],
    ["Título", caseData.title ?? "N/D"],
    ["Descripción", caseData.description ?? "N/D"],
    ["Nivel de riesgo", caseData.risk_level ?? "N/D"],
    ["Estado", caseData.status ?? "N/D"],
    ["Fecha de creación", new Date(caseData.created_at).toLocaleString()],
  ];

  caseFields.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 65, y);
    y += 6;
  });

  y += 8;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("2. Cadena de Custodia (Hash Chain)", 15, y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text(
    "Cada evento queda vinculado criptográficamente al anterior mediante hash SHA-256. Cualquier alteración retroactiva de un evento invalidaría todos los hashes posteriores.",
    15,
    y,
    { maxWidth: pageWidth - 30 }
  );
  doc.setTextColor(0);
  y += 12;

  if (ledgerEntries.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.text("No hay eventos registrados en la cadena de custodia para este caso.", 15, y);
    y += 8;
  } else {
    ledgerEntries.forEach((entry, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Evento ${idx + 1}: ${entry.event_type}`, 15, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(`Fecha: ${new Date(entry.created_at).toLocaleString()}`, 15, y);
      y += 4;
      doc.text(`Actor: ${entry.actor}`, 15, y);
      y += 4;
      doc.text(`Hash: ${entry.event_hash}`, 15, y, { maxWidth: pageWidth - 30 });
      y += 4;
      doc.text(`Hash anterior: ${entry.previous_hash ?? "GENESIS"}`, 15, y, { maxWidth: pageWidth - 30 });
      y += 8;
    });
  }

  if (y > 240) {
    doc.addPage();
    y = 20;
  } else {
    y += 6;
  }

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("3. Historial de Auditoría", 15, y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  if (auditEntries.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.text("No hay registros de auditoría adicionales para este caso.", 15, y);
  } else {
    auditEntries.forEach((entry) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "normal");
      doc.text(
        `${new Date(entry.created_at).toLocaleString()} — ${entry.module} — ${entry.action}`,
        15,
        y
      );
      y += 5;
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      "Este reporte documenta el proceso de investigación y la evidencia recopilada. No constituye garantía de recuperación de fondos.",
      pageWidth / 2,
      290,
      { align: "center", maxWidth: pageWidth - 20 }
    );
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, 290);
  }

  return doc;
}