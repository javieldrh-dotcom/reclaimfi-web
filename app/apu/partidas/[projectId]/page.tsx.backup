"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { generateApuOfferPdf } from "@/app/core/reports/generateApuOfferPdf";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { getVerticalTheme } from "@/app/core/design/tokens";

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
  const [editingPartidaId, setEditingPartidaId] = useState<string | null>(null);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [catalogFilter, setCatalogFilter] = useState<string>("SERVICIO");

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

  useEffect(() => {
    async function loadCatalog() {
      const { data } = await supabase.from("apu_catalog_items").select("*").eq("category", catalogFilter);
      setCatalogItems(data ?? []);
    }
    loadCatalog();
  }, [catalogFilter]);

  function useTemplate(item: any) {
    setDescription(item.description);
    setUnit(item.default_unit ?? "UND");
    setMaterials((item.materials_template ?? []).map((m: any) => ({ description: m.description, unit: m.unit, quantity: String(m.quantity), unitCost: String(m.unitCost) })));
    setEquipment((item.equipment_template ?? []).map((e: any) => ({ description: e.description, unit: e.unit, quantity: String(e.quantity), unitCost: String(e.unitCost) })));
    setLabor((item.labor_template ?? []).map((l: any) => ({ positionName: l.positionName, quantity: String(l.quantity), days: String(l.days), dailyRate: String(l.dailyRate) })));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addMaterial() { setMaterials([...materials, { description: "", unit: "", quantity: "", unitCost: "" }]); }
  function addEquipment() { setEquipment([...equipment, { description: "", unit: "", quantity: "", unitCost: "" }]); }
  function addLabor() { setLabor([...labor, { positionName: "", quantity: "", days: "", dailyRate: "" }]); }

  function updateMaterial(i: number, field: string, value: string) { const u = [...materials]; (u[i] as any)[field] = value; setMaterials(u); }
  function updateEquipment(i: number, field: string, value: string) { const u = [...equipment]; (u[i] as any)[field] = value; setEquipment(u); }
  function updateLabor(i: number, field: string, value: string) { const u = [...labor]; (u[i] as any)[field] = value; setLabor(u); }

  async function editPartida(partida: any) {
    setEditingPartidaId(partida.id);
    setDescription(partida.description);
    setUnit(partida.unit);
    setQuantity(String(partida.quantity));
    setAdminPct(String(partida.admin_percentage));
    setProfitPct(String(partida.profit_percentage));
    setFsclId(partida.fscl_calculation_id ?? "");

    const { data: mats } = await supabase.from("apu_partida_materials").select("*").eq("apu_partida_id", partida.id);
    const { data: equips } = await supabase.from("apu_partida_equipment").select("*").eq("apu_partida_id", partida.id);
    const { data: labs } = await supabase.from("apu_partida_labor").select("*").eq("apu_partida_id", partida.id);

    setMaterials((mats ?? []).map((m: any) => ({ description: m.description, unit: m.unit, quantity: String(m.quantity), unitCost: String(m.unit_cost) })));
    setEquipment((equips ?? []).map((e: any) => ({ description: e.description, unit: e.unit, quantity: String(e.quantity), unitCost: String(e.unit_cost) })));
    setLabor((labs ?? []).map((l: any) => ({ positionName: l.position_name, quantity: String(l.quantity), days: String(l.days), dailyRate: String(l.daily_rate) })));

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingPartidaId(null);
    setDescription(""); setMaterials([]); setEquipment([]); setLabor([]);
  }

  async function deletePartida(partidaId: string) {
    if (!window.confirm("Eliminar esta partida y todos sus insumos? Esta accion no se puede deshacer.")) return;
    await supabase.from("apu_partida_materials").delete().eq("apu_partida_id", partidaId);
    await supabase.from("apu_partida_equipment").delete().eq("apu_partida_id", partidaId);
    await supabase.from("apu_partida_labor").delete().eq("apu_partida_id", partidaId);
    await supabase.from("apu_partidas").delete().eq("id", partidaId);
    if (editingPartidaId === partidaId) cancelEdit();
    await loadData();
  }
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

    let partidaId = editingPartidaId;

    if (editingPartidaId) {
      const { error } = await supabase.from("apu_partidas").update({
        description, unit, quantity: parseFloat(quantity),
        admin_percentage: parseFloat(adminPct), profit_percentage: parseFloat(profitPct),
        fscl_calculation_id: fsclId || null,
      }).eq("id", editingPartidaId);
      if (error) { setMessage("Error: " + error.message); return; }

      await supabase.from("apu_partida_materials").delete().eq("apu_partida_id", editingPartidaId);
      await supabase.from("apu_partida_equipment").delete().eq("apu_partida_id", editingPartidaId);
      await supabase.from("apu_partida_labor").delete().eq("apu_partida_id", editingPartidaId);
    } else {
      const nextNum = partidas.length > 0 ? Math.max(...partidas.map((p) => p.item_number)) + 1 : 1;
      const { data: partida, error } = await supabase.from("apu_partidas").insert([{
        apu_project_id: projectId,
        item_number: nextNum,
        description, unit, quantity: parseFloat(quantity),
        admin_percentage: parseFloat(adminPct), profit_percentage: parseFloat(profitPct),
        fscl_calculation_id: fsclId || null,
      }]).select("id").single();
      if (error || !partida) { setMessage("Error: " + error?.message); return; }
      partidaId = partida.id;
    }

    if (materials.length > 0) {
      await supabase.from("apu_partida_materials").insert(materials.filter(m => m.description).map(m => ({
        apu_partida_id: partidaId, description: m.description, unit: m.unit,
        quantity: parseFloat(m.quantity) || 0, unit_cost: parseFloat(m.unitCost) || 0,
      })));
    }
    if (equipment.length > 0) {
      await supabase.from("apu_partida_equipment").insert(equipment.filter(e => e.description).map(e => ({
        apu_partida_id: partidaId, description: e.description, unit: e.unit,
        quantity: parseFloat(e.quantity) || 0, unit_cost: parseFloat(e.unitCost) || 0,
      })));
    }
    if (labor.length > 0) {
      await supabase.from("apu_partida_labor").insert(labor.filter(l => l.positionName).map(l => ({
        apu_partida_id: partidaId, position_name: l.positionName,
        quantity: parseFloat(l.quantity) || 0, days: parseFloat(l.days) || 0, daily_rate: parseFloat(l.dailyRate) || 0,
      })));
    }

    setMessage(editingPartidaId ? "Partida actualizada correctamente." : "Partida guardada. Precio Unitario: " + t.unitPrice.toFixed(2));
    setEditingPartidaId(null);
    setDescription(""); setMaterials([]); setEquipment([]); setLabor([]);
    await loadData();
  }

  const apuTheme = getVerticalTheme("apu");
  const inputStyle = { ...apuTheme.inputStyle, fontSize: 20, padding: 14 };
  const labelStyle = { fontSize: 14, color: "#8B93A7", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 6 };

  async function downloadOfferPdf() {
    const detailedPartidas = await Promise.all(partidas.map(async (p) => {
      const { data: mats } = await supabase.from("apu_partida_materials").select("description, unit, quantity, unit_cost").eq("apu_partida_id", p.id);
      const { data: equips } = await supabase.from("apu_partida_equipment").select("description, unit, quantity, unit_cost").eq("apu_partida_id", p.id);
      const { data: labs } = await supabase.from("apu_partida_labor").select("position_name, quantity, days, daily_rate").eq("apu_partida_id", p.id);
      const selectedFscl = fsclOptions.find((f) => f.id === p.fscl_calculation_id);
      const factor = selectedFscl ? selectedFscl.fscl_factor : 1;

      return {
        itemNumber: p.item_number,
        description: p.description,
        unit: p.unit,
        quantity: p.quantity,
        adminPercentage: p.admin_percentage,
        profitPercentage: p.profit_percentage,
        materials: (mats ?? []).map((m: any) => ({ description: m.description, unit: m.unit, quantity: m.quantity, unitCost: m.unit_cost })),
        equipment: (equips ?? []).map((e: any) => ({ description: e.description, unit: e.unit, quantity: e.quantity, unitCost: e.unit_cost })),
        labor: (labs ?? []).map((l: any) => ({ positionName: l.position_name, quantity: l.quantity, days: l.days, dailyRate: l.daily_rate, fsclFactor: factor })),
      };
    }));

    const doc = generateApuOfferPdf(
      project?.procedure_number ?? "",
      project?.project_description ?? "",
      "",
      detailedPartidas,
      project?.submission_date
    );
    doc.save("oferta-" + (project?.procedure_number ?? "apu") + ".pdf");
  }

  const t = calculateTotals();


  return (
    <VerticalPageLayout
      vertical="apu"
      title={(project?.procedure_number ?? "") + " - Partidas"}
      subtitle={project?.project_description}
      actions={partidas.length > 0 ? (
        <button onClick={downloadOfferPdf} style={{ ...apuTheme.buttonStyle, fontSize: 13, padding: "10px 20px" }}>
          Descargar Oferta PDF
        </button>
      ) : undefined}
    
      fullWidth
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr 1fr", gap: 28, maxWidth: "none" }}>
        <div>
          <label style={labelStyle}>Descripcion de la Partida</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} placeholder="Ej. Cambio de valvula de 6 pulgadas" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
            <div><label style={labelStyle}>Unidad</label><input value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Cantidad</label><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>% Admin</label><input type="number" value={adminPct} onChange={(e) => setAdminPct(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>% Utilidad</label><input type="number" value={profitPct} onChange={(e) => setProfitPct(e.target.value)} style={inputStyle} /></div>
          </div>

          {fsclOptions.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Factor de Costo Laboral (opcional)</label>
              <select value={fsclId} onChange={(e) => setFsclId(e.target.value)} style={inputStyle}>
                <option value="">Sin factor FSCL (moneda/pais sin CCTP)</option>
                {fsclOptions.map((f) => <option key={f.id} value={f.id}>{f.work_system} - Factor {f.fscl_factor?.toFixed(4)}</option>)}
              </select>
            </div>
          )}

          <h3 style={{ marginTop: 28, color: "#4ade80", fontSize: 19, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block" }}></span>
            Materiales
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
            <label style={labelStyle}>Descripcion</label>
            <label style={labelStyle}>Unidad</label>
            <label style={labelStyle}>Cantidad</label>
            <label style={labelStyle}>Costo Unitario</label>
          </div>
          {materials.map((m, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
              <input value={m.description} onChange={(e) => updateMaterial(i, "description", e.target.value)} style={inputStyle} placeholder="Ej. Valvula 6 pulgadas" />
              <input value={m.unit} onChange={(e) => updateMaterial(i, "unit", e.target.value)} style={inputStyle} placeholder="UND" />
              <input type="number" value={m.quantity} onChange={(e) => updateMaterial(i, "quantity", e.target.value)} style={inputStyle} placeholder="1" />
              <input type="number" value={m.unitCost} onChange={(e) => updateMaterial(i, "unitCost", e.target.value)} style={inputStyle} placeholder="0.00" />
            </div>
          ))}
          <button onClick={addMaterial} style={{ marginTop: 10, color: "#4ade80", fontSize: 15, background: "none", border: "1px dashed #4ade8060", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>+ Agregar Material</button>

          <h3 style={{ marginTop: 28, color: "#facc15", fontSize: 19, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#facc15", display: "inline-block" }}></span>
            Equipos
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
            <label style={labelStyle}>Descripcion</label>
            <label style={labelStyle}>Unidad</label>
            <label style={labelStyle}>Cantidad</label>
            <label style={labelStyle}>Costo Unitario</label>
          </div>
          {equipment.map((e, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
              <input value={e.description} onChange={(ev) => updateEquipment(i, "description", ev.target.value)} style={inputStyle} placeholder="Ej. Llave de torque" />
              <input value={e.unit} onChange={(ev) => updateEquipment(i, "unit", ev.target.value)} style={inputStyle} placeholder="UND" />
              <input type="number" value={e.quantity} onChange={(ev) => updateEquipment(i, "quantity", ev.target.value)} style={inputStyle} placeholder="1" />
              <input type="number" value={e.unitCost} onChange={(ev) => updateEquipment(i, "unitCost", ev.target.value)} style={inputStyle} placeholder="0.00" />
            </div>
          ))}
          <button onClick={addEquipment} style={{ marginTop: 10, color: "#facc15", fontSize: 15, background: "none", border: "1px dashed #facc1560", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>+ Agregar Equipo</button>

          <h3 style={{ marginTop: 28, color: "#f87171", fontSize: 19, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171", display: "inline-block" }}></span>
            Labor Directa
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
            <label style={labelStyle}>Cargo</label>
            <label style={labelStyle}>Cantidad</label>
            <label style={labelStyle}>Dias</label>
            <label style={labelStyle}>Tarifa Diaria</label>
          </div>
          {labor.map((l, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
              <input value={l.positionName} onChange={(ev) => updateLabor(i, "positionName", ev.target.value)} style={inputStyle} placeholder="Ej. Tecnico Mecanico" />
              <input type="number" value={l.quantity} onChange={(ev) => updateLabor(i, "quantity", ev.target.value)} style={inputStyle} placeholder="1" />
              <input type="number" value={l.days} onChange={(ev) => updateLabor(i, "days", ev.target.value)} style={inputStyle} placeholder="2" />
              <input type="number" value={l.dailyRate} onChange={(ev) => updateLabor(i, "dailyRate", ev.target.value)} style={inputStyle} placeholder="0.00" />
            </div>
          ))}
          <button onClick={addLabor} style={{ marginTop: 10, color: "#f87171", fontSize: 15, background: "none", border: "1px dashed #f8717160", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>+ Agregar Labor</button>

          <button onClick={savePartida} style={{ marginTop: 28, padding: 18, background: apuTheme.accent, color: "#0B0E14", fontWeight: 700, borderRadius: 12, border: "none", fontSize: 17, width: "100%", cursor: "pointer" }}>
            {editingPartidaId ? "ACTUALIZAR PARTIDA" : "GUARDAR PARTIDA"}
          </button>
          {editingPartidaId && (
            <button onClick={cancelEdit} style={{ marginTop: 10, padding: 12, background: "none", color: "#8B93A7", border: "1px solid #1F2937", borderRadius: 12, fontSize: 14, width: "100%", cursor: "pointer" }}>
              Cancelar Edicion
            </button>
          )}
          {message && <p style={{ marginTop: 12, fontSize: 15, color: message.includes("Error") ? "#f87171" : "#4ade80" }}>{message}</p>}
        </div>

        <div style={{ position: "sticky", top: 20, alignSelf: "start" }}>
          <div style={{ padding: 24, background: "#12161F", borderRadius: 16, border: "1px solid " + apuTheme.accent + "40" }}>
            <h3 style={{ fontSize: 16, color: apuTheme.accent, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Resumen del Costo</h3>
            <div style={{ fontSize: 15, lineHeight: 1.8 }}>
              <p>Materiales: {t.materialsCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p>Equipos: {t.equipmentCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p>Labor: {t.laborCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <div style={{ borderTop: "1px solid #1F2937", marginTop: 10, paddingTop: 10 }}>
                <p>Costo Directo: {t.directCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <p>+ Admin: {t.admin.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <p>+ Utilidad: {t.profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div style={{ marginTop: 14, padding: 14, background: "#0B0E14", borderRadius: 10 }}>
                <p style={{ fontWeight: 700, color: "#4ade80", fontSize: 18 }}>Precio Unitario</p>
                <p style={{ fontWeight: 700, fontSize: 24, fontFamily: "monospace" }}>{t.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <p style={{ fontWeight: 700, color: "#8B93A7", fontSize: 14, marginTop: 8 }}>Total (x {quantity})</p>
                <p style={{ fontWeight: 700, fontSize: 20, fontFamily: "monospace" }}>{t.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {partidas.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 18, color: apuTheme.accent, marginBottom: 12 }}>Partidas Guardadas ({partidas.length})</h3>
              {partidas.map((p) => (
                <div key={p.id} style={{ padding: 16, background: "#12161F", borderRadius: 12, border: "1px solid #1F2937", marginBottom: 10 }}>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>{p.item_number}. {p.description}</p>
                  <p style={{ fontSize: 13, color: "#8B93A7", marginTop: 2 }}>{p.quantity} {p.unit}</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={() => editPartida(p)} style={{ flex: 1, background: "none", border: "1px solid #7dd3fc", color: "#7dd3fc", padding: "6px 0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                      Editar
                    </button>
                    <button onClick={() => deletePartida(p.id)} style={{ flex: 1, background: "none", border: "1px solid #f87171", color: "#f87171", padding: "6px 0", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{ position: "sticky", top: 20 }}>
            <h3 style={{ fontSize: 16, color: apuTheme.accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Catalogo de Partidas</h3>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["OBRA", "SERVICIO", "DISTRIBUCION"].map((cat) => (
                <button key={cat} onClick={() => setCatalogFilter(cat)} style={{ flex: 1, padding: "8px 4px", fontSize: 12, background: catalogFilter === cat ? apuTheme.accent : "#12161F", color: catalogFilter === cat ? "#0B0E14" : "#8B93A7", border: "1px solid #1F2937", borderRadius: 8, cursor: "pointer" }}>
                  {cat}
                </button>
              ))}
            </div>
            {catalogItems.length === 0 && <p style={{ fontSize: 14, color: "#8B93A7" }}>Sin partidas de catalogo para esta categoria.</p>}
            {catalogItems.map((item) => (
              <div key={item.id} style={{ padding: 14, background: "#12161F", borderRadius: 12, border: "1px solid #1F2937", marginBottom: 10 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{item.description}</p>
                <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 2 }}>Unidad: {item.default_unit}</p>
                <button onClick={() => useTemplate(item)} style={{ marginTop: 8, width: "100%", padding: "6px 0", fontSize: 12, background: "none", border: "1px solid " + apuTheme.accent, color: apuTheme.accent, borderRadius: 8, cursor: "pointer" }}>
                  Usar esta plantilla
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VerticalPageLayout>
  );
}
