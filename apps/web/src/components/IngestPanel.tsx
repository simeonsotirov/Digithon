import { useRef, useState } from "react";
import { AlertCircle, CloudUpload, ExternalLink, Play } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IngestSource } from "../api";
import { useIngestMutation } from "../queries";

export function IngestPanel() {
  const [tab, setTab] = useState("seed");
  const [file, setFile] = useState<File | null>(null);
  const [driveId, setDriveId] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const ingest = useIngestMutation();

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setTab("file"); }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f) setFile(f);
  }

  function submit() {
    let source: IngestSource;
    if (tab === "file" && file) source = { type: "file", file };
    else if (tab === "drive" && driveId.trim()) source = { type: "drive", driveId: driveId.trim() };
    else source = { type: "seed" };
    ingest.mutate(source);
  }

  const canSubmit =
    !ingest.isPending &&
    (tab === "seed" ||
      (tab === "file" && file !== null) ||
      (tab === "drive" && driveId.trim() !== ""));

  return (
    <div className="w-full sm:w-80 flex flex-col gap-3">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-slate-800 border border-slate-700">
          <TabsTrigger value="seed" className="flex-1 data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300 text-slate-400 text-xs font-bold">
            Demo CSV
          </TabsTrigger>
          <TabsTrigger value="file" className="flex-1 data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300 text-slate-400 text-xs font-bold">
            Upload File
          </TabsTrigger>
          <TabsTrigger value="drive" className="flex-1 data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300 text-slate-400 text-xs font-bold">
            Google Drive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seed" className="mt-0" />

        <TabsContent value="file" className="mt-0">
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
        </TabsContent>

        <TabsContent value="drive" className="mt-0">
          <div className="flex flex-col gap-1.5">
            <Input
              value={driveId}
              onChange={(e) => setDriveId(e.target.value)}
              placeholder="Paste Google Drive link or file ID"
              className="border-slate-700 bg-slate-900 text-slate-200 placeholder:text-slate-500 focus-visible:ring-cyan-400/50"
            />
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <ExternalLink className="h-3 w-3 shrink-0" />
              Share link or file ID from Google Drive
            </p>
          </div>
        </TabsContent>
      </Tabs>

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
