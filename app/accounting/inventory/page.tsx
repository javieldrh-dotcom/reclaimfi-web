"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function InventoryPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [movements, setMovements] = useState<any[]>([]);

  const [sku, setSku] = useState("");
  const [itemName, setItemName] = useState("");
  const [unit, setUnit] = useState("UND");
  const [valuationMethod, setValuationMethod] = useState("WEIGHTED_AVERAGE");
  const [message, setMessage] = useState("");

  const [movQuantity, setMovQuantity] = useState("");
  const [movUnitCost, setMovUnitCost] = useState("");
  const [movType, setMovType] = useState("IN");
  const [movDate, setMovDate] = useState(new Date().toISOString().slice(0, 10));
  const [movReference, setMovReference] = useState("");

  async function loadItems(cid: string) {
    const { data } = await supabase.from("inventory_items").select("*").eq("company_id", cid).order("item_name");
    setItems(data ?? []);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadItems(cid);
    }
    load();
  }, []);

  async function createItem() {
    setMessage("");
    if (!companyId || !sku || !itemName) { setMessage("Completa SKU y nombre del producto."); return; }

    const { error } = await supabase.from("inventory_items").insert([{
      company_id: companyId,
      sku,
      item_name: itemName,
      unit,
      valuation_method: valuationMethod,
    }]);

    if (error) { setMessage("Error: " + error.message); return; }
    setMessage("Producto creado correctamente.");
    setSku(""); setItemName("");
    if (companyId) await loadItems(companyId);
  }

  async function loadMovements(itemId: string) {
    setSelectedItemId(itemId);
    const { data } = await supabase.from("inventory_movements").select("*").eq("inventory_item_id", itemId).order("movement_date", { ascending: true });
    setMovements(data ?? []);
  }
  async function registerMovement() {
    setMessage("");
    if (!selectedItemId || !movQuantity) { setMessage("Selecciona un producto y la cantidad."); return; }

    const item = items.find((i) => i.id === selectedItemId);
    if (!item) return;

    const qty = parseFloat(movQuantity);
    let newQuantity = item.current_quantity;
    let newAvgCost = item.current_avg_cost;
    let costForThisMovement = 0;

    if (movType === "IN") {
      const unitCost = parseFloat(movUnitCost) || 0;
      const totalOldValue = item.current_quantity * item.current_avg_cost;
      const totalNewValue = qty * unitCost;
      newQuantity = item.current_quantity + qty;
      newAvgCost = newQuantity > 0 ? (totalOldValue + totalNewValue) / newQuantity : 0;
      costForThisMovement = unitCost;
    } else {
      if (qty > item.current_quantity) {
        setMessage("No hay suficiente inventario disponible (disponible: " + item.current_quantity + ").");
        return;
      }
      newQuantity = item.current_quantity - qty;
      costForThisMovement = item.current_avg_cost;
    }

    const { error: movError } = await supabase.from("inventory_movements").insert([{
      inventory_item_id: selectedItemId,
      movement_type: movType,
      quantity: qty,
      unit_cost: costForThisMovement,
      movement_date: movDate,
      reference: movReference,
      resulting_quantity: newQuantity,
      resulting_avg_cost: newAvgCost,
    }]);

    if (movError) { setMessage("Error: " + movError.message); return; }

    await supabase.from("inventory_items").update({
      current_quantity: newQuantity,
      current_avg_cost: newAvgCost,
    }).eq("id", selectedItemId);

    setMessage("Movimiento registrado. Nuevo saldo: " + newQuantity + " unidades a costo promedio " + newAvgCost.toLocaleString(undefined, { maximumFractionDigits: 4 }));
    setMovQuantity(""); setMovUnitCost(""); setMovReference("");
    if (companyId) await loadItems(companyId);
    await loadMovements(selectedItemId);
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <VerticalPageLayout vertical="accounting" title="Control de Inventario" subtitle="Kardex con valuacion por Promedio Ponderado (NIC 2)" fullWidth>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <div>
          <div style={theme.cardStyle}>
            <h3 style={{ fontSize: 20, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>Nuevo Producto</h3>
            <input value={sku} onChange={(e) => setSku(e.target.value)} style={inputStyle} placeholder="SKU/Codigo" />
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Nombre del producto" />
            <input value={unit} onChange={(e) => setUnit(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Unidad" />
            <button onClick={createItem} style={{ ...theme.buttonStyle, marginTop: 12, fontSize: 16, width: "100%" }}>
              CREAR PRODUCTO
            </button>
            {message && <p style={{ marginTop: 8, fontSize: 16, color: message.includes("Error") || message.includes("No hay") ? "#f87171" : theme.accent }}>{message}</p>}
          </div>

          <div style={{ ...theme.cardStyle, marginTop: 16, maxHeight: 500, overflowY: "auto" }}>
            <h3 style={{ fontSize: 20, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>Productos</h3>
            {items.map((i) => (
              <div key={i.id} onClick={() => loadMovements(i.id)} style={{ padding: 12, borderRadius: 8, cursor: "pointer", marginBottom: 6, background: selectedItemId === i.id ? theme.accent + "30" : "transparent", border: selectedItemId === i.id ? "1px solid " + theme.accent : "1px solid transparent" }}>
                <p style={{ fontSize: 18, fontWeight: 600 }}>{i.sku} - {i.item_name}</p>
                <p style={{ fontSize: 16, color: "#8B93A7", marginTop: 2 }}>Stock: {i.current_quantity} {i.unit} | Costo Prom.: {i.current_avg_cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          {selectedItem ? (
            <>
              <div style={theme.cardStyle}>
                <h3 style={{ fontSize: 20, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>Registrar Movimiento - {selectedItem.item_name}</h3>
                <div style={{ display: "flex", gap: 10 }}>
                  <select value={movType} onChange={(e) => setMovType(e.target.value)} style={inputStyle}>
                    <option value="IN">Entrada</option>
                    <option value="OUT">Salida</option>
                  </select>
                  <input type="date" value={movDate} onChange={(e) => setMovDate(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <input type="number" value={movQuantity} onChange={(e) => setMovQuantity(e.target.value)} style={inputStyle} placeholder="Cantidad" />
                  {movType === "IN" && (
                    <input type="number" value={movUnitCost} onChange={(e) => setMovUnitCost(e.target.value)} style={inputStyle} placeholder="Costo Unitario" />
                  )}
                </div>
                <input value={movReference} onChange={(e) => setMovReference(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} placeholder="Referencia (opcional)" />
                <button onClick={registerMovement} style={{ ...theme.buttonStyle, marginTop: 12, fontSize: 16 }}>
                  REGISTRAR MOVIMIENTO
                </button>
              </div>

              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 20, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>Kardex</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: theme.accent, fontSize: 15, fontWeight: 700 }}>
                      <th style={{ padding: 8 }}>Fecha</th>
                      <th style={{ padding: 8 }}>Tipo</th>
                      <th style={{ padding: 8, textAlign: "right" }}>Cantidad</th>
                      <th style={{ padding: 8, textAlign: "right" }}>Costo</th>
                      <th style={{ padding: 8, textAlign: "right" }}>Saldo</th>
                      <th style={{ padding: 8, textAlign: "right" }}>Costo Prom.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #1F2937" }}>
                        <td style={{ padding: 8, fontSize: 16 }}>{m.movement_date}</td>
                        <td style={{ padding: 8, fontSize: 16, color: m.movement_type === "IN" ? "#4ade80" : "#f87171" }}>{m.movement_type === "IN" ? "Entrada" : "Salida"}</td>
                        <td style={{ padding: 8, textAlign: "right", fontSize: 16, ...theme.numberStyle }}>{m.quantity}</td>
                        <td style={{ padding: 8, textAlign: "right", fontSize: 16, ...theme.numberStyle }}>{m.unit_cost?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td style={{ padding: 8, textAlign: "right", fontSize: 16, ...theme.numberStyle }}>{m.resulting_quantity}</td>
                        <td style={{ padding: 8, textAlign: "right", fontSize: 16, fontWeight: 700, ...theme.numberStyle }}>{m.resulting_avg_cost?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p style={{ color: "#8B93A7", fontSize: 18 }}>Selecciona un producto para ver su Kardex y registrar movimientos.</p>
          )}
        </div>
      </div>
    </VerticalPageLayout>
  );
}
