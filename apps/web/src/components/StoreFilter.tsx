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
  selectedRisk: string;
  onStoreChange: (id: string) => void;
  onRunChange: (id: string) => void;
  onRiskChange: (risk: string) => void;
};

const RISK_OPTIONS = [
  { value: "all",      label: "All risks" },
  { value: "watch",    label: "Watch" },
  { value: "reorder",  label: "Reorder" },
  { value: "stockout", label: "Stockout" },
];

export function StoreFilter({
  stores,
  runs,
  selectedStore,
  selectedRun,
  selectedRisk,
  onStoreChange,
  onRunChange,
  onRiskChange,
}: Props) {
  return (
    <div className="flex flex-wrap gap-4 items-center rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Store</span>
        <Select value={selectedStore} onValueChange={(v) => v && onStoreChange(v)}>
          <SelectTrigger className="w-44 border-slate-700 bg-slate-900 text-slate-200 focus:ring-cyan-400/50">
            <SelectValue placeholder="All stores" />
          </SelectTrigger>
          <SelectContent className="border-slate-700 bg-slate-900">
            <SelectItem value="all" className="text-slate-200 focus:bg-slate-800">All stores</SelectItem>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id} className="text-slate-200 focus:bg-slate-800">
                {store.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-10 hidden sm:block border-slate-700" />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Run</span>
        <Select value={selectedRun} onValueChange={(v) => v && onRunChange(v)}>
          <SelectTrigger className="w-48 border-slate-700 bg-slate-900 text-slate-200 focus:ring-cyan-400/50">
            <SelectValue placeholder="All runs" />
          </SelectTrigger>
          <SelectContent className="border-slate-700 bg-slate-900">
            <SelectItem value="all" className="text-slate-200 focus:bg-slate-800">All runs</SelectItem>
            {runs.map((run) => (
              <SelectItem key={run.id} value={run.id} className="text-slate-200 focus:bg-slate-800 font-mono text-xs">
                {run.status} · {run.id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="h-10 hidden sm:block border-slate-700" />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Risk</span>
        <Select value={selectedRisk} onValueChange={(v) => v && onRiskChange(v)}>
          <SelectTrigger className="w-36 border-slate-700 bg-slate-900 text-slate-200 focus:ring-cyan-400/50">
            <SelectValue placeholder="All risks" />
          </SelectTrigger>
          <SelectContent className="border-slate-700 bg-slate-900">
            {RISK_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value} className="text-slate-200 focus:bg-slate-800">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
