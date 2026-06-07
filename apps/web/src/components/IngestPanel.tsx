import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useIngestMutation } from "../queries";

export function IngestPanel() {
  const ingest = useIngestMutation();

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        size="lg"
        disabled={ingest.isPending}
        onClick={() => ingest.mutate()}
        className="bg-[#F7B160] text-[#172957] hover:bg-[#e5a050] font-black rounded-full px-6"
      >
        {ingest.isPending ? "Queueing…" : "Ingest messy CSV"}
      </Button>
      {ingest.isError && (
        <Alert variant="destructive" className="max-w-xs">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to queue run. Is the API running?</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
