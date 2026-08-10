"use client";
import Link from "next/link";
import { useLocale } from "next-intl";

export default function TerminosPage() {
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
        <h1 style={{ fontSize: 40, fontWeight: 800, fontFamily: "''IBM Plex Serif'', serif" }}>Términos de Servicio</h1>
        <p style={{ ...pStyle, color: "#5A6A85" }}>Última actualización: 10 de agosto de 2026</p>

        <p style={pStyle}>Al acceder o usar Audit Global Intelligence ("la Plataforma"), usted acepta estos Términos de Servicio en su totalidad.</p>

        <h2 style={h2Style}>1. Descripción del Servicio</h2>
        <p style={pStyle}>La Plataforma ofrece herramientas de contabilidad, auditoría forense digital, y análisis de precios para licitaciones públicas, adaptadas a la normativa de distintas regiones.</p>

        <h2 style={h2Style}>2. Cuentas y Responsabilidad del Usuario</h2>
        <p style={pStyle}>Usted es responsable de mantener la confidencialidad de sus credenciales de acceso y de toda actividad realizada bajo su cuenta. Usted es responsable de la exactitud de los datos que ingresa a la Plataforma.</p>

        <h2 style={h2Style}>3. Propiedad Intelectual y Contenido Cargado</h2>
        <p style={pStyle}>
          Los usuarios <strong>no pueden cargar, publicar ni distribuir</strong> ningún material protegido por derechos de autor sin la debida autorización del titular. La funcionalidad de carga de documentos está limitada a los documentos propios del usuario necesarios para su contabilidad (por ejemplo, sus propias facturas).
        </p>
        <p style={pStyle}>
          Los recursos educativos, plantillas, guías y materiales de referencia disponibles en la sección de recursos para profesionales contables son publicados exclusivamente por el administrador de la Plataforma. Los usuarios no tienen permitido subir este tipo de contenido.
        </p>

        <h2 style={h2Style}>4. Planes y Pagos</h2>
        <p style={pStyle}>El acceso a determinadas funcionalidades requiere una suscripción activa. Los detalles de cada plan están disponibles en nuestra página de Precios. Nos reservamos el derecho de suspender el acceso ante falta de pago, conforme a los términos de cada plan.</p>

        <h2 style={h2Style}>5. Limitación de Responsabilidad</h2>
        <p style={pStyle}>La Plataforma se ofrece "tal cual". No garantizamos que los cálculos, reportes o resultados generados (incluyendo aquellos asistidos por inteligencia artificial) sean exactos o completos para todos los efectos legales o fiscales. Es responsabilidad del usuario verificar la información antes de su presentación ante autoridades competentes.</p>

        <h2 style={h2Style}>6. Resolución de Disputas y Arbitraje</h2>
        <p style={pStyle}>
          <strong>Lea esta sección cuidadosamente, ya que afecta sus derechos legales.</strong>
        </p>
        <p style={pStyle}>
          Cualquier disputa, controversia o reclamo que surja de o esté relacionado con estos Términos o el uso de la Plataforma se resolverá mediante <strong>arbitraje vinculante e individual</strong>, en lugar de en un tribunal, salvo que la ley aplicable en su jurisdicción no permita el arbitraje obligatorio para este tipo de disputas (en cuyo caso esta cláusula no le aplica en la medida de esa prohibición).
        </p>
        <ul style={{ paddingLeft: 24 }}>
          <li style={liStyle}>El arbitraje se llevará a cabo de forma individual; usted renuncia a su derecho a participar en una acción colectiva ("class action").</li>
          <li style={liStyle}>El arbitraje será administrado por una institución arbitral reconocida, mutuamente acordada, aplicando sus reglas vigentes.</li>
          <li style={liStyle}>Cada parte asumirá sus propios costos, salvo que el árbitro determine lo contrario conforme a las reglas aplicables.</li>
        </ul>
        <p style={pStyle}>
          Esta cláusula puede no ser aplicable a consumidores en jurisdicciones donde la ley local prohíba o limite el arbitraje obligatorio en materia de protección al consumidor (esto puede incluir Venezuela y otras jurisdicciones, dependiendo de la naturaleza de la disputa). En tales casos, prevalecerá la ley local aplicable.
        </p>

        <h2 style={h2Style}>7. Ley Aplicable</h2>
        <p style={pStyle}>Estos Términos se rigen, en lo no cubierto por disposiciones de protección al consumidor de su jurisdicción local, por las leyes aplicables al lugar de constitución de la Plataforma, sin perjuicio de las normas de conflicto de leyes.</p>

        <h2 style={h2Style}>8. Modificaciones</h2>
        <p style={pStyle}>Podemos modificar estos Términos periódicamente. El uso continuado de la Plataforma después de una modificación constituye su aceptación de los Términos actualizados.</p>

        <h2 style={h2Style}>9. Contacto</h2>
        <p style={pStyle}>Para preguntas sobre estos Términos, contáctenos a través de nuestra <Link href={"/" + locale + "/contacto"} style={{ color: sky }}>página de Contacto</Link>.</p>

        <div style={{ marginTop: 48, padding: 20, background: bgCard, borderRadius: 12, border: "1px solid " + cardBorder }}>
          <p style={{ fontSize: 14, color: "#5A6A85" }}>
            Este documento es una plantilla informativa y no constituye asesoría legal. La aplicabilidad de la cláusula de arbitraje varía según la jurisdicción del usuario y el tipo de disputa. Se recomienda revisión por un abogado especializado en las jurisdicciones donde opera su negocio antes de su uso oficial.
          </p>
        </div>
      </main>
    </div>
  );
}