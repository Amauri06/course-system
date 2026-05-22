import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
}

export const Table = <T,>({
  columns,
  data,
  keyExtractor,
  isLoading = false
}: TableProps<T>) => {
  return (
    <div className="w-full overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-xs">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {columns.map((col) => {
                const alignment = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-6 py-4 font-bold text-slate-500 tracking-wide uppercase text-xs ${alignment} ${col.width || ''}`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
                    <span className="text-sm font-medium text-slate-400">Cargando registros...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                  Sin registros encontrados
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={keyExtractor(row)} className="hover:bg-slate-50/50 transition-colors">
                  {columns.map((col) => {
                    const alignment = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
                    return (
                      <td key={col.key} className={`px-6 py-4.5 ${alignment} whitespace-nowrap text-slate-700 font-medium text-sm`}>
                        {col.render ? col.render(row) : (row[col.key as keyof T] as unknown as React.ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
