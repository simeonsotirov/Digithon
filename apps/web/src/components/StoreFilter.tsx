import type { Run, Store } from "../api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type Props = {
  stores: Store[];
  runs: Run[];
  selectedStore: string;
  selectedRun: string;
  onStoreChange: (id: string) => void;
  onRunChange: (id: string) => void;
};

export function StoreFilter({
  stores,
  runs,
  selectedStore,
  selectedRun,
  onStoreChange,
  onRunChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-4 items-center rounded-xl border px-4 py-3 mb-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Store</span>
        <Select value={selectedStore} onValueChange={(v) => v && onStoreChange(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All stores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stores</SelectItem>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Separator orientation="vertical" className="h-10 hidden sm:block" />
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Run</span>
        <Select value={selectedRun} onValueChange={(v) => v && onRunChange(v)}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All runs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All runs</SelectItem>
            {runs.map((run) => (
              <SelectItem key={run.id} value={run.id}>
                {run.status} · {run.id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
