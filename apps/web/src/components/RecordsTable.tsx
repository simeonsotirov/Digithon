import type { NormalizedRecord } from "../api";

type Props = { records: NormalizedRecord[] };

export function RecordsTable({ records }: Props) {
  if (records.length === 0) {
    return <p className="empty">No records yet — trigger an ingest run above.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Store</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Date</th>
            <th>Signal</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.store_name}</td>
              <td>{record.product_name}</td>
              <td>{record.quantity}</td>
              <td>${Number(record.price).toFixed(2)}</td>
              <td>{record.sale_date}</td>
              <td>
                <span className={`signal ${record.reorder_signal}`}>
                  {record.reorder_signal}
                </span>
              </td>
              <td>{record.quality_notes.join(", ") || "clean"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
