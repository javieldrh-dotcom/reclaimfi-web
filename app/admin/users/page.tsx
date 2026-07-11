"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function AdminUsersPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);

      const { data: rolesData } = await supabase.from("user_roles").select("id, name, description").order("name");
      setRoles(rolesData ?? []);

      if (cid) {
        const { data: assignData } = await supabase
          .from("user_role_assignments")
          .select("id, user_id, role_id, user_roles(name)")
          .eq("company_id", cid);
        setAssignments(assignData ?? []);
      }
    }
    load();
  }, []);

  async function assignRole() {
    setMessage("");
    if (!companyId || !roleId || !email) { setMessage("Completa todos los campos."); return; }

    const { data: targetUser } = await supabase.rpc("get_user_id_by_email", { user_email: email });

    if (!targetUser) {
      setMessage("No se encontro un usuario con ese correo. Debe haber iniciado sesion al menos una vez.");
      return;
    }

    const { error } = await supabase.from("user_role_assignments").insert([{
      user_id: targetUser,
      role_id: roleId,
      company_id: companyId,
    }]);

    if (error) {
      setMessage("Error: " + error.message);
      return;
    }

    setMessage("Rol asignado correctamente.");
    setEmail("");

    const { data: assignData } = await supabase
      .from("user_role_assignments")
      .select("id, user_id, role_id, user_roles(name)")
      .eq("company_id", companyId);
    setAssignments(assignData ?? []);
  }

  const inputStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 8, color: "white", width: "100%" };

  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Administracion de Usuarios y Roles</h1>

      <div style={{ marginTop: 30, display: "grid", gap: 10, maxWidth: 500 }}>
        <input placeholder="Correo del usuario" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)} style={inputStyle}>
          <option value="">Selecciona un rol</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name} - {r.description}</option>)}
        </select>
        <button onClick={assignRole} style={{ padding: 14, background: "#22d3ee", color: "black", fontWeight: 900, borderRadius: 12, border: "none" }}>
          ASIGNAR ROL
        </button>
        {message && <p style={{ color: message.includes("correctamente") ? "#4ade80" : "#f87171" }}>{message}</p>}
      </div>

      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, color: "#7dd3fc" }}>Usuarios con Rol Asignado</h2>
        {assignments.map((a) => (
          <div key={a.id} style={{ padding: 12, borderBottom: "1px solid #1a3050" }}>
            {a.user_id} - <strong>{a.user_roles?.name}</strong>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, color: "#7dd3fc" }}>Roles Disponibles</h2>
        {roles.map((r) => (
          <div key={r.id} style={{ padding: 12, borderBottom: "1px solid #1a3050" }}>
            <strong>{r.name}</strong> - {r.description}
          </div>
        ))}
      </div>
    </div>
  );
}