"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import NeuralBackground from "@/app/components/NeuralBackground";
import jsPDF from "jspdf";

interface Evaluation {
  id: number;
  wallet: string;
  audit_type: string;
  priority: string;
  risk: string;
  description: string;
}

export default function ReportsPage() {

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {

    const { data, error } = await supabase
      .from("evaluations")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setEvaluations(data || []);
    }
  }

  function generatePDF(item: Evaluation) {

    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("Audit Global Intelligence", 20, 20);

    doc.setFontSize(14);

    doc.text("Report ID: " + item.id, 20, 40);

    doc.text("Wallet: " + item.wallet, 20, 55);

    doc.text("Audit Type: " + item.audit_type, 20, 70);

    doc.text("Priority: " + item.priority, 20, 85);

    doc.text("Risk: " + item.risk, 20, 100);

    doc.text("Findings:", 20, 120);

    doc.setFontSize(12);

    doc.text(
      item.description || "No findings",
      20,
      135,
      {
        maxWidth: 170,
      }
    );

    doc.setFontSize(14);

    doc.text("AGI Recommendation:", 20, 170);

    doc.setFontSize(12);

    let recommendation = "";

    if (item.risk.includes("Alto")) {
      recommendation =
        "Immediate forensic investigation recommended.";
    } else if (item.risk.includes("RevisiÃ³n")) {
      recommendation =
        "Manual compliance review recommended.";
    } else {
      recommendation =
        "Activity within acceptable parameters.";
    }

    doc.text(
      recommendation,
      20,
      185,
      {
        maxWidth: 170,
      }
    );

    doc.save("report-" + item.id + ".pdf");
  }

  return (
    <main className="min-h-screen bg-black text-white p-10 relative overflow-hidden">
      <NeuralBackground color="#00ccff" particleCount={120} />

      <div className="mx-auto max-w-7xl relative z-10">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-4xl font-bold text-cyan-400">
              Forensic Reports
            </h1>

            <p className="mt-3 text-gray-500">
              ReporterÃ­a institucional y trazabilidad AML.
            </p>

          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-cyan-300">
            Live Intelligence
          </div>

        </div>

        {/* REPORTS */}
        <div className="mt-10 grid gap-8">

          {evaluations.map((item) => (

            <div
              key={item.id}
              className="rounded-3xl border border-white/5 bg-white/[0.03] p-8"
            >

              {/* TOP */}
              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-2xl font-semibold text-white">
                    Report #{item.id}
                  </h2>

                  <p className="mt-2 text-gray-500">

                    Wallet analizada:

                    <span className="ml-2 text-cyan-300">
                      {item.wallet}
                    </span>

                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-sm ${
                    item.risk.includes("Alto")
                      ? "bg-red-400/10 text-red-300"
                      : item.risk.includes("RevisiÃ³n")
                      ? "bg-yellow-400/10 text-yellow-300"
                      : "bg-green-400/10 text-green-300"
                  }`}
                >
                  {item.risk}
                </span>

              </div>

              {/* METRICS */}
              <div className="mt-8 grid gap-6 md:grid-cols-3">

                <div className="rounded-2xl border border-white/5 bg-black/30 p-5">

                  <p className="text-sm text-gray-500">
                    Tipo de AuditorÃ­a
                  </p>

                  <h3 className="mt-3 text-lg font-medium">
                    {item.audit_type}
                  </h3>

                </div>

                <div className="rounded-2xl border border-white/5 bg-black/30 p-5">

                  <p className="text-sm text-gray-500">
                    Prioridad
                  </p>

                  <h3 className="mt-3 text-lg font-medium">
                    {item.priority}
                  </h3>

                </div>

                <div className="rounded-2xl border border-white/5 bg-black/30 p-5">

                  <p className="text-sm text-gray-500">
                    Estado AML
                  </p>

                  <h3 className="mt-3 text-lg font-medium">
                    {item.risk}
                  </h3>

                </div>

              </div>

              {/* FINDINGS */}
              <div className="mt-8 rounded-2xl border border-white/5 bg-black/30 p-6">

                <p className="text-sm text-gray-500">
                  Hallazgos preliminares
                </p>

                <p className="mt-4 leading-7 text-gray-300">
                  {item.description}
                </p>

              </div>

              {/* RECOMMENDATION */}
              <div className="mt-8 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-6">

                <p className="text-sm text-cyan-300">
                  RecomendaciÃ³n AGI
                </p>

                <p className="mt-4 leading-7 text-gray-300">

                  {item.risk.includes("Alto")
                    ? "Se recomienda investigaciÃ³n inmediata y trazabilidad blockchain avanzada."
                    : item.risk.includes("RevisiÃ³n")
                    ? "Se recomienda validaciÃ³n manual por compliance."
                    : "Actividad preliminar dentro de parÃ¡metros aceptables."
                  }

                </p>

              </div>

              {/* PDF BUTTON */}
              <div className="mt-8 flex justify-end">

                <button
                  onClick={() => generatePDF(item)}
                  className="rounded-2xl bg-cyan-400 px-6 py-3 font-medium text-black transition hover:bg-cyan-300"
                >
                  Generate PDF
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>
  );
}

