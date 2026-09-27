import React, { useState, useMemo } from 'react';
import { DataRow } from '../types';
import {
  Search,
  Download,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Square,
  FileCheck,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';

interface Props {
  data: DataRow[];
  sourceName: string;
}

export const DataExplorerTab: React.FC<Props> = ({ data, sourceName }) => {
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');

  // Sorting & Pagination States
  const [sortCol, setSortCol] = useState<string>('order_id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Export Configuration States
  const [exportFilename, setExportFilename] = useState<string>('data_se_baatein_filtered.csv');
  const [showExportPanel, setShowExportPanel] = useState<boolean>(true);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // All available columns
  const allColumns = useMemo(() => {
    if (!data.length) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Selected columns to include in table and export
  const [selectedColumns, setSelectedColumns] = useState<string[]>(allColumns);

  // Synchronize columns when dataset changes
  React.useEffect(() => {
    if (allColumns.length > 0 && selectedColumns.length === 0) {
      setSelectedColumns(allColumns);
    }
  }, [allColumns]);

  // Unique categories & regions for dropdown filters
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      if (r.category) set.add(String(r.category));
    });
    return Array.from(set).sort();
  }, [data]);

  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => {
      if (r.region) set.add(String(r.region));
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Category filter
      if (categoryFilter !== 'ALL' && String(row.category) !== categoryFilter) {
        return false;
      }
      // Region filter
      if (regionFilter !== 'ALL' && String(row.region) !== regionFilter) {
        return false;
      }
      // Full-text search across all values
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return Object.values(row).some((val) =>
          String(val).toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [data, categoryFilter, regionFilter, searchTerm]);

  // Sorted dataset
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const valA = a[sortCol];
      const valB = b[sortCol];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA ?? '').localeCompare(String(valB ?? ''))
        : String(valB ?? '').localeCompare(String(valA ?? ''));
    });
  }, [filteredData, sortCol, sortAsc]);

  // Paginated dataset
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  // Column toggle handler
  const handleToggleColumn = (col: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(col)) {
        if (prev.length === 1) return prev; // Keep at least one column
        return prev.filter((c) => c !== col);
      }
      return [...prev, col];
    });
  };

  const handleSelectAllColumns = () => setSelectedColumns(allColumns);
  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setRegionFilter('ALL');
    setSelectedColumns(allColumns);
    setPage(1);
  };

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  };

  // Export processed/filtered CSV
  const handleDownloadCSV = () => {
    if (!sortedData.length || !selectedColumns.length) return;

    const headers = selectedColumns.join(',');
    const rows = sortedData.map((row) =>
      selectedColumns
        .map((c) => {
          const val = row[c] ?? '';
          const str = String(val).replace(/"/g, '""');
          return typeof val === 'string' || str.includes(',') ? `"${str}"` : str;
        })
        .join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    let cleanName = exportFilename.trim();
    if (!cleanName.endsWith('.csv')) {
      cleanName += '.csv';
    }

    link.setAttribute('href', url);
    link.setAttribute('download', cleanName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  // Estimated export file size in KB
  const estimatedFileSizeKB = useMemo(() => {
    if (!sortedData.length || !selectedColumns.length) return 0;
    const sampleRowBytes = selectedColumns.reduce((acc, c) => acc + String(sortedData[0][c] || '').length + 2, 0);
    return ((sampleRowBytes * sortedData.length + selectedColumns.join(',').length) / 1024).toFixed(2);
  }, [sortedData, selectedColumns]);

  return (
    <div className="space-y-5">
      {/* Download Toast Notification */}
      {downloadSuccess && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs text-emerald-300 shadow-xl transition-all">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Successfully exported <strong>{sortedData.length} rows</strong> & <strong>{selectedColumns.length} columns</strong> as{' '}
              <code>{exportFilename}</code>!
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">Download Complete</span>
        </div>
      )}

      {/* Filter & Processing Controls Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              Dataset Processing & Filter Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Filter records and customize columns before exporting as a new CSV file
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
            <button
              onClick={() => setShowExportPanel(!showExportPanel)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-xs text-indigo-300 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              {showExportPanel ? 'Hide Export Config' : 'Configure Export'}
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Full-Text Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search across all fields..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category Dropdown Filter */}
          {uniqueCategories.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Filter by Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Categories ({data.length} records)</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Region Dropdown Filter */}
          {uniqueRegions.length > 0 && (
            <div>
              <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Filter by Region</label>
              <select
                value={regionFilter}
                onChange={(e) => {
                  setRegionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Regions</option>
                {uniqueRegions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Export & Column Selection Panel */}
        {showExportPanel && (
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300">
                Select Columns to Include in New CSV ({selectedColumns.length} of {allColumns.length} chosen):
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAllColumns}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline"
                >
                  Select All
                </button>
              </div>
            </div>

            {/* Column Pill Checkboxes */}
            <div className="flex flex-wrap gap-1.5">
              {allColumns.map((col) => {
                const isSelected = selectedColumns.includes(col);
                return (
                  <button
                    key={col}
                    onClick={() => handleToggleColumn(col)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border border-indigo-500/60 text-indigo-200'
                        : 'bg-slate-950 border border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3 h-3 text-indigo-400" />
                    ) : (
                      <Square className="w-3 h-3 text-slate-600" />
                    )}
                    <span>{col}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Filename & Export Action Card */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex-1 max-w-sm">
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                  Export CSV Filename
                </label>
                <input
                  type="text"
                  value={exportFilename}
                  onChange={(e) => setExportFilename(e.target.value)}
                  placeholder="custom_dataset_name.csv"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Export Statistics */}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Export Rows</span>
                  <strong className="text-slate-200 font-mono text-sm">{sortedData.length}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Columns</span>
                  <strong className="text-slate-200 font-mono text-sm">{selectedColumns.length}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Est. Size</span>
                  <strong className="text-indigo-400 font-mono text-sm">~{estimatedFileSizeKB} KB</strong>
                </div>
              </div>

              {/* Main Export Action Button */}
              <button
                onClick={handleDownloadCSV}
                disabled={sortedData.length === 0 || selectedColumns.length === 0}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01]"
              >
                <Download className="w-4 h-4" />
                Export Processed CSV File
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Processed Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Displaying <strong className="text-slate-200">{sortedData.length}</strong> matching records out of{' '}
            <strong className="text-slate-200">{data.length}</strong> total
          </span>
          <span className="text-[11px] text-slate-500">
            Click column headers to toggle sort direction (▲ / ▼)
          </span>
        </div>

        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase sticky top-0 z-10 border-b border-slate-800">
              <tr>
                {selectedColumns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-4 py-3 cursor-pointer hover:text-white select-none whitespace-nowrap bg-slate-950"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  {selectedColumns.map((col) => {
                    const val = row[col];
                    const isNum = typeof val === 'number';
                    return (
                      <td
                        key={col}
                        className={`px-4 py-2.5 whitespace-nowrap ${
                          isNum ? 'text-right font-medium text-slate-200' : 'text-slate-300'
                        }`}
                      >
                        {isNum ? Number(val).toLocaleString() : String(val ?? '-')}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={selectedColumns.length} className="px-4 py-10 text-center text-slate-500">
                    No matching records found for the applied search/filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <strong className="text-slate-200">{page}</strong> of <strong className="text-slate-200">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
