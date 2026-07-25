import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateInventoryKardexPdf(companyName: string, itemName: string, sku: string, movements: any[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, 12, { align: "center" });
  doc.setFontSize(12);
  doc.text("KARDEX DE INVENTARIO - " + sku + " - " + itemName, pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(9);
  doc.text("Valuacion por Promedio Ponderado (NIC 2)", pageWidth / 2, 26, { align: "center" });

  const head = [["Fecha", "Tipo", "Cantidad", "Costo Unitario", "Saldo", "Costo Promedio"]];
  const body = movements.map((m: any) => [
    m.movement_date,
    m.movement_type === "IN" ? "Entrada" : "Salida",
    m.quantity?.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    m.unit_cost?.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    m.resulting_quantity?.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    m.resulting_avg_cost?.toLocaleString(undefined, { minimumFractionDigits: 2 }),
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 32,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
  });

  return doc;
}