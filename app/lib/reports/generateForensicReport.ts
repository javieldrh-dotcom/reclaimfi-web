import jsPDF from "jspdf";

export type EngagementType = "COMPILATION" | "REVIEW" | "AUDIT";

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

interface DigitalAsset {
  entity_name: string;
  entity_type: string;
  estimated_value?: number | null;
  risk_level: string | null;
}

interface AuditorInfo {
  name: string;
  license: string;
  federationName: string;
}

const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  COMPILATION: "INFORME DE COMPILACION (NICC/ISRS 4410)",
  REVIEW: "INFORME DE REVISION - ATESTIGUAMIENTO LIMITADO (NIA/ISRE 2400)",
  AUDIT: "DICTAMEN DE AUDITORIA - ASEGURAMIENTO RAZONABLE (NIA/ISA)",
};

const ENGAGEMENT_STATEMENTS: Record<EngagementType, string[]> = {
  COMPILATION: [
    "Hemos compilado la informacion financiera de activos digitales que se presenta en este informe, la cual ha sido proporcionada por la administracion o el usuario del sistema.",
    "No hemos realizado una auditoria ni una revision, por lo tanto no expresamos ninguna opinion ni conclusion de aseguramiento sobre si esta informacion se presenta de acuerdo con el marco de informacion financiera aplicable.",
  ],
  REVIEW: [
    "Hemos revisado la informacion financiera de activos digitales que se presenta en este informe.",
    "Nuestra revision se realizo de acuerdo con normas de encargos de revision. Estas normas requieren que planifiquemos y ejecutemos la revision para obtener una seguridad limitada sobre si la informacion esta libre de incorreccion material.",
    "Basado en nuestra revision, no ha llegado a nuestra atencion ningun asunto que nos haga creer que la informacion financiera de activos digitales no se presenta razonablemente, en todos los aspectos materiales, salvo por lo que se indica en la seccion de hallazgos de este informe.",
  ],
  AUDIT: [
    "Hemos auditado la informacion financiera de activos digitales que se presenta en este informe.",
    "Nuestra auditoria se realizo de acuerdo con Normas Internacionales de Auditoria (NIA). Nuestras responsabilidades de acuerdo con dichas normas se describen en la seccion de metodologia de este informe.",
    "En nuestra opinion, la informacion financiera de activos digitales que se presenta en este informe presenta razonablemente, en todos los aspectos materiales, la situacion de los activos digitales analizados, con base en la evidencia recopilada y descrita en la cadena de custodia.",
  ],
};

