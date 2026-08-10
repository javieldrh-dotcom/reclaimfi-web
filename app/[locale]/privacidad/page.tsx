"use client";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function PrivacidadPage() {
  const locale = useLocale();
  const bg = "#0A1628";
  const bgCard = "#12213B";
  const ink = "#FFFFFF";
  const inkSoft = "#8FA3C4";
  const sky = "#FACC15";
  const cardBorder = "#1E3A5F";

  const h2Style: React.CSSProperties = { fontSize: 24, fontWeight: 800, color: sky, marginTop: 40, fontFamily: "''IBM Plex Serif'', serif" };
  const pStyle: React.CSSProperties = { fontSize: 16, color: inkSoft, lineHeight: 1.8, marginTop: 12 };
  const liStyle: React.CSSProperties = { fontSize: 16, color: inkSoft, lineHeight: 1.8, marginTop: 6 };

  return (
    <div style={{ background: bg, minHeight: "100vh", color: ink, fontFamily: "''IBM Plex Sans'', sans-serif" }}>
      <header style={{ padding: "22px 48px", borderBottom: "1px solid " + cardBorder, background: bgCard }}>
        <Link href={"/" + locale} style={{ fontSize: 20, fontWeight: 800, color: sky, textDecoration: "none", fontFamily: "''IBM Plex Serif'', serif" }}>
          Audit Global Intelligence
        </Link>
      </header>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "60px 24px 100px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, fontFamily: "''IBM Plex Serif'', serif" }}>Política de Privacidad</h1>
        <p style={{ ...pStyle, color: "#5A6A85" }}>Última actualización: 10 de agosto de 2026</p>

        <p style={pStyle}>
          Esta Política de Privacidad describe cómo Audit Global Intelligence ("nosotros", "la Plataforma") recopila, usa, protege y comparte su información al utilizar nuestros servicios de contabilidad, auditoría forense y análisis de licitaciones.
        </p>

        <h2 style={h2Style}>1. Información que Recopilamos</h2>
        <p style={pStyle}>Recopilamos las siguientes categorías de información:</p>
        <ul style={{ paddingLeft: 24 }}>
          <li style={liStyle}><strong>Datos de identidad:</strong> nombre, correo electrónico, información de la cuenta.</li>
          <li style={liStyle}><strong>Datos de la empresa:</strong> razón social, RIF/identificación fiscal, sector económico, país.</li>
          <li style={liStyle}><strong>Datos contables y financieros:</strong> asientos contables, facturas, estados financieros, y cualquier registro que usted ingrese a la Plataforma.</li>
          <li style={liStyle}><strong>Documentos cargados:</strong> facturas e imágenes que usted sube para procesamiento (ver sección de Inteligencia Artificial).</li>
          <li style={liStyle}><strong>Datos de uso:</strong> registros de acceso, direcciones IP, y actividad dentro de la Plataforma con fines de seguridad y auditoría.</li>
        </ul>

        <h2 style={h2Style}>2. Uso de Inteligencia Artificial</h2>
        <p style={pStyle}>
          <strong>Divulgación importante:</strong> la Plataforma utiliza sistemas de inteligencia artificial de terceros (Anthropic, proveedor del modelo Claude) para las siguientes funciones:
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li style={liStyle}><strong>Extracción de datos de facturas (OCR):</strong> cuando usted sube una imagen de factura, un sistema de IA analiza la imagen para extraer datos como monto, fecha y proveedor.</li>
          <li style={liStyle}><strong>Asistente de consultas en lenguaje natural:</strong> nuestro chat permite hacer preguntas sobre su contabilidad en español, procesadas por un modelo de IA.</li>
          <li style={liStyle}><strong>Asistente de orientación dentro de la aplicación:</strong> un asistente conversacional que ayuda a los usuarios a entender las funcionalidades de la Plataforma. Este asistente se identifica claramente como un sistema automatizado, no una persona.</li>
          <li style={liStyle}><strong>Agente de cumplimiento normativo:</strong> apoyo automatizado para el análisis de obligaciones fiscales, cuyas conclusiones no sustituyen el criterio de un profesional contable o legal.</li>
        </ul>
        <p style={pStyle}>
          Los datos que usted proporciona a estas funciones (imágenes de facturas, texto de sus consultas) se envían al proveedor de IA para su procesamiento. Ninguna de estas herramientas toma decisiones fiscales o legales vinculantes de forma autónoma — todos los resultados generados por IA deben ser revisados por el usuario antes de su uso oficial. No garantizamos la exactitud absoluta de los resultados generados por IA.
        </p>

        <h2 style={h2Style}>3. Cómo Usamos su Información</h2>
        <p style={pStyle}>Utilizamos su información para: operar y mantener la Plataforma, procesar su contabilidad conforme a la normativa de su región, verificar su identidad, prevenir fraude, y cumplir con obligaciones legales aplicables.</p>

        <h2 style={h2Style}>4. Seguridad de los Datos</h2>
        <p style={pStyle}>Implementamos medidas técnicas de seguridad que incluyen: aislamiento de datos por empresa a nivel de base de datos, cadena de verificación blockchain en los registros contables, autenticación de dos factores opcional, y control de acceso basado en roles.</p>

        <h2 style={h2Style}>5. Con Quién Compartimos su Información</h2>
        <p style={pStyle}>No vendemos su información personal. Compartimos datos únicamente con proveedores de infraestructura necesarios para operar la Plataforma: Supabase (base de datos y autenticación), Anthropic (procesamiento de IA, según se describe en la sección 2), y Sentry (monitoreo de errores técnicos). Estos proveedores están obligados contractualmente a proteger su información.</p>

        <h2 style={h2Style}>6. Sus Derechos</h2>
        <p style={pStyle}>Usted tiene derecho a acceder, corregir, o solicitar la eliminación de su información personal, sujeto a nuestras obligaciones legales de conservación de registros contables. Para ejercer estos derechos, contáctenos a través de la página de Contacto.</p>

        <h2 style={h2Style}>7. Transferencias Internacionales</h2>
        <p style={pStyle}>Dado que operamos en múltiples regiones, su información puede procesarse en servidores ubicados fuera de su país de residencia. Tomamos medidas razonables para proteger su información conforme a esta Política, independientemente de dónde se procese.</p>

        <h2 style={h2Style}>8. Cambios a esta Política</h2>
        <p style={pStyle}>Podemos actualizar esta Política periódicamente. Le notificaremos cambios materiales a través de la Plataforma o por correo electrónico.</p>

        <h2 style={h2Style}>9. Contacto</h2>
        <p style={pStyle}>Para preguntas sobre esta Política de Privacidad, contáctenos a través de nuestra <Link href={"/" + locale + "/contacto"} style={{ color: sky }}>página de Contacto</Link>.</p>

        <div style={{ marginTop: 48, padding: 20, background: bgCard, borderRadius: 12, border: "1px solid " + cardBorder }}>
          <p style={{ fontSize: 14, color: "#5A6A85" }}>
            Este documento es una plantilla informativa y no constituye asesoría legal. Se recomienda revisión por un abogado antes de su uso oficial, particularmente en lo relativo a las jurisdicciones donde opera su negocio.
          </p>
        </div>
      </main>
    </div>
  );
}