import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface OfertaPartida {
  itemNumber: number;
  code: string | null;
  description: string;
  unit: string;
  quantity: number;
  materialsCost: number;
  equipmentCost: number;
  laborCost: number;
  directCost: number;
  adminPercentage: number;
  profitPercentage: number;
  unitPrice: number;
  total: number;
}

export function generateApuOfertaPdf(
  companyName: string,
  procedureNumber: string,
  projectDescription: string,
  contractingEntity: string,
  partidas: OfertaPartida[],
  ivaRate: number = 16,
  repName: string = "",
  repId: string = "",
  repPosition: string = ""
) {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(companyName || "Empresa", pageWidth / 2, 15, { align: "center" });
  doc.setFontSize(11);
  doc.text("RESUMEN DE PARTIDAS O POSICIONES - FORMATO II.06", pageWidth / 2, 21, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Procedimiento: " + procedureNumber, 14, 29);
  const descLines = doc.splitTextToSize("Obra: " + (projectDescription || ""), pageWidth - 28);
  doc.text(descLines, 14, 34);
  doc.text("Ente Contratante: " + (contractingEntity || "N/A"), 14, 34 + descLines.length * 4);

  const startY = 40 + descLines.length * 4;

  const subTotalOferta = partidas.reduce((s, p) => s + p.total, 0);
  const ivaAmount = subTotalOferta * (ivaRate / 100);
  const totalOferta = subTotalOferta + ivaAmount;

  autoTable(doc, {
    startY,
    head: [
      [
        { content: "Partida", rowSpan: 2 },
        { content: "Descripcion", rowSpan: 2 },
        { content: "Und.", rowSpan: 2 },
        { content: "Cant.", rowSpan: 2 },
        { content: "Costos Directos", colSpan: 4, styles: { halign: "center" } },
        { content: "Costos Indirectos", colSpan: 2, styles: { halign: "center" } },
        { content: "Precio Unitario", rowSpan: 2 },
        { content: "Total Oferta", rowSpan: 2 },
      ],
      ["Materiales", "Equipo", "Labor", "Sub Total", "% Admin", "% Util."],
    ],
    body: partidas.map((p) => [
      p.code || String(p.itemNumber),
      p.description,
      p.unit,
      p.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 }),
      p.materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      p.equipmentCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      p.laborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      p.directCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      p.adminPercentage.toFixed(1) + "%",
      p.profitPercentage.toFixed(1) + "%",
      p.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      p.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ]),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fontSize: 6.5, halign: "center", fillColor: [30, 58, 95] },
    columnStyles: {
      1: { cellWidth: "auto" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
      10: { halign: "right" },
      11: { halign: "right", fontStyle: "bold" },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sub Total Oferta:", pageWidth - 90, finalY);
  doc.text(subTotalOferta.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - 14, finalY, { align: "right" });
  doc.text("I.V.A. (" + ivaRate + "%):", pageWidth - 90, finalY + 6);
  doc.text(ivaAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - 14, finalY + 6, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL OFERTA:", pageWidth - 90, finalY + 14);
  doc.text(totalOferta.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - 14, finalY + 14, { align: "right" });

  const sigY = finalY + 32;
  if (sigY < doc.internal.pageSize.getHeight() - 20) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.line(14, sigY, 90, sigY);
    doc.text(repName || "Nombre y Apellido", 14, sigY - 2);
    doc.setFontSize(7);
    doc.text("Nombre y Apellido", 14, sigY + 5);
    doc.setFontSize(9);
    doc.line(110, sigY, 170, sigY);
    doc.text(repId || "Cedula de Identidad", 110, sigY - 2);
    doc.setFontSize(7);
    doc.text("Cedula de Identidad", 110, sigY + 5);
    doc.setFontSize(9);
    doc.line(190, sigY, 250, sigY);
    doc.text(repPosition || "Cargo / Representante Legal", 190, sigY - 2);
    doc.setFontSize(7);
    doc.text("Cargo / Representante Legal", 190, sigY + 5);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Pagina " + i + " de " + pageCount, pageWidth - 20, doc.internal.pageSize.getHeight() - 6);
  }

  return doc;
}