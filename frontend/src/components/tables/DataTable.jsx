import React, { useState } from 'react';
import { EmptyState } from '../common/StateViews';

export const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  pageSize = 10,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching your query.',
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');

  // Handle sorting
  const handleSort = (columnKey) => {
    if (sortKey === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(columnKey);
      setSortOrder('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    let valA = a[sortKey];
    let valB = b[sortKey];
    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
    if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={`table-container ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={col.sortable ? 'sortable' : ''}
                onClick={col.sortable ? () => handleSort(col.accessor) : undefined}
                style={col.width ? { width: col.width } : undefined}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {col.header}
                  {col.sortable && sortKey === col.accessor && (
                    <span style={{ fontSize: '10px' }}>
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, rowIdx) => (
            <tr key={row[keyField] || rowIdx}>
              {columns.map((col, colIdx) => (
                <td key={colIdx}>
                  {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {data.length > pageSize && (
        <div className="table-pagination">
          <span className="pagination-info">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, data.length)} of {data.length} records
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, padding: '0 8px' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
