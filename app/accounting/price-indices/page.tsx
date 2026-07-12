"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

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

  const inputStyle = { background: "#0d1117", border: "1px solid #1a3050", borderRadius: 8, padding: 10, color: "white", width: "100%" };
  return (
    <div style={{ padding: 40, color: "white", background: "#000a16", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, color: "#7dd3fc" }}>Indices de Precios por Pais</h1>
      <p style={{ marginTop: 8, color: "#9ca3af", fontSize: 12 }}>
        Estos indices se usan para calcular el REPOMO y la reexpresion por inflacion (NIC 29 / NIF B-10).
      </p>

      <div style={{ marginTop: 30, display: "grid", gap: 10, maxWidth: 500 }}>
        <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} style={inputStyle}>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <input value={indexName} onChange={(e) => setIndexName(e.target.value)} style={inputStyle} placeholder="Nombre del indice (ej. INPC_BCV)" />
        <input type="date" value={periodDate} onChange={(e) => setPeriodDate(e.target.value)} style={inputStyle} />
        <input type="number" step="0.01" value={indexValue} onChange={(e) => setIndexValue(e.target.value)} style={inputStyle} placeholder="Valor del indice" />
        <button onClick={addIndex} style={{ padding: 14, background: "#22d3ee", color: "black", fontWeight: 900, borderRadius: 12, border: "none" }}>
          AGREGAR INDICE
        </button>
        {message && <p style={{ color: message.includes("Error") ? "#f87171" : "#4ade80" }}>{message}</p>}
      </div>

      <div style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 20, color: "#7dd3fc" }}>Indices Cargados</h2>
        <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#7dd3fc", fontSize: 12 }}>
              <th style={{ padding: 8 }}>Pais</th>
              <th style={{ padding: 8 }}>Indice</th>
              <th style={{ padding: 8 }}>Fecha</th>
              <th style={{ padding: 8 }}>Valor</th>
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {indices.map((i) => (
              <tr key={i.id} style={{ borderBottom: "1px solid #1a3050" }}>
                <td style={{ padding: 8 }}>{i.country_code}</td>
                <td style={{ padding: 8 }}>{i.index_name}</td>
                <td style={{ padding: 8 }}>{i.period_date}</td>
                <td style={{ padding: 8 }}>{i.index_value}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => deleteIndex(i.id)} style={{ background: "none", border: "1px solid #f87171", color: "#f87171", padding: "4px 10px", borderRadius: 8, fontSize: 11 }}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
