import type { Run, Store } from "../api";

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
    <section className="controls">
      <label>
        Store
        <select value={selectedStore} onChange={(e) => onStoreChange(e.target.value)}>
          <option value="all">All stores</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.display_name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Run
        <select value={selectedRun} onChange={(e) => onRunChange(e.target.value)}>
          <option value="all">All runs</option>
          {runs.map((run) => (
            <option key={run.id} value={run.id}>
              {run.status} · {run.id.slice(0, 8)}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
