"use client";
import { useState } from "react";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { saveAs } from "file-saver";

interface ReportField { key: string; label: string; type: "text" | "date" | "textarea"; }
interface ReportTemplate { id: string; name: string; description: string; fields: ReportField[]; }

const TEMPLATES: ReportTemplate[] = [
  {
    id: "estructura-costos-sundde",
    name: "Informe NIEA 3000 - Estructura de Costos (Ley Organica de Precios Justos)",
    description: "Informe del Contador Publico Independiente sobre la Estructura de Costos de un producto, para consignar ante SUNDDE conforme a la Ley Organica de Precios Justos.",
    fields: [
      { key: "companyName", label: "Nombre de la Empresa", type: "text" },
      { key: "productName", label: "Nombre del Producto", type: "text" },
      { key: "period", label: "Periodo/Mes de la Estructura de Costos (ej. diciembre 2017)", type: "text" },
      { key: "accountantName", label: "Nombre y Apellido del Contador Publico", type: "text" },
      { key: "cpcNumber", label: "Numero de C.P.C.", type: "text" },
      { key: "city", label: "Ciudad", type: "text" },
      { key: "reportDate", label: "Fecha del Informe", type: "date" },
    ],
  },
  {
    id: "niea3000-aumento-capital",
    name: "Informe NIEA 3000 - Inventario de Bienes para Aumento de Capital",
    description: "Informe del Contador Publico Independiente sobre el inventario de bienes inmuebles aportados por un accionista para aumentar el capital social de una empresa ya constituida.",
    fields: [
      { key: "companyName", label: "Nombre de la Empresa", type: "text" },
      { key: "shareholderName", label: "Nombre del Accionista que Aporta", type: "text" },
      { key: "shareholderCedula", label: "Cedula del Accionista", type: "text" },
      { key: "currency", label: "Moneda de Expresion (ej. Bolivares, USD)", type: "text" },
      { key: "terrenosAmount", label: "Monto Total - Terrenos", type: "text" },
      { key: "edificacionesAmount", label: "Monto Total - Edificaciones", type: "text" },
      { key: "terrenoDescription", label: "Nota 2 - Descripcion Completa del Terreno (ubicacion, registro, tomo, folio)", type: "textarea" },
      { key: "edificacionDescription", label: "Nota 3 - Descripcion Completa de la Edificacion (ubicacion, registro, tomo, folio)", type: "textarea" },
      { key: "sharesAcquired", label: "Numero de Acciones Adquiridas", type: "text" },
      { key: "shareNominalValue", label: "Valor Nominal por Accion", type: "text" },
      { key: "presentationDate", label: "Fecha de Presentacion del Inventario", type: "date" },
      { key: "assemblyDate", label: "Fecha de la Asamblea Extraordinaria", type: "date" },
      { key: "mercantileRegistry", label: "Registro Mercantil (numero/identificacion)", type: "text" },
      { key: "judicialCircumscription", label: "Circunscripcion Judicial del Estado", type: "text" },
      { key: "accountantName", label: "Nombre y Apellido del Contador Publico", type: "text" },
      { key: "cpcNumber", label: "Numero de C.P.C.", type: "text" },
      { key: "city", label: "Ciudad", type: "text" },
      { key: "reportDate", label: "Fecha del Informe", type: "date" },
    ],
  },
  {
    id: "certificacion-ingresos-limitada",
    name: "Certificacion de Ingresos (Seguridad Limitada)",
    description: "Informe de aseguramiento con seguridad limitada (expresion negativa) sobre la relacion de ingresos de una persona natural, usualmente para tramites de credito bancario.",
    fields: [
      { key: "personName", label: "Nombre Completo de la Persona", type: "text" },
      { key: "cedula", label: "Cedula de Identidad", type: "text" },
      { key: "periodStart", label: "Fecha de Inicio del Periodo", type: "date" },
      { key: "periodEnd", label: "Fecha de Fin del Periodo", type: "date" },
      { key: "profession", label: "Profesion / Actividad Ejercida", type: "text" },
      { key: "addressee", label: "A quien se dirige el informe (ej. Banco XYZ)", type: "text" },
      { key: "purpose", label: "Proposito del Informe (ej. tramitar credito bancario)", type: "textarea" },
      { key: "accountantName", label: "Nombre y Apellidos del Contador Publico", type: "text" },
      { key: "cpcNumber", label: "Numero de C.P.C.", type: "text" },
      { key: "city", label: "Ciudad", type: "text" },
      { key: "reportDate", label: "Fecha del Informe", type: "date" },
    ],
  },
  {
    id: "certificacion-ingresos",
    name: "Certificacion de Ingresos (Seguridad Razonable)",
    description: "Informe de aseguramiento con seguridad razonable sobre la relacion de ingresos de una persona natural en el libre ejercicio de su profesion, usualmente para tramites de credito bancario.",
    fields: [
      { key: "personName", label: "Nombre Completo de la Persona", type: "text" },
      { key: "cedula", label: "Cedula de Identidad", type: "text" },
      { key: "periodStart", label: "Fecha de Inicio del Periodo", type: "date" },
      { key: "periodEnd", label: "Fecha de Fin del Periodo", type: "date" },
      { key: "profession", label: "Profesion / Actividad Ejercida", type: "text" },
      { key: "addressee", label: "A quien se dirige el informe (ej. Banco XYZ)", type: "text" },
      { key: "purpose", label: "Proposito del Informe (ej. tramitar credito bancario)", type: "textarea" },
      { key: "accountantName", label: "Nombre y Apellidos del Contador Publico", type: "text" },
      { key: "cpcNumber", label: "Numero de C.P.C.", type: "text" },
      { key: "city", label: "Ciudad", type: "text" },
      { key: "reportDate", label: "Fecha del Informe", type: "date" },
    ],
  },
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
  function cell(text: string, bold = false) {
    return new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
      width: { size: 33, type: WidthType.PERCENTAGE },
    });
  }

  async function generateNotasInventario() {
    const d = formData;
    const terrenos = parseFloat((d.terrenosAmount || "0").replace(/,/g, "")) || 0;
    const edificaciones = parseFloat((d.edificacionesAmount || "0").replace(/,/g, "")) || 0;
    const total = terrenos + edificaciones;

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: (d.companyName || "[EMPRESA]").toUpperCase(), bold: true, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "NOTAS AL INVENTARIO DE BIENES INMUEBLES APORTADO POR LOS ACCIONISTAS COMO PARTE DEL CAPITAL SOCIAL", bold: true, size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Al " + (d.presentationDate || "[FECHA]") })], alignment: AlignmentType.CENTER, spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: "(Expresado en " + (d.currency || "Bolivares") + ")" })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "Los principios y practicas contables mas significativas para la preparacion del INVENTARIO DE BIENES INMUEBLES APORTADO POR LOS ACCIONISTAS PARA AUMENTAR EL CAPITAL SOCIAL al " + (d.presentationDate || "[FECHA]") + ", se describen a continuacion:" })], spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "NOTA 1 - BASES DE PREPARACION Y POLITICAS CONTABLES", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Los accionistas de la empresa " + (d.companyName || "[EMPRESA]") + " han decidido aumentar su capital social, mediante el aporte de los bienes incluidos en el Inventario de bienes inmuebles presentado. Los valores de los bienes incluidos en el inventario de bienes inmuebles seran aprobados por los accionistas en la asamblea general extraordinaria de la empresa " + (d.companyName || "[EMPRESA]") + " y para la preparacion y presentacion de estos valores se tomaron en cuenta los principios de contabilidad generalmente aceptados en Venezuela, VEN NIF PYME." })], spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "NOTA 2: TERRENOS", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: d.terrenoDescription || "[DESCRIPCION DEL TERRENO]" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "TOTAL TERRENOS: Bs. " + terrenos.toLocaleString(undefined, { minimumFractionDigits: 2 }), bold: true })], spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "NOTA 3: EDIFICACIONES", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: d.edificacionDescription || "[DESCRIPCION DE LA EDIFICACION]" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "TOTAL EDIFICACIONES: Bs. " + edificaciones.toLocaleString(undefined, { minimumFractionDigits: 2 }), bold: true })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "TOTAL INVENTARIO INMUEBLES PARA AUMENTO: Bs. " + total.toLocaleString(undefined, { minimumFractionDigits: 2 }), bold: true })], spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "Los inmuebles anteriormente señalados constituyen el aporte del socio " + (d.shareholderName || "[ACCIONISTA]") + " de la empresa " + (d.companyName || "[EMPRESA]") + " de la siguiente forma: Adquisicion de " + (d.sharesAcquired || "[NUMERO]") + " nuevas acciones por un valor nominal de Bs. " + (d.shareNominalValue || "[VALOR]") + " cada una, las cuales quedan totalmente suscritas y pagadas tal como se indica, con el aporte relacionado en el \"INVENTARIO DE BIENES INMUEBLES APORTADO POR LOS ACCIONISTAS PARA AUMENTAR EL CAPITAL SOCIAL\" al " + (d.presentationDate || "[FECHA]") + " por Bs. " + total.toLocaleString(undefined, { minimumFractionDigits: 2 }) + "." })], spacing: { after: 300 } }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "notas-inventario-" + (d.companyName || "empresa").replace(/\s+/g, "-").toLowerCase() + ".docx");
    setMessage("Notas al inventario generadas y descargadas correctamente.");
  }

  async function generateInventarioAnexo() {
    const d = formData;
    const terrenos = parseFloat((d.terrenosAmount || "0").replace(/,/g, "")) || 0;
    const edificaciones = parseFloat((d.edificacionesAmount || "0").replace(/,/g, "")) || 0;
    const total = terrenos + edificaciones;

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: "INVENTARIO DE BIENES INMUEBLES APORTADO POR LOS ACCIONISTAS COMO PARTE DEL CAPITAL SOCIAL", bold: true, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Al " + (d.presentationDate || "[FECHA]") })], alignment: AlignmentType.CENTER, spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: "(Expresado en " + (d.currency || "Bolivares") + ")" })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [cell("Descripcion", true), cell("Notas", true), cell("Monto en " + (d.currency || "Bs"), true)] }),
              new TableRow({ children: [cell("BIENES INMUEBLES:", true), cell(""), cell("")] }),
              new TableRow({ children: [cell("Terrenos"), cell("2"), cell(terrenos.toLocaleString(undefined, { minimumFractionDigits: 2 }))] }),
              new TableRow({ children: [cell("Edificaciones"), cell("3"), cell(edificaciones.toLocaleString(undefined, { minimumFractionDigits: 2 }))] }),
              new TableRow({ children: [cell("TOTAL BIENES INMUEBLES", true), cell(""), cell(total.toLocaleString(undefined, { minimumFractionDigits: 2 }), true)] }),
            ],
          }),

          new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 400 } }),
          new Paragraph({ children: [new TextRun({ text: "_______________________________" })], spacing: { before: 300 } }),
          new Paragraph({ children: [new TextRun({ text: "Nombre y firma Responsable Informacion (Cliente)" })] }),
          new Paragraph({ children: [new TextRun({ text: (d.shareholderName || "[NOMBRE]") + " - C.I N° V-" + (d.shareholderCedula || "[CEDULA]") })], spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "Las notas anexas son parte integral del inventario de bienes inmuebles aportado por los accionistas de la empresa " + (d.companyName || "[EMPRESA]") + ", como aporte del aumento del capital social de la empresa.", italics: true, size: 20 })], spacing: { before: 200, after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "VER INFORME DE ASEGURAMIENTO DEL CONTADOR PUBLICO INDEPENDIENTE", bold: true })], spacing: { before: 200, after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Hago constar que cada uno de los inmuebles detallados en esta relacion, provienen de actividades legitimas y de comprobable licito comercio." })], spacing: { after: 200 } }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "anexo-inventario-bienes-" + (d.companyName || "empresa").replace(/\s+/g, "-").toLowerCase() + ".docx");
    setMessage("Anexo de inventario generado y descargado correctamente.");
  }

  async function generateEstructuraCostos() {
    const d = formData;
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: "INFORME DE ASEGURAMIENTO DEL CONTADOR PUBLICO INDEPENDIENTE", bold: true, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
          new Paragraph({ children: [new TextRun({ text: "Destinatario apropiado" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: (d.companyName || "[NOMBRE DE LA EMPRESA]").toUpperCase(), bold: true })], spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "ALCANCE", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "He (Hemos) sido contratado(s) para asegurar sobre la Estructura de Costos del Producto \"" + (d.productName || "[PRODUCTO]") + "\" de la compania " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + " elaborada por la entidad para el " + (d.period || "[PERIODO]") + ", con el objeto de cumplir con las disposiciones de la Ley Organica de Precios Justos (2015) y sus respectivas providencias administrativas." })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "De acuerdo con el articulo 31 de la Ley Organica de Precios Justos (2015), toda empresa que produzca bienes o preste servicios en el pais podra imputar sobre su estructura de costos un 30% de ganancia. Por tal motivo, la compania " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + " ha preparado la estructura de costos de su producto \"" + (d.productName || "[PRODUCTO]") + "\" que se adjunta en el informe." })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Mi (nuestro) informe esta dirigido a opinar sobre los siguientes:" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "- Si el diseño de la estructura de costo del producto esta acorde al proceso productivo de la entidad." })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: "- Si los calculos mostrados en la estructura de costos del producto fueron realizados de acuerdo a la Ley Organica de Precios Justos (2015) y sus respectivas providencias administrativas." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "RESPONSABILIDAD DE LOS ADMINISTRADORES DE LA EMPRESA " + (d.companyName || "[NOMBRE]").toUpperCase(), bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Los administradores de la compania " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + ", son los responsables de la preparacion y presentacion de la estructura de costos de su producto \"" + (d.productName || "[PRODUCTO]") + "\", y que dicha informacion no contenga errores materiales. Su responsabilidad incluye el diseño, implementacion y eficacia de los controles internos relevantes, y asegurar que la compania cumpla con los lineamientos de la Ley Organica de Precios Justos (2015) y sus respectivas providencias administrativas." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "RESPONSABILIDAD DEL CONTADOR PUBLICO INDEPENDIENTE", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Mi (Nuestra) responsabilidad consiste en examinar la estructura de costos de su producto \"" + (d.productName || "[PRODUCTO]") + "\" y reportar una conclusion basado en la evidencia obtenida. Realice mi revision de conformidad con la Norma Internacional para ENCARGOS DE ASEGURAMIENTO, distintos de auditorias y revision de estados financieros, numero 3000 (NIEA 3000), emitida por la Federacion Internacional de Contadores Publicos (IFAC). La norma preve que cumpla (cumplamos) con los requerimientos eticos e independencia pertinentes, y que planifiquemos y realicemos nuestros procedimientos para obtener una seguridad razonable de que la estructura de costos del producto \"" + (d.productName || "[PRODUCTO]") + "\" de la compania " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + " ha sido preparada de acuerdo con los lineamientos de la Ley Organica de Precios Justos (2015) y sus respectivas providencias administrativas, en todos los aspectos materiales." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "PROCEDIMIENTOS REALIZADOS", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Los procedimientos seleccionados dependen del juicio del contador, incluyendo la evaluacion de los riesgos de errores significativos en la estructura de costos del producto debido a fraude o error. El encargo tambien incluye evaluar lo apropiado en cuanto a la factibilidad del criterio usado por la compania " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + " para la preparacion y presentacion de la estructura de costos, obteniendo un entendimiento de la informacion financiera y no financiera utilizada en el reporte, indagando con la gerencia los metodos de determinacion de los costos de produccion, gastos ajenos a la produccion y margen de ganancia del producto." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "CONCLUSION", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Mi (nuestra) opinion se ha formado sobre la base de la evidencia obtenida. En mi opinion, respecto a todo lo importante:" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "a) El diseño de la estructura de costo del producto esta acorde al proceso productivo de la entidad, y" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "b) Los calculos mostrados en la estructura de costos del producto son razonables y fueron realizados de acuerdo a la Ley Organica de Precios Justos (2015) y sus respectivas providencias administrativas." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "USUARIOS PREVISTOS Y PROPOSITO", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Este informe esta dirigido unicamente para consignar ante la Superintendencia Nacional para la Defensa de los Derechos Socioeconomicos (SUNDDE), la Estructura de Costos del Producto \"" + (d.productName || "[PRODUCTO]") + "\" como deber formal establecido en la Ley Organica de Precios Justos (2015) y sus respectivas providencias administrativas." })], spacing: { after: 500 } }),

          new Paragraph({ children: [new TextRun({ text: "_______________________________" })], spacing: { before: 400 } }),
          new Paragraph({ children: [new TextRun({ text: "Firma del Contador Publico" })] }),
          new Paragraph({ children: [new TextRun({ text: (d.accountantName || "[NOMBRE Y APELLIDOS]") })] }),
          new Paragraph({ children: [new TextRun({ text: "C.P.C. " + (d.cpcNumber || "[NUMERO]") })] }),
          new Paragraph({ children: [new TextRun({ text: (d.city || "[CIUDAD]") + ", " + (d.reportDate || "[FECHA]") })], spacing: { after: 200 } }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "estructura-costos-" + (d.companyName || "empresa").replace(/\s+/g, "-").toLowerCase() + ".docx");
    setMessage("Informe de estructura de costos generado y descargado correctamente.");
  }

  async function generateAumentoCapital() {
    const d = formData;
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: "INFORME DE ASEGURAMIENTO DEL CONTADOR PUBLICO INDEPENDIENTE", bold: true, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
          new Paragraph({ children: [new TextRun({ text: "A los Señores Accionistas y a la Junta Directiva" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: (d.companyName || "[NOMBRE DE LA EMPRESA]").toUpperCase(), bold: true })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: (d.city || "[CIUDAD]") + ". -" })], spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "ALCANCE", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "He sido contratado(a) para examinar e informar sobre el Inventario de Bienes Inmuebles que se adjunta, como aporte de los accionistas de la empresa " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + ", al " + (d.presentationDate || "[FECHA]") + ", destinado a aumentar el Capital Social segun convocatoria realizada para una asamblea extraordinaria de accionistas en fecha " + (d.assemblyDate || "[FECHA]") + "." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "RESPONSABILIDAD DE LOS ADMINISTRADORES DE LA EMPRESA", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Los administradores de la empresa " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + ", son los responsables de la preparacion y presentacion del inventario de bienes inmuebles aportado por el accionista " + (d.shareholderName || "[ACCIONISTA]") + " para aumentar el capital social, tomando en consideracion los valores aprobados por los accionistas." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "RESPONSABILIDAD DEL CONTADOR PUBLICO INDEPENDIENTE", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Mi responsabilidad consiste en expresar una conclusion, sobre la propiedad y existencia de los bienes inmuebles incluidos en el inventario preparado y presentado por los administradores de la empresa " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + " con base en mis procedimientos, los cuales fueron realizados de conformidad con la Norma Internacional para Encargos de Aseguramiento, distintos de auditorias y revision de estados financieros, numero 3000 (NIEA 3000)." })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Un encargo de aseguramiento para informar sobre el inventario de bienes inmuebles aportados por los accionistas de una empresa constituida, como aporte para el aumento del capital social, implica llevar a cabo procedimientos de auditoria para obtener evidencia sobre la propiedad y existencia de los bienes contenidos en el referido inventario. La norma preve que cumpla con los requerimientos eticos, y que planifique y realice mis procedimientos para obtener una seguridad razonable de que los bienes aportados existen y son propiedad de los accionistas de la empresa. Los procedimientos seleccionados dependen del juicio del auditor independiente de la empresa, lo cual incluye la revision de los documentos que demuestran la titularidad de la propiedad de los bienes y la inspeccion fisica para comprobar su existencia." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "CONCLUSION", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Mi opinion se ha formado sobre la base de la evidencia obtenida. Los criterios que utilice para formar mi opinion son los relacionados con la existencia y propiedad de los bienes inmuebles incluidos en el inventario al " + (d.presentationDate || "[FECHA]") + ". En mi opinion, respecto a todo lo importante:" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "a) Los bienes inmuebles que se presentan en el Inventario de Bienes Inmuebles, aportado por el accionista Sr./Sra. " + (d.shareholderName || "[ACCIONISTA]") + " para aumentar el capital social al " + (d.presentationDate || "[FECHA]") + " existen, y" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "b) Son de propiedad del Sr./Sra. " + (d.shareholderName || "[ACCIONISTA]") + ", accionista de la empresa " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + ", para que sean aprobados en asamblea extraordinaria de accionistas de fecha " + (d.assemblyDate || "[FECHA]") + ", con el fin de que se constituya en su aporte para aumentar la cantidad de sus acciones y en consecuencia el aumento del capital social de la empresa " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + "." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "USUARIOS PREVISTOS Y PROPOSITO", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Este informe esta dirigido unicamente para tramitar ante el Registro Mercantil " + (d.mercantileRegistry || "[IDENTIFICAR]") + ", de la Circunscripcion Judicial del Estado " + (d.judicialCircumscription || "[ESTADO]") + ", el registro del acta de asamblea extraordinaria de accionistas de fecha " + (d.assemblyDate || "[FECHA]") + " de la empresa " + (d.companyName || "[NOMBRE DE LA EMPRESA]") + "." })], spacing: { after: 500 } }),

          new Paragraph({ children: [new TextRun({ text: "_______________________________" })], spacing: { before: 400 } }),
          new Paragraph({ children: [new TextRun({ text: "Firma del Contador Publico" })] }),
          new Paragraph({ children: [new TextRun({ text: (d.accountantName || "[NOMBRE Y APELLIDOS]") })] }),
          new Paragraph({ children: [new TextRun({ text: "C.P.C. " + (d.cpcNumber || "[NUMERO]") })] }),
          new Paragraph({ children: [new TextRun({ text: (d.city || "[CIUDAD]") + ", " + (d.reportDate || "[FECHA]") })], spacing: { after: 200 } }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "informe-aumento-capital-" + (d.companyName || "empresa").replace(/\s+/g, "-").toLowerCase() + ".docx");
    setMessage("Informe de aumento de capital generado y descargado correctamente.");
  }

  async function generateCertificacionIngresosLimitada() {
    const d = formData;
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: "INFORME DE ASEGURAMIENTO DEL CONTADOR PUBLICO INDEPENDIENTE", bold: true, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "SOBRE LA RELACION DE INGRESOS DE " + (d.personName || "[NOMBRE]").toUpperCase(), bold: true, size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "Señores:" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: (d.addressee || "[DESTINATARIO]") })], spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "Alcance", bold: true })], spacing: { before: 100, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "He revisado la evidencia inherente a los ingresos percibidos por el Sr./Sra. " + (d.personName || "[NOMBRE]") + ", identificado(a) con la cedula de identidad nº " + (d.cedula || "[CEDULA]") + ", durante el periodo comprendido desde el " + (d.periodStart || "[FECHA INICIO]") + " hasta el " + (d.periodEnd || "[FECHA FIN]") + ", presentado en la relacion de ingresos adjunta, correspondiente a su actividad como " + (d.profession || "[PROFESION]") + " en el libre ejercicio de la profesion." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Responsabilidad de la persona que percibe los ingresos", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "El Sr./Sra. " + (d.personName || "[NOMBRE]") + ", es responsable de la preparacion y presentacion del importe de sus ingresos que se adjunta a este informe, incluyendo la integridad, legalidad y veracidad de los documentos suministrados. Esta responsabilidad incluye la aseveracion de que todos y cada uno de los ingresos detallados en la relacion, provienen de actividades legitimas y de comprobable licito ejercicio." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Responsabilidad del contador publico independiente", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Mi responsabilidad es expresar una seguridad limitada sobre la relacion de ingresos obtenida por el Sr./Sra. " + (d.personName || "[NOMBRE]") + ", durante el periodo señalado de acuerdo con mis procedimientos, los cuales he realizado de conformidad con la Norma Internacional para Encargos de Aseguramiento, distintos de auditorias y revision de estados financieros de informacion financiera historica, numero 3000 (NIEA 3000); esta norma preve que cumpla con los requerimientos eticos, y que planifique y realice mis procedimientos para obtener una seguridad limitada de que, en todos los aspectos materiales, la relacion esta presentada razonablemente." })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Un encargo de aseguramiento implica llevar a cabo procedimientos para obtener evidencia acerca de la razonabilidad de las aseveraciones emitidas por el responsable. Los procedimientos para compilar evidencia son mas limitados que para un encargo de aseguramiento con seguridad razonable, por lo tanto, se obtiene menos certeza que en un encargo de aseguramiento con seguridad razonable. El objetivo es obtener una seguridad limitada para que el contador publico obtenga un nivel moderado de seguridad como base de una forma negativa de expresion. Por lo tanto, mi responsabilidad no es expresar una opinion sobre los ingresos del Sr./Sra. " + (d.personName || "[NOMBRE]") + ", para el periodo del " + (d.periodStart || "[FECHA INICIO]") + " al " + (d.periodEnd || "[FECHA FIN]") + ", con base al examen sobre la evidencia obtenida." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Identificacion del criterio de evaluacion", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Mi encargo consistio en revisar los estados de cuenta de bancos, declaraciones de impuestos, contratos, entre otros documentos inherentes, comprobar y confirmar los ingresos percibidos por el Sr./Sra. " + (d.personName || "[NOMBRE]") + ", para el periodo señalado. Mi seguridad limitada se formo sobre la base de la evidencia obtenida suficiente y adecuada. El criterio utilizado para emitirla fue la definicion de ingresos contenida en la seccion 2, conceptos y principios generales, de las normas internacionales de informacion financiera para las pequeñas y medianas entidades, aun cuando no le son aplicables a las personas naturales no comerciantes." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Conclusion", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Con base en el encargo efectuado descrito en este informe, no ha llamado mi atencion algo que me haga pensar que la relacion de ingresos que se anexa, en todos los aspectos importantes, no sea razonable y que los ingresos detallados en la relacion, no provengan de actividades legitimas y de comprobable licito ejercicio." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Usuarios previstos y proposito", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Este informe y la relacion que se adjunta estan dirigidos unicamente para " + (d.purpose || "[PROPOSITO]") + "." })], spacing: { after: 500 } }),

          new Paragraph({ children: [new TextRun({ text: "_______________________________" })], spacing: { before: 400 } }),
          new Paragraph({ children: [new TextRun({ text: "Firma del Contador Publico" })] }),
          new Paragraph({ children: [new TextRun({ text: (d.accountantName || "[NOMBRE Y APELLIDOS]") })] }),
          new Paragraph({ children: [new TextRun({ text: "C.P.C. " + (d.cpcNumber || "[NUMERO]") })] }),
          new Paragraph({ children: [new TextRun({ text: (d.city || "[CIUDAD]") + ", " + (d.reportDate || "[FECHA]") })], spacing: { after: 200 } }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "certificacion-ingresos-limitada-" + (d.personName || "persona").replace(/\s+/g, "-").toLowerCase() + ".docx");
    setMessage("Certificacion de ingresos (seguridad limitada) generada y descargada correctamente.");
  }

  async function generateCertificacionIngresos() {
    const d = formData;
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: "INFORME DE ASEGURAMIENTO DEL CONTADOR PUBLICO INDEPENDIENTE", bold: true, size: 24 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "SOBRE LA RELACION DE INGRESOS DE " + (d.personName || "[NOMBRE]").toUpperCase(), bold: true, size: 22 })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "Señores:" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: (d.addressee || "[DESTINATARIO]") })], spacing: { after: 300 } }),

          new Paragraph({ children: [new TextRun({ text: "Alcance", bold: true })], spacing: { before: 100, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "He examinado la evidencia inherente a los ingresos percibidos por el Sr./Sra. " + (d.personName || "[NOMBRE]") + ", identificado(a) con la cedula de identidad nº " + (d.cedula || "[CEDULA]") + ", durante el periodo comprendido desde el " + (d.periodStart || "[FECHA INICIO]") + " hasta el " + (d.periodEnd || "[FECHA FIN]") + ", presentado en la relacion de ingresos adjunta, correspondiente a su actividad como " + (d.profession || "[PROFESION]") + " en el libre ejercicio de la profesion." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Responsabilidad de la persona que percibe los ingresos", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "El Sr./Sra. " + (d.personName || "[NOMBRE]") + ", es responsable de la preparacion y presentacion del importe de sus ingresos que se adjunta a este informe, incluyendo la integridad, legalidad y veracidad de los documentos suministrados. Esta responsabilidad incluye la aseveracion de que todos y cada uno de los ingresos detallados en la relacion, provienen de actividades legitimas y de comprobable licito ejercicio." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Responsabilidad del contador publico independiente", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Mi responsabilidad es expresar una opinion sobre la relacion de ingresos obtenida por el Sr./Sra. " + (d.personName || "[NOMBRE]") + ", durante el periodo señalado de acuerdo con mis procedimientos, los cuales he realizado de conformidad con la Norma Internacional para Encargos de Aseguramiento, distintos de auditorias y revision de estados financieros de informacion financiera historica, numero 3000 (NIEA 3000), la cual preve que cumpla con los requerimientos eticos, y que planifique y realice mis procedimientos para obtener una seguridad razonable de que, en todos los aspectos materiales, la relacion esta presentada razonablemente." })], spacing: { after: 200 } }),
          new Paragraph({ children: [new TextRun({ text: "Un encargo de aseguramiento implica llevar a cabo procedimientos para obtener evidencia acerca de la razonabilidad de las aseveraciones emitidas por el responsable. Los procedimientos seleccionados dependen del juicio profesional del contador publico, que incluye evaluar los riesgos acerca de que los ingresos no esten presentados razonablemente." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Identificacion del criterio de evaluacion", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Mi encargo consistio en examinar los estados de cuenta de bancos, declaraciones de impuestos, contratos, entre otros documentos inherentes, comprobar y confirmar los ingresos relacionados por el Sr./Sra. " + (d.personName || "[NOMBRE]") + ", para el periodo señalado. Mi opinion se formo sobre la base de la evidencia obtenida suficiente y adecuada. El criterio utilizado para emitirla fue la definicion de ingresos contenida en la seccion 2, conceptos y principios generales, de las normas internacionales de informacion financiera para las pequeñas y medianas entidades, aun cuando no le son aplicables a las personas naturales no comerciantes." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Conclusion", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Mi opinion se ha formado sobre la base de los asuntos esbozados en este informe. En mi opinion, respecto de todo lo importante:" })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "1. La relacion adjunta presenta razonablemente los ingresos obtenidos por el Sr./Sra. " + (d.personName || "[NOMBRE]") + ", desde el " + (d.periodStart || "[FECHA INICIO]") + " hasta el " + (d.periodEnd || "[FECHA FIN]") + "." })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "2. Los ingresos estan respaldados por los documentos presentados por el Sr./Sra. " + (d.personName || "[NOMBRE]") + ", durante el periodo presentado." })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "3. Los ingresos detallados en la relacion, provienen de actividades legitimas y de comprobable licito ejercicio." })], spacing: { after: 200 } }),

          new Paragraph({ children: [new TextRun({ text: "Usuarios previstos y proposito", bold: true })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Este informe y la relacion que se adjunta estan dirigidos unicamente para " + (d.purpose || "[PROPOSITO]") + "." })], spacing: { after: 500 } }),

          new Paragraph({ children: [new TextRun({ text: "_______________________________" })], spacing: { before: 400 } }),
          new Paragraph({ children: [new TextRun({ text: "Firma del Contador Publico" })] }),
          new Paragraph({ children: [new TextRun({ text: (d.accountantName || "[NOMBRE Y APELLIDOS]") })] }),
          new Paragraph({ children: [new TextRun({ text: "C.P.C. " + (d.cpcNumber || "[NUMERO]") })] }),
          new Paragraph({ children: [new TextRun({ text: (d.city || "[CIUDAD]") + ", " + (d.reportDate || "[FECHA]") })], spacing: { after: 200 } }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "certificacion-ingresos-" + (d.personName || "persona").replace(/\s+/g, "-").toLowerCase() + ".docx");
    setMessage("Certificacion de ingresos generada y descargada correctamente.");
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
    if (selectedTemplate.id === "certificacion-ingresos") {
      generateCertificacionIngresos();
    }
    if (selectedTemplate.id === "certificacion-ingresos-limitada") {
      generateCertificacionIngresosLimitada();
    }
    if (selectedTemplate.id === "niea3000-aumento-capital") {
      generateAumentoCapital();
    }
    if (selectedTemplate.id === "estructura-costos-sundde") {
      generateEstructuraCostos();
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
          {selectedTemplate.id === "niea3000-aumento-capital" && (
            <>
              <button onClick={generateInventarioAnexo} style={{ ...theme.buttonStyle, marginTop: 12, marginLeft: 12, fontSize: 18, background: "#818CF8" }}>
                GENERAR ANEXO - TABLA DE INVENTARIO
              </button>
              <button onClick={generateNotasInventario} style={{ ...theme.buttonStyle, marginTop: 12, marginLeft: 12, fontSize: 18, background: "#FB923C" }}>
                GENERAR NOTAS AL INVENTARIO
              </button>
            </>
          )}
          {message && <p style={{ marginTop: 12, fontSize: 16, color: theme.accent }}>{message}</p>}
        </div>
      )}
    </VerticalPageLayout>
  );
}
