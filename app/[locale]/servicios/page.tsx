export default function Servicios() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-20 lg:px-12">

      <div className="mx-auto max-w-7xl">

        <div className="max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
            Infraestructura Profesional
          </div>

          <h1 className="text-5xl font-bold leading-tight md:text-7xl">
            Servicios
            <span className="block text-cyan-400">
              Estratégicos
            </span>
          </h1>

          <p className="mt-8 text-lg leading-8 text-gray-400">
            Soluciones especializadas en auditoría digital,
            inteligencia blockchain, cumplimiento regulatorio
            y análisis de riesgo financiero.
          </p>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold text-cyan-300">
              Auditoría Forense
            </h2>

            <p className="mt-4 leading-7 text-gray-300">
              Evaluación técnica de evidencia digital,
              trazabilidad documental y análisis estructurado.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold text-cyan-300">
              Blockchain Intelligence
            </h2>

            <p className="mt-4 leading-7 text-gray-300">
              Investigación de wallets, transacciones
              y clasificación de riesgo financiero.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold text-cyan-300">
              AML / KYC
            </h2>

            <p className="mt-4 leading-7 text-gray-300">
              Automatización de validaciones regulatorias
              y monitoreo de cumplimiento.
            </p>
          </div>

        </div>

      </div>

    </main>
  );
}

