export default function CompliancePage() {
  return (
    <main className="min-h-screen bg-black text-white p-10">

      <div className="mx-auto max-w-7xl">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold text-cyan-400">
              Compliance Center
            </h1>

            <p className="mt-3 text-gray-500">
              AML, KYC y monitoreo regulatorio institucional.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-3 text-yellow-300">
            AML / KYC
          </div>

        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">

            <h2 className="text-2xl font-semibold">
              KYC Validation
            </h2>

            <p className="mt-4 text-gray-500">
              Verificación institucional de identidad.
            </p>

          </div>

          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">

            <h2 className="text-2xl font-semibold">
              AML Monitoring
            </h2>

            <p className="mt-4 text-gray-500">
              Monitoreo de actividad sospechosa.
            </p>

          </div>

          <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-8">

            <h2 className="text-2xl font-semibold">
              Regulatory Status
            </h2>

            <p className="mt-4 text-gray-500">
              Estado regulatorio y cumplimiento.
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}

