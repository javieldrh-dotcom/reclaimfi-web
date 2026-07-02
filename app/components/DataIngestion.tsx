"use client";

import { useState } from "react";

interface UploadedFile {

  id: number;

  name: string;

  size: string;

  status: string;

  classification: string;

  uploadedAt: string;

  anomalyScore?: number;

  impact?: string;

}

export default function DataIngestion() {

  const [files, setFiles] =
    useState<UploadedFile[]>([]);

  const [dragging, setDragging] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [amount, setAmount] =
    useState("");

  //
  // SEND TO BACKEND
  //

  async function uploadFiles(

    selectedFiles: FileList | null

  ) {

    if (!selectedFiles) return;

    setUploading(true);

    try {

      //
      // LOCAL UI
      //

      const localFiles =
        Array.from(selectedFiles).map(

          (file, index) => ({

            id:
              Date.now() + index,

            name: file.name,

            size:
              (
                file.size /
                1024 /
                1024
              ).toFixed(2) + " MB",

            status:
              "PROCESSING",

            classification:
              "ANALYZING",

            uploadedAt:
              new Date().toLocaleTimeString(),

          })

        );

      setFiles((prev) => [

        ...localFiles,
        ...prev,

      ]);

      //
      // FORM DATA
      //

      const formData =
        new FormData();

      Array.from(selectedFiles)
        .forEach((file) => {

          formData.append(
            "files",
            file
          );

        });

      if (amount) {
        formData.append("amount", amount);
      }

      //
      // BACKEND REQUEST
      //

      const response =
        await fetch(

          "/api/upload",

          {

            method: "POST",

            body: formData,

          }

        );

      const result =
        await response.json();

      //
      // UPDATE UI
      //

      if (result.success) {

        const processed =
          result.results;

        setFiles((prev) =>

          prev.map((item) => {

            const backend =
              processed.find(

                (p: any) =>

                  p.metadata
                    .fileName ===
                  item.name

              );

            if (!backend)
              return item;

            return {

              ...item,

              status:
                "ANALYZED",

              classification:
                backend
                  .metadata
                  .classification,

              anomalyScore:
                backend
                  .aiAnalysis
                  .anomalyScore,

              impact:
                backend
                  .aiAnalysis
                  .operationalImpact,

            };

          })

        );

      }

    } catch (error) {

      console.error(
        "UPLOAD ERROR:",
        error
      );

    } finally {

      setUploading(false);

    }

  }

  //
  // DROP
  //

  function handleDrop(

    e: React.DragEvent

  ) {

    e.preventDefault();

    setDragging(false);

    uploadFiles(
      e.dataTransfer.files
    );

  }

  return (

    <div>

      {/* HEADER */}

      <div className="rounded-3xl border border-cyan-500/20 bg-[#0d1117]/95 p-10 shadow-[0_0_40px_rgba(34,211,238,0.08)]">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-black text-cyan-300">

              DATA INGESTION

            </h1>

            <p className="mt-5 max-w-4xl text-lg leading-relaxed text-gray-400">

              Enterprise ingestion and operational
              intelligence processing engine
              connected to AGI orchestration,
              AI analytics,
              AML monitoring,
              financial anomaly detection,
              and autonomous investigation workflows.

            </p>

          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-black/40 px-10 py-8 shadow-[0_0_35px_rgba(34,211,238,0.15)]">

            <p className="text-xs tracking-[0.35em] text-cyan-400">

              INGESTION STATUS

            </p>

            <h2 className="mt-4 text-5xl font-black text-cyan-300">

              ACTIVE

            </h2>

          </div>

        </div>

      </div>

      {/* DROPZONE */}

      <div className="mt-10 rounded-3xl border border-cyan-500/20 bg-[#0d1117]/95 p-10">

       <h2 className="text-3xl font-black text-cyan-300">

          FILE INGESTION ENGINE

        </h2>

        <div className="mt-6">
          <label className="text-sm font-black tracking-[0.2em] text-cyan-400">
            MONTO DE LA TRANSACCIÓN (OPCIONAL)
          </label>
          <input
            type="number"
            placeholder="Ej. 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-3 w-full rounded-2xl border border-cyan-500/20 bg-black/30 px-6 py-4 text-white placeholder-gray-500 outline-none focus:border-cyan-400"
          />
        </div>

        <div

          onDragOver={(e) => {

            e.preventDefault();

            setDragging(true);

          }}

          onDragLeave={() =>
            setDragging(false)
          }

          onDrop={handleDrop}

          className={`mt-8 rounded-3xl border-2 border-dashed p-20 text-center transition-all ${
            dragging

              ? "border-cyan-400 bg-cyan-500/10"

              : "border-cyan-500/20 bg-black/30"
          }`}
        >

          <div className="space-y-5">

            <h3 className="text-3xl font-black text-white">

              Upload Intelligence Sources

            </h3>

            <p className="text-gray-400">

              Banking statements,
              treasury reports,
              tax files,
              procurement records,
              blockchain exports,
              operational intelligence,
              CSV,
              XLSX,
              JSON,
              PDF,
              and financial telemetry sources.

            </p>

            <label className="inline-flex cursor-pointer rounded-2xl bg-cyan-500 px-8 py-5 text-lg font-black tracking-[0.15em] text-black transition-all hover:bg-cyan-400">

              {

                uploading

                  ? "PROCESSING..."

                  : "SELECT FILES"

              }

              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) =>
                  uploadFiles(
                    e.target.files
                  )
                }
              />

            </label>

          </div>

        </div>

      </div>

      {/* METRICS */}

      <div className="mt-10 grid gap-6 md:grid-cols-4">

        <div className="rounded-3xl border border-cyan-500/20 bg-[#0d1117]/95 p-8">

          <p className="text-xs tracking-[0.3em] text-cyan-400">

            FILES

          </p>

          <h2 className="mt-5 text-6xl font-black text-cyan-300">

            {files.length}

          </h2>

        </div>

        <div className="rounded-3xl border border-green-500/20 bg-[#0d1117]/95 p-8">

          <p className="text-xs tracking-[0.3em] text-green-400">

            ANALYZED

          </p>

          <h2 className="mt-5 text-6xl font-black text-green-300">

            {

              files.filter(

                (f) =>

                  f.status ===
                  "ANALYZED"

              ).length

            }

          </h2>

        </div>

        <div className="rounded-3xl border border-yellow-500/20 bg-[#0d1117]/95 p-8">

          <p className="text-xs tracking-[0.3em] text-yellow-400">

            PROCESSING

          </p>

          <h2 className="mt-5 text-6xl font-black text-yellow-300">

            {

              files.filter(

                (f) =>

                  f.status ===
                  "PROCESSING"

              ).length

            }

          </h2>

        </div>

        <div className="rounded-3xl border border-red-500/20 bg-[#0d1117]/95 p-8">

          <p className="text-xs tracking-[0.3em] text-red-400">

            HIGH RISK

          </p>

          <h2 className="mt-5 text-6xl font-black text-red-300">

            {

              files.filter(

                (f) =>

                  (f.anomalyScore || 0) > 70

              ).length

            }

          </h2>

        </div>

      </div>

      {/* FILE TABLE */}

      <div className="mt-10 rounded-3xl border border-cyan-500/20 bg-[#0d1117]/95 p-8">

        <div className="flex items-center justify-between">

          <div>

            <h2 className="text-3xl font-black text-cyan-300">

              INTELLIGENCE PIPELINE

            </h2>

            <p className="mt-3 text-gray-500">

              Autonomous operational intelligence processing

            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-400" />

            <span className="text-sm font-black tracking-[0.25em] text-cyan-300">

              LIVE ENGINE

            </span>

          </div>

        </div>

        {/* FILES */}

        <div className="mt-10 space-y-5">

          {files.length === 0 ? (

            <div className="rounded-2xl border border-cyan-500/10 bg-black/30 p-10 text-center text-gray-400">

              No intelligence sources uploaded

            </div>

          ) : (

            files.map((file) => (

              <div
                key={file.id}
                className="rounded-2xl border border-cyan-500/10 bg-black/30 p-6 transition-all hover:border-cyan-400/20 hover:bg-cyan-500/5"
              >

                <div className="flex items-center justify-between">

                  {/* LEFT */}

                  <div>

                    <div className="flex items-center gap-4">

                      <span className="rounded-full bg-cyan-500/10 px-4 py-2 text-xs font-black tracking-[0.2em] text-cyan-300">

                        {file.classification}

                      </span>

                      <span className="text-sm text-gray-500">

                        {file.uploadedAt}

                      </span>

                    </div>

                    <h3 className="mt-4 text-xl font-bold text-white">

                      {file.name}

                    </h3>

                    <p className="mt-3 text-gray-400">

                      Size:
                      {" "}
                      {file.size}

                    </p>

                    {

                      file.anomalyScore !==
                        undefined && (

                        <p className="mt-2 text-sm text-red-300">

                          Anomaly Score:
                          {" "}
                          {file.anomalyScore}

                        </p>

                      )

                    }

                  </div>

                  {/* RIGHT */}

                  <div className="space-y-4 text-right">

                    <span className={`block rounded-full px-5 py-3 text-xs font-black tracking-[0.2em] ${
                      file.status ===
                      "ANALYZED"

                        ? "bg-green-500/20 text-green-300"

                        : "bg-yellow-500/20 text-yellow-300"
                    }`}>

                      {file.status}

                    </span>

                    {

                      file.impact && (

                        <span className="block rounded-full bg-red-500/20 px-5 py-3 text-xs font-black tracking-[0.2em] text-red-300">

                          {file.impact}

                        </span>

                      )

                    }

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </div>

    </div>

  );

}

