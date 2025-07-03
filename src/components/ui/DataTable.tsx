import React from "react";

interface DataColumn {
  key: string;
  label: string;
  width?: string;
  className?: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface DataTableProps {
  headers?: string[];
  columns?: DataColumn[];
  data: Record<string, unknown>[];
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable({
  headers,
  columns,
  data,
  className = "",
  loading = false,
  emptyMessage = "No data available",
}: DataTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-gray-600 text-sm">Loading...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  // Use columns if provided, otherwise fallback to headers
  const tableColumns: DataColumn[] =
    columns || headers?.map((header) => ({ key: header, label: header })) || [];

  return (
    <div
      className={`border border-gray-300 rounded-md overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              {tableColumns.map((column) => (
                <th
                  key={column.key}
                  className={`px-2 py-1.5 text-left font-medium text-gray-800 border-r border-gray-300 ${column.className || ""}`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                {tableColumns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-2 py-1.5 border-r border-gray-300 ${column.className || ""}`}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : (row[column.key] as React.ReactNode)}
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