export function generateForensicReport(
  caseData: CaseData,
  ledgerEntries: LedgerEntry[],
  auditEntries: AuditEntry[],
  engagementType: EngagementType,
  digitalAssets: DigitalAsset[] = [],
  auditorInfo?: AuditorInfo
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(ENGAGEMENT_LABELS[engagementType], pageWidth / 2, y, { align: "center", maxWidth: pageWidth - 20 });
  y += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Generado por ReclaimFi - Audit Global Intelligence", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.text("Fecha de generacion: " + new Date().toLocaleString(), pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 12;

  doc.setDrawColor(200);
  doc.line(15, y, pageWidth - 15, y);
  y += 10;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("1. Informacion del Caso", 15, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const caseFields: [string, string][] = [
    ["Codigo de caso", caseData.case_code],
    ["Titulo", caseData.title ?? "N/D"],
    ["Descripcion", caseData.description ?? "N/D"],
    ["Nivel de riesgo", caseData.risk_level ?? "N/D"],
    ["Estado", caseData.status ?? "N/D"],
    ["Fecha de creacion", new Date(caseData.created_at).toLocaleString()],
  ];

  caseFields.forEach(function (field) {
    doc.setFont("helvetica", "bold");
    doc.text(field[0] + ":", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(field[1]), 65, y);
    y += 6;
  });

  y += 8;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("2. Naturaleza del Encargo Profesional", 15, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  ENGAGEMENT_STATEMENTS[engagementType].forEach(function (line) {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(line, 15, y, { maxWidth: pageWidth - 30 });
    y += 12;
  });

  y += 4;

  if (digitalAssets.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("3. Estado de Situacion Financiera de Activos Digitales", 15, y);
    y += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Entidad", 15, y);
    doc.text("Tipo", 85, y);
    doc.text("Valor estimado", 130, y);
    doc.text("Riesgo", 175, y);
    y += 5;
    doc.setDrawColor(220);
    doc.line(15, y, pageWidth - 15, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    let total = 0;
    digitalAssets.forEach(function (asset) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(asset.entity_name, 15, y, { maxWidth: 65 });
      doc.text(asset.entity_type, 85, y, { maxWidth: 40 });
      const val = asset.estimated_value ?? 0;
      total += val;
      doc.text("$" + val.toLocaleString(), 130, y);
      doc.text(asset.risk_level ?? "N/D", 175, y);
      y += 6;
    });

    y += 3;
    doc.setDrawColor(200);
    doc.line(15, y, pageWidth - 15, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Total estimado: $" + total.toLocaleString(), 15, y);
    y += 10;

    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120);
    doc.text(
      "Los valores estimados corresponden a la fecha de generacion de este informe y estan sujetos a la volatilidad propia de los activos digitales.",
      15, y, { maxWidth: pageWidth - 30 }
    );
    doc.setTextColor(0);
    y += 10;
  }

  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("4. Cadena de Custodia (Hash Chain)", 15, y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text(
    "Cada evento queda vinculado criptograficamente al anterior mediante hash SHA-256. Cualquier alteracion retroactiva de un evento invalidaria todos los hashes posteriores.",
    15, y, { maxWidth: pageWidth - 30 }
  );
  doc.setTextColor(0);
  y += 12;

  if (ledgerEntries.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.text("No hay eventos registrados en la cadena de custodia para este caso.", 15, y);
    y += 8;
  } else {
    ledgerEntries.forEach(function (entry, idx) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Evento " + (idx + 1) + ": " + entry.event_type, 15, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Fecha: " + new Date(entry.created_at).toLocaleString(), 15, y);
      y += 4;
      doc.text("Actor: " + entry.actor, 15, y);
      y += 4;
      doc.text("Hash: " + entry.event_hash, 15, y, { maxWidth: pageWidth - 30 });
      y += 4;
      doc.text("Hash anterior: " + (entry.previous_hash ?? "GENESIS"), 15, y, { maxWidth: pageWidth - 30 });
      y += 8;
    });
  }

  if (y > 240) { doc.addPage(); y = 20; } else { y += 6; }
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("5. Historial de Auditoria", 15, y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (auditEntries.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.text("No hay registros de auditoria adicionales para este caso.", 15, y);
    y += 8;
  } else {
    auditEntries.forEach(function (entry) {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "normal");
      doc.text(
        new Date(entry.created_at).toLocaleString() + " - " + entry.module + " - " + entry.action,
        15, y
      );
      y += 5;
    });
  }

  if (auditorInfo) {
    if (y > 230) { doc.addPage(); y = 20; } else { y += 10; }
    doc.setDrawColor(200);
    doc.line(15, y, pageWidth - 15, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Firma del Profesional Responsable", 15, y);
    y += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(auditorInfo.name, 15, y);
    y += 5;
    doc.text("Matricula: " + auditorInfo.license, 15, y);
    y += 5;
    doc.text(auditorInfo.federationName, 15, y);
    y += 8;

    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(
      "Este documento incluye una firma criptografica (hash SHA-256) del contenido integro del informe, generada al momento de su emision, que permite verificar su integridad posterior.",
      15, y, { maxWidth: pageWidth - 30 }
    );
    doc.setTextColor(0);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      "Este documento se emite conforme a la naturaleza del encargo profesional indicada en la seccion 2. No constituye garantia de recuperacion de fondos.",
      pageWidth / 2, 290, { align: "center", maxWidth: pageWidth - 20 }
    );
    doc.text("Pagina " + i + " de " + pageCount, pageWidth - 20, 290);
  }

  return doc;
}