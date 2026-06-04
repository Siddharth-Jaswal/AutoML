'use client';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ColumnInfo } from '@/store/useDatasetStore';
import { ArrowUpDown } from 'lucide-react';

const columnHelper = createColumnHelper<ColumnInfo>();

export function DatasetTable({ data }: { data: ColumnInfo[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = [
    columnHelper.accessor('name', {
      header: 'Feature Name',
      cell: info => <span className="font-medium text-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor('type', {
      header: 'Data Type',
      cell: info => (
        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-secondary-foreground/10">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('unique_values', {
      header: 'Unique Values',
      cell: info => info.getValue().toLocaleString(),
    }),
    columnHelper.accessor('missing_percentage', {
      header: 'Missing %',
      cell: info => {
        const val = info.getValue();
        const color = val > 20 ? 'text-destructive' : val > 0 ? 'text-yellow-500' : 'text-green-500';
        return <span className={color}>{val.toFixed(2)}%</span>;
      },
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-muted-foreground">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-6 py-4 font-semibold cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-muted/10 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
