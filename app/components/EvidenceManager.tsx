"use client";

import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";
import { logLedgerEvent } from "../lib/logLedgerEvent";

interface EvidenceItem {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
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

  const [openingId, setOpeningId] =
    useState<string | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  useEffect(() => {

    fetchEvidence();

  }, []);

  // La tabla real se llama "evidences" (no "case_evidence", que no existe
  // en la base), y guarda file_path (la ruta dentro del bucket), no una
  // file_url. Por eso el insert fallaba siempre antes de esta correccion.
  async function fetchEvidence() {

    const { data, error } =
      await supabase
        .from("evidences")
        .select("*")
        .eq("case_id", caseId)
        .order(
          "created_at",
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } =
      await supabase
        .from("evidences")
        .insert([

          {

            case_id: caseId,

            file_name: file.name,

            file_path: filePath,

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

    await logLedgerEvent("rf.evidence.uploaded", caseId, {
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
    });

    setFile(null);

    setLoading(false);

    fetchEvidence();

  }

  // El bucket "case-evidence" guarda evidencia forense potencialmente
  // sensible; en vez de un enlace publico permanente, se genera una URL
  // firmada de corta duracion solo cuando alguien pide abrir el archivo.
  async function openEvidence(item: EvidenceItem) {
    setOpeningId(item.id);
    const { data, error } = await supabase.storage
      .from("case-evidence")
      .createSignedUrl(item.file_path, 60 * 10);

    setOpeningId(null);

    if (error || !data?.signedUrl) {
      console.error(error);
      alert("No se pudo generar el enlace de la evidencia.");
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  // Borra tanto el archivo del bucket como la fila en "evidences". El
  // archivo se borra primero: si eso falla, no queda un registro huerfano
  // en la base apuntando a un archivo que sigue en el bucket (al reves si
  // seria peor: un archivo huerfano en el bucket es inofensivo, una fila
  // en la base apuntando a un archivo borrado rompe el boton "OPEN").
  async function deleteEvidence(item: EvidenceItem) {
    if (!window.confirm(`¿Borrar la evidencia "${item.file_name}"? Esta accion no se puede deshacer.`)) {
      return;
    }

    setDeletingId(item.id);

    const { error: storageError } = await supabase.storage
      .from("case-evidence")
      .remove([item.file_path]);

    if (storageError) {
      console.error(storageError);
      alert("No se pudo borrar el archivo del almacenamiento.");
      setDeletingId(null);
      return;
    }

    const { error: deleteError } = await supabase
      .from("evidences")
      .delete()
      .eq("id", item.id);

    setDeletingId(null);

    if (deleteError) {
      console.error(deleteError);
      alert("El archivo se borro del almacenamiento, pero no se pudo borrar el registro. Contacta soporte.");
      return;
    }

    await logLedgerEvent("rf.evidence.deleted", caseId, {
      file_name: item.file_name,
      file_path: item.file_path,
      file_type: item.file_type,
    });

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

              <div className="flex gap-2">

                <button
                  onClick={() => openEvidence(item)}
                  disabled={openingId === item.id}
                  className="rounded-lg bg-cyan-500 px-5 py-3 text-sm font-bold text-black disabled:opacity-50"
                >

                  {openingId === item.id ? "ABRIENDO..." : "OPEN"}

                </button>

                <button
                  onClick={() => deleteEvidence(item)}
                  disabled={deletingId === item.id}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                >

                  {deletingId === item.id ? "BORRANDO..." : "BORRAR"}

                </button>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}