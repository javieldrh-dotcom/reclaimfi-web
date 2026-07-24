"use client";
import { useState } from "react";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";

interface ReportField { key: string; label: string; type: "text" | "date" | "textarea"; }
interface ReportTemplate { id: string; name: string; description: string; fields: ReportField[]; }

const TEMPLATES: ReportTemplate[] = [
  {
    id: "niea3000-inventario",
    name: "Informe de Aseguramiento NIEA 3000 - Inventario de Bienes",
    description: "Informe del Contador Publico Independiente sobre el inventario de bienes muebles/inmuebles aportados como capital social en la constitucion de una empresa.",
    fields: [
      { key: "companyName", label: "Nombre de la Empresa en Formacion", type: "text" },
      { key: "presentationDate", label: "Fecha de Presentacion del Inventario", type: "date" },
      { key: "assemblyDate", label: "Fecha del Acta de Asamblea", type: "date" },
      { key: "mercantileRegistry", label: "Registro Mercantil (numero/identificacion)", type: "text" },
      { key: "judicialCircumscription", label: "Circunscripcion Judicial del Estado", type: "text" },
      { key: "accountantName", label: "Nombre y Apellido del Contador Publico", type: "text" },
      { key: "cpcNumber", label: "Numero de C.P.C.", type: "text" },
      { key: "city", label: "Ciudad", type: "text" },
      { key: "reportDate", label: "Fecha del Informe", type: "date" },
    ],
  },
];

