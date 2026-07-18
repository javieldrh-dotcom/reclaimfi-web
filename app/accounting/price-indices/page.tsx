"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

const COUNTRIES = [
  { code: "VE", name: "Venezuela" },
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "BR", name: "Brasil" },
  { code: "CL", name: "Chile" },
  { code: "PE", name: "Peru" },
  { code: "EC", name: "Ecuador" },
  { code: "US", name: "Estados Unidos" },
];

export default function PriceIndicesPage() {
  const theme = getVerticalTheme("accounting");
  const [indices, setIndices] = useState<any[]>([]);
  const [countryCode, setCountryCode] = useState("VE");
  const [indexName, setIndexName] = useState("INPC_BCV");
  const [periodDate, setPeriodDate] = useState("");
  const [indexValue, setIndexValue] = useState("");
  const [message, setMessage] = useState("");

  async function loadIndices() {
    const { data } = await supabase.from("price_indices").select("*").order("country_code").order("period_date");
    setIndices(data ?? []);
  }

  useEffect(() => {
    loadIndices();
  }, []);

  async function addIndex() {
    setMessage("");
    if (!periodDate || !indexValue) { setMessage("Completa fecha y valor."); return; }

    const { error } = await supabase.from("price_indices").insert([{
      country_code: countryCode,
      index_name: indexName,
      period_date: periodDate,
      index_value: parseFloat(indexValue),
    }]);

    if (error) { setMessage("Error: " + error.message); return; }
    setMessage("Indice agregado correctamente.");
    setPeriodDate("");
    setIndexValue("");
    await loadIndices();
  }

  async function deleteIndex(id: string) {
    if (!window.confirm("Eliminar este indice?")) return;
    await supabase.from("price_indices").delete().eq("id", id);
    await loadIndices();
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };
  return (
    <VerticalPageLayout vertical="accounting" title="Indices de Precios por Pais" subtitle="Estos indices se usan para calcular el REPOMO y la reexpresion por inflacion (NIC 29 / NIF B-10)" fullWidth>
      <div style={{ maxWidth: 600 }}>
        <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={inputStyle}>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <input value={indexName} onChange={(e) => setIndexName(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Nombre del indice (ej. INPC_BCV)" />
        <input type="date" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} />
        <input type="number" step="0.01" value={indexValue} onChange={(e) => setIndexValue(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Valor del indice" />
        <button onClick={addIndex} style={{ ...theme.buttonStyle, marginTop: 16, fontSize: 18 }}>
          AGREGAR INDICE
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>

      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 24, color: theme.accent, fontWeight: 700 }}>Indices Cargados</h2>
        <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: theme.accent, fontSize: 16, fontWeight: 700 }}>
              <th style={{ padding: 10 }}>Pais</th>
              <th style={{ padding: 10 }}>Indice</th>
              <th style={{ padding: 10 }}>Fecha</th>
              <th style={{ padding: 10 }}>Valor</th>
              <th style={{ padding: 10 }}></th>
            </tr>
          </thead>
          <tbody>
            {indices.map((i) => (
              <tr key={i.id} style={{ borderBottom: "1px solid #1F2937" }}>
                <td style={{ padding: 10, fontSize: 20 }}>{i.country_code}</td>
                <td style={{ padding: 10, fontSize: 20 }}>{i.index_name}</td>
                <td style={{ padding: 10, fontSize: 20 }}>{i.period_date}</td>
                <td style={{ padding: 10, fontSize: 20, ...theme.numberStyle }}>{i.index_value}</td>
                <td style={{ padding: 10 }}>
                  <button onClick={() => deleteIndex(i.id)} style={{ background: "none", border: "1px solid #f87171", color: "#f87171", padding: "6px 14px", borderRadius: 8, fontSize: 15 }}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VerticalPageLayout>
  );
}
