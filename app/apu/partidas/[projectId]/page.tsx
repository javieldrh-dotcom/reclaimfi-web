"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { generateApuOfertaPdf } from "@/app/core/reports/generateApuOfertaPdf";

interface Partida {
  id: string;
  apu_project_id: string;
  item_number: number;
  code: string | null;
  description: string;
  unit: string;
  quantity: number;
  admin_percentage: number;
  profit_percentage: number;
  fscl_calculation_id: string | null;
}

interface LineItem {
  id: string;
  description?: string;
  position_name?: string;
  unit?: string;
  quantity: number;
  unit_cost?: number;
  days?: number;
  daily_rate?: number;
}

interface FsclOption {
  id: string;
  work_system: string;
  fscl_factor: number;
}

interface AiSuggestion {
  materials: { description: string; unit: string; quantity: number }[];
  equipment: { description: string; unit: string; quantity: number }[];
  labor: { positionName: string; quantity: number; days: number }[];
  summary: string;
}

export default function ApuPartidasPage() {
  const theme = getVerticalTheme("apu");
  const params = useParams();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [companyName, setCompanyName] = useState("");
  const [repName, setRepName] = useState("");
  const [repId, setRepId] = useState("");
  const [repPosition, setRepPosition] = useState("");
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [fsclOptions, setFsclOptions] = useState<FsclOption[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [subItems, setSubItems] = useState<Record<string, { materials: LineItem[]; equipment: LineItem[]; labor: LineItem[] }>>({});
  const [message, setMessage] = useState("");

  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newAdmin, setNewAdmin] = useState("15");
  const [newProfit, setNewProfit] = useState("10");
  const [newFsclId, setNewFsclId] = useState("");

  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<Record<string, AiSuggestion>>({});

  const loadPartidas = useCallback(async () => {
    const { data } = await supabase.from("apu_partidas").select("*").eq("apu_project_id", projectId).order("created_at", { ascending: true });
    setPartidas(data ?? []);
  }, [projectId]);

  useEffect(() => {
    async function load() {
      if (!projectId) return;
      const { data: proj } = await supabase.from("apu_projects").select("*").eq("id", projectId).single();
      setProject(proj);
      if (proj?.company_id) {
        const { data: comp } = await supabase.from("companies").select("name, legal_representative_name, legal_representative_id, legal_representative_position").eq("id", proj.company_id).single();
        setCompanyName(comp?.name ?? "");
        setRepName(comp?.legal_representative_name ?? "");
        setRepId(comp?.legal_representative_id ?? "");
        setRepPosition(comp?.legal_representative_position ?? "");
      }
      const { data: fscl } = await supabase.from("apu_fscl_calculations").select("id, work_system, fscl_factor").eq("apu_project_id", projectId).order("created_at", { ascending: false });
      setFsclOptions(fscl ?? []);
      await loadPartidas();
    }
    load();
  }, [projectId, loadPartidas]);

  async function createPartida() {
    setMessage("");
    if (!newDescription || !newUnit) { setMessage("Completa al menos descripcion y unidad."); return; }
    const nextItemNumber = partidas.length > 0 ? Math.max(...partidas.map((p: any) => p.item_number || 0)) + 1 : 1;
    const { error } = await supabase.from("apu_partidas").insert([{
      apu_project_id: projectId,
      item_number: nextItemNumber,
      code: newCode || null,
      description: newDescription,
      unit: newUnit,
      quantity: parseFloat(newQuantity) || 1,
      admin_percentage: parseFloat(newAdmin) || 0,
      profit_percentage: parseFloat(newProfit) || 0,
      fscl_calculation_id: newFsclId || null,
    }]);
    if (error) { setMessage("Error: " + error.message); return; }
    setNewCode(""); setNewDescription(""); setNewUnit(""); setNewQuantity("1"); setNewAdmin("15"); setNewProfit("10"); setNewFsclId("");
    await loadPartidas();
  }

  async function deletePartida(id: string) {
    if (!window.confirm("Eliminar esta partida y todo su detalle de costos?")) return;
    await supabase.from("apu_partidas").delete().eq("id", id);
    await loadPartidas();
  }

  async function loadSubItems(partidaId: string) {
    const [{ data: materials }, { data: equipment }, { data: labor }] = await Promise.all([
      supabase.from("apu_partida_materials").select("*").eq("apu_partida_id", partidaId).order("created_at", { ascending: true }),
      supabase.from("apu_partida_equipment").select("*").eq("apu_partida_id", partidaId).order("created_at", { ascending: true }),
      supabase.from("apu_partida_labor").select("*").eq("apu_partida_id", partidaId).order("created_at", { ascending: true }),
    ]);
    setSubItems((prev) => ({ ...prev, [partidaId]: { materials: materials ?? [], equipment: equipment ?? [], labor: labor ?? [] } }));
  }

  async function toggleExpand(partidaId: string) {
    if (expanded === partidaId) { setExpanded(null); return; }
    setExpanded(partidaId);
    if (!subItems[partidaId]) await loadSubItems(partidaId);
  }

  async function addRow(partidaId: string, table: "apu_partida_materials" | "apu_partida_equipment" | "apu_partida_labor", row: any) {
    const { error } = await supabase.from(table).insert([{ apu_partida_id: partidaId, ...row }]);
    if (error) { setMessage("Error: " + error.message); return; }
    await loadSubItems(partidaId);
  }

  async function deleteRow(partidaId: string, table: "apu_partida_materials" | "apu_partida_equipment" | "apu_partida_labor", id: string) {
    await supabase.from(table).delete().eq("id", id);
    await loadSubItems(partidaId);
  }

  const [bulkSuggesting, setBulkSuggesting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  async function bulkSuggestAllPartidas() {
    const pending = partidas.filter((p) => {
      const items = subItems[p.id];
      return !items || (items.materials.length === 0 && items.equipment.length === 0 && items.labor.length === 0);
    });
    if (pending.length === 0) {
      setMessage("Todas las partidas ya tienen detalle de costos, no hay nada pendiente de sugerir.");
      return;
    }
    if (!window.confirm("Se va a consultar la IA para " + pending.length + " partidas, una por una. Esto tiene un costo de uso de API y puede tardar varios minutos. Continuar?")) return;

    setBulkSuggesting(true);
    setBulkProgress({ current: 0, total: pending.length });

    for (let i = 0; i < pending.length; i++) {
      const p = pending[i];
      setBulkProgress({ current: i + 1, total: pending.length });
      try {
        const res = await fetch("/api/apu-suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: p.description }),
        });
        const data = await res.json();
        if (!data?.error && data?.success !== false) {
          for (const m of data.materials || []) {
            await supabase.from("apu_partida_materials").insert([{ apu_partida_id: p.id, description: m.description, unit: m.unit, quantity: m.quantity, unit_cost: 0 }]);
            await ensureInCatalog("MATERIAL", m.description, m.unit);
          }
          for (const e of data.equipment || []) {
            await supabase.from("apu_partida_equipment").insert([{ apu_partida_id: p.id, description: e.description, unit: e.unit, quantity: e.quantity, unit_cost: 0 }]);
            await ensureInCatalog("EQUIPMENT", e.description, e.unit);
          }
          for (const l of data.labor || []) {
            await supabase.from("apu_partida_labor").insert([{ apu_partida_id: p.id, position_name: l.positionName, quantity: l.quantity, days: l.days, daily_rate: 0 }]);
            await ensureInCatalog("LABOR", l.positionName, "dia");
          }
        }
      } catch (e) {
        // continua con la siguiente partida aunque una falle
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    for (const p of pending) {
      await loadSubItems(p.id);
    }
    setBulkSuggesting(false);
    setBulkProgress(null);
    setMessage("Sugerencias de IA aplicadas a " + pending.length + " partidas. Completa los costos unitarios pendientes en el catalogo o en cada partida.");
  }

  async function requestAiSuggestion(partida: Partida) {
    setAiLoading(partida.id);
    setMessage("");
    try {
      const res = await fetch("/api/apu-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: partida.description }),
      });
      const data = await res.json();
      if (data?.error || data?.success === false) {
        setMessage(data.error || "No se pudo generar la sugerencia.");
      } else {
        setAiSuggestion((prev) => ({ ...prev, [partida.id]: data }));
      }
    } catch (e: any) {
      setMessage("Error consultando IA: " + e.message);
    } finally {
      setAiLoading(null);
    }
  }

  async function ensureInCatalog(category: "MATERIAL" | "EQUIPMENT" | "LABOR", description: string, unit: string | null) {
    if (!project?.company_id || !description) return;
    const { data: existing } = await supabase
      .from("apu_price_catalog")
      .select("id")
      .eq("company_id", project.company_id)
      .eq("category", category)
      .ilike("description", description)
      .limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from("apu_price_catalog").insert([{
        company_id: project.company_id,
        category,
        description,
        unit: unit || null,
        unit_cost: 0,
        notes: "Agregado automaticamente desde sugerencia de IA, precio pendiente",
      }]);
    }
  }

  async function applySuggestions(partidaId: string) {
    const s = aiSuggestion[partidaId];
    if (!s) return;
    for (const m of s.materials) {
      await supabase.from("apu_partida_materials").insert([{ apu_partida_id: partidaId, description: m.description, unit: m.unit, quantity: m.quantity, unit_cost: 0 }]);
      await ensureInCatalog("MATERIAL", m.description, m.unit);
    }
    for (const e of s.equipment) {
      await supabase.from("apu_partida_equipment").insert([{ apu_partida_id: partidaId, description: e.description, unit: e.unit, quantity: e.quantity, unit_cost: 0 }]);
      await ensureInCatalog("EQUIPMENT", e.description, e.unit);
    }
    for (const l of s.labor) {
      await supabase.from("apu_partida_labor").insert([{ apu_partida_id: partidaId, position_name: l.positionName, quantity: l.quantity, days: l.days, daily_rate: 0 }]);
      await ensureInCatalog("LABOR", l.positionName, "dia");
    }
    setAiSuggestion((prev) => { const next = { ...prev }; delete next[partidaId]; return next; });
    await loadSubItems(partidaId);
    setMessage("Sugerencias agregadas y catalogo actualizado. Ahora completa los costos unitarios pendientes (la IA no sugiere precios por si sola).");
  }

  function calc(partida: Partida) {
    const items = subItems[partida.id];
    if (!items) return { materialsCost: 0, equipmentCost: 0, laborCost: 0, directCost: 0, admin: 0, profit: 0, unitPrice: 0, total: 0, factor: 1 };
    const materialsCost = items.materials.reduce((s, m) => s + (m.quantity || 0) * (m.unit_cost || 0), 0);
    const equipmentCost = items.equipment.reduce((s, e) => s + (e.quantity || 0) * (e.unit_cost || 0), 0);
    const fscl = fsclOptions.find((f) => f.id === partida.fscl_calculation_id);
    const factor = fscl ? fscl.fscl_factor : 1;
    const laborCost = items.labor.reduce((s, l) => s + (l.quantity || 0) * (l.days || 0) * (l.daily_rate || 0) * factor, 0);
    const directCost = materialsCost + equipmentCost + laborCost;
    const admin = directCost * ((partida.admin_percentage || 0) / 100);
    const profit = directCost * ((partida.profit_percentage || 0) / 100);
    const unitPrice = directCost + admin + profit;
    return { materialsCost, equipmentCost, laborCost, directCost, admin, profit, unitPrice, total: unitPrice * partida.quantity, factor };
  }

  const [pdfGenerating, setPdfGenerating] = useState(false);

  async function downloadOfertaPdf() {
    setPdfGenerating(true);
    const freshSubItems: typeof subItems = { ...subItems };
    for (const p of partidas) {
      if (!freshSubItems[p.id]) {
        const [{ data: materials }, { data: equipment }, { data: labor }] = await Promise.all([
          supabase.from("apu_partida_materials").select("*").eq("apu_partida_id", p.id),
          supabase.from("apu_partida_equipment").select("*").eq("apu_partida_id", p.id),
          supabase.from("apu_partida_labor").select("*").eq("apu_partida_id", p.id),
        ]);
        freshSubItems[p.id] = { materials: materials ?? [], equipment: equipment ?? [], labor: labor ?? [] };
      }
    }
    setSubItems(freshSubItems);

    const ofertaPartidas = partidas.map((p, idx) => {
      const items = freshSubItems[p.id];
      const materialsCost = (items?.materials ?? []).reduce((s, m) => s + (m.quantity || 0) * (m.unit_cost || 0), 0);
      const equipmentCost = (items?.equipment ?? []).reduce((s, e) => s + (e.quantity || 0) * (e.unit_cost || 0), 0);
      const fscl = fsclOptions.find((f) => f.id === p.fscl_calculation_id);
      const factor = fscl ? fscl.fscl_factor : 1;
      const laborCost = (items?.labor ?? []).reduce((s, l) => s + (l.quantity || 0) * (l.days || 0) * (l.daily_rate || 0) * factor, 0);
      const directCost = materialsCost + equipmentCost + laborCost;
      const admin = directCost * ((p.admin_percentage || 0) / 100);
      const profit = directCost * ((p.profit_percentage || 0) / 100);
      const unitPrice = directCost + admin + profit;
      return {
        itemNumber: idx + 1,
        code: p.code,
        description: p.description,
        unit: p.unit,
        quantity: p.quantity,
        materialsCost,
        equipmentCost,
        laborCost,
        directCost,
        adminPercentage: p.admin_percentage || 0,
        profitPercentage: p.profit_percentage || 0,
        unitPrice,
        total: unitPrice * p.quantity,
      };
    });

    const doc = generateApuOfertaPdf(
      companyName,
      project?.procedure_number ?? "",
      project?.project_description ?? "",
      project?.contracting_entity ?? "",
      ofertaPartidas,
      16,
      repName,
      repId,
      repPosition
    );
    doc.save("oferta-" + (project?.procedure_number ?? "apu") + ".pdf");
    setPdfGenerating(false);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 16 };
  const smallInput = { ...theme.inputStyle, fontSize: 14, padding: 8 };
  return (
    <VerticalPageLayout vertical="apu" title="Partidas de la Oferta" subtitle={project ? project.procedure_number + " - " + project.project_description : "Cargando..."} fullWidth
      actions={
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={bulkSuggestAllPartidas} disabled={bulkSuggesting || partidas.length === 0} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px", opacity: bulkSuggesting || partidas.length === 0 ? 0.6 : 1 }}>
            {bulkSuggesting ? "Procesando " + (bulkProgress?.current ?? 0) + "/" + (bulkProgress?.total ?? 0) + "..." : "Sugerir IA para Todas las Partidas"}
          </button>
          <button onClick={downloadOfertaPdf} disabled={pdfGenerating || partidas.length === 0} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px", opacity: pdfGenerating || partidas.length === 0 ? 0.6 : 1 }}>
            {pdfGenerating ? "Generando..." : "Descargar PDF de Oferta"}
          </button>
        </div>
      }
    >
      <div style={{ ...theme.cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>Nueva Partida</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input value={newCode} onChange={(e) => setNewCode(e.target.value)} style={{ ...inputStyle, width: 120 }} placeholder="Codigo (ej. P-2.06)" />
          <input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 260 }} placeholder="Descripcion de la partida" />
          <input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} style={{ ...inputStyle, width: 90 }} placeholder="Unidad" />
          <input type="number" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} style={{ ...inputStyle, width: 110 }} placeholder="Cantidad" />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ fontSize: 14, color: "#8B93A7" }}>Admin %</label>
          <input type="number" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} style={{ ...inputStyle, width: 80 }} />
          <label style={{ fontSize: 14, color: "#8B93A7" }}>Utilidad %</label>
          <input type="number" value={newProfit} onChange={(e) => setNewProfit(e.target.value)} style={{ ...inputStyle, width: 80 }} />
          <label style={{ fontSize: 14, color: "#8B93A7" }}>Factor FSCL</label>
          <select value={newFsclId} onChange={(e) => setNewFsclId(e.target.value)} style={{ ...inputStyle, width: 220 }}>
            <option value="">Sin factor (x1)</option>
            {fsclOptions.map((f) => <option key={f.id} value={f.id}>{f.work_system} - {f.fscl_factor.toFixed(4)}</option>)}
          </select>
          <button onClick={createPartida} style={{ ...theme.buttonStyle, padding: "10px 20px" }}>Agregar Partida</button>
        </div>
        {message && <p style={{ marginTop: 10, fontSize: 14, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      {partidas.map((p) => {
        const c = calc(p);
        const isOpen = expanded === p.id;
        const items = subItems[p.id];
        const suggestion = aiSuggestion[p.id];
        return (
          <div key={p.id} style={{ ...theme.cardStyle, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer" }} onClick={() => toggleExpand(p.id)}>
              <div>
                <p style={{ fontSize: 12, color: theme.accent, fontFamily: theme.numberStyle.fontFamily }}>{p.code || "S/COD"}</p>
                <p style={{ fontSize: 17, fontWeight: 600 }}>{p.description}</p>
                <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 2 }}>{p.quantity} {p.unit} - Admin {p.admin_percentage}% - Utilidad {p.profit_percentage}%</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 12, color: "#8B93A7" }}>Precio Unitario</p>
                <p style={theme.numberStyle}>{c.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 4 }}>Total</p>
                <p style={{ ...theme.numberStyle, fontWeight: 700, color: theme.accent }}>{c.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {isOpen && (
              <div style={{ marginTop: 16, borderTop: "1px solid " + theme.border, paddingTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#8B93A7" }}>
                    <span>Materiales: {c.materialsCost.toFixed(2)}</span>
                    <span>Equipos: {c.equipmentCost.toFixed(2)}</span>
                    <span>M.O. (x{c.factor.toFixed(2)}): {c.laborCost.toFixed(2)}</span>
                    <span>Directo: {c.directCost.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => requestAiSuggestion(p)} disabled={aiLoading === p.id}
                      style={{ ...theme.buttonStyle, padding: "6px 14px", fontSize: 13, opacity: aiLoading === p.id ? 0.6 : 1 }}>
                      {aiLoading === p.id ? "Consultando IA..." : "Sugerir con IA"}
                    </button>
                    <button onClick={() => deletePartida(p.id)} style={{ padding: "6px 14px", fontSize: 13, background: "none", border: "1px solid #f87171", color: "#f87171", borderRadius: 8, cursor: "pointer" }}>
                      Eliminar partida
                    </button>
                  </div>
                </div>

                {suggestion && (
                  <div style={{ background: theme.background, border: "1px solid " + theme.accent, borderRadius: 10, padding: 12, marginBottom: 14 }}>
                    <p style={{ fontSize: 13, color: theme.accent, fontWeight: 700, marginBottom: 6 }}>Sugerencia IA (solo cantidades, sin precios)</p>
                    <p style={{ fontSize: 12, color: "#8B93A7", marginBottom: 8 }}>{suggestion.summary}</p>
                    <div style={{ fontSize: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      <div>
                        <p style={{ color: "#8B93A7", fontWeight: 700 }}>Materiales</p>
                        {suggestion.materials.map((m, i) => <p key={i}>{m.description} - {m.quantity} {m.unit}</p>)}
                      </div>
                      <div>
                        <p style={{ color: "#8B93A7", fontWeight: 700 }}>Equipos</p>
                        {suggestion.equipment.map((e, i) => <p key={i}>{e.description} - {e.quantity} {e.unit}</p>)}
                      </div>
                      <div>
                        <p style={{ color: "#8B93A7", fontWeight: 700 }}>Mano de Obra</p>
                        {suggestion.labor.map((l, i) => <p key={i}>{l.positionName} - {l.quantity} x {l.days}d</p>)}
                      </div>
                    </div>
                    <button onClick={() => applySuggestions(p.id)} style={{ ...theme.buttonStyle, marginTop: 10, padding: "6px 14px", fontSize: 13 }}>
                      Agregar todo a la partida
                    </button>
                  </div>
                )}

                {items && (
                  <>
                    <LineItemTable
                      label="Materiales" theme={theme} smallInput={smallInput}
                      rows={items.materials} costLabel="Costo Unit."
                      onAdd={(row: any) => addRow(p.id, "apu_partida_materials", row)}
                      onDelete={(id: string) => deleteRow(p.id, "apu_partida_materials", id)}
                    />
                    <LineItemTable
                      label="Equipos" theme={theme} smallInput={smallInput}
                      rows={items.equipment} costLabel="Costo Unit."
                      onAdd={(row: any) => addRow(p.id, "apu_partida_equipment", row)}
                      onDelete={(id: string) => deleteRow(p.id, "apu_partida_equipment", id)}
                    />
                    <LaborTable
                      theme={theme} smallInput={smallInput}
                      rows={items.labor}
                      onAdd={(row: any) => addRow(p.id, "apu_partida_labor", row)}
                      onDelete={(id: string) => deleteRow(p.id, "apu_partida_labor", id)}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {partidas.length === 0 && <p style={{ color: "#8B93A7", fontSize: 15 }}>Aun no hay partidas registradas para este proyecto.</p>}
    </VerticalPageLayout>
  );
}

function LineItemTable({ label, theme, smallInput, rows, costLabel, onAdd, onDelete }: any) {
  const [desc, setDesc] = useState("");
  const [unit, setUnit] = useState("");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: theme.accent, marginBottom: 6 }}>{label}</p>
      {rows.map((r: any) => (
        <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid " + theme.border }}>
          <span>{r.description} ({r.unit})</span>
          <span style={{ display: "flex", gap: 10 }}>
            <span>{r.quantity} x {r.unit_cost}</span>
            <button onClick={() => onDelete(r.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>x</button>
          </span>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} style={{ ...smallInput, flex: 1 }} placeholder="Descripcion" />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} style={{ ...smallInput, width: 70 }} placeholder="Unidad" />
        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} style={{ ...smallInput, width: 80 }} placeholder="Cant." />
        <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} style={{ ...smallInput, width: 90 }} placeholder={costLabel} />
        <button onClick={() => { if (!desc) return; onAdd({ description: desc, unit, quantity: parseFloat(qty) || 0, unit_cost: parseFloat(cost) || 0 }); setDesc(""); setUnit(""); setQty(""); setCost(""); }}
          style={{ padding: "0 12px", background: theme.accent, color: theme.background, border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>+</button>
      </div>
    </div>
  );
}

function LaborTable({ theme, smallInput, rows, onAdd, onDelete }: any) {
  const [pos, setPos] = useState("");
  const [qty, setQty] = useState("");
  const [days, setDays] = useState("");
  const [rate, setRate] = useState("");
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: theme.accent, marginBottom: 6 }}>Mano de Obra</p>
      {rows.map((r: any) => (
        <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid " + theme.border }}>
          <span>{r.position_name}</span>
          <span style={{ display: "flex", gap: 10 }}>
            <span>{r.quantity} x {r.days}d x {r.daily_rate}</span>
            <button onClick={() => onDelete(r.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>x</button>
          </span>
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input value={pos} onChange={(e) => setPos(e.target.value)} style={{ ...smallInput, flex: 1 }} placeholder="Cargo" />
        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} style={{ ...smallInput, width: 70 }} placeholder="Cant." />
        <input type="number" value={days} onChange={(e) => setDays(e.target.value)} style={{ ...smallInput, width: 70 }} placeholder="Dias" />
        <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} style={{ ...smallInput, width: 90 }} placeholder="Tarifa/dia" />
        <button onClick={() => { if (!pos) return; onAdd({ position_name: pos, quantity: parseFloat(qty) || 0, days: parseFloat(days) || 0, daily_rate: parseFloat(rate) || 0 }); setPos(""); setQty(""); setDays(""); setRate(""); }}
          style={{ padding: "0 12px", background: theme.accent, color: theme.background, border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>+</button>
      </div>
    </div>
  );
}