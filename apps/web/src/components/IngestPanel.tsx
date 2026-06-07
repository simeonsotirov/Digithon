import { useRef, useState } from "react";
import { AlertCircle, CloudUpload, ExternalLink, Play } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { IngestSource } from "../api";
import { useIngestMutation } from "../queries";

type Mode = "seed" | "file" | "drive";

const MODES: { id: Mode; label: string }[] = [
  { id: "seed", label: "Demo CSV" },
  { id: "file", label: "Upload File" },
  { id: "drive", label: "Google Drive" },
];

export function IngestPanel() {
  const [mode, setMode] = useState<Mode>("seed");
  const [file, setFile] = useState<File | null>(null);
  const [driveId, setDriveId] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const ingest = useIngestMutation();

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setMode("file"); }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f) setFile(f);
  }

  function submit() {
    let source: IngestSource;
    if (mode === "file" && file) source = { type: "file", file };
    else if (mode === "drive" && driveId.trim()) source = { type: "drive", driveId: driveId.trim() };
    else source = { type: "seed" };
    ingest.mutate(source);
  }

  const canSubmit =
    !ingest.isPending &&
    (mode === "seed" ||
      (mode === "file" && file !== null) ||
      (mode === "drive" && driveId.trim() !== ""));

  return (
    <div className="w-full sm:w-80 flex flex-col gap-3">
      {/* Mode tabs */}
      <div className="flex rounded-xl border border-slate-700 overflow-hidden text-xs font-bold">
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex-1 py-2 transition-colors ${
              mode === id
                ? "bg-cyan-400/20 text-cyan-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* File dropzone */}
      {mode === "file" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileRef.current?.click()}
          className={`rounded-2xl border border-dashed p-5 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-cyan-400 bg-cyan-400/15"
              : "border-cyan-400/30 bg-cyan-400/5 hover:bg-cyan-400/10"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <CloudUpload className="mx-auto mb-2 h-7 w-7 text-cyan-400/60" />
          {file ? (
            <p className="text-sm font-semibold text-cyan-300 truncate">{file.name}</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-300">Drop CSV or XLSX here</p>
              <p className="text-xs text-slate-500 mt-1">or click to browse</p>
            </>
          )}
        </div>
      )}

      {/* Google Drive input */}
      {mode === "drive" && (
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            value={driveId}
            onChange={(e) => setDriveId(e.target.value)}
            placeholder="Paste Google Drive link or file ID"
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60 transition-colors"
          />
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <ExternalLink className="h-3 w-3 shrink-0" />
            Share link or file ID from Google Drive
          </p>
        </div>
      )}

      {/* Submit */}
      <Button
        size="lg"
        disabled={!canSubmit}
        onClick={submit}
        className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-black rounded-xl active:scale-[0.98] transition-all"
      >
        {ingest.isPending ? "Queueing…" : (
          <span className="flex items-center gap-2">
            Run Ingest <Play className="h-4 w-4" />
          </span>
        )}
      </Button>

      {ingest.isError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Failed to queue. Is the API running?
          </AlertDescription>
        </Alert>
      )}

      {ingest.isSuccess && (
        <p className="text-xs text-emerald-400 text-center font-semibold">
          Run queued successfully
        </p>
      )}
    </div>
  );
}
