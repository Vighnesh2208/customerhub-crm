import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading data...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center text-slate-500 ${className}`}>
      <Loader2 className="w-7 h-7 text-indigo-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
}

export function TableSkeletonRows({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-slate-100 animate-pulse">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-4 py-3.5">
              <div 
                className="h-4 bg-slate-200/70 rounded" 
                style={{ width: `${Math.max(40, 90 - (cIdx * 15))}%` }} 
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-28 bg-slate-200 rounded" />
        <div className="w-8 h-8 rounded-lg bg-slate-100" />
      </div>
      <div className="h-7 w-20 bg-slate-200 rounded mb-2" />
      <div className="h-3 w-36 bg-slate-100 rounded" />
    </div>
  );
}
