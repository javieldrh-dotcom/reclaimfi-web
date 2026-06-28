"use client";

import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";

interface EvidenceItem {

  id: string;

  file_name: string;

  file_url: string;

  file_type: string;

  uploaded_at: string;

}

interface Props {

  caseId: string;

}

export default function EvidenceManager({

  caseId,

}: Props) {

  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [evidence, setEvidence] =
    useState<EvidenceItem[]>([]);

  useEffect(() => {

    fetchEvidence();

  }, []);

  async function fetchEvidence() {

    const { data, error } =
      await supabase
        .from("case_evidence")
        .select("*")
        .eq("case_id", caseId)
        .order(
          "uploaded_at",
          { ascending: false }
        );

    if (error) {

      console.error(error);

      return;

    }

    setEvidence(data || []);

  }

  async function uploadEvidence() {

    if (!file) {

      alert("Select a file");

      return;

    }

    setLoading(true);

    const filePath =
      `${Date.now()}-${file.name}`;

    const { error: uploadError } =
      await supabase.storage
        .from("case-evidence")
        .upload(
          filePath,
          file
        );

    if (uploadError) {

      console.error(uploadError);

      alert("Upload failed");

      setLoading(false);

      return;

    }

    const { data } =
      supabase.storage
        .from("case-evidence")
        .getPublicUrl(filePath);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } =
      await supabase
        .from("case_evidence")
        .insert([

          {

            case_id: caseId,

            file_name: file.name,

            file_url:
              data.publicUrl,

            file_type: file.type,

            uploaded_by:
              user?.id,

          },

        ]);

    if (insertError) {

      console.error(insertError);

      alert(
        "Database insert failed"
      );

      setLoading(false);

      return;

    }

    setFile(null);

    setLoading(false);

    fetchEvidence();

  }

  return (

    <div className="mt-10 rounded-xl border border-cyan-400/20 bg-black/40 p-8">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-3xl font-black text-cyan-300">

            EVIDENCE MANAGER

          </h2>

          <p className="mt-2 text-gray-400">

            Upload and manage forensic evidence.

          </p>

        </div>

      </div>

      {/* UPLOAD */}

      <div className="mt-8 flex gap-4">

        <input
          type="file"
          onChange={(e) =>
            setFile(
              e.target.files?.[0] || null
            )
          }
          className="w-full rounded-lg border border-cyan-400/20 bg-black/40 p-4 text-white"
        />

        <button
          onClick={uploadEvidence}
          disabled={loading}
          className="rounded-lg bg-cyan-500 px-6 py-4 font-bold text-black transition-all hover:bg-cyan-400"
        >

          {loading
            ? "UPLOADING..."
            : "UPLOAD"}

        </button>

      </div>

      {/* EVIDENCE LIST */}

      <div className="mt-10 space-y-4">

        {evidence.map((item) => (

          <div
            key={item.id}
            className="rounded-xl border border-cyan-400/10 bg-black/30 p-5"
          >

            <div className="flex items-center justify-between">

              <div>

                <h3 className="font-bold text-white">

                  {item.file_name}

                </h3>

                <p className="mt-2 text-sm text-gray-400">

                  {item.file_type}

                </p>

              </div>

              <a
                href={item.file_url}
                target="_blank"
                className="rounded-lg bg-cyan-500 px-5 py-3 text-sm font-bold text-black"
              >

                OPEN

              </a>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}

