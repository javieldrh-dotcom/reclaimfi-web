"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

export default function SelectModulePage() {
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;

      const { data: assignments } = await supabase
        .from("user_role_assignments")
        .select("role_id")
        .eq("user_id", userData.user.id);

      const roleIds = (assignments ?? []).map((a: any) => a.role_id);
      if (roleIds.length === 0) return;

      const { data: rolePerms } = await supabase
        .from("role_permissions")
        .select("permissions(name)")
        .in("role_id", roleIds);

      const permNames = (rolePerms ?? []).map((p: any) => p.permissions?.name).filter(Boolean);
      setPermissions(permNames);
    }
    load();
  }, []);

  const hasAccounting = permissions.includes("VIEW_ACCOUNTING");
  const hasReclaimFi = permissions.includes("VIEW_RECLAIMFI");

  const cardStyle = (enabled: boolean) => ({
    padding: 40,
    borderRadius: 20,
    border: "1px solid #1a3050",
    background: enabled ? "rgba(34,211,238,0.08)" : "rgba(100,100,100,0.05)",
    opacity: enabled ? 1 : 0.5,
    cursor: enabled ? "pointer" : "not-allowed",
    textAlign: "center" as const,
  });

  return (
    <div style={{ padding: 60, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 36, fontWeight: 900, color: "#7dd3fc", textAlign: "center" }}>
        Selecciona tu Modulo
      </h1>

      <div style={{ marginTop: 50, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, maxWidth: 800, margin: "50px auto" }}>
        {hasReclaimFi ? (
          <Link href="/dashboard" style={cardStyle(true)}>
            <h2 style={{ fontSize: 24, fontWeight: 900 }}>ReclaimFi</h2>
            <p style={{ marginTop: 10, color: "#9ca3af" }}>Auditoria Forense y Blockchain Intelligence</p>
          </Link>
        ) : (
          <div style={cardStyle(false)}>
            <h2 style={{ fontSize: 24, fontWeight: 900 }}>ReclaimFi</h2>
            <p style={{ marginTop: 10, color: "#9ca3af" }}>Actualiza tu plan para acceder</p>
          </div>
        )}

        {hasAccounting ? (
          <Link href="/accounting/journal" style={cardStyle(true)}>
            <h2 style={{ fontSize: 24, fontWeight: 900 }}>Contabilidad Financiera</h2>
            <p style={{ marginTop: 10, color: "#9ca3af" }}>NIIF Multi-Sector con IA</p>
          </Link>
        ) : (
          <div style={cardStyle(false)}>
            <h2 style={{ fontSize: 24, fontWeight: 900 }}>Contabilidad Financiera</h2>
            <p style={{ marginTop: 10, color: "#9ca3af" }}>Actualiza tu plan para acceder</p>
          </div>
        )}
      </div>
    </div>
  );
}
