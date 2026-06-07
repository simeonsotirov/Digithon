import { TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Kpis = {
  total_raw_rows: number;
  total_normalized_rows: number;
  quality_issue_count: number;
  reorder_count: number;
  stockout_count: number;
};

type Props = { kpis: Kpis | undefined; loading?: boolean };

function TrendBadge({ value, good = "up" }: { value: string; good?: "up" | "down" }) {
  const isUp = value.startsWith("+");
  const isGood = good === "up" ? isUp : !isUp;
  return (
    <Badge
      className={`gap-1 font-semibold border-0 text-xs px-2 py-0.5 ${
        isGood ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
    >
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {value}
    </Badge>
  );
}

export function KpiCards({ kpis, loading }: Props) {
  const rawRows = kpis?.total_raw_rows ?? 0;
  const normRows = kpis?.total_normalized_rows ?? 0;
  const qualityIssues = kpis?.quality_issue_count ?? 0;
  const reorders = kpis?.reorder_count ?? 0;
  const stockouts = kpis?.stockout_count ?? 0;

  const normRate = rawRows > 0 ? Math.round((normRows / rawRows) * 100) : 0;
  const issueRate = rawRows > 0 ? Math.round((qualityIssues / rawRows) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* Hero card — Total Ingested (like Finance "My Balance") */}
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm font-medium text-muted-foreground">Total Ingested</p>
            {!loading && <TrendBadge value={rawRows > 0 ? "+100%" : "0%"} good="up" />}
          </div>
          {loading ? (
            <Skeleton className="h-10 w-24 mt-2 mb-1" />
          ) : (
            <p className="text-4xl font-black tabular-nums text-foreground mt-2">
              {rawRows.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1 mb-5">raw rows from all CSV sources</p>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg bg-primary/10 px-3 py-1.5 text-center">
              <p className="text-xs font-semibold text-primary">{normRows.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">normalized</p>
            </div>
            <div className="flex-1 rounded-lg bg-muted px-3 py-1.5 text-center">
              <p className="text-xs font-semibold text-foreground">{normRate}%</p>
              <p className="text-[10px] text-muted-foreground">success rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Normalized — like Finance "Net Profit" */}
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm font-medium text-muted-foreground">Normalized Records</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-10 w-24 mt-2 mb-1" />
          ) : (
            <p className="text-4xl font-black tabular-nums text-foreground mt-2">
              {normRows.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">canonical records stored</p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {normRate}% of raw rows clean
          </div>
        </CardContent>
      </Card>

      {/* Quality Issues — like Finance "Expenses" */}
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm font-medium text-muted-foreground">Quality Issues</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-10 w-24 mt-2 mb-1" />
          ) : (
            <p className="text-4xl font-black tabular-nums text-foreground mt-2">
              {qualityIssues.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">corrections & warnings</p>
          <div className="mt-4 flex items-center gap-1.5">
            {!loading && <TrendBadge value={issueRate > 10 ? `+${issueRate}%` : `-${100 - issueRate}%`} good="down" />}
            <span className="text-xs text-muted-foreground">of ingested rows</span>
          </div>
        </CardContent>
      </Card>

      {/* Reorder + Stockout — like Finance "Pending Invoices" */}
      <Card className="rounded-xl border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm font-medium text-muted-foreground">Reorder Signals</p>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-10 w-24 mt-2 mb-1" />
          ) : (
            <p className="text-4xl font-black tabular-nums text-foreground mt-2">
              {reorders.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">products below threshold</p>
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-red-700 font-semibold">{stockouts} stockout risk</span>
            {stockouts > 0 && <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
