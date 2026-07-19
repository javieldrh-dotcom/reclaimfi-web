"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function SpecialTaxpayerPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isSpecialTaxpayer, setIsSpecialTaxpayer] = useState(false);
  const [taxId, setTaxId] = useState("");
  const [withholdingAgentNumber, setWithholdingAgentNumber] = useState("");
  const [withholdingRate, setWithholdingRate] = useState("75");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: company } = await supabase.from("companies").select("tax_id, is_special_taxpayer, withholding_agent_number, withholding_rate_percentage").eq("id", cid).single();
        if (company) {
          setTaxId(company.tax_id ?? "");
          setIsSpecialTaxpayer(company.is_special_taxpayer ?? false);
          setWithholdingAgentNumber(company.withholding_agent_number ?? "");
          setWithholdingRate(String(company.withholding_rate_percentage ?? 75));
        }
      }
    }
    load();
  }, []);

  async function saveConfig() {
    if (!companyId) return;
    const { error } = await supabase.from("companies").update({
      tax_id: taxId,
      is_special_taxpayer: isSpecialTaxpayer,
      withholding_agent_number: withholdingAgentNumber,
      withholding_rate_percentage: parseFloat(withholdingRate) || 75,
    }).eq("id", companyId);

    setMessage(error ? "Error: " + error.message : "Configuracion guardada correctamente.");
  }
  const inputStyle = { ...theme.inputStyle, fontSize: 22 };

  return (
    <VerticalPageLayout vertical="accounting" title="Contribuyente Especial" subtitle="Configuracion del regimen de Sujeto Pasivo Especial y Agente de Retencion de IVA" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700 }}>RIF de la Empresa</label>
        <input value={taxId} onChange={(e) => setTaxId(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} placeholder="J-00000000-0" />

        <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, fontSize: 20 }}>
          <input type="checkbox" checked={isSpecialTaxpayer} onChange={(e) => setIsSpecialTaxpayer(e.target.checked)} style={{ width: 22, height: 22 }} />
          Soy Contribuyente Especial (Sujeto Pasivo Especial - SPE)
        </label>

        {isSpecialTaxpayer && (
          <div style={{ ...theme.cardStyle, marginTop: 16 }}>
            <p style={{ fontSize: 18, color: "#B0B8C8", lineHeight: 1.7 }}>
              Como Contribuyente Especial, estas obligado a: declarar IVA quincenalmente (dos periodos: 1-15 y 16-fin de mes, segun el ultimo digito de tu RIF),
              y a retener IVA a tus proveedores en cada compra, salvo excepciones especificas (proveedor contribuyente formal, operaciones menores a 20 U.T. via caja chica, entre otras).
            </p>

            <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 16, display: "block" }}>N de Agente de Retencion</label>
            <input value={withholdingAgentNumber} onChange={(e) => setWithholdingAgentNumber(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />

            <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginTop: 16, display: "block" }}>% de Retencion (Art. 4 de la Providencia vigente)</label>
            <input type="number" value={withholdingRate} onChange={(e) => setWithholdingRate(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
            <p style={{ fontSize: 15, color: "#8B93A7", marginTop: 6 }}>
              El estandar es 75% del impuesto causado (100% en casos especificos del Art. 5). Verifica la Providencia vigente, ya que este porcentaje puede cambiar por decreto.
            </p>
          </div>
        )}

        <button onClick={saveConfig} style={{ ...theme.buttonStyle, marginTop: 20, fontSize: 18 }}>
          GUARDAR CONFIGURACION
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>
    </VerticalPageLayout>
  );
}
