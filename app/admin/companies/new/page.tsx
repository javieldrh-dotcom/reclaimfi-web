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
      .insert([{ name, country, industry_sector: sector, owner_id: userData.user.id }])
      .select("id")
      .single();

    if (companyError || !company) {
      setMessage("Error al crear la empresa: " + companyError?.message);
      setLoading(false);
      return;
    }

    const { data: templateAccounts } = await supabase
      .from("chart_of_accounts")
      .select("account_code, account_name, account_type, monetary_type, parent_account_id")
      .eq("industry_sector", sector);

    if (templateAccounts && templateAccounts.length > 0) {
      const accountsToInsert = templateAccounts.map((a: any) => ({
        account_code: a.account_code,
        account_name: a.account_name,
        account_type: a.account_type,
        monetary_type: a.monetary_type,
        company_id: company.id,
        parent_account_id: a.parent_account_id,
      }));
      await supabase.from("chart_of_accounts").insert(accountsToInsert);
    }

    const { data: adminRole } = await supabase.from("user_roles").select("id").eq("name", "ADMIN").single();
    if (adminRole) {
      await supabase.from("user_role_assignments").insert([{
        user_id: userData.user.id,
        role_id: adminRole.id,
        company_id: company.id,
      }]);
    }

    setMessage("Empresa creada correctamente con " + (templateAccounts?.length ?? 0) + " cuentas instaladas.");
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
