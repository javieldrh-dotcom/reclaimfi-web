"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { generateApuCostSummaryPdf } from "@/app/core/reports/generateApuCostSummaryPdf";

export default function CostSummaryPage() {
  const theme = getVerticalTheme("apu");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [repName, setRepName] = useState("");
  const [repId, setRepId] = useState("");
  const [repPosition, setRepPosition] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [bcvRate, setBcvRate] = useState(0);
  const [bcvMessage, setBcvMessage] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: companyData } = await supabase.from("companies").select("name, legal_representative_name, legal_representative_id, legal_representative_position").eq("id", cid).single();
        setCompanyName(companyData?.name ?? "");
        setRepName(companyData?.legal_representative_name ?? "");
        setRepId(companyData?.legal_representative_id ?? "");
        setRepPosition(companyData?.legal_representative_position ?? "");
        const { data: proj } = await supabase.from("apu_projects").select("id, procedure_number, project_description").eq("company_id", cid).order("created_at", { ascending:false });
        setProjects(proj ?? []);
      }
      try {
        const res = await fetch("/api/bcv-rate");
        const json = await res.json();
        if (json.success) {
          setBcvRate(json.rate);
        } else {
          setBcvMessage("No se pudo obtener la tasa BCV automaticamente. Ingresala manualmente abajo.");
        }
      } catch {
        setBcvMessage("No se pudo obtener la tasa BCV automaticamente. Ingresala manualmente abajo.");
      }
    }
    load();
  }, []);

  async function calculateSummary(projectId: string) {
    setSelectedProjectId(projectId);
    setLoading(true);

    const { data: partidas } = await supabase.from("apu_partidas").select("*").eq("apu_project_id", projectId);
    const { data: fsclOptions } = await supabase.from("apu_fscl_calculations").select("id, fscl_factor").eq("apu_project_id", projectId);

    let totalMaterials = 0, totalEquipment = 0, totalLabor = 0, totalAdmin = 0, totalProfit = 0;

    for (const p of partidas ?? []) {
      const { data: mats } = await supabase.from("apu_partida_materials").select("quantity, unit_cost").eq("apu_partida_id", p.id);
      const { data: equips } = await supabase.from("apu_partida_equipment").select("quantity, unit_cost").eq("apu_partida_id", p.id);
      const { data: labs } = await supabase.from("apu_partida_labor").select("quantity, days, daily_rate").eq("apu_partida_id", p.id);

      const materialsCost = (mats ?? []).reduce((s: number, m: any) => s + (m.quantity || 0) * (m.unit_cost || 0), 0);
      const equipmentCost = (equips ?? []).reduce((s: number, e: any) => s + (e.quantity || 0) * (e.unit_cost || 0), 0);
      const fscl = (fsclOptions ?? []).find((f: any) => f.id === p.fscl_calculation_id);
      const factor = fscl ? fscl.fscl_factor : 1;
      const laborCost = (labs ?? []).reduce((s: number, l: any) => s + (l.quantity || 0) * (l.days || 0) * (l.daily_rate || 0) * factor, 0);

      const directCost = materialsCost + equipmentCost + laborCost;
      const admin = directCost * ((p.admin_percentage || 0) / 100);
      const profit = directCost * ((p.profit_percentage || 0) / 100);

      totalMaterials += materialsCost * (p.quantity || 1);
      totalEquipment += equipmentCost * (p.quantity || 1);
      totalLabor += laborCost * (p.quantity || 1);
      totalAdmin += admin * (p.quantity || 1);
      totalProfit += profit * (p.quantity || 1);
    }

    const directTotal = totalMaterials + totalEquipment + totalLabor;
    const grandTotal = directTotal + totalAdmin + totalProfit;
    const adminPercentage = directTotal > 0 ? (totalAdmin / directTotal) * 100 : 0;
    const profitPercentage = directTotal > 0 ? (totalProfit / directTotal) * 100 : 0;

    setSummary({ totalMaterials, totalEquipment, totalLabor, totalAdmin, totalProfit, adminPercentage, profitPercentage, grandTotal, partidaCount: (partidas ?? []).length });
    setLoading(false);
  }

  function downloadPdf() {
    if (!summary) return;
    const project = projects.find((p) => p.id === selectedProjectId);
    const doc = generateApuCostSummaryPdf(
      companyName,
      project?.procedure_number ?? "",
      project?.project_description ?? "",
      {
        totalMaterials: summary.totalMaterials,
        totalEquipment: summary.totalEquipment,
        totalLabor: summary.totalLabor,
        totalAdmin: summary.totalAdmin,
        totalProfit: summary.totalProfit,
        adminPercentage: summary.adminPercentage,
        profitPercentage: summary.profitPercentage,
        bcvRate: bcvRate,
        ivaRate: 16,
      },
      repName,
      repId,
      repPosition
    );
    doc.save("resumen-elemento-costo-" + (project?.procedure_number ?? "apu") + ".pdf");
  }

  return (
    <VerticalPageLayout vertical="apu" title="Resumen por Elemento de Costo" subtitle="Vista ejecutiva consolidada de la oferta (Formato II.12)" fullWidth
      actions={summary ? (
        <button onClick={downloadPdf} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px" }}>
          Descargar PDF
        </button>
      ) : undefined}
    >
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <label style={{ fontSize: 18, color: theme.accent, fontWeight: 700 }}>Selecciona un Proyecto</label>
        <select onChange={(e) => calculateSummary(e.target.value)} style={{ ...theme.inputStyle, fontSize: 20, marginTop: 8 }}>
          <option value="">Selecciona...</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.procedure_number} - {p.project_description}</option>)}
        </select>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 14, color: "#8B93A7" }}>Tasa BCV (Bs/USD) {bcvMessage && "- " + bcvMessage}</label>
          <input type="number" value={bcvRate} onChange={(e) => setBcvRate(parseFloat(e.target.value) || 0)} style={{ ...theme.inputStyle, marginTop: 6 }} />
        </div>

        {loading && <p style={{ marginTop: 20, fontSize: 18, color: "#8B93A7" }}>Calculando...</p>}

        {summary && !loading && (
          <div style={{ ...theme.cardStyle, marginTop: 24 }}>
            <h3 style={{ fontSize: 22, color: theme.accent, fontWeight: 700, marginBottom: 16 }}>Elementos de Costo ({summary.partidaCount} partidas)</h3>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 }}><span>Materiales</span><span style={theme.numberStyle}>{summary.totalMaterials.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 }}><span>Equipos</span><span style={theme.numberStyle}>{summary.totalEquipment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 }}><span>Labor (con factor FSCL)</span><span style={theme.numberStyle}>{summary.totalLabor.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 }}><span>Administracion ({summary.adminPercentage.toFixed(1)}%)</span><span style={theme.numberStyle}>{summary.totalAdmin.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: 8, fontSize: 20 }}><span>Utilidad ({summary.profitPercentage.toFixed(1)}%)</span><span style={theme.numberStyle}>{summary.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
            <div style={{ marginTop: 16, padding: 16, background: "#0B0E14", borderRadius: 12, display: "flex", justifyContent: "space-between", fontSize: 26, fontWeight: 900, color: "#4ade80" }}>
              <span>Total General</span>
              <span style={theme.numberStyle}>{summary.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}
      </div>
    </VerticalPageLayout>
  );
}