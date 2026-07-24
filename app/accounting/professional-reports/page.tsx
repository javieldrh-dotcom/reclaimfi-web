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
    id: "carta-convenio-niea3000",
    name: "Carta Convenio - Encargo de Aseguramiento NIEA 3000",
    description: "Carta de compromiso que confirma el entendimiento de terminos y objetivos de un encargo de aseguramiento antes de iniciarlo (Anexo 1, NIEA 3000).",
    fields: [
      { key: "letterDate", label: "Fecha de la Carta", type: "date" },
      { key: "clientCompanyName", label: "Nombre de la Empresa Cliente", type: "text" },
      { key: "infoName", label: "Nombre de la Informacion a Revisar", type: "text" },
      { key: "infoDescription", label: "Breve Descripcion de la Informacion a Revisar", type: "textarea" },
      { key: "cutoffDate", label: "Fecha de Corte (ej. 31 de diciembre de 2025)", type: "text" },
      { key: "assuranceLevel", label: "Nivel de Seguridad (Razonable o Limitada)", type: "text" },
      { key: "criteria", label: "Detalle del Criterio a Utilizar", type: "textarea" },
      { key: "usersIdentified", label: "Usuarios de la Informacion", type: "text" },
      { key: "purpose", label: "Proposito de la Informacion", type: "textarea" },
      { key: "procedures", label: "Detalle de los Procedimientos a Realizar", type: "textarea" },
      { key: "specificRisk", label: "Riesgo Especifico a Mencionar", type: "text" },
      { key: "assertion", label: "Aseveracion a Nombrar", type: "text" },
      { key: "firmName", label: "Razon Social de la Firma", type: "text" },
      { key: "professionalName", label: "Nombre del Profesional", type: "text" },
      { key: "clientNameCargo", label: "Nombre y Cargo de Quien Acusa Recibo", type: "text" },
    ],
  },
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
  async function generateCartaConvenio() {
    const d = formData;
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: (d.letterDate || "[FECHA]") })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Al Consejo de Directores u otros representantes apropiados del cliente que contrato al contador publico" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "De la empresa " + (d.clientCompanyName || "[EMPRESA]"), bold: true })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Esta carta es para confirmar nuestro entendimiento de los terminos y objetivos de nuestro encargo, asi como la naturaleza y limitaciones de los servicios que proporcionaremos." })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Llevaremos a cabo los siguientes servicios:" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Revisaremos el reporte de la Compania " + (d.clientCompanyName || "[EMPRESA]") + ", referido a " + (d.infoDescription || "[DESCRIPCION]") + ", al " + (d.cutoffDate || "[FECHA DE CORTE]") + ", expresaremos una conclusion de seguridad " + (d.assuranceLevel || "[razonable/limitada]") + " sobre si la informacion a ser revisada esta preparada y presentada razonablemente de acuerdo con " + (d.criteria || "[CRITERIO]") + "." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Usuarios de " + (d.infoName || "[INFORMACION]") + " y nuestro reporte relacionado", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "La Compania confirma que los usuarios de la informacion a revisar y de nuestro reporte a emitir son " + (d.usersIdentified || "[USUARIOS]") + " para el siguiente proposito: " + (d.purpose || "[PROPOSITO]") + "." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Responsabilidades del Contador Publico", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Llevaremos a cabo nuestro compromiso de acuerdo con la Norma Internacional sobre ENCARGOS DE ASEGURAMIENTO 3000 (NIEA 3000). Esta norma requiere que cumplamos con los requisitos de las partes A y B del Codigo de Etica para Contadores Profesionales, incluida la independencia, y que planifiquemos y realicemos nuestro compromiso para obtener una seguridad " + (d.assuranceLevel || "[razonable/limitada]") + " sobre si " + (d.infoName || "[INFORMACION]") + " esta preparada de conformidad con los criterios establecidos." })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Los procedimientos a realizar incluyen: " + (d.procedures || "[PROCEDIMIENTOS]") + "." })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Nuestro aseguramiento esta planificado para obtener una seguridad " + (d.assuranceLevel || "[razonable/limitada]") + ", pero no absoluta, sobre si " + (d.infoName || "[INFORMACION]") + " esta libre de " + (d.specificRisk || "[RIESGO]") + " debido a error o fraude." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Responsabilidades de la Gerencia", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Nuestro encargo sera ejecutado sobre la base de que la Compania entiende y acuerda su responsabilidad sobre la preparacion y presentacion razonable de " + (d.assertion || "[ASEVERACION]") + "; diseno, implementacion y eficacia de los controles internos; prevencion y deteccion del fraude; y acceso ilimitado a la informacion y personal necesarios para nuestros procedimientos." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Honorarios Profesionales", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Nuestros honorarios, que seran facturados conforme el encargo progrese, se basan en el tiempo requerido por las personas asignadas al encargo, mas gastos directos." })], spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "Favor de firmar y regresar la copia anexa a esta carta, para confirmar su conformidad con el entendimiento de los terminos del encargo." })], spacing: { after: 400 } }),

          new Paragraph({ children: [new TextRun({ text: (d.firmName || "[RAZON SOCIAL DE LA FIRMA]"), bold: true })], spacing: { before: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Firma autografa" })] }),
          new Paragraph({ children: [new TextRun({ text: (d.professionalName || "[NOMBRE DEL PROFESIONAL]") })], spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "Acuse de recibo a nombre del cliente:", bold: true })], spacing: { before: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "(Firma) " + (d.clientNameCargo || "[NOMBRE Y CARGO]") })] }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "carta-convenio-" + (d.clientCompanyName || "cliente").replace(/\s+/g, "-").toLowerCase() + ".docx");
    setMessage("Carta convenio generada y descargada correctamente.");
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
    if (selectedTemplate.id === "carta-convenio-niea3000") {
      generateCartaConvenio();
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
