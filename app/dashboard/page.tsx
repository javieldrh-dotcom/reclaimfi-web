export default function Dashboard() {
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl font-bold text-cyan-400">
        Dashboard de Auditoría
      </h1>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          Riesgo Financiero
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          Transacciones Analizadas
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          Alertas AML
        </div>
      </div>
    </main>
  );
}