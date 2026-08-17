import jsPDF from "jspdf";

interface OfertaPartida {
  code: string | null;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function generateApuOfertaPdf(
  companyName: string,
  procedureNumber: string,
  projectDescription: string,
  contractingEntity: string,
  partidas: OfertaPartida[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  function drawHeader() {
    y = 20;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(companyName || "Empresa", pageWidth / 2, y, { align: "center" });
    y += 7;
    doc.setFontSize(12);
    doc.text("OFERTA DE PRECIOS", pageWidth / 2, y, { align: "center" });
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Procedimiento: " + procedureNumber, 15, y);
    y += 5;
    const descLines = doc.splitTextToSize(projectDescription || "", pageWidth - 30);
    doc.text(descLines, 15, y);
    y += descLines.length * 4 + 2;
    doc.text("Ente Contratante: " + (contractingEntity || "N/A"), 15, y);
    y += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("COD.", 15, y);
    doc.text("DESCRIPCION", 40, y);
    doc.text("UND", pageWidth - 85, y, { align: "center" });
    doc.text("CANT.", pageWidth - 65, y, { align: "right" });
    doc.text("P. UNITARIO", pageWidth - 40, y, { align: "right" });
    doc.text("TOTAL", pageWidth - 15, y, { align: "right" });
    y += 4;
    doc.setDrawColor(200);
    doc.line(15, y, pageWidth - 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
  }

  drawHeader();

  let grandTotal = 0;

  partidas.forEach((p) => {
    const descLines = doc.splitTextToSize(p.description, 100);
    const blockHeight = Math.max(descLines.length * 4, 6) + 3;

    if (y + blockHeight > 275) {
      doc.addPage();
      drawHeader();
    }

    doc.setFontSize(8);
    doc.text(p.code || "-", 15, y);
    doc.text(descLines, 40, y);
    doc.text(p.unit, pageWidth - 85, y, { align: "center" });
    doc.text(p.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 }), pageWidth - 65, y, { align: "right" });
    doc.text(p.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - 40, y, { align: "right" });
    doc.text(p.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - 15, y, { align: "right" });

    grandTotal += p.total;
    y += blockHeight;
  });

  y += 4;
  doc.setDrawColor(150);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL GENERAL DE LA OFERTA:", pageWidth - 90, y, { align: "left" });
  doc.text(grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - 15, y, { align: "right" });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Pagina " + i + " de " + pageCount, pageWidth - 20, 290);
  }

  return doc;
}