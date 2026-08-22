import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface CostSummaryData {
  totalMaterials: number;
  totalEquipment: number;
  totalLabor: number;
  totalAdmin: number;
  totalProfit: number;
  adminPercentage: number;
  profitPercentage: number;
  bcvRate: number;
  ivaRate: number;
}

export function generateApuCostSummaryPdf(
  companyName: string,
  procedureNumber: string,
  projectDescription: string,
  data: CostSummaryData,
  repName: string = "",
  repId: string = "",
  repPosition: string = ""
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(companyName || "Empresa", pageWidth / 2, 15, { align: "center" });
  doc.setFontSize(11);
  doc.text("RESUMEN DE LA OFERTA POR ELEMENTO DE COSTO - FORMATO II.12", pageWidth / 2, 21, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Procedimiento: " + procedureNumber, 14, 29);
  const descLines = doc.splitTextToSize("Obra: " + (projectDescription || ""), pageWidth - 28);
  doc.text(descLines, 14, 34);
  const bcvY = 34 + descLines.length * 4;
  doc.text("Tasa BCV: " + data.bcvRate.toLocaleString(undefined, { minimumFractionDigits: 2 }) + " Bs/USD", 14, bcvY);

  const directCost = data.totalMaterials + data.totalEquipment + data.totalLabor;
  const totalSinIva = directCost + data.totalAdmin + data.totalProfit;
  const ivaAmount = totalSinIva * (data.ivaRate / 100);
  const totalOferta = totalSinIva + ivaAmount;

  function pesoPct(amount: number) {
    return directCost > 0 ? (amount / directCost) * 100 : 0;
  }

  const rows = [
    ["Materiales", data.totalMaterials, pesoPct(data.totalMaterials)],
    ["Equipos", data.totalEquipment, pesoPct(data.totalEquipment)],
    ["Mano de Obra (con factor FSCL)", data.totalLabor, pesoPct(data.totalLabor)],
  ];

  autoTable(doc, {
    startY: bcvY + 8,
    head: [["Descripcion", "Monto USD", "Peso % s/Directos", "Monto Bs"]],
    body: [
      ...rows.map((r) => [r[0], (r[1] as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), (r[2] as number).toFixed(1) + "%", ((r[1] as number) * data.bcvRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })]),
      ["Costos Directos", directCost.toLocaleString(undefined, { minimumFractionDigits: 2 }), "100.0%", (directCost * data.bcvRate).toLocaleString(undefined, { minimumFractionDigits: 2 })],
      ["Administracion (" + data.adminPercentage.toFixed(1) + "%)", data.totalAdmin.toLocaleString(undefined, { minimumFractionDigits: 2 }), "-", (data.totalAdmin * data.bcvRate).toLocaleString(undefined, { minimumFractionDigits: 2 })],
      ["Utilidad (" + data.profitPercentage.toFixed(1) + "%)", data.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 }), "-", (data.totalProfit * data.bcvRate).toLocaleString(undefined, { minimumFractionDigits: 2 })],
      ["Total $ sin IVA", totalSinIva.toLocaleString(undefined, { minimumFractionDigits: 2 }), "-", (totalSinIva * data.bcvRate).toLocaleString(undefined, { minimumFractionDigits: 2 })],
      ["I.V.A. (" + data.ivaRate + "%)", ivaAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), "-", (ivaAmount * data.bcvRate).toLocaleString(undefined, { minimumFractionDigits: 2 })],
    ],
    foot: [["TOTAL OFERTA", totalOferta.toLocaleString(undefined, { minimumFractionDigits: 2 }), "-", (totalOferta * data.bcvRate).toLocaleString(undefined, { minimumFractionDigits: 2 })]],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 95], halign: "center" },
    footStyles: { fillColor: [250, 204, 21], textColor: [10, 22, 40], fontStyle: "bold", fontSize: 10 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "center" },
      3: { halign: "right" },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Porcentajes de referencia aplicados: % Administracion = " + data.adminPercentage.toFixed(1) + "%  |  % Utilidad e Imprevistos = " + data.profitPercentage.toFixed(1) + "%", 14, finalY);

  const sigY = finalY + 24;
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
  doc.line(14, sigY + 20, 90, sigY + 20);
  doc.text(repPosition || "Cargo / Representante Legal", 14, sigY + 18);
  doc.setFontSize(7);
  doc.text("Cargo / Representante Legal", 14, sigY + 25);
  doc.setFontSize(9);

  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text("Pagina 1 de 1", pageWidth - 20, doc.internal.pageSize.getHeight() - 6);

  return doc;
}