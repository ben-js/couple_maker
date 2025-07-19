import React from 'react';

interface Column {
  key: string;
  header: string;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  title?: string;
  data: any[];
  columns: Column[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  maxHeight?: string;
}

const Table: React.FC<TableProps> = ({ 
  title,
  data, 
  columns, 
  loading = false, 
  emptyMessage = "데이터가 없습니다.",
  className = '',
  maxHeight = 'max-h-96'
}) => {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* 제목 영역 */}
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {title} {data.length > 0 && `(${data.length}건)`}
          </h3>
        </div>
      )}
      
      {/* 테이블 영역 */}
      <div className="overflow-x-auto custom-scrollbar">
        <div className={`${maxHeight} overflow-y-auto custom-scrollbar`}>
          <table className="min-w-full table-fixed">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-sm font-medium text-gray-500 ${
                      column.width || ''
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length} 
                    className="px-6 py-8 text-center text-gray-500 text-sm"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 text-sm text-gray-900 ${
                          column.width || ''
                        }`}
                      >
                        {column.render 
                          ? column.render(row[column.key], row)
                          : row[column.key] || '-'
                        }
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Table; 