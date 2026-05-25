export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-950 opacity-90" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 lg:px-12">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 backdrop-blur">
              Audit Global Intelligence
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Inteligencia Forense
              <span className="block text-cyan-400">Financiera & Blockchain</span>
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-gray-300 md:text-xl">
              Plataforma profesional de análisis forense digital, evaluación de riesgo,
              trazabilidad documental y auditoría blockchain orientada a activos financieros,
              cumplimiento y evidencia verificable.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button className="rounded-2xl bg-cyan-400 px-7 py-4 font-semibold text-black transition hover:scale-105">
                Solicitar Evaluación
              </button>

              <button className="rounded-2xl border border-white/20 px-7 py-4 font-semibold text-white transition hover:bg-white/10">
                Ver Servicios
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
        <div className="mb-16 max-w-3xl">
          <h2 className="text-4xl font-bold">Servicios Estratégicos</h2>
          <p className="mt-6 text-lg text-gray-400">
            Infraestructura tecnológica y metodologías orientadas a trazabilidad,
            cumplimiento y análisis de riesgo financiero.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: 'Auditoría Forense Digital',
              desc: 'Evaluación técnica de integridad documental, trazabilidad y análisis de evidencia digital.',
            },
            {
              title: 'Blockchain Intelligence',
              desc: 'Análisis de wallets, movimientos, patrones transaccionales y clasificación de riesgo.',
            },
            {
              title: 'AML / KYC',
              desc: 'Automatización de cumplimiento y verificación orientada a activos financieros.',
            },
            {
              title: 'Recuperación de Activos',
              desc: 'Flujos estructurados para evaluación técnica y seguimiento de casos complejos.',
            },
            {
              title: 'Evidencia Verificable',
              desc: 'Registro auditado de eventos, timestamps y preservación de integridad.',
            },
            {
              title: 'Reportería Ejecutiva',
              desc: 'Generación profesional de informes técnicos claros y comprensibles.',
            },
          ].map((service) => (
            <div
              key={service.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              <h3 className="text-2xl font-semibold text-cyan-300">
                {service.title}
              </h3>

              <p className="mt-4 leading-7 text-gray-300">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TECHNOLOGY */}
      <section className="border-y border-white/10 bg-slate-950/70">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-2 lg:px-12">
          <div>
            <h2 className="text-4xl font-bold">
              Arquitectura Diseñada para Escalabilidad
            </h2>

            <p className="mt-6 text-lg leading-8 text-gray-400">
              Construida sobre infraestructura cloud moderna, preparada para automatización,
              trazabilidad, análisis de riesgo y evolución hacia entornos enterprise.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {[
              'Next.js + TypeScript',
              'Arquitectura API-First',
              'Cloud Autoescalable',
              'Trazabilidad de Eventos',
              'Seguridad Empresarial',
              'Dashboards Analíticos',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6 text-cyan-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-28 text-center">
        <h2 className="text-4xl font-bold md:text-5xl">
          Tecnología orientada a precisión, cumplimiento y confianza.
        </h2>

        <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-gray-400">
          Audit Global Intelligence integra auditoría profesional, análisis financiero y
          tecnología forense para proporcionar evaluaciones estructuradas y evidencia
          técnicamente verificable.
        </p>

        <button className="mt-12 rounded-2xl bg-cyan-400 px-10 py-5 text-lg font-semibold text-black transition hover:scale-105">
          Iniciar Evaluación
        </button>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-gray-500">
        © 2026 Audit Global Intelligence. Todos los derechos reservados.
      </footer>
    </main>
  )
}