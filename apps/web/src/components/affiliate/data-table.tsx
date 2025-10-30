import type { ReactNode } from "react";

interface Column<T> {
    key: string;
    header: string;
    render?: (value: any, row: T) => ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    emptyMessage = "No data available",
}: DataTableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="rounded-lg border border-stone-800 bg-[#1a1a1a] p-8 text-center shadow-sm">
                <p className="text-stone-400">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-stone-800 bg-[#1a1a1a] shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-stone-800 border-b bg-stone-950/50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="px-6 py-3 text-left font-medium text-stone-400 text-xs uppercase tracking-wider"
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800">
                        {data.map((row) => (
                            <tr
                                key={JSON.stringify(row)}
                                className="transition-colors hover:bg-stone-800/30"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className="px-6 py-4 text-sm text-stone-300"
                                    >
                                        {column.render
                                            ? column.render(
                                                  row[column.key],
                                                  row,
                                              )
                                            : row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
