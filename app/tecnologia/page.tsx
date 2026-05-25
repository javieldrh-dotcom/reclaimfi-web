export default function Tecnologia() {
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold text-cyan-400">
        Tecnología
      </h1>

      <p className="mt-6 max-w-3xl text-gray-300 leading-7">
        Nuestra plataforma está construida sobre infraestructura moderna
        orientada a análisis de datos financieros, trazabilidad blockchain
        y sistemas de auditoría automatizada.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-cyan-300">
            Motor de Análisis
          </h2>
          <p className="mt-3 text-gray-300">
            Procesamiento de datos en tiempo real para detección de riesgo
            financiero y patrones sospechosos.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-cyan-300">
            Blockchain Layer
          </h2>
          <p className="mt-3 text-gray-300">
            Registro inmutable de transacciones para auditoría verificable.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-cyan-300">
            IA de Riesgo
          </h2>
          <p className="mt-3 text-gray-300">
            Modelos de inteligencia artificial para evaluación predictiva de riesgo.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-cyan-300">
            Seguridad
          </h2>
          <p className="mt-3 text-gray-300">
            Encriptación de extremo a extremo y protocolos de cumplimiento financiero.
          </p>
        </div>

      </div>
    </main>
  );
}