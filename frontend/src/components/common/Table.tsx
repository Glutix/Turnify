import { type ReactNode } from "react";

interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  rowClassName?: (row: T) => string;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  rowClassName,
  emptyMessage = "No hay datos para mostrar.",
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-espresso/10 bg-superficie py-12 text-center text-sm text-espresso/50">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-espresso/10">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-espresso/10 bg-espresso/5">
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-xs font-medium uppercase tracking-widest text-espresso/60 ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={`border-b border-espresso/5 last:border-0 ${rowClassName ? rowClassName(row) : ""}`}
            >
              {columns.map((col, i) => (
                <td key={i} className={`px-4 py-3 text-espresso ${col.className ?? ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}