import jsPDF from "jspdf";

interface MaterialItem { description: string; unit: string; quantity: number; unitCost: number; }
interface EquipmentItem { description: string; unit: string; quantity: number; unitCost: number; }
interface LaborItem { positionName: string; quantity: number; days: number; dailyRate: number; fsclFactor: number; }

interface PartidaDetail {
  itemNumber: number;
  description: string;
  unit: string;
  quantity: number;
  adminPercentage: number;
  profitPercentage: number;
  materials: MaterialItem[];
  equipment: EquipmentItem[];
  labor: LaborItem[];
}

export function generateApuOfferPdf(
  procedureNumber: string,
  projectDescription: string,
  companyName: string,
  partidas: PartidaDetail[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(companyName || "Empresa", pageWidth / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(12);
  doc.text("ANALISIS DE PRECIOS UNITARIOS - " + procedureNumber, pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(projectDescription, pageWidth / 2, y, { align: "center", maxWidth: pageWidth - 30 });
  y += 5;
  doc.text("Al " + new Date().toLocaleDateString(), pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 12;

  let grandTotal = 0;
  partidas.forEach((p) => {
    if (y > 250) { doc.addPage(); y = 20; }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(20, 30, 45);
    doc.rect(15, y - 5, pageWidth - 30, 8, "F");
    doc.text("Partida " + p.itemNumber + ": " + p.description + " (" + p.quantity + " " + p.unit + ")", 17, y);
    y += 10;

    let materialsCost = 0, equipmentCost = 0, laborCost = 0;

    if (p.materials.length > 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Materiales", 15, y);
      doc.text("Cant.", pageWidth - 80, y, { align: "right" });
      doc.text("C.Unit.", pageWidth - 45, y, { align: "right" });
      doc.text("Total", pageWidth - 20, y, { align: "right" });
      y += 5;
      doc.setFont("helvetica", "normal");
      p.materials.forEach((m) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const lineTotal = m.quantity * m.unitCost;
        materialsCost += lineTotal;
        doc.text(m.description, 15, y, { maxWidth: pageWidth - 100 });
        doc.text(m.quantity.toString(), pageWidth - 80, y, { align: "right" });
        doc.text(m.unitCost.toLocaleString(), pageWidth - 45, y, { align: "right" });
        doc.text(lineTotal.toLocaleString(), pageWidth - 20, y, { align: "right" });
        y += 5;
      });
      y += 2;
    }

    if (p.equipment.length > 0) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Equipos", 15, y);
      doc.text("Cant.", pageWidth - 80, y, { align: "right" });
      doc.text("C.Unit.", pageWidth - 45, y, { align: "right" });
      doc.text("Total", pageWidth - 20, y, { align: "right" });
      y += 5;
      doc.setFont("helvetica", "normal");
      p.equipment.forEach((eq) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const lineTotal = eq.quantity * eq.unitCost;
        equipmentCost += lineTotal;
        doc.text(eq.description, 15, y, { maxWidth: pageWidth - 100 });
        doc.text(eq.quantity.toString(), pageWidth - 80, y, { align: "right" });
        doc.text(eq.unitCost.toLocaleString(), pageWidth - 45, y, { align: "right" });
        doc.text(lineTotal.toLocaleString(), pageWidth - 20, y, { align: "right" });
        y += 5;
      });
      y += 2;
    }

    if (p.labor.length > 0) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Labor Directa", 15, y);
      doc.text("Dias", pageWidth - 90, y, { align: "right" });
      doc.text("Tarifa", pageWidth - 55, y, { align: "right" });
      doc.text("Total", pageWidth - 20, y, { align: "right" });
      y += 5;
      doc.setFont("helvetica", "normal");
      p.labor.forEach((l) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const lineTotal = l.quantity * l.days * l.dailyRate * l.fsclFactor;
        laborCost += lineTotal;
        const label = l.positionName + (l.fsclFactor !== 1 ? " (FSCL x" + l.fsclFactor.toFixed(2) + ")" : "");
        doc.text(label, 15, y, { maxWidth: pageWidth - 110 });
        doc.text(l.days.toString(), pageWidth - 90, y, { align: "right" });
        doc.text(l.dailyRate.toLocaleString(), pageWidth - 55, y, { align: "right" });
        doc.text(lineTotal.toLocaleString(), pageWidth - 20, y, { align: "right" });
        y += 5;
      });
      y += 2;
    }

    const directCost = materialsCost + equipmentCost + laborCost;
    const admin = directCost * (p.adminPercentage / 100);
    const profit = directCost * (p.profitPercentage / 100);
    const unitPrice = directCost + admin + profit;
    const total = unitPrice * p.quantity;
    grandTotal += total;

    doc.setDrawColor(220);
    doc.line(15, y, pageWidth - 15, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Costo Directo: " + directCost.toLocaleString(), 15, y);
    y += 5;
    doc.text("+ Administracion (" + p.adminPercentage + "%): " + admin.toLocaleString(), 15, y);
    y += 5;
    doc.text("+ Utilidad (" + p.profitPercentage + "%): " + profit.toLocaleString(), 15, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Precio Unitario: " + unitPrice.toLocaleString(), 15, y);
    doc.text("Total: " + total.toLocaleString(), pageWidth - 20, y, { align: "right" });
    y += 14;
  });

  if (y > 260) { doc.addPage(); y = 20; }
  doc.setDrawColor(150);
  doc.line(15, y, pageWidth - 15, y);
  y += 8;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL DE LA OFERTA: " + grandTotal.toLocaleString(), 15, y);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Documento generado conforme a estructura de costos APU. Pagina " + i + " de " + pageCount, pageWidth / 2, 290, { align: "center" });
  }

  return doc;
}
