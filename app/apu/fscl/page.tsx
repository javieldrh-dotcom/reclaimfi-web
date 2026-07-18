"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { getVerticalTheme } from "@/app/core/design/tokens";
import VerticalPageLayout from "@/app/components/VerticalPageLayout";

export default function FsclCalculatorPage() {
  const theme = getVerticalTheme("apu");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [workSystem, setWorkSystem] = useState("5X2-36-DIA");
  const [dailyBasicSalary, setDailyBasicSalary] = useState("");
  const [calendarDays, setCalendarDays] = useState("365");
  const [nonWorkedDays, setNonWorkedDays] = useState("104");
  const [isaPercentage, setIsaPercentage] = useState("0");
  const [travelTimeAmount, setTravelTimeAmount] = useState("0");
  const [preavisoDays, setPreavisoDays] = useState("60");
  const [antiguedadLegalDays, setAntiguedadLegalDays] = useState("30");
  const [antiguedadContractualDays, setAntiguedadContractualDays] = useState("0");
  const [vacacionesDays, setVacacionesDays] = useState("27");
  const [bonoVacacionalDays, setBonoVacacionalDays] = useState("60");
  const [utilidadesDays, setUtilidadesDays] = useState("120");
  const [eppAmount, setEppAmount] = useState("0");
  const [aguaHieloAmount, setAguaHieloAmount] = useState("0");
  const [clinicaAmount, setClinicaAmount] = useState("0");
  const [message, setMessage] = useState("");
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: uc } = await supabase.from("user_companies").select("company_id").eq("user_id", userData.user.id).limit(1).single();
      const cid = uc?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data: proj } = await supabase.from("apu_projects").select("id, procedure_number, project_description").eq("company_id", cid).order("created_at", { ascending: false });
        setProjects(proj ?? []);
      }
    }
    load();
  }, []);
  function calculateFscl() {
    const sb = parseFloat(dailyBasicSalary) || 0;
    const calDays = parseFloat(calendarDays) || 365;
    const nonWorked = parseFloat(nonWorkedDays) || 0;
    const worked = calDays - nonWorked;

    const isa = sb * ((parseFloat(isaPercentage) || 0) / 100);
    const travel = parseFloat(travelTimeAmount) || 0;
    const subTotalA = (sb + isa + travel) * calDays;

    const preaviso = sb * (parseFloat(preavisoDays) || 0);
    const antigLegal = sb * (parseFloat(antiguedadLegalDays) || 0);
    const antigContractual = sb * (parseFloat(antiguedadContractualDays) || 0);
    const vacaciones = sb * (parseFloat(vacacionesDays) || 0);
    const bonoVac = sb * (parseFloat(bonoVacacionalDays) || 0);
    const utilidades = sb * (parseFloat(utilidadesDays) || 0);
    const subTotalB = preaviso + antigLegal + antigContractual + vacaciones + bonoVac + utilidades;

    const epp = parseFloat(eppAmount) || 0;
    const agua = parseFloat(aguaHieloAmount) || 0;
    const clinica = parseFloat(clinicaAmount) || 0;
    const subTotalC = epp + agua + clinica;

    const seguroSocial = subTotalA * 0.11;
    const inces = subTotalA * 0.02;
    const lph = subTotalA * 0.02;
    const paroForzoso = subTotalA * 0.02;
    const subTotalTerceros = seguroSocial + inces + lph + paroForzoso;

    const totalAnnualCost = subTotalA + subTotalB + subTotalC + subTotalTerceros;
    const totalDailyCost = totalAnnualCost / calDays;
    const factor = totalDailyCost / sb;

    return {
      worked, subTotalA, subTotalB, subTotalC, subTotalTerceros,
      totalAnnualCost, totalDailyCost, factor,
      seguroSocial, inces, lph, paroForzoso,
    };
  }

  async function saveCalculation() {
    setMessage("");
    if (!selectedProject || !dailyBasicSalary) { setMessage("Selecciona un proyecto y el salario basico."); return; }

    const r = calculateFscl();

    const { error } = await supabase.from("apu_fscl_calculations").insert([{
      apu_project_id: selectedProject,
      work_system: workSystem,
      daily_basic_salary: parseFloat(dailyBasicSalary),
      calendar_days: parseInt(calendarDays),
      non_worked_days: parseInt(nonWorkedDays),
      worked_days: r.worked,
      isa_percentage: parseFloat(isaPercentage),
      travel_time_amount: parseFloat(travelTimeAmount),
      sub_total_a: r.subTotalA,
      preaviso_days: parseFloat(preavisoDays),
      antiguedad_legal_days: parseFloat(antiguedadLegalDays),
      antiguedad_contractual_days: parseFloat(antiguedadContractualDays),
      vacaciones_days: parseFloat(vacacionesDays),
      bono_vacacional_days: parseFloat(bonoVacacionalDays),
      utilidades_days: parseFloat(utilidadesDays),
      sub_total_b: r.subTotalB,
      examenes_pre_empleo: 0,
      epp_amount: parseFloat(eppAmount),
      agua_hielo_amount: parseFloat(aguaHieloAmount),
      clinica_amount: parseFloat(clinicaAmount),
      sub_total_c: r.subTotalC,
      sub_total_terceros: r.subTotalTerceros,
      total_daily_cost: r.totalDailyCost,
      fscl_factor: r.factor,
    }]);

    if (error) { setMessage("Error: " + error.message); return; }
    setMessage("Calculo FSCL guardado. Factor: " + r.factor.toFixed(4));
  }

  const inputStyle = { ...theme.inputStyle, fontSize: 20 };

  const r = calculateFscl();

  return (
    <VerticalPageLayout vertical="apu" title="Calculadora FSCL (Factor Sobre Costo de Labor)" subtitle="Contrato Colectivo Petrolero (CCTP) - Calcula el factor multiplicador sobre el salario basico diario" fullWidth>
      <div style={{ maxWidth: 700 }}>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} style={inputStyle}>
          <option value="">Selecciona un proyecto/licitacion</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.procedure_number} - {p.project_description}</option>)}
        </select>

        <input value={workSystem} onChange={(e) => setWorkSystem(e.target.value)} style={{ ...inputStyle, marginTop: 10 }} placeholder="Sistema de trabajo (ej. 5X2-36-DIA)" />

        <div style={{ marginTop: 10 }}>
          <label style={{ fontSize: 16, color: theme.accent, fontWeight: 700 }}>SALARIO BASICO DIARIO</label>
          <input type="number" value={dailyBasicSalary} onChange={(e) => setDailyBasicSalary(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input type="number" value={calendarDays} onChange={(e) => setCalendarDays(e.target.value)} style={inputStyle} placeholder="Dias calendario" />
          <input type="number" value={nonWorkedDays} onChange={(e) => setNonWorkedDays(e.target.value)} style={inputStyle} placeholder="Dias no laborados" />
        </div>

        <h3 style={{ marginTop: 20, color: "#4ade80", fontSize: 20, fontWeight: 700 }}>Sub Total A - Pagos Directos</h3>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input type="number" value={isaPercentage} onChange={(e) => setIsaPercentage(e.target.value)} style={inputStyle} placeholder="% ISA" />
          <input type="number" value={travelTimeAmount} onChange={(e) => setTravelTimeAmount(e.target.value)} style={inputStyle} placeholder="Tiempo de viaje" />
        </div>

        <h3 style={{ marginTop: 20, color: "#facc15", fontSize: 20, fontWeight: 700 }}>Sub Total B - Indemnizacion Laboral (en dias de salario)</h3>
        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          <input type="number" value={preavisoDays} onChange={(e) => setPreavisoDays(e.target.value)} style={inputStyle} placeholder="Preaviso" />
          <input type="number" value={antiguedadLegalDays} onChange={(e) => setAntiguedadLegalDays(e.target.value)} style={inputStyle} placeholder="Antiguedad Legal" />
          <input type="number" value={antiguedadContractualDays} onChange={(e) => setAntiguedadContractualDays(e.target.value)} style={inputStyle} placeholder="Antiguedad Contractual" />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input type="number" value={vacacionesDays} onChange={(e) => setVacacionesDays(e.target.value)} style={inputStyle} placeholder="Vacaciones" />
          <input type="number" value={bonoVacacionalDays} onChange={(e) => setBonoVacacionalDays(e.target.value)} style={inputStyle} placeholder="Bono Vacacional" />
          <input type="number" value={utilidadesDays} onChange={(e) => setUtilidadesDays(e.target.value)} style={inputStyle} placeholder="Utilidades" />
        </div>

        <h3 style={{ marginTop: 20, color: "#f87171", fontSize: 20, fontWeight: 700 }}>Sub Total C - Puntos Contractuales</h3>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <input type="number" value={eppAmount} onChange={(e) => setEppAmount(e.target.value)} style={inputStyle} placeholder="EPP" />
          <input type="number" value={aguaHieloAmount} onChange={(e) => setAguaHieloAmount(e.target.value)} style={inputStyle} placeholder="Agua/Hielo" />
          <input type="number" value={clinicaAmount} onChange={(e) => setClinicaAmount(e.target.value)} style={inputStyle} placeholder="Clinica" />
        </div>

        <div style={{ ...theme.cardStyle, marginTop: 24 }}>
          <p style={{ fontSize: 18 }}>Sub Total A: <span style={theme.numberStyle}>{r.subTotalA.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
          <p style={{ fontSize: 18, marginTop: 6 }}>Sub Total B: <span style={theme.numberStyle}>{r.subTotalB.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
          <p style={{ fontSize: 18, marginTop: 6 }}>Sub Total C: <span style={theme.numberStyle}>{r.subTotalC.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
          <p style={{ fontSize: 18, marginTop: 6 }}>Pagos a Terceros (SSO+INCES+LPH+PF): <span style={theme.numberStyle}>{r.subTotalTerceros.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
          <p style={{ fontSize: 18, marginTop: 12 }}>Costo Diario Total: <span style={theme.numberStyle}>{r.totalDailyCost.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span></p>
          <p style={{ fontSize: 26, fontWeight: 900, color: "#4ade80", marginTop: 12 }}>Factor FSCL: {r.factor.toFixed(4)}</p>
        </div>

        <button onClick={saveCalculation} style={{ ...theme.buttonStyle, marginTop: 20, fontSize: 18 }}>
          GUARDAR CALCULO FSCL
        </button>
        {message && <p style={{ marginTop: 8, fontSize: 18, color: message.includes("Error") ? "#f87171" : theme.accent }}>{message}</p>}
      </div>
    </VerticalPageLayout>
  );
}
