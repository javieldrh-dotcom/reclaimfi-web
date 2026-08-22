"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

const CATEGORIES = [
  { value: "MATERIAL", label: "Materiales" },
  { value: "EQUIPMENT", label: "Equipos" },
  { value: "LABOR", label: "Mano de Obra" },
];

export default function PriceCatalogPage() {
  const theme = getVerticalTheme("apu");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("MATERIAL");
  const [loading, setLoading] = useState(true);

  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Record<string, any[]>>({});
  const [supplierName, setSupplierName] = useState("");
  const [quoteUnitCost, setQuoteUnitCost] = useState("");
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [quoteNotes, setQuoteNotes] = useState("");

  async function loadItems(cid: string) {
    const { data } = await supabase.from("apu_price_catalog").select("*").eq("company_id", cid).order("description", { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).order("last_active_at", { ascending: false }).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) await loadItems(cid);
    }
    load();
  }, []);

  async function addItem() {
    setMessage("");
    if (!companyId || !description.trim() || !unitCost) {
      setMessage("Completa al menos descripcion y costo unitario.");
      return;
    }
    const { error } = await supabase.from("apu_price_catalog").insert([{
      company_id: companyId,
      category: filter,
      description: description.trim(),
      unit: unit.trim() || null,
      unit_cost: parseFloat(unitCost) || 0,
      notes: notes.trim() || null,
    }]);
    if (error) { setMessage("Error: " + error.message); return; }
    setDescription(""); setUnit(""); setUnitCost(""); setNotes("");
    setMessage("Agregado al catalogo.");
    if (companyId) await loadItems(companyId);
  }

  async function deleteItem(id: string) {
    if (!window.confirm("Eliminar este precio del catalogo?")) return;
    await supabase.from("apu_price_catalog").delete().eq("id", id);
    if (companyId) await loadItems(companyId);
  }

  async function loadQuotes(itemId: string) {
    const { data } = await supabase.from("apu_price_quotes").select("*").eq("catalog_item_id", itemId).order("quote_date", { ascending: false });
    setQuotes((prev) => ({ ...prev, [itemId]: data ?? [] }));
  }

  async function toggleExpandItem(itemId: string) {
    if (expandedItem === itemId) { setExpandedItem(null); return; }
    setExpandedItem(itemId);
    if (!quotes[itemId]) await loadQuotes(itemId);
  }

  async function addQuote(itemId: string) {
    if (!supplierName.trim() || !quoteUnitCost) return;
    await supabase.from("apu_price_quotes").insert([{
      catalog_item_id: itemId,
      supplier_name: supplierName.trim(),
      unit_cost: parseFloat(quoteUnitCost) || 0,
      quote_date: quoteDate,
      notes: quoteNotes.trim() || null,
    }]);
    setSupplierName(""); setQuoteUnitCost(""); setQuoteNotes("");
    await loadQuotes(itemId);
  }

  async function selectQuote(itemId: string, quoteId: string, cost: number) {
    await supabase.from("apu_price_quotes").update({ is_selected: false }).eq("catalog_item_id", itemId);
    await supabase.from("apu_price_quotes").update({ is_selected: true }).eq("id", quoteId);
    await supabase.from("apu_price_catalog").update({ unit_cost: cost }).eq("id", itemId);
    await loadQuotes(itemId);
    if (companyId) await loadItems(companyId);
  }

  async function deleteQuote(itemId: string, quoteId: string) {
    await supabase.from("apu_price_quotes").delete().eq("id", quoteId);
    await loadQuotes(itemId);
  }

  const filteredItems = filter === "TODOS" ? items : items.filter((i) => i.category === filter);
  const categoryLabels: Record<string, string> = { MATERIAL: "Materiales", EQUIPMENT: "Equipos", LABOR: "Mano de Obra" };

  if (loading) return <div style={{ ...theme.pageStyle }}>Cargando...</div>;

  return (
    <VerticalPageLayout vertical="apu" title="Catalogo de Precios de Referencia" subtitle="Tus precios reales conocidos, reutilizables en cualquier proyecto. La IA los consulta primero antes de estimar." fullWidth>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setFilter("TODOS")}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid " + (filter === "TODOS" ? theme.accent : theme.border),
            background: filter === "TODOS" ? theme.accent + "18" : "transparent",
            color: filter === "TODOS" ? theme.accent : "#B0B8C8",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Todos ({items.length})
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid " + (filter === c.value ? theme.accent : theme.border),
              background: filter === c.value ? theme.accent + "18" : "transparent",
              color: filter === c.value ? theme.accent : "#B0B8C8",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {c.label} ({items.filter((i) => i.category === c.value).length})
          </button>
        ))}
      </div>

      <div style={{ ...theme.cardStyle, maxWidth: 700, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, color: theme.accent, fontWeight: 700, marginBottom: 12 }}>
          Agregar Precio de {CATEGORIES.find((c) => c.value === filter)?.label ?? "Insumo"}
        </h3>
        <input value={description} onChange={(e) => setDescription(e.target.value)} style={theme.inputStyle} placeholder={filter === "LABOR" ? "Cargo (ej. Soldador calificado)" : "Descripcion del insumo"} />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} style={{ ...theme.inputStyle, flex: 1 }} placeholder={filter === "LABOR" ? "Und. (ej. dia)" : "Unidad (ej. Kg, m2)"} />
          <input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} style={{ ...theme.inputStyle, flex: 1 }} placeholder="Costo unitario (USD)" />
        </div>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...theme.inputStyle, marginTop: 10 }} placeholder="Notas (proveedor, fecha de cotizacion, etc. - opcional)" />
        <button onClick={addItem} style={{ ...theme.buttonStyle, marginTop: 12 }}>Agregar al Catalogo</button>
        {message && <p style={{ marginTop: 8, fontSize: 13, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {filteredItems.length === 0 ? (
          <p style={{ color: "#8B93A7", fontSize: 14 }}>Aun no hay precios{filter !== "TODOS" ? " de " + CATEGORIES.find((c) => c.value === filter)?.label.toLowerCase() : ""} en tu catalogo.</p>
        ) : (
          filteredItems.map((item) => {
            const isOpen = expandedItem === item.id;
            const itemQuotes = quotes[item.id] ?? [];
            return (
              <div key={item.id} style={{ ...theme.cardStyle, marginBottom: 8, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => toggleExpandItem(item.id)}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600 }}>
                      {item.description}
                      {filter === "TODOS" && <span style={{ fontSize: 11, color: theme.accent, marginLeft: 8, fontWeight: 700 }}>[{categoryLabels[item.category]}]</span>}
                    </p>
                    <p style={{ fontSize: 12, color: "#8B93A7", marginTop: 2 }}>
                      {item.unit && item.unit + " · "}${item.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      {item.notes && " · " + item.notes}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: theme.accent }}>{isOpen ? "Ocultar cotizaciones" : "Ver cotizaciones"}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} style={{ background: "none", border: "1px solid #f87171", color: "#f87171", padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                      Eliminar
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 14, borderTop: "1px solid " + theme.border, paddingTop: 14 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: theme.accent, marginBottom: 8 }}>Cotizaciones de Proveedores</p>
                    {itemQuotes.length === 0 ? (
                      <p style={{ fontSize: 12, color: "#8B93A7", marginBottom: 10 }}>Aun no hay cotizaciones registradas para este insumo.</p>
                    ) : (
                      itemQuotes.map((q) => (
                        <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: theme.background, borderRadius: 6, marginBottom: 6, border: q.is_selected ? "1px solid " + theme.accent : "1px solid " + theme.border }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600 }}>
                              {q.supplier_name}
                              {q.is_selected && <span style={{ fontSize: 11, color: theme.accent, marginLeft: 8 }}>✓ Seleccionada</span>}
                            </p>
                            <p style={{ fontSize: 11, color: "#8B93A7" }}>
                              ${q.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })} · {q.quote_date}{q.notes && " · " + q.notes}
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            {!q.is_selected && (
                              <button onClick={() => selectQuote(item.id, q.id, q.unit_cost)} style={{ background: "none", border: "1px solid " + theme.accent, color: theme.accent, padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>
                                Usar este precio
                              </button>
                            )}
                            <button onClick={() => deleteQuote(item.id, q.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 14 }}>x</button>
                          </div>
                        </div>
                      ))
                    )}
                    <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                      <input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} style={{ ...theme.inputStyle, fontSize: 13, padding: 8, flex: 1, minWidth: 140 }} placeholder="Nombre del proveedor" />
                      <input type="number" value={quoteUnitCost} onChange={(e) => setQuoteUnitCost(e.target.value)} style={{ ...theme.inputStyle, fontSize: 13, padding: 8, width: 110 }} placeholder="Costo" />
                      <input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} style={{ ...theme.inputStyle, fontSize: 13, padding: 8, width: 140 }} />
                      <input value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} style={{ ...theme.inputStyle, fontSize: 13, padding: 8, flex: 1, minWidth: 120 }} placeholder="Notas (opcional)" />
                      <button onClick={() => addQuote(item.id)} style={{ padding: "0 14px", background: theme.accent, color: theme.background, border: "none", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>
                        Agregar Cotizacion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </VerticalPageLayout>
  );
}