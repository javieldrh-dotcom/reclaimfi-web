import jsPDF from "jspdf";

interface JournalLineItem {
  year: string;
  month: string;
  accountLabel: string;
  debit: number;
  credit: number;
}

export function generateSimpleDiarioPdf(companyName: string, exerciseYear: string, items: JournalLineItem[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(companyName || "Empresa", pageWidth / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(12);
  doc.text("LIBRO DIARIO - EJERCICIO " + exerciseYear, pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("AÑO", 20, y);
  doc.text("MES", 40, y);
  doc.text("CUENTA", pageWidth / 2, y, { align: "center" });
  doc.text("DEBE", pageWidth - 55, y, { align: "right" });
  doc.text("HABER", pageWidth - 20, y, { align: "right" });
  y += 4;
  doc.setDrawColor(200);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let lastYear = "";
  let lastMonth = "";

  items.forEach((item) => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(item.year !== lastYear ? item.year : "", 20, y);
    doc.text(item.month !== lastMonth ? item.month : "", 40, y);
    lastYear = item.year;
    lastMonth = item.month;
    doc.text(item.accountLabel, pageWidth / 2, y, { align: "center", maxWidth: pageWidth - 130 });
    doc.text(item.debit > 0 ? item.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "", pageWidth - 55, y, { align: "right" });
    doc.text(item.credit > 0 ? item.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "", pageWidth - 20, y, { align: "right" });
    y += 7;
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Pagina " + i + " de " + pageCount, pageWidth - 20, 290);
  }

  return doc;
}