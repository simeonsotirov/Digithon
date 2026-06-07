import { Card, CardContent } from "@/components/ui/card";
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
  { label: "Raw rows", key: "total_raw_rows" as const },
  { label: "Normalized", key: "total_normalized_rows" as const },
  { label: "Quality fixes", key: "quality_issue_count" as const },
  { label: "Reorders", key: "reorder_count" as const },
  { label: "Stockouts", key: "stockout_count" as const },
];

export function KpiCards({ kpis, loading }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 my-6">
      {CARDS.map(({ label, key }) => (
        <Card key={key}>
          <CardContent className="pt-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-2" />
            ) : (
              <p className="text-3xl font-bold mt-1">{kpis?.[key] ?? 0}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
