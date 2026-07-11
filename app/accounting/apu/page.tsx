"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function ApuPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [desc, setDesc] = useState("");
  const [unit, setUnit] = useState("UND");
  const [qty, setQty] = useState("1");
  const [materials, setMaterials] = useState("0");
  const [equipment, setEquipment] = useState("0");
  const [labor, setLabor] = useState("0");
  const [adminPct, setAdminPct] = useState("12.5");
  const [profitPct, setProfitPct] = useState("15");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data } = await supabase.from("apu_items").select("*").eq("company_id", cid).order("item_number");
        setItems(data ?? []);
      }
    }
    load();
  }, []);

  function calc() {
    const directCost = (parseFloat(materials) || 0) + (parseFloat(equipment) || 0) + (parseFloat(labor) || 0);
    const admin = directCost * ((parseFloat(adminPct) || 0) / 100);
    const profit = directCost * ((parseFloat(profitPct) || 0) / 100);
    const unitPrice = directCost + admin + profit;
    const total = unitPrice * (parseFloat(qty) || 0);
    return { directCost, admin, profit, unitPrice, total };
  }

  async function saveItem() {
    if (!companyId) return;
    const c = calc();
    const nextNum = items.length > 0 ? Math.max(...items.map((i) => i.item_number)) + 1 : 1;
    const { error } = await supabase.from("apu_items").insert([{
      company_id: companyId,
      item_number: nextNum,
      description: desc,
      unit,
      quantity: parseFloat(qty) || 0,
      materials_cost: parseFloat(materials) || 0,
      equipment_cost: parseFloat(equipment) || 0,
      labor_cost: parseFloat(labor) || 0,
      admin_percentage: parseFloat(adminPct) || 0,
      profit_percentage: parseFloat(profitPct) || 0,
      unit_price: c.unitPrice,
      total_offer: c.total,
    }]);
    if (!error) {
      const { data } = await supabase.from("apu_items").select("*").eq("company_id", companyId).order("item_number");
      setItems(data ?? []);
      setDesc(""); setMaterials("0"); setEquipment("0"); setLabor("0");
    }
  }

  const c = calc();
  const inputStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 8, color: "white", width: "100%" };
  const grandTotal = items.reduce((s, i) => s + (i.total_offer || 0), 0);

  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Analisis de Precios Unitarios (APU)</h1>
      <div style={{ marginTop: 30, display: "grid", gap: 10, maxWidth: 600 }}>
        <input placeholder="Descripcion de la partida" value={desc} onChange={(e) => setDesc(e.target.value)} style={inputStyle} />
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="Unidad" value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} />
          <input placeholder="Cantidad" type="number" value={qty} onChange={(e) => setQty(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="Materiales" type="number" value={materials} onChange={(e) => setMaterials(e.target.value)} style={inputStyle} />
          <input placeholder="Equipo" type="number" value={equipment} onChange={(e) => setEquipment(e.target.value)} style={inputStyle} />
          <input placeholder="Labor" type="number" value={labor} onChange={(e) => setLabor(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="% Administracion" type="number" value={adminPct} onChange={(e) => setAdminPct(e.target.value)} style={inputStyle} />
          <input placeholder="% Utilidad" type="number" value={profitPct} onChange={(e) => setProfitPct(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ padding: 12, background: "#0d1117", borderRadius: 8, fontSize: 13 }}>
          <p>Costo Directo: {c.directCost.toLocaleString()}</p>
          <p>+ Administracion: {c.admin.toLocaleString()}</p>
          <p>+ Utilidad: {c.profit.toLocaleString()}</p>
          <p style={{ fontWeight: 900, color: "#4ade80" }}>Precio Unitario: {c.unitPrice.toLocaleString()}</p>
          <p style={{ fontWeight: 900 }}>Total Oferta (x cantidad): {c.total.toLocaleString()}</p>
        </div>
        <button onClick={saveItem} style={{ padding: 14, background: "#22d3ee", color: "black", fontWeight: 900, borderRadius: 12, border: "none" }}>AGREGAR PARTIDA</button>
      </div>
      {items.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, color: "#7dd3fc" }}>Partidas del Presupuesto</h2>
          <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#7dd3fc", fontSize: 12 }}>
                <th style={{ padding: 8 }}>No.</th><th style={{ padding: 8 }}>Descripcion</th><th style={{ padding: 8 }}>Cant.</th><th style={{ padding: 8 }}>P.U.</th><th style={{ padding: 8 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} style={{ borderBottom: "1px solid #1a3050" }}>
                  <td style={{ padding: 8 }}>{i.item_number}</td><td style={{ padding: 8 }}>{i.description}</td><td style={{ padding: 8 }}>{i.quantity} {i.unit}</td><td style={{ padding: 8 }}>{i.unit_price?.toLocaleString()}</td><td style={{ padding: 8 }}>{i.total_offer?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 16, fontWeight: 900, fontSize: 18, color: "#4ade80" }}>Total Oferta: {grandTotal.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}