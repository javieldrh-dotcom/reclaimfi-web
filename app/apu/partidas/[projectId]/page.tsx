"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { generateFinancialStatementPdf } from "@/app/core/reports/generateFinancialStatementPdf";

export default function PartidasPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [partidas, setPartidas] = useState<any[]>([]);
  const [fsclOptions, setFsclOptions] = useState<any[]>([]);

  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("UND");
  const [quantity, setQuantity] = useState("1");
  const [adminPct, setAdminPct] = useState("12.5");
  const [profitPct, setProfitPct] = useState("15");
  const [fsclId, setFsclId] = useState("");

  const [materials, setMaterials] = useState<{ description: string; unit: string; quantity: string; unitCost: string }[]>([]);
  const [equipment, setEquipment] = useState<{ description: string; unit: string; quantity: string; unitCost: string }[]>([]);
  const [labor, setLabor] = useState<{ positionName: string; quantity: string; days: string; dailyRate: string }[]>([]);

  const [message, setMessage] = useState("");

  async function loadData() {
    const { data: proj } = await supabase.from("apu_projects").select("*").eq("id", projectId).single();
    setProject(proj);

    const { data: fscl } = await supabase.from("apu_fscl_calculations").select("id, work_system, fscl_factor").eq("apu_project_id", projectId);
    setFsclOptions(fscl ?? []);

    const { data: parts } = await supabase.from("apu_partidas").select("*").eq("apu_project_id", projectId).order("item_number");
    setPartidas(parts ?? []);
  }

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);
  function addMaterial() { setMaterials([...materials, { description: "", unit: "", quantity: "", unitCost: "" }]); }
  function addEquipment() { setEquipment([...equipment, { description: "", unit: "", quantity: "", unitCost: "" }]); }
  function addLabor() { setLabor([...labor, { positionName: "", quantity: "", days: "", dailyRate: "" }]); }

  function updateMaterial(i: number, field: string, value: string) { const u = [...materials]; (u[i] as any)[field] = value; setMaterials(u); }
  function updateEquipment(i: number, field: string, value: string) { const u = [...equipment]; (u[i] as any)[field] = value; setEquipment(u); }
  function updateLabor(i: number, field: string, value: string) { const u = [...labor]; (u[i] as any)[field] = value; setLabor(u); }

  function calculateTotals() {
    const materialsCost = materials.reduce((s, m) => s + (parseFloat(m.quantity) || 0) * (parseFloat(m.unitCost) || 0), 0);
    const equipmentCost = equipment.reduce((s, e) => s + (parseFloat(e.quantity) || 0) * (parseFloat(e.unitCost) || 0), 0);
    const selectedFscl = fsclOptions.find((f) => f.id === fsclId);
    const factor = selectedFscl ? selectedFscl.fscl_factor : 1;
    const laborCost = labor.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.days) || 0) * (parseFloat(l.dailyRate) || 0) * factor, 0);

    const directCost = materialsCost + equipmentCost + laborCost;
    const admin = directCost * ((parseFloat(adminPct) || 0) / 100);
    const profit = directCost * ((parseFloat(profitPct) || 0) / 100);
    const unitPrice = directCost + admin + profit;
    const total = unitPrice * (parseFloat(quantity) || 0);

    return { materialsCost, equipmentCost, laborCost, directCost, admin, profit, unitPrice, total };
  }

  async function savePartida() {
    setMessage("");
    if (!description) { setMessage("Agrega una descripcion."); return; }

    const t = calculateTotals();
    const nextNum = partidas.length > 0 ? Math.max(...partidas.map((p) => p.item_number)) + 1 : 1;

    const { data: partida, error } = await supabase.from("apu_partidas").insert([{
      apu_project_id: projectId,
      item_number: nextNum,
      description,
      unit,
      quantity: parseFloat(quantity),
      admin_percentage: parseFloat(adminPct),
      profit_percentage: parseFloat(profitPct),
      fscl_calculation_id: fsclId || null,
    }]).select("id").single();

    if (error || !partida) { setMessage("Error: " + error?.message); return; }

    if (materials.length > 0) {
      await supabase.from("apu_partida_materials").insert(materials.filter(m => m.description).map(m => ({
        apu_partida_id: partida.id, description: m.description, unit: m.unit,
        quantity: parseFloat(m.quantity) || 0, unit_cost: parseFloat(m.unitCost) || 0,
      })));
    }
    if (equipment.length > 0) {
      await supabase.from("apu_partida_equipment").insert(equipment.filter(e => e.description).map(e => ({
        apu_partida_id: partida.id, description: e.description, unit: e.unit,
        quantity: parseFloat(e.quantity) || 0, unit_cost: parseFloat(e.unitCost) || 0,
      })));
    }
    if (labor.length > 0) {
      await supabase.from("apu_partida_labor").insert(labor.filter(l => l.positionName).map(l => ({
        apu_partida_id: partida.id, position_name: l.positionName,
        quantity: parseFloat(l.quantity) || 0, days: parseFloat(l.days) || 0, daily_rate: parseFloat(l.dailyRate) || 0,
      })));
    }

    setMessage("Partida guardada. Precio Unitario: " + t.unitPrice.toFixed(2));
    setDescription(""); setMaterials([]); setEquipment([]); setLabor([]);
    await loadData();
  }

  const inputStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 6, color: "white", width: "100%", fontSize: 12 };

  function downloadOfferPdf() {
    const doc = generateFinancialStatementPdf(
      "PRESENTACION DE OFERTA - " + (project?.procedure_number ?? ""),
      project?.project_description ?? "",
      [
        { title: "Partidas de la Oferta", items: partidas.map((p) => ({ code: String(p.item_number), name: p.description + " (" + p.quantity + " " + p.unit + ")", amount: 0 })), total: 0, totalLabel: "Ver detalle en sistema" },
      ],
      "Total de Partidas",
      partidas.length
    );
    doc.save("oferta-" + (project?.procedure_number ?? "apu") + ".pdf");
  }

  const t = calculateTotals();

  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#7dd3fc" }}>{project?.procedure_number} - Partidas</h1>
      <p style={{ marginTop: 6, color: "#9ca3af", fontSize: 12 }}>{project?.project_description}</p>
      {partidas.length > 0 && (
        <button onClick={downloadOfferPdf} style={{ marginTop: 12, padding: 10, background: "#4ade80", color: "black", fontWeight: 900, borderRadius: 10, border: "none", fontSize: 12 }}>
          DESCARGAR OFERTA PDF
        </button>
      )}

      <div style={{ marginTop: 30, maxWidth: 700 }}>
        <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} placeholder="Descripcion de la partida" />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} placeholder="Unidad" />
          <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} placeholder="Cantidad" />
          <input type="number" value={adminPct} onChange={(e) => setAdminPct(e.target.value)} style={inputStyle} placeholder="% Admin" />
          <input type="number" value={profitPct} onChange={(e) => setProfitPct(e.target.value)} style={inputStyle} placeholder="% Utilidad" />
        </div>

        {fsclOptions.length > 0 && (
          <select value={fsclId} onChange={(e) => setFsclId(e.target.value)} style={{ ...inputStyle, marginTop: 8 }}>
            <option value="">Sin factor FSCL (moneda/pais sin CCTP)</option>
            {fsclOptions.map((f) => <option key={f.id} value={f.id}>{f.work_system} - Factor {f.fscl_factor?.toFixed(4)}</option>)}
          </select>
        )}

        <h3 style={{ marginTop: 16, color: "#4ade80" }}>Materiales</h3>
        {materials.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <input value={m.description} onChange={(e) => updateMaterial(i, "description", e.target.value)} style={inputStyle} placeholder="Descripcion" />
            <input value={m.unit} onChange={(e) => updateMaterial(i, "unit", e.target.value)} style={inputStyle} placeholder="Unidad" />
            <input type="number" value={m.quantity} onChange={(e) => updateMaterial(i, "quantity", e.target.value)} style={inputStyle} placeholder="Cant." />
            <input type="number" value={m.unitCost} onChange={(e) => updateMaterial(i, "unitCost", e.target.value)} style={inputStyle} placeholder="Costo U." />
          </div>
        ))}
        <button onClick={addMaterial} style={{ marginTop: 6, color: "#4ade80", fontSize: 12 }}>+ Material</button>

        <h3 style={{ marginTop: 16, color: "#facc15" }}>Equipos</h3>
        {equipment.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <input value={e.description} onChange={(ev) => updateEquipment(i, "description", ev.target.value)} style={inputStyle} placeholder="Descripcion" />
            <input value={e.unit} onChange={(ev) => updateEquipment(i, "unit", ev.target.value)} style={inputStyle} placeholder="Unidad" />
            <input type="number" value={e.quantity} onChange={(ev) => updateEquipment(i, "quantity", ev.target.value)} style={inputStyle} placeholder="Cant." />
            <input type="number" value={e.unitCost} onChange={(ev) => updateEquipment(i, "unitCost", ev.target.value)} style={inputStyle} placeholder="Costo U." />
          </div>
        ))}
        <button onClick={addEquipment} style={{ marginTop: 6, color: "#facc15", fontSize: 12 }}>+ Equipo</button>

        <h3 style={{ marginTop: 16, color: "#f87171" }}>Labor Directa</h3>
        {labor.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <input value={l.positionName} onChange={(ev) => updateLabor(i, "positionName", ev.target.value)} style={inputStyle} placeholder="Cargo" />
            <input type="number" value={l.quantity} onChange={(ev) => updateLabor(i, "quantity", ev.target.value)} style={inputStyle} placeholder="Cant." />
            <input type="number" value={l.days} onChange={(ev) => updateLabor(i, "days", ev.target.value)} style={inputStyle} placeholder="Dias" />
            <input type="number" value={l.dailyRate} onChange={(ev) => updateLabor(i, "dailyRate", ev.target.value)} style={inputStyle} placeholder="Tarifa Diaria" />
          </div>
        ))}
        <button onClick={addLabor} style={{ marginTop: 6, color: "#f87171", fontSize: 12 }}>+ Labor</button>

        <div style={{ marginTop: 20, padding: 16, background: "#0d1117", borderRadius: 12, fontSize: 13 }}>
          <p>Costo Materiales: {t.materialsCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p>Costo Equipos: {t.equipmentCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p>Costo Labor (con factor FSCL si aplica): {t.laborCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p style={{ marginTop: 6 }}>Costo Directo: {t.directCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p>+ Administracion: {t.admin.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p>+ Utilidad: {t.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p style={{ fontWeight: 900, color: "#4ade80", marginTop: 6 }}>Precio Unitario: {t.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p style={{ fontWeight: 900 }}>Total (x Cantidad): {t.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>

        <button onClick={savePartida} style={{ marginTop: 16, padding: 14, background: "#22d3ee", color: "black", fontWeight: 900, borderRadius: 12, border: "none" }}>
          GUARDAR PARTIDA
        </button>
        {message && <p style={{ color: message.includes("Error") ? "#f87171" : "#4ade80" }}>{message}</p>}
      </div>

      {partidas.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, color: "#7dd3fc" }}>Partidas Guardadas</h2>
          {partidas.map((p) => (
            <div key={p.id} style={{ padding: 10, borderBottom: "1px solid #1a3050" }}>
              {p.item_number}. {p.description} - {p.quantity} {p.unit}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
