import jsPDF from "jspdf";

interface LineItem {
  code?: string;
  name: string;
  amount: number;
}

interface StatementSection {
  title: string;
  items: LineItem[];
  total: number;
  totalLabel: string;
}

export function generateFinancialStatementPdf(
  statementTitle: string,
  companyName: string,
  sections: StatementSection[],
  finalLabel: string,
  finalValue: number
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(statementTitle, pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(companyName, pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.text("Fecha de generacion: " + new Date().toLocaleString(), pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 12;

  doc.setDrawColor(200);
  doc.line(15, y, pageWidth - 15, y);
  y += 10;

  sections.forEach((section) => {
    if (y > 260) { doc.addPage(); y = 20; }

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, 15, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    section.items.forEach((item) => {
      if (y > 270) { doc.addPage(); y = 20; }
      const label = item.code ? item.code + " - " + item.name : item.name;
      doc.text(label, 15, y, { maxWidth: pageWidth - 80 });
      doc.text(item.amount.toLocaleString(), pageWidth - 20, y, { align: "right" });
      y += 6;
    });

    doc.setDrawColor(220);
    doc.line(15, y, pageWidth - 15, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text(section.totalLabel, 15, y);
    doc.text(section.total.toLocaleString(), pageWidth - 20, y, { align: "right" });
    y += 12;
  });

  if (y > 250) { doc.addPage(); y = 20; }
  y += 5;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setDrawColor(150);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;
  doc.text(finalLabel, 15, y);
  doc.text(finalValue.toLocaleString(), pageWidth - 20, y, { align: "right" });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      "Documento generado conforme a NIIF/IFRS. Sujeto a revision del profesional certificado.",
      pageWidth / 2, 290, { align: "center", maxWidth: pageWidth - 20 }
    );
    doc.text("Pagina " + i + " de " + pageCount, pageWidth - 20, 290);
  }

  return doc;
}