import { Package, CheckCircle2, AlertTriangle, RefreshCw, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Kpis = {
  total_raw_rows: number;
  total_normalized_rows: number;
  quality_issue_count: number;
  reorder_count: number;
  stockout_count: number;
};

type Props = { kpis: Kpis | undefined; loading?: boolean };

const CARDS = [
  {
    key: "total_raw_rows" as const,
    label: "Rows Ingested",
    description: "Total parsed source rows",
    icon: Package,
    iconClass: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    key: "total_normalized_rows" as const,
    label: "Rows Normalized",
    description: "Canonical records stored",
    icon: CheckCircle2,
    iconClass: "text-emerald-600",
    iconBg: "bg-emerald-50",
  },
  {
    key: "quality_issue_count" as const,
    label: "Quality Issues",
    description: "Corrections & warnings",
    icon: AlertTriangle,
    iconClass: "text-amber-600",
    iconBg: "bg-amber-50",
  },
  {
    key: "reorder_count" as const,
    label: "Reorder Signals",
    description: "Products below threshold",
    icon: RefreshCw,
    iconClass: "text-orange-600",
    iconBg: "bg-orange-50",
  },
  {
    key: "stockout_count" as const,
    label: "Stockout Risk",
    description: "Critical stock warnings",
    icon: XCircle,
    iconClass: "text-red-600",
    iconBg: "bg-red-50",
  },
] as const;

export function KpiCards({ kpis, loading }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {CARDS.map(({ key, label, description, icon: Icon, iconClass, iconBg }) => (
        <Card key={key} className="rounded-xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.12em]">
              {label}
            </CardTitle>
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
              <Icon className={`h-4 w-4 ${iconClass}`} />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {(kpis?.[key] ?? 0).toLocaleString()}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
