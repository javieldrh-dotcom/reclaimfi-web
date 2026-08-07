export default function Contacto() {
  return (
    <main className="min-h-screen bg-black text-white p-10 flex items-center justify-center">
      <div className="w-full max-w-xl">

        <h1 className="text-4xl font-bold text-cyan-400">
          Contacto
        </h1>

        <p className="mt-4 text-gray-300">
          Solicita información o una evaluación de tu caso financiero.
        </p>

        <form className="mt-10 space-y-4">

          <input
            type="text"
            placeholder="Nombre"
            className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-cyan-400"
          />

          <input
            type="email"
            placeholder="Correo electrónico"
            className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-cyan-400"
          />

          <textarea
            placeholder="Mensaje"
            rows={5}
            className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white outline-none focus:border-cyan-400"
          />

          <button
            type="button"
            className="w-full rounded-xl bg-cyan-400 py-4 font-semibold text-black transition hover:scale-105"
          >
            Enviar Solicitud
          </button>

        </form>

      </div>
    </main>
  );
}