export default function ProfessionalReportsPage() {
  const theme = getVerticalTheme("accounting");
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  function selectTemplate(t: ReportTemplate) {
    setSelectedTemplate(t);
    setFormData({});
    setMessage("");
  }

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }
  async function generateNiea3000() {
    const d = formData;
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: "INFORME DE ASEGURAMIENTO DEL CONTADOR PUBLICO INDEPENDIENTE", bold: true, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
          new Paragraph({ children: [new TextRun({ text: "Destinatario apropiado" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: (d.companyName || "[NOMBRE DE LA EMPRESA]").toUpperCase(), bold: true })], spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "ALCANCE", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "He (Hemos) sido contratado(s) para informar sobre el inventario de bienes muebles e inmuebles adjunto, que representa el aporte como capital social, realizado por los accionistas de la empresa en formacion " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + " al " + (d.presentationDate || "[FECHA]") + ", segun se evidencia en el acta para la constitucion de la entidad del " + (d.assemblyDate || "[FECHA]") + "." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "RESPONSABILIDAD DE LOS ADMINISTRADORES DE LA EMPRESA EN FORMACION " + (d.companyName || "[NOMBRE]").toUpperCase(), bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Los administradores de la empresa en formacion " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + ", son los responsables de la preparacion y presentacion del inventario de bienes muebles e inmuebles, tomando en consideracion los valores aprobados por los accionistas para conformar su aporte del capital social." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "RESPONSABILIDAD DEL AUDITOR INDEPENDIENTE", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Mi (Nuestra) responsabilidad consiste en expresar una conclusion, sobre la propiedad y existencia de los bienes muebles e inmuebles incluidos en el inventario preparado y presentado por los administradores de la empresa en formacion " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + ", con base en nuestros procedimientos, la cual fue realizada de conformidad con la Norma Internacional para ENCARGOS DE ASEGURAMIENTO, distintos de auditorias y revision de estados financieros, numero 3000 (NIEA 3000)." })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Un encargo de aseguramiento para informar sobre el inventario de bienes muebles e inmuebles aportados por los accionistas de una empresa en formacion como parte del capital social, implica llevar a cabo procedimientos de auditoria para obtener evidencia sobre la propiedad y existencia de los bienes contenidos en el referido inventario. La norma preve que cumpla (cumplamos) con los requerimientos eticos, y que planifiquemos y realicemos nuestros procedimientos para obtener una seguridad razonable de que los bienes aportados existen y son propiedad de los accionistas de la empresa en formacion. Los procedimientos seleccionados dependen del juicio del auditor independiente de la empresa, lo cual incluye la revision de los documentos que demuestran la titularidad de la propiedad de los bienes y la inspeccion fisica para comprobar su existencia." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "CONCLUSION", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Mi (nuestra) opinion se ha formado sobre la base de la evidencia obtenida. Los criterios que utilice (utilizamos) para formar mi (nuestra) opinion son los relacionados con la existencia y propiedad de los bienes muebles e inmuebles incluidos en el inventario al " + (d.presentationDate || "[FECHA]") + ". En mi opinion, respecto a todo lo importante:" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "a) Los bienes muebles e inmuebles que se presentan en el inventario al " + (d.presentationDate || "[FECHA]") + ", existen, y" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "b) Son propiedad de los accionistas de la empresa en formacion, aprobados por ellos, con el fin de conformar su aporte en el capital social de la empresa en formacion " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + "." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "USUARIOS PREVISTOS Y PROPOSITO", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Este informe esta dirigido unicamente para tramitar ante el Registro Mercantil " + (d.mercantileRegistry || "[IDENTIFICAR]") + ", de la Circunscripcion Judicial del Estado " + (d.judicialCircumscription || "[ESTADO]") + ", la constitucion de la empresa " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + "." })], spacing: { after: 500 } }),

          new Paragraph({ children: [new TextRun({ text: "_______________________________" })], spacing: { before: 400 } }),
          new Paragraph({ children: [new TextRun({ text: "Firma del Contador Publico" })] }),
          new Paragraph({ children: [new TextRun({ text: (d.accountantName || "[NOMBRE Y APELLIDOS]") })] }),
          new Paragraph({ children: [new TextRun({ text: "C.P.C. " + (d.cpcNumber || "[NUMERO]") })] }),
          new Paragraph({ children: [new TextRun({ text: (d.city || "[CIUDAD]") + ", " + (d.reportDate || "[FECHA]") })], spacing: { after: 200 } }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "informe-niea3000-" + (d.companyName || "empresa").replace(/\s+/g, "-").toLowerCase() + ".docx");
    setMessage("Informe generado y descargado correctamente.");
  }

  function handleGenerate() {
    if (!selectedTemplate) return;
    if (selectedTemplate.id === "niea3000-inventario") {
      generateNiea3000();
    }
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 18 };

  return (
    <VerticalPageLayout vertical="accounting" title="Certificaciones y Constancias" subtitle="Generador de certificaciones rutinarias con formato NIIF/NIEA - Balance Personal, Certificacion de Ingresos, Inventario de Bienes" fullWidth>
      {!selectedTemplate && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {TEMPLATES.map((t) => (
            <div key={t.id} onClick={() => selectTemplate(t)} style={{ ...theme.cardStyle, cursor: "pointer", border: "2px solid " + theme.accent + "40" }}>
              <p style={{ fontWeight: 700, fontSize: 20, color: theme.accent }}>{t.name}</p>
              <p style={{ marginTop: 10, fontSize: 15, color: "#8B93A7", lineHeight: 1.6 }}>{t.description}</p>
            </div>
          ))}
          <div style={{ ...theme.cardStyle, opacity: 0.5, border: "1px dashed #1F2937" }}>
            <p style={{ fontWeight: 700, fontSize: 20, color: "#8B93A7" }}>Balance Personal</p>
            <p style={{ marginTop: 10, fontSize: 15, color: "#8B93A7" }}>Proximamente - pendiente de plantilla</p>
          </div>
          <div style={{ ...theme.cardStyle, opacity: 0.5, border: "1px dashed #1F2937" }}>
            <p style={{ fontWeight: 700, fontSize: 20, color: "#8B93A7" }}>Certificacion de Ingresos</p>
            <p style={{ marginTop: 10, fontSize: 15, color: "#8B93A7" }}>Proximamente - pendiente de plantilla</p>
          </div>
        </div>
      )}

      {selectedTemplate && (
        <div style={{ maxWidth: 700 }}>
          <button onClick={() => setSelectedTemplate(null)} style={{ background: "none", border: "1px solid #1F2937", color: "#8B93A7", padding: "6px 16px", borderRadius: 8, fontSize: 14, cursor: "pointer", marginBottom: 20 }}>
            ← Volver al catalogo
          </button>
          <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>{selectedTemplate.name}</h2>
          <p style={{ fontSize: 15, color: "#8B93A7", marginTop: 6 }}>{selectedTemplate.description}</p>

          <div style={{ marginTop: 20 }}>
            {selectedTemplate.fields.map((field) => (
              <div key={field.key} style={{ marginTop: 12 }}>
                <label style={{ fontSize: 15, color: theme.accent, fontWeight: 700, display: "block", marginBottom: 6 }}>{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea value={formData[field.key] ?? ""} onChange={(e) => updateField(field.key, e.target.value)} rows={3} style={{ ...inputStyle, width: "100%" }} />
                ) : (
                  <input type={field.type} value={formData[field.key] ?? ""} onChange={(e) => updateField(field.key, e.target.value)} style={{ ...inputStyle, width: "100%" }} />
                )}
              </div>
            ))}
          </div>

          <button onClick={handleGenerate} style={{ ...theme.buttonStyle, marginTop: 24, fontSize: 18 }}>
            GENERAR Y DESCARGAR INFORME
          </button>
          {message && <p style={{ marginTop: 12, fontSize: 16, color: theme.accent }}>{message}</p>}
        </div>
      )}
    </VerticalPageLayout>
  );
}
