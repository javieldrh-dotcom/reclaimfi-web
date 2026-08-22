"use client";

export default function CyberSecurity() {
  return (
    <div>
      <div className="rounded-3xl border border-red-500/20 bg-[#0d1117]/95 p-10 shadow-[0_0_40px_rgba(239,68,68,0.08)]">
        <h1 className="text-5xl font-black text-red-400">CYBER DEFENSE CENTER</h1>
        <p className="mt-5 max-w-4xl text-lg leading-relaxed text-gray-400">
          Este modulo esta pensado para monitoreo de ciberseguridad operacional (SIEM, deteccion de endpoints, respuesta a incidentes). Requiere integracion con infraestructura real de monitoreo de red, la cual todavia no esta conectada a la plataforma. Actualmente no hay datos reales que mostrar aqui.
        </p>
      </div>

      <div className="mt-10 rounded-3xl border border-white/5 bg-[#0d1117]/60 p-10 text-center">
        <p className="text-gray-500">Modulo pendiente de desarrollo. Sin integracion de datos reales todavia.</p>
      </div>
    </div>
  );
}