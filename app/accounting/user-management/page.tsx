"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

const ROLES = ["ADMIN", "CONTADOR", "AUDITOR", "SOLO_LECTURA"];
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador (acceso total)",
  CONTADOR: "Contador (contabilidad completa)",
  AUDITOR: "Auditor (modulo forense)",
  SOLO_LECTURA: "Solo Lectura (sin editar)",
};

export default function UserManagementPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [assignments, setAssignments] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("CONTADOR");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAssignments(cid: string) {
    const { data: roleData } = await supabase
      .from("user_role_assignments")
      .select("id, user_id, role_id, user_roles(name)")
      .eq("company_id", cid);

    const enriched = await Promise.all(
      (roleData ?? []).map(async (r: any) => {
        const { data: emailData } = await supabase.rpc("get_user_email", { uid: r.user_id });
        return { ...r, email: emailData ?? "(correo no encontrado)", roleName: r.user_roles?.name };
      })
    );
    setAssignments(enriched);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: companyData } = await supabase.from("companies").select("name").eq("id", cid).single();
        setCompanyName(companyData?.name ?? "");
        await loadAssignments(cid);
      }
    }
    load();
  }, []);

  async function grantAccess() {
    setMessage("");
    if (!companyId || !email) { setMessage("Ingresa un correo."); return; }
    setLoading(true);

    const { data: targetUserId } = await supabase.rpc("find_user_id_by_email", { search_email: email.trim().toLowerCase() });
    if (!targetUserId) {
      setMessage("No se encontro ningun usuario con ese correo. La persona debe registrarse primero en la plataforma (pantalla de inicio de sesion) antes de poder asignarle acceso.");
      setLoading(false);
      return;
    }

    const { data: roleRow } = await supabase.from("user_roles").select("id").eq("name", selectedRole).single();
    if (!roleRow) { setMessage("Rol no encontrado."); setLoading(false); return; }

    const { data: existing } = await supabase.from("user_role_assignments").select("id").eq("user_id", targetUserId).eq("company_id", companyId).maybeSingle();
    if (existing) {
      await supabase.from("user_role_assignments").update({ role_id: roleRow.id }).eq("id", existing.id);
      setMessage("Rol actualizado correctamente.");
    } else {
      await supabase.from("user_role_assignments").insert([{ user_id: targetUserId, company_id: companyId, role_id: roleRow.id }]);
      const { data: existingCompany } = await supabase.from("user_companies").select("id").eq("user_id", targetUserId).eq("company_id", companyId).maybeSingle();
      if (!existingCompany) {
        await supabase.from("user_companies").insert([{ user_id: targetUserId, company_id: companyId, last_active_at: new Date().toISOString() }]);
      }
      setMessage("Acceso otorgado correctamente.");
    }
    setEmail("");
    await loadAssignments(companyId);
    setLoading(false);
  }

  async function changeRole(assignmentId: string, newRoleName: string) {
    const { data: roleRow } = await supabase.from("user_roles").select("id").eq("name", newRoleName).single();
    if (!roleRow || !companyId) return;
    await supabase.from("user_role_assignments").update({ role_id: roleRow.id }).eq("id", assignmentId);
    await loadAssignments(companyId);
  }

  async function removeAccess(assignmentId: string) {
    if (!companyId) return;
    if (!window.confirm("Se revocara el acceso de este usuario a esta empresa. Confirmar?")) return;
    await supabase.from("user_role_assignments").delete().eq("id", assignmentId);
    await loadAssignments(companyId);
  }

  const inputStyle = theme.inputStyle;

  return (
    <VerticalPageLayout vertical="accounting" title="Gestion de Usuarios" subtitle="Asigna roles y permisos a los usuarios de esta empresa" fullWidth>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <p style={{ fontSize: 15, color: "#8B93A7" }}>{companyName}</p>

        <div style={{ ...theme.cardStyle, marginTop: 16 }}>
          <p style={{ fontSize: 15, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Otorgar o Actualizar Acceso</p>
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="Correo del usuario (debe estar ya registrado)" />
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <button onClick={grantAccess} disabled={loading} style={{ ...theme.buttonStyle, marginTop: 12 }}>
            {loading ? "PROCESANDO..." : "OTORGAR ACCESO"}
          </button>
          {message && <p style={{ marginTop: 8, color: message.includes("no se encontro") || message.includes("no encontrado") ? "#f87171" : theme.accent }}>{message}</p>}
        </div>

        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>Usuarios con Acceso</h3>
          {assignments.map((a) => (
            <div key={a.id} style={{ ...theme.cardStyle, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <span style={{ fontSize: 15 }}>{a.email}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={a.roleName} onChange={(e) => changeRole(a.id, e.target.value)} style={{ ...inputStyle, padding: 8, fontSize: 13 }}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                <button onClick={() => removeAccess(a.id)} style={{ background: "none", border: "1px solid #f87171", color: "#f87171", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Revocar</button>
              </div>
            </div>
          ))}
          {assignments.length === 0 && <p style={{ color: "#8B93A7", marginTop: 10 }}>Sin usuarios asignados todavia.</p>}
        </div>
      </div>
    </VerticalPageLayout>
  );
}