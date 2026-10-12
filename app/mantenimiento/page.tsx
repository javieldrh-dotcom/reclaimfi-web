"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import NeuralBackground from "@/app/components/NeuralBackground";

const DEFAULT_MESSAGE = "Estamos construyendo algo nuevo. Audit Global Intelligence estara disponible muy pronto.";

// Pagina que app/proxy.ts (via app/lib/supabase/maintenanceGate.ts) muestra
// a cualquier visitante que no sea el propietario de la plataforma mientras
// platform_config.maintenance_mode este en true. El mensaje se trae de esa
// misma tabla (lectura publica por RLS) para que Javiel pueda cambiarlo
// desde el Panel del Propietario sin tocar codigo ni esperar un redeploy.
export default function MantenimientoPage() {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("platform_config")
        .select("maintenance_message")
        .eq("id", "default")
        .maybeSingle();
      if (data?.maintenance_message) setMessage(data.maintenance_message);
    }
    load();
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0B0E14", color: "white", fontFamily: "'IBM Plex Sans', sans-serif", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <NeuralBackground color="#2DD4BF" particleCount={90} />
      <style>{`
        @keyframes pulseGlow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        .maint-glow { animation: pulseGlow 2.5s ease-in-out infinite; }
      `}</style>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 32px", maxWidth: 640, margin: "0 auto" }}>
        <p className="maint-glow" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#2DD4BF", textTransform: "uppercase" }}>
          En Construccion
        </p>
        <h1 style={{ marginTop: 18, fontSize: 40, fontWeight: 900, fontFamily: "'IBM Plex Serif', serif", color: "rgba(255,255,255,0.95)", textShadow: "0 0 40px #2DD4BF60" }}>
          Audit Global Intelligence
        </h1>
        <p style={{ marginTop: 20, fontSize: 17, lineHeight: 1.6, color: "#8B93A7" }}>
          {message}
        </p>
      </div>
    </div>
  );
}
