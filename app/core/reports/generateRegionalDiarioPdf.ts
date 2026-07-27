import jsPDF from "jspdf";

interface AccountLine {
  code: string;
  name: string;
  folio: number | string;
  debit: number;
  credit: number;
}

interface MonthBlock {
  year: string;
  month: string;
  accounts: AccountLine[];
  explanation: string;
}

export function generateRegionalDiarioPdf(companyName: string, exerciseYear: string, blocks: MonthBlock[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(companyName || "Empresa", pageWidth / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(12);
  doc.text("LIBRO DIARIO - EJERCICIO " + exerciseYear, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text("Asientos Resumen Mensuales - Formato Venezuela (Art. 34 C.Com)", pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 12;

  blocks.forEach((block) => {
    if (y > 240) { doc.addPage(); y = 20; }

    // Encabezado del bloque mensual
    doc.setFillColor(23, 27, 38);
    doc.rect(15, y, pageWidth - 30, 10, "F");
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(block.month + " " + block.year, 20, y + 7);
    doc.setTextColor(0);
    y += 15;

    const debitAccounts = block.accounts.filter((a) => a.debit > 0);
    const creditAccounts = block.accounts.filter((a) => a.credit > 0);

    // Encabezados de columna
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(140);
    doc.text("COD.", 20, y);
    doc.text("CUENTA", 40, y);
    doc.text("REF.", pageWidth - 65, y, { align: "center" });
    doc.text("MONTO", pageWidth - 20, y, { align: "right" });
    doc.setTextColor(0);
    y += 4;
    doc.setDrawColor(230);
    doc.line(15, y, pageWidth - 15, y);
    y += 6;

    // Bloque DEBE
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(74, 222, 128);
    doc.text("DEBE", 20, y);
    doc.setTextColor(0);
    y += 6;
    doc.setFont("helvetica", "normal");
    debitAccounts.forEach((a) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(a.code, 20, y);
      doc.text(a.name, 40, y, { maxWidth: pageWidth - 105 });
      doc.text(String(a.folio ?? "-"), pageWidth - 65, y, { align: "center" });
      doc.text(a.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }), pageWidth - 20, y, { align: "right" });
      y += 6;
    });

    y += 3;

    // Bloque HABER
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(251, 146, 60);
    doc.text("HABER", 20, y);
    doc.setTextColor(0);
    y += 6;
    doc.setFont("helvetica", "normal");
    creditAccounts.forEach((a) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(a.code, 20, y);
      doc.text("     " + a.name, 40, y, { maxWidth: pageWidth - 105 });
      doc.text(String(a.folio ?? "-"), pageWidth - 65, y, { align: "center" });
      doc.text(a.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }), pageWidth - 20, y, { align: "right" });
      y += 6;
    });

    y += 4;
    doc.setDrawColor(230);
    doc.line(15, y, pageWidth - 15, y);
    y += 6;

    // Explicación
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120);
    const explanationLines = doc.splitTextToSize("Explicacion: " + block.explanation, pageWidth - 40);
    doc.text(explanationLines, 20, y);
    doc.setTextColor(0);
    y += explanationLines.length * 4 + 12;
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Documento generado conforme al Art. 34 del Codigo de Comercio.", pageWidth / 2, 290, { align: "center" });
    doc.text("Pagina " + i + " de " + pageCount, pageWidth - 20, 290);
  }

  return doc;
}