import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateSalesBookPdf(companyName: string, companyRif: string, entries: any[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(companyName, pageWidth / 2, 12, { align: "center" });
  doc.setFontSize(10);
  doc.text("RIF: " + companyRif, pageWidth / 2, 18, { align: "center" });
  doc.setFontSize(12);
  doc.text("LIBRO DE VENTAS IVA", pageWidth / 2, 25, { align: "center" });

  const head = [
    [
      { content: "Ope.\nNº", rowSpan: 2 },
      { content: "Fecha", rowSpan: 2 },
      { content: "RIF\nComprador", rowSpan: 2 },
      { content: "Razon Social", rowSpan: 2 },
      { content: "Tipo\nDoc.", rowSpan: 2 },
      { content: "Nº\nDoc.", rowSpan: 2 },
      { content: "Nº\nControl", rowSpan: 2 },
      { content: "Ventas\nExportacion", rowSpan: 2 },
      { content: "VENTAS INTERNAS", colSpan: 5 },
      { content: "IVA\nRetenido", rowSpan: 2 },
    ],
    [
      "Total c/IVA", "No Gravadas", "Base Imp.", "Alicuota", "Debito Fiscal",
    ],
  ];

  const body = entries.map((e: any) => [
    e.entry_number,
    e.entry_date,
    e.customer_tax_id,
    e.customer_name,
    e.document_type,
    e.invoice_number,
    e.control_number,
    e.is_export ? (e.total_including_vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00",
    (e.total_including_vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
    (e.non_taxable_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
    (e.taxable_base_general || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
    (e.rate_general || 0) + "%",
    (e.fiscal_debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
    (e.withheld_by_customer || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
  ]);

  const totalExport = entries.filter((e: any) => e.is_export).reduce((s: number, e: any) => s + (e.total_including_vat || 0), 0);
  const totalIncluding = entries.reduce((s: number, e: any) => s + (e.total_including_vat || 0), 0);
  const totalNonTaxable = entries.reduce((s: number, e: any) => s + (e.non_taxable_amount || 0), 0);
  const totalBase = entries.reduce((s: number, e: any) => s + (e.taxable_base_general || 0), 0);
  const totalDebit = entries.reduce((s: number, e: any) => s + (e.fiscal_debit || 0), 0);
  const totalWithheld = entries.reduce((s: number, e: any) => s + (e.withheld_by_customer || 0), 0);

  const foot = [[
    { content: "TOTALES", colSpan: 7 },
    totalExport.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    totalIncluding.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    totalNonTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    totalBase.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    "",
    totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }),
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
  doc.text("RESUMEN LIBRO DE VENTAS", 14, finalY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Ventas internas no gravadas: " + totalNonTaxable.toLocaleString(undefined, { minimumFractionDigits: 2 }), 14, finalY + 7);
  doc.text("Ventas de exportacion: " + totalExport.toLocaleString(undefined, { minimumFractionDigits: 2 }), 14, finalY + 13);
  doc.text("Ventas internas gravadas alicuota general: " + totalBase.toLocaleString(undefined, { minimumFractionDigits: 2 }), 14, finalY + 19);
  doc.setFont("helvetica", "bold");
  doc.text("Total Debitos Fiscales: " + totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }), 14, finalY + 27);

  return doc;
}