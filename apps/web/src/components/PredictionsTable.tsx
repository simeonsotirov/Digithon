import type { InventoryPrediction } from "../api";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CONFIDENCE_VARIANT: Record<InventoryPrediction["confidence"], "default" | "secondary" | "outline"> = {
  high: "default",
  medium: "secondary",
  low: "outline",
};

type Props = { predictions: InventoryPrediction[]; loading?: boolean };

export function PredictionsTable({ predictions, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (predictions.length === 0) {
    return <p className="text-sm text-muted-foreground">No predictions yet. Run an ingest to generate event-aware recommendations.</p>;
  }

  return (
    <ScrollArea className="h-[360px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Store</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Base</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Predicted</TableHead>
            <TableHead>Reorder</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {predictions.map((prediction) => (
            <TableRow key={prediction.id}>
              <TableCell>{prediction.event_name}</TableCell>
              <TableCell>{prediction.store_name}</TableCell>
              <TableCell>{prediction.product_name}</TableCell>
              <TableCell>{Number(prediction.baseline_quantity).toFixed(1)}</TableCell>
              <TableCell>{prediction.available_stock}</TableCell>
              <TableCell>{prediction.predicted_quantity}</TableCell>
              <TableCell className="font-bold">{prediction.recommended_reorder_quantity}</TableCell>
              <TableCell>
                <Badge variant={CONFIDENCE_VARIANT[prediction.confidence]}>{prediction.confidence}</Badge>
              </TableCell>
              <TableCell className="max-w-[280px] text-xs text-muted-foreground">
                {prediction.reasons[0] ?? "Event-aware reorder recommendation"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
