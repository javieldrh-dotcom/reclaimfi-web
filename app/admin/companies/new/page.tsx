"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

const SECTORS = [
  { code: "GENERIC", label: "Servicios Profesionales" },
  { code: "COMMERCE", label: "Comercio (mayor/menor)" },
  { code: "MANUFACTURING", label: "Manufactura/Industrial" },
  { code: "CONSTRUCTION", label: "Construccion" },
  { code: "TRANSPORTATION", label: "Transporte y Almacenamiento" },
  { code: "FINANCIAL", label: "Financiero y Seguros" },
  { code: "AGRICULTURE", label: "Agropecuario" },
  { code: "HEALTHCARE", label: "Salud" },
  { code: "HOSPITALITY", label: "Hoteleria y Turismo" },
  { code: "RESTAURANT", label: "Restaurantes y Comida" },
  { code: "OIL_GAS", label: "Petroleo y Gas" },
];

const COUNTRIES = [
  { code: "VE", name: "Venezuela" },
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "BR", name: "Brasil" },
  { code: "CL", name: "Chile" },
  { code: "PE", name: "Peru" },
  { code: "EC", name: "Ecuador" },
  { code: "BO", name: "Bolivia" },
  { code: "PY", name: "Paraguay" },
  { code: "UY", name: "Uruguay" },
  { code: "PA", name: "Panama" },
  { code: "CR", name: "Costa Rica" },
  { code: "GT", name: "Guatemala" },
  { code: "HN", name: "Honduras" },
  { code: "SV", name: "El Salvador" },
  { code: "NI", name: "Nicaragua" },
  { code: "DO", name: "Republica Dominicana" },
  { code: "CU", name: "Cuba" },
  { code: "PR", name: "Puerto Rico" },
  { code: "US", name: "Estados Unidos" },
  { code: "CA", name: "Canada" },
  { code: "ES", name: "Espana" },
  { code: "PT", name: "Portugal" },
  { code: "FR", name: "Francia" },
  { code: "DE", name: "Alemania" },
  { code: "IT", name: "Italia" },
  { code: "GB", name: "Reino Unido" },
  { code: "NL", name: "Paises Bajos" },
  { code: "BE", name: "Belgica" },
  { code: "CH", name: "Suiza" },
  { code: "SE", name: "Suecia" },
  { code: "NO", name: "Noruega" },
  { code: "DK", name: "Dinamarca" },
  { code: "FI", name: "Finlandia" },
  { code: "PL", name: "Polonia" },
  { code: "IE", name: "Irlanda" },
  { code: "AT", name: "Austria" },
  { code: "GR", name: "Grecia" },
  { code: "RU", name: "Rusia" },
  { code: "TR", name: "Turquia" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japon" },
  { code: "KR", name: "Corea del Sur" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapur" },
  { code: "AE", name: "Emiratos Arabes Unidos" },
  { code: "SA", name: "Arabia Saudita" },
  { code: "IL", name: "Israel" },
  { code: "ZA", name: "Sudafrica" },
  { code: "NG", name: "Nigeria" },
  { code: "EG", name: "Egipto" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "Nueva Zelanda" },
];

export default function NewCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [country, setCountry] = useState("VE");
  const [sector, setSector] = useState("GENERIC");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function createCompany() {
    setLoading(true);
    setMessage("");

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) { setMessage("Debes iniciar sesion."); setLoading(false); return; }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      // jurisdiction_code no se guardaba aqui -- companies.country y
      // companies.jurisdiction_code son columnas DISTINTAS, y nomina/ISLR/
      // IVA solo leen jurisdiction_code. Antes de este cambio, toda
      // empresa nueva quedaba sin jurisdiccion asignada (o con el
      // respaldo VE) hasta que alguien corriera un UPDATE manual en SQL --
      // eso no escala a cientos de contadores creando clientes en
      // distintos paises. Se usa el mismo codigo de pais elegido en el
      // formulario como jurisdiction_code: hoy coinciden 1 a 1 (el pais
      // ES la jurisdiccion). El dia que haga falta una jurisdiccion mas
      // fina que el pais (ej. un estado de EEUU con reglas propias), este
      // campo se puede separar del selector de pais sin tocar el resto.
      .insert([{ name, tax_id: taxId, country, jurisdiction_code: country, industry_sector: sector, owner_id: userData.user.id }])
      .select("id")
      .single();

    if (companyError || !company) {
      setMessage("Error al crear la empresa: " + companyError?.message);
      setLoading(false);
      return;
    }

    // CRITICO: hay que registrar al usuario como miembro (user_companies) y
    // asignarle el rol ADMIN de esta empresa ANTES de insertar el plan de
    // cuentas -- la politica RLS de insercion en chart_of_accounts exige
    // is_company_member(company_id) AND rol ADMIN/CONTADOR. Si se insertan
    // las cuentas primero (como estaba antes), la RLS las bloquea en
    // silencio (0 filas insertadas, sin lanzar error visible aqui) y el
    // mensaje de "exito" terminaba mostrando la cantidad de PLANTILLAS
    // encontradas, no la cantidad realmente copiada -- la empresa quedaba
    // sin ninguna cuenta aunque el mensaje dijera lo contrario.
    const { error: membershipError } = await supabase
      .from("user_companies")
      .insert([{ user_id: userData.user.id, company_id: company.id, last_active_at: new Date().toISOString() }]);
    if (membershipError) {
      setMessage("Empresa creada pero no se pudo asociar tu usuario: " + membershipError.message + ". No instales el plan de cuentas todavia, contacta soporte.");
      setLoading(false);
      return;
    }

    const { data: adminRole, error: adminRoleLookupError } = await supabase.from("user_roles").select("id").eq("name", "ADMIN").single();
    if (adminRoleLookupError || !adminRole) {
      setMessage("Empresa creada pero no se encontro el rol ADMIN en el sistema (" + (adminRoleLookupError?.message ?? "sin rol ADMIN") + "). No instales el plan de cuentas todavia, contacta soporte.");
      setLoading(false);
      return;
    }
    const { error: roleAssignError } = await supabase.from("user_role_assignments").insert([{
      user_id: userData.user.id,
      role_id: adminRole.id,
      company_id: company.id,
    }]);
    if (roleAssignError) {
      setMessage("Empresa creada pero no se te pudo asignar el rol ADMIN (" + roleAssignError.message + "). No instales el plan de cuentas todavia, contacta soporte.");
      setLoading(false);
      return;
    }

    // Primero se busca una plantilla ESPECIFICA del pais elegido (ej. una
    // plantilla de Construccion pensada para EEUU, con cuentas de
    // retainage/overbillings en vez del estilo venezolano). Si no existe
    // ninguna fila con ese pais para este sector, se usa la plantilla
    // universal (template_jurisdiction_code IS NULL) -- el mismo
    // comportamiento de siempre para Venezuela y cualquier otro pais sin
    // plantilla propia todavia.
    let { data: templateAccounts } = await supabase
      .from("chart_of_accounts")
      .select("id, account_code, account_name, account_type, monetary_type, parent_account_id")
      .is("company_id", null)
      .eq("industry_sector", sector)
      .eq("template_jurisdiction_code", country);

    if (!templateAccounts || templateAccounts.length === 0) {
      const { data: universalTemplate } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name, account_type, monetary_type, parent_account_id")
        .is("company_id", null)
        .is("template_jurisdiction_code", null)
        .eq("industry_sector", sector);
      templateAccounts = universalTemplate ?? [];
    }

    let installedCount = 0;
    if (templateAccounts && templateAccounts.length > 0) {
      // parent_account_id de la plantilla apunta a OTRA fila plantilla
      // (company_id null) -- no se puede copiar tal cual, hay que
      // insertar primero sin jerarquia, mapear codigo -> nuevo id, y
      // luego reconstruir la jerarquia dentro de la empresa nueva.
      const accountsToInsert = templateAccounts.map((a: any) => ({
        account_code: a.account_code,
        account_name: a.account_name,
        account_type: a.account_type,
        monetary_type: a.monetary_type,
        company_id: company.id,
      }));
      const { data: insertedAccounts, error: insertError } = await supabase
        .from("chart_of_accounts")
        .insert(accountsToInsert)
        .select("id, account_code");

      if (insertError) {
        setMessage("ADVERTENCIA: La empresa se creo pero el plan de cuentas NO se pudo instalar (" + insertError.message + "). No debes registrar transacciones sin un plan de cuentas -- contacta soporte.");
        setLoading(false);
        return;
      }

      installedCount = insertedAccounts?.length ?? 0;

      if (insertedAccounts && insertedAccounts.length > 0) {
        const templateIdToCode = new Map(templateAccounts.map((a: any) => [a.id, a.account_code]));
        const codeToNewId = new Map(insertedAccounts.map((a: any) => [a.account_code, a.id]));
        const parentUpdates = templateAccounts
          .filter((a: any) => a.parent_account_id && templateIdToCode.has(a.parent_account_id))
          .map((a: any) => ({
            id: codeToNewId.get(a.account_code),
            parent_account_id: codeToNewId.get(templateIdToCode.get(a.parent_account_id) as string),
          }))
          .filter((u) => u.id && u.parent_account_id);

        for (const u of parentUpdates) {
          await supabase.from("chart_of_accounts").update({ parent_account_id: u.parent_account_id }).eq("id", u.id);
        }
      }
    }

    if (installedCount === 0) {
      setMessage("ADVERTENCIA: La empresa se creo pero NO se instalo ninguna cuenta contable. Contacta soporte antes de usarla - no debes registrar transacciones sin un plan de cuentas.");
      setLoading(false);
      return;
    }
    setMessage("Empresa creada correctamente con " + installedCount + " cuentas instaladas.");
    setLoading(false);
    setTimeout(() => router.push("/select-module"), 2000);
  }

  const inputStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", width: "100%" };
  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Crear Nueva Empresa</h1>

      <div style={{ marginTop: 30, display: "grid", gap: 12, maxWidth: 500 }}>
        <div>
          <label style={{ fontSize: 13, color: "#7dd3fc" }}>NOMBRE DE LA EMPRESA</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} placeholder="Ej. Consultora ABC C.A." />
        </div>

        <div>
          <label style={{ fontSize: 13, color: "#7dd3fc" }}>RIF</label>
          <input value={taxId} onChange={(e) => setTaxId(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} placeholder="Ej. J-123456789" />
        </div>

        <div>
          <label style={{ fontSize: 13, color: "#7dd3fc" }}>PAIS</label>
          <select value={country} onChange={(e) => setCountry(e.target.value)} style={{ ...inputStyle, marginTop: 6 }}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 13, color: "#7dd3fc" }}>SECTOR ECONOMICO (CIIU/CAEV)</label>
          <select value={sector} onChange={(e) => setSector(e.target.value)} style={{ ...inputStyle, marginTop: 6 }}>
            {SECTORS.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
            El sistema instalara automaticamente el plan de cuentas correspondiente a este sector.
          </p>
        </div>

        <button
          onClick={createCompany}
          disabled={loading || !name}
          style={{ marginTop: 10, padding: 14, background: "#22d3ee", color: "black", fontWeight: 900, borderRadius: 12, border: "none" }}
        >
          {loading ? "CREANDO..." : "CREAR EMPRESA"}
        </button>

        {message && (
          <p style={{ color: message.includes("Error") ? "#f87171" : "#4ade80" }}>{message}</p>
        )}
      </div>
    </div>
  );
}
