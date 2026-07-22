import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generatePurchaseBookPdf(companyName: string, companyRif: string, entries: any[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, 12, { align: "center" });
  doc.setFontSize(10);
  doc.text("RIF: " + companyRif, pageWidth / 2, 18, { align: "center" });
  doc.setFontSize(12);
  doc.text("LIBRO DE COMPRAS IVA", pageWidth / 2, 25, { align: "center" });

  const head = [
    [
      { content: "Ope.\nNº", rowSpan: 2 },
      { content: "Fecha", rowSpan: 2 },
      { content: "RIF\nVendedor", rowSpan: 2 },
      { content: "Razon Social", rowSpan: 2 },
      { content: "Tipo\nDoc.", rowSpan: 2 },
      { content: "Nº\nDoc.", rowSpan: 2 },
      { content: "Nº\nControl", rowSpan: 2 },
      { content: "COMPRAS IMPORTACION", colSpan: 3 },
      { content: "COMPRAS INTERNAS", colSpan: 5 },
      { content: "RETENCION", colSpan: 2 },
    ],
    [
      "Base Imp.", "Alicuota", "Impuesto",
      "No Gravada", "Base Imp.", "Alicuota", "IVA", "Total c/IVA",
      "Nº Comprob.", "Monto",
    ],
  ];

  const body = entries.map((e: any) => [
    e.entry_number,
    e.entry_date,
    e.vendor_tax_id,
    e.vendor_name,
    e.document_type,
    e.invoice_number,
    e.control_number,
    (e.import_taxable_base || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
    (e.import_rate || 0) + "%",
    (e.import_tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
    (e.non_taxable_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
    (e.taxable_base_general || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
    (e.rate_general || 0) + "%",
    (e.fiscal_credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
    (e.total_document_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
    e.withholding_receipt_number || "-",
    (e.withheld_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
  ]);

  const totalImportBase = entries.reduce((s: number, e: any) => s + (e.import_taxable_base || 0), 0);
  const totalImportTax = entries.reduce((s: number, e: any) => s + (e.import_tax || 0), 0);
  const totalNonTaxable = entries.reduce((s: number, e: any) => s + (e.non_taxable_amount || 0), 0);
  const totalBase = entries.reduce((s: number, e: any) => s + (e.taxable_base_general || 0), 0);
  const totalCredit = entries.reduce((s: number, e: any) => s + (e.fiscal_credit || 0), 0);
  const totalDoc = entries.reduce((s: number, e: any) => s + (e.total_document_amount || 0), 0);
  const totalWithheld = entries.reduce((s: number, e: any) => s + (e.withheld_amount || 0), 0);

  const foot = [[
    { content: "TOTALES", colSpan: 7 },
    totalImportBase.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    "",
    totalImportTax.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    totalNonTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    totalBase.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    "",
    totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    totalDoc.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    "",
    totalWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 }),
  ]];

  autoTable(doc, {
    head,
    body,
    foot,
    startY: 30,
    theme: "grid",
    styles: { fontSize: 6.5, cellPadding: 1.5, halign: "center" },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 6.5 },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    columnStyles: { 3: { halign: "left" } },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMEN LIBRO DE COMPRAS", 14, finalY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Compras no gravadas o sin derecho a C.F.: " + totalNonTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 }), 14, finalY + 7);
  doc.text("Importaciones gravadas alicuota general: " + totalImportBase.toLocaleString(undefined, { minimumFractionDigits: 2 }), 14, finalY + 13);
  doc.text("Compras internas gravadas alicuota general: " + totalBase.toLocaleString(undefined, { minimumFractionDigits: 2 }), 14, finalY + 19);
  doc.setFont("helvetica", "bold");
  doc.text("Total Creditos Fiscales: " + (totalCredit + totalImportTax).toLocaleString(undefined, { minimumFractionDigits: 2 }), 14, finalY + 27);

  return doc;
}