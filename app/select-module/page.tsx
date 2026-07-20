"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import AuroraBackground from "@/app/components/AuroraBackground";

export default function SelectModulePage() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setLoading(false); return; }
      const { data: assignments } = await supabase
        .from("user_role_assignments")
        .select("role_id")
        .eq("user_id", userData.user.id);
      const roleIds = (assignments ?? []).map((a: any) => a.role_id);
      if (roleIds.length === 0) { setLoading(false); return; }
      const { data: rolePerms } = await supabase
        .from("role_permissions")
        .select("permissions(name)")
        .in("role_id", roleIds);
      const permNames = (rolePerms ?? []).map((p: any) => p.permissions?.name).filter(Boolean);
      setPermissions(permNames);
      setLoading(false);
    }
    load();
  }, []);

  const hasAccounting = permissions.includes("VIEW_ACCOUNTING");
  const hasReclaimFi = permissions.includes("VIEW_RECLAIMFI");
  const hasApu = permissions.includes("VIEW_APU");

  const cardStyle = (enabled: boolean, color: string) => ({
    padding: 44,
    borderRadius: 20,
    border: "3px solid " + color,
    background: "#12161F",
    opacity: enabled ? 1 : 0.7,
    cursor: "pointer",
    textAlign: "center" as const,
    textDecoration: "none",
    color: "white",
    display: "block",
    boxShadow: "0 8px 30px " + color + "30",
  });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0E14", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
        Cargando...
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0B0E14", color: "white", fontFamily: "'IBM Plex Sans', sans-serif", overflow: "hidden" }}>
      <AuroraBackground />
      <div style={{ position: "relative", zIndex: 1, padding: "80px 40px" }}>
        <h1 style={{ fontSize: 44, fontWeight: 900, fontFamily: "'IBM Plex Serif', serif", textAlign: "center", color: "#7dd3fc" }}>
          Selecciona tu Modulo
        </h1>
        <p style={{ textAlign: "center", marginTop: 14, fontSize: 22, color: "#B0B8C8" }}>
          Elige el modulo al que deseas acceder
        </p>

        <div style={{ marginTop: 60, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 30, maxWidth: 1100, margin: "60px auto 0" }}>
          <Link href={hasReclaimFi ? "/dashboard" : "/subscribe?plan=RECLAIMFI"} style={cardStyle(hasReclaimFi, "#2DD4BF")}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#2DD4BF" }}>ReclaimFi</h2>
            <p style={{ marginTop: 14, fontSize: 18, color: "#B0B8C8" }}>Auditoria Forense y Blockchain Intelligence</p>
            {!hasReclaimFi && <p style={{ marginTop: 10, fontSize: 15, color: "#2DD4BF", fontWeight: 700 }}>Suscribirse →</p>}
          </Link>
          <Link href={hasAccounting ? "/accounting/journal" : "/subscribe?plan=CONTABILIDAD"} style={cardStyle(hasAccounting, "#818CF8")}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#818CF8" }}>Contabilidad Financiera</h2>
            <p style={{ marginTop: 14, fontSize: 18, color: "#B0B8C8" }}>NIIF Multi-Sector con IA</p>
            {!hasAccounting && <p style={{ marginTop: 10, fontSize: 15, color: "#818CF8", fontWeight: 700 }}>Suscribirse →</p>}
          </Link>
          <Link href={hasApu ? "/apu/projects" : "/subscribe?plan=APU"} style={cardStyle(hasApu, "#FB923C")}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#FB923C" }}>APU / Licitaciones</h2>
            <p style={{ marginTop: 14, fontSize: 18, color: "#B0B8C8" }}>Analisis de Precios Unitarios para el Estado</p>
            {!hasApu && <p style={{ marginTop: 10, fontSize: 15, color: "#FB923C", fontWeight: 700 }}>Suscribirse →</p>}
          </Link>
        </div>
      </div>
    </div>
  );
}