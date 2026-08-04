"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";
import { generateInventoryKardexPdf } from "@/app/core/reports/generateInventoryKardexPdf";
import AccountSearchSelect from "@/app/components/AccountSearchSelect";

export default function InventoryPage() {
  const theme = getVerticalTheme("accounting");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [inventoryAccountId, setInventoryAccountId] = useState("");
  const [offsetAccountId, setOffsetAccountId] = useState("");
  const [cogsAccountId, setCogsAccountId] = useState("");
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
  const [movCurrency, setMovCurrency] = useState("USD");
  const [movExchangeRate, setMovExchangeRate] = useState("1");
  const [movReference, setMovReference] = useState("");

  async function loadItems(cid: string) {
    const { data } = await supabase.from("inventory_items").select("*").eq("company_id", cid).order("item_name");
    setItems(data ?? []);
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
        const { data: acc } = await supabase.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("company_id", cid).in("account_type", ["ASSET", "LIABILITY", "EXPENSE"]);
        setAccounts(acc ?? []);
        const invAcc = (acc ?? []).find((a: any) => a.account_name.toLowerCase().includes("inventario de mercancia"));
        if (invAcc) setInventoryAccountId(invAcc.id);
        const cogsAcc = (acc ?? []).find((a: any) => a.account_name.toLowerCase().includes("costo de mercancia vendida") || a.account_name.toLowerCase().includes("costo de ventas"));
        if (cogsAcc) setCogsAccountId(cogsAcc.id);
        await loadItems(cid);
      }
    }
    load();
  }, []);

  async function createNewAccount(type: string, target: string) {
    const name = window.prompt("Nombre de la nueva cuenta de " + (type === "ASSET" ? "Activo" : type === "LIABILITY" ? "Pasivo" : "Gasto") + ":");
    if (!name || !companyId) return;
    const prefix = type === "ASSET" ? "1199" : type === "LIABILITY" ? "2199" : "5199";
    const { data: newAcc, error } = await supabase.from("chart_of_accounts").insert([{
      account_code: prefix + "-" + Date.now().toString().slice(-4),
      account_name: name,
      account_type: type,
      company_id: companyId,
    }]).select("id, account_code, account_name, account_type").single();
    if (error || !newAcc) { alert("Error al crear cuenta: " + error?.message); return; }
    setAccounts((prev) => [...prev, newAcc]);
    if (target === "inventory") setInventoryAccountId(newAcc.id);
    if (target === "offset") setOffsetAccountId(newAcc.id);
    if (target === "cogs") setCogsAccountId(newAcc.id);
  }

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

  async function fetchBcvRate() {
    setMessage("Consultando tasa BCV...");
    try {
      const res = await fetch("/api/bcv-rate");
      const json = await res.json();
      if (!json.success) { setMessage("No se pudo consultar la tasa BCV: " + json.error); return; }
      setMovCurrency("VES");
      setMovExchangeRate(String(json.rate));
      setMessage("Tasa BCV de hoy aplicada: " + json.rate + " (" + json.source + ")");
    } catch (err: any) {
      setMessage("Error al consultar la tasa: " + err.message);
    }
  }

  async function registerMovement() {
    setMessage("");
    if (!selectedItemId || !movQuantity) { setMessage("Selecciona un producto y la cantidad."); return; }
    if (!inventoryAccountId || !offsetAccountId) { setMessage("Selecciona las cuentas contables (Inventario y Contrapartida) antes de registrar."); return; }
    const item = items.find((i) => i.id === selectedItemId);
    if (!item) return;
    const qty = parseFloat(movQuantity);
    let newQuantity = item.current_quantity;
    let newAvgCost = item.current_avg_cost;
    let costForThisMovement = 0;

    if (movType === "IN") {
      const fxRate = parseFloat(movExchangeRate) || 1;
      const unitCost = (parseFloat(movUnitCost) || 0) * fxRate;
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
      if (!cogsAccountId) { setMessage("Selecciona la cuenta de Costo de Ventas para registrar salidas."); return; }
      newQuantity = item.current_quantity - qty;
      costForThisMovement = item.current_avg_cost;
    }

    const movementValue = qty * costForThisMovement;

    const { data: lastEntry } = await supabase.from("journal_entries").select("entry_number").eq("company_id", companyId).order("entry_number", { ascending: false }).limit(1).single();
    const nextEntryNumber = (lastEntry?.entry_number || 0) + 1;

    const { data: entry, error: entryError } = await supabase.from("journal_entries").insert([{
      company_id: companyId,
      description: (movType === "IN" ? "Entrada" : "Salida") + " de Inventario - " + item.item_name + (movReference ? " (" + movReference + ")" : ""),
      entry_date: movDate,
      entry_number: nextEntryNumber,
    }]).select("id").single();

    if (entryError || !entry) { setMessage("Error al crear asiento: " + entryError?.message); return; }

    const lines = movType === "IN"
      ? [
          { journal_entry_id: entry.id, account_id: inventoryAccountId, debit: movementValue, credit: 0 },
          { journal_entry_id: entry.id, account_id: offsetAccountId, debit: 0, credit: movementValue },
        ]
      : [
          { journal_entry_id: entry.id, account_id: cogsAccountId, debit: movementValue, credit: 0 },
          { journal_entry_id: entry.id, account_id: inventoryAccountId, debit: 0, credit: movementValue },
        ];

    await supabase.from("journal_lines").insert(lines);

    const { error: movError } = await supabase.from("inventory_movements").insert([{
      inventory_item_id: selectedItemId,
      movement_type: movType,
      quantity: qty,
      unit_cost: costForThisMovement,
      movement_date: movDate,
      reference: movReference,
      resulting_quantity: newQuantity,
      resulting_avg_cost: newAvgCost,
      journal_entry_id: entry.id,
    }]);
    if (movError) { setMessage("Error: " + movError.message); return; }

    await supabase.from("inventory_items").update({
      current_quantity: newQuantity,
      current_avg_cost: newAvgCost,
    }).eq("id", selectedItemId);

    setMessage("Movimiento registrado y asiento contable generado. Nuevo saldo: " + newQuantity + " unidades a costo promedio " + newAvgCost.toLocaleString(undefined, { maximumFractionDigits: 4 }));
    setMovQuantity(""); setMovUnitCost(""); setMovReference("");
    if (companyId) await loadItems(companyId);
    await loadMovements(selectedItemId);
  }

  function downloadPdf() {
    if (!selectedItem) return;
    const doc = generateInventoryKardexPdf(companyName, selectedItem.item_name, selectedItem.sku, movements);
    doc.save("kardex-" + selectedItem.sku.toLowerCase() + ".pdf");
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };
  const selectedItem = items.find((i) => i.id === selectedItemId);

  return (
    <VerticalPageLayout vertical="accounting" title="Control de Inventario" subtitle="Kardex con valuacion por Promedio Ponderado (NIC 2) - Vinculado a contabilidad" fullWidth
      actions={selectedItem && movements.length > 0 ? (
        <button onClick={downloadPdf} style={{ ...theme.buttonStyle, fontSize: 13, padding: "10px 20px" }}>
          Descargar PDF
        </button>
      ) : undefined}
    >
      <div style={{ ...theme.cardStyle, marginBottom: 20, maxWidth: 900 }}>
        <p style={{ fontSize: 15, color: theme.accent, fontWeight: 700, marginBottom: 10 }}>Cuentas Contables (requeridas para registrar movimientos)</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            <AccountSearchSelect accounts={accounts.filter(a => a.account_type === "ASSET")} value={inventoryAccountId} onChange={setInventoryAccountId} placeholder="Buscar Cuenta de Inventario..." />
            <button onClick={() => createNewAccount("ASSET", "inventory")} style={{ padding: "0 12px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Nueva</button>
          </div>
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            <AccountSearchSelect accounts={accounts.filter(a => a.account_type === "LIABILITY" || a.account_type === "ASSET")} value={offsetAccountId} onChange={setOffsetAccountId} placeholder="Buscar Contrapartida..." />
            <button onClick={() => createNewAccount("LIABILITY", "offset")} style={{ padding: "0 12px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Nueva</button>
          </div>
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            <AccountSearchSelect accounts={accounts.filter(a => a.account_type === "EXPENSE")} value={cogsAccountId} onChange={setCogsAccountId} placeholder="Buscar Costo de Ventas (opcional)..." />
            <button onClick={() => createNewAccount("EXPENSE", "cogs")} style={{ padding: "0 12px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>+ Nueva</button>
          </div>
        </div>
        {inventoryAccountId && offsetAccountId && inventoryAccountId === offsetAccountId && (
          <p style={{ marginTop: 8, fontSize: 14, color: "#f87171" }}>La cuenta de Inventario y la Contrapartida no pueden ser la misma.</p>
        )}
        {inventoryAccountId && cogsAccountId && inventoryAccountId === cogsAccountId && (
          <p style={{ marginTop: 8, fontSize: 14, color: "#f87171" }}>La cuenta de Inventario y la de Costo de Ventas no pueden ser la misma.</p>
        )}
      </div>

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
            {message && <p style={{ marginTop: 8, fontSize: 16, color: message.includes("Error") || message.includes("No hay") || message.includes("Selecciona") ? "#f87171" : theme.accent }}>{message}</p>}
          </div>
          <div style={{ ...theme.cardStyle, marginTop: 16, maxHeight: 500, overflowY: "auto" }}>
            <h3 style={{ fontSize: 20, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>Productos</h3>
            {items.map((i) => (
              <div key={i.id} onClick={() => loadMovements(i.id)} style={{ padding: 12, borderRadius: 8, cursor: "pointer", marginBottom: 6, background: selectedItemId === i.id ? theme.accent + "30" : "transparent", border: selectedItemId === i.id ? "1px solid " + theme.accent : "1px solid transparent" }}>
                <p style={{ fontSize: 18, fontWeight: 600 }}>{i.sku} - {i.item_name}</p>
                <p style={{ fontSize: 16, color: "#8B93A7", marginTop: 2 }}>Stock: {i.current_quantity} {i.unit} | Costo Prom.: {i.current_avg_cost.toLocaleString(undefined,{ maximumFractionDigits: 2 })}</p>
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
                  <select value={movCurrency} onChange={(e) => setMovCurrency(e.target.value)} style={inputStyle}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="VES">VES (Bolivares)</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <input type="number" value={movQuantity} onChange={(e) => setMovQuantity(e.target.value)} style={inputStyle} placeholder="Cantidad" />
                  {movType === "IN" && (
                    <input type="number" value={movUnitCost} onChange={(e) => setMovUnitCost(e.target.value)} style={inputStyle} placeholder="Costo Unitario" />
                  )}
                  {movType === "IN" && (
                    <>
                      <input type="number" step="0.0001" value={movExchangeRate} onChange={(e) => setMovExchangeRate(e.target.value)} style={inputStyle} placeholder="Tasa de Cambio" />
                      <button onClick={fetchBcvRate} type="button" style={{ padding: "0 14px", background: "none", border: "1px solid " + theme.accent, color: theme.accent, borderRadius: 8, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>Tasa BCV Hoy</button>
                    </>
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
                        <td style={{ padding: 8, textAlign: "right", fontSize: 16, ...theme.numberStyle }}>{m.unit_cost?.toLocaleString(undefined, { maximumFractionDigits: 2})}</td>
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
