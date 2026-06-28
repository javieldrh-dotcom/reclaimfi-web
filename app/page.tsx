import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-12">

          <h1 className="text-xl font-bold tracking-wide text-cyan-400">
            Audit Global Intelligence
          </h1>

          <nav
            aria-label="Main navigation"
            className="hidden gap-8 text-sm text-gray-300 md:flex"
          >
            <Link href="/servicios" className="transition hover:text-cyan-400">
              Servicios
            </Link>

            <Link href="/tecnologia" className="transition hover:text-cyan-400">
              Tecnología
            </Link>

            <Link href="/compliance" className="transition hover:text-cyan-400">
              Compliance
            </Link>

            <Link href="/contacto" className="transition hover:text-cyan-400">
              Contacto
            </Link>
          </nav>

          {/* ✅ FIX: Link válido */}
          <Link
            href="/login"
            className="rounded-xl border border-cyan-400/40 px-4 py-2 text-sm text-cyan-300 transition hover:bg-cyan-400/10"
          >
            Acceso Seguro
          </Link>

        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-950 opacity-90" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 lg:px-12">
          <div className="max-w-4xl">

            <div className="mb-6 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300 backdrop-blur">
              Plataforma Profesional de Inteligencia Financiera
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Inteligencia Forense
              <span className="block text-cyan-400">
                Financiera & Blockchain
              </span>
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-gray-300 md:text-xl">
              Infraestructura tecnológica orientada a auditoría digital,
              trazabilidad documental, análisis blockchain y clasificación
              profesional de riesgo financiero.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">

              <Link
                href="/login"
                className="inline-block rounded-2xl bg-cyan-400 px-7 py-4 font-semibold text-black transition hover:scale-105"
              >
                Solicitar Evaluación
              </Link>

              <Link
                href="/dashboard"
                className="rounded-2xl border border-white/20 px-7 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                Ver Arquitectura
              </Link>

            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-12">

        <div className="mb-16 max-w-3xl">
          <h2 className="text-4xl font-bold">
            Servicios Estratégicos
          </h2>

          <p className="mt-6 text-lg text-gray-400">
            Soluciones orientadas a cumplimiento, análisis de riesgo,
            trazabilidad y preservación de evidencia digital.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur transition hover:border-cyan-400/40 hover:bg-white/10">
            <div className="mb-4 text-cyan-400 text-2xl">●</div>
            <h3 className="text-2xl font-semibold text-cyan-300">
              Auditoría Forense Digital
            </h3>
            <p className="mt-4 leading-7 text-gray-300">
              Evaluación técnica de integridad documental y evidencia electrónica.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur transition hover:border-cyan-400/40 hover:bg-white/10">
            <div className="mb-4 text-cyan-400 text-2xl">●</div>
            <h3 className="text-2xl font-semibold text-cyan-300">
              Blockchain Intelligence
            </h3>
            <p className="mt-4 leading-7 text-gray-300">
              Análisis de wallets, transacciones y clasificación de riesgo.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur transition hover:border-cyan-400/40 hover:bg-white/10">
            <div className="mb-4 text-cyan-400 text-2xl">●</div>
            <h3 className="text-2xl font-semibold text-cyan-300">
              AML / KYC
            </h3>
            <p className="mt-4 leading-7 text-gray-300">
              Automatización de flujos de cumplimiento y validación.
            </p>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-28 text-center">
        <h2 className="text-4xl font-bold md:text-5xl">
          Tecnología orientada a precisión, cumplimiento y confianza.
        </h2>

        <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-gray-400">
          Audit Global Intelligence integra auditoría profesional,
          análisis financiero y tecnología forense para generar
          evaluaciones estructuradas y evidencia verificable.
        </p>

        <Link
          href="/login"
          className="mt-12 inline-block rounded-2xl bg-cyan-400 px-10 py-5 text-lg font-semibold text-black transition hover:scale-105"
        >
          Iniciar Evaluación
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-gray-500">
        © 2026 Audit Global Intelligence. Todos los derechos reservados.
      </footer>

    </main>
  );
}

