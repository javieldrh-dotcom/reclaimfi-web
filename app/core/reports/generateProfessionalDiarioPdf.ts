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

export function generateProfessionalDiarioPdf(companyName: string, exerciseYear: string, currency: string, entries: JournalEntryBlock[], startingFolio: number = 1) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  let pageFolio = startingFolio;
  let pageDebitTotal = 0;
  let pageCreditTotal = 0;
  let lastYearPrinted = "";
  let lastMonthPrinted = "";

  function drawHeader() {
    y = 20;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(companyName || "Empresa", pageWidth / 2, y, { align: "center" });
    y += 6;
    doc.setFontSize(11);
    doc.text("LIBRO DIARIO", pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text("Ejercicio " + exerciseYear + " - Expresado en " + currency, pageWidth / 2, y, { align: "center" });
    doc.setTextColor(0);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Folio Nº " + pageFolio, pageWidth - 20, y, { align: "right" });
    y += 8;

    doc.setFontSize(8);
    doc.text("FECHA", 15, y);
    doc.text("CUENTA", 40, y);
    doc.text("REF.", pageWidth - 75, y, { align: "center" });
    doc.text("DEBE", pageWidth - 45, y, { align: "right" });
    doc.text("HABER", pageWidth - 20, y, { align: "right" });
    y += 4;
    doc.setDrawColor(200);
    doc.line(15, y, pageWidth - 15, y);
    y += 6;
  }

  function closePage(showContinues: boolean) {
    doc.setDrawColor(200);
    doc.line(15, y, pageWidth - 15, y);
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("TOTALES DE LA PAGINA", 40, y);
    doc.text(pageDebitTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }), pageWidth - 45, y, { align: "right" });
    doc.text(pageCreditTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }), pageWidth - 20, y, { align: "right" });
    y += 8;
    if (showContinues) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("Pasa al Folio Nº " + (pageFolio + 1), 15, y);
    }
  }

  drawHeader();

  entries.forEach((entry, entryIdx) => {
    const showYear = entry.year !== lastYearPrinted;
    const showMonth = entry.month !== lastMonthPrinted;
    lastYearPrinted = entry.year;
    lastMonthPrinted = entry.month;

    const narrationLines = doc.splitTextToSize("P/R " + entry.narration, pageWidth - 70);
    const blockHeight = entry.lines.length * 6 + narrationLines.length * 4 + 6;

    if (y + blockHeight > 265) {
      closePage(true);
      doc.addPage();
      pageFolio += 1;
      pageDebitTotal = 0;
      pageCreditTotal = 0;
      drawHeader();
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    entry.lines.forEach((line, lineIdx) => {
      if (lineIdx === 0) {
        if (showYear) doc.text(entry.year, 15, y);
        if (showMonth) doc.text(entry.month.toUpperCase(), 15, y + 5);
      }
      doc.text((line.code ? line.code + " - " : "") + line.name, 40, y, { maxWidth: pageWidth - 105 });
      doc.text(String(line.folio ?? "-"), pageWidth - 75, y, { align: "center" });
      doc.text(line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "", pageWidth - 45, y, { align: "right" });
      doc.text(line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "", pageWidth - 20, y, { align: "right" });
      pageDebitTotal += line.debit || 0;
      pageCreditTotal += line.credit || 0;
      y += 6;
    });

    doc.setFont("helvetica", "italic");
    doc.setTextColor(120);
    doc.text(narrationLines, 40, y);
    doc.setTextColor(0);
    y += narrationLines.length * 4 + 6;

    if (entryIdx === entries.length - 1) {
      closePage(false);
    }
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Pagina " + i + " de " + pageCount, pageWidth - 20, 290);
  }

  return doc;
}