type Kpis = {
  total_raw_rows: number;
  total_normalized_rows: number;
  quality_issue_count: number;
  reorder_count: number;
  stockout_count: number;
};

type Props = { kpis: Kpis | undefined };

export function KpiCards({ kpis }: Props) {
  return (
    <section className="kpis">
      <article>
        <span>Raw rows</span>
        <strong>{kpis?.total_raw_rows ?? 0}</strong>
      </article>
      <article>
        <span>Normalized</span>
        <strong>{kpis?.total_normalized_rows ?? 0}</strong>
      </article>
      <article>
        <span>Quality fixes</span>
        <strong>{kpis?.quality_issue_count ?? 0}</strong>
      </article>
      <article>
        <span>Reorders</span>
        <strong>{kpis?.reorder_count ?? 0}</strong>
      </article>
      <article>
        <span>Stockouts</span>
        <strong>{kpis?.stockout_count ?? 0}</strong>
      </article>
    </section>
  );
}
