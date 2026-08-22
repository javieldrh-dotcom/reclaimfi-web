import jsPDF from "jspdf";

interface AccountLine {
  code?: string;
  name: string;
  folio: number | string;
  debit: number;
  credit: number;
}

interface JournalEntryBlock {
  year: string;
  month: string;
  lines: AccountLine[];
  narration: string;
}

const NAVY: [number, number, number] = [30, 58, 95];
const SOFT_GRAY: [number, number, number] = [90, 106, 133];
const INK: [number, number, number] = [20, 20, 20];

export function generateProfessionalDiarioPdf(companyName: string, exerciseYear: string, currency: string, entries: JournalEntryBlock[], startingFolio: number = 1) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  let pageFolio = startingFolio;
  let pageDebitTotal = 0;
  let pageCreditTotal = 0;
  let lastYearPrinted = "";
  let lastMonthPrinted = "";
  let rowIndex = 0;

  function drawHeader() {
    y = 18;
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, 3, "F");

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(companyName || "Empresa", pageWidth / 2, y, { align: "center" });
    y += 7;
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text("LIBRO DIARIO", pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SOFT_GRAY);
    doc.text("Ejercicio " + exerciseYear + "  \u00b7  Expresado en " + currency, pageWidth / 2, y, { align: "center" });
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("Folio N " + pageFolio, pageWidth - 15, y, { align: "right" });
    y += 6;

    doc.setFillColor(245, 247, 250);
    doc.rect(15, y - 4, pageWidth - 30, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("FECHA", 18, y);
    doc.text("CUENTA", 42, y);
    doc.text("REF.", pageWidth - 75, y, { align: "center" });
    doc.text("DEBE", pageWidth - 45, y, { align: "right" });
    doc.text("HABER", pageWidth - 17, y, { align: "right" });
    y += 7;
    doc.setTextColor(...INK);
    rowIndex = 0;
  }

  function closePage(showContinues: boolean) {
    doc.setDrawColor(210);
    doc.setLineWidth(0.3);
    doc.line(15, y, pageWidth - 15, y);
    y += 5;
    doc.setFillColor(255, 249, 219);
    doc.rect(15, y - 4, pageWidth - 30, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("TOTALES DE LA PAGINA", 42, y);
    doc.setTextColor(...INK);
    doc.text(pageDebitTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }), pageWidth - 45, y, { align: "right" });
    doc.text(pageCreditTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }), pageWidth - 17, y, { align: "right" });
    y += 9;
    if (showContinues) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...SOFT_GRAY);
      doc.text("Pasa al Folio N " + (pageFolio + 1), 15, y);
      doc.setTextColor(...INK);
    }
  }

  drawHeader();

  entries.forEach((entry, entryIdx) => {
    const narrationLines = doc.splitTextToSize("P/R " + entry.narration, pageWidth - 72);
    const blockHeight = entry.lines.length * 6.5 + narrationLines.length * 4 + 7;

    if (y + blockHeight > 260) {
      closePage(true);
      doc.addPage();
      pageFolio += 1;
      pageDebitTotal = 0;
      pageCreditTotal = 0;
      drawHeader();
      lastYearPrinted = "";
      lastMonthPrinted = "";
    }

    if (rowIndex % 2 === 0) {
      doc.setFillColor(250, 251, 252);
      doc.rect(15, y - 4, pageWidth - 30, blockHeight, "F");
    }
    rowIndex++;

    const showYear = entry.year !== lastYearPrinted;
    const showMonth = entry.month !== lastMonthPrinted;
    lastYearPrinted = entry.year;
    lastMonthPrinted = entry.month;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    entry.lines.forEach((line, lineIdx) => {
      if (lineIdx === 0) {
        doc.setTextColor(...NAVY);
        doc.setFont("helvetica", "bold");
        if (showYear) doc.text(entry.year, 18, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        if (showMonth) doc.text(entry.month.toUpperCase(), 18, y + 4.5);
        doc.setFontSize(8.5);
        doc.setTextColor(...INK);
      }
      doc.setFont("helvetica", "normal");
      doc.text((line.code ? line.code + " - " : "") + line.name, 42, y, { maxWidth: pageWidth - 107 });
      doc.setTextColor(...SOFT_GRAY);
      doc.text(String(line.folio ?? "-"), pageWidth - 75, y, { align: "center" });
      doc.setTextColor(...INK);
      doc.text(line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "", pageWidth - 45, y, { align: "right" });
      doc.text(line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "", pageWidth - 17, y, { align: "right" });
      pageDebitTotal += line.debit || 0;
      pageCreditTotal += line.credit || 0;
      y += 6.5;
    });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...SOFT_GRAY);
    doc.text(narrationLines, 42, y);
    doc.setTextColor(...INK);
    doc.setFontSize(8.5);
    y += narrationLines.length * 4 + 7;

    if (entryIdx === entries.length - 1) {
      closePage(false);
    }
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Pagina " + i + " de " + pageCount, pageWidth - 15, 290, { align: "right" });
  }

  return doc;
}