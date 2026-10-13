import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while contacting the server.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`p-6 bg-rose-50/70 border border-rose-200 rounded-xl text-center flex flex-col items-center justify-center ${className}`}>
      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertTriangle className="w-5 h-5 stroke-[2]" />
      </div>
      <h3 className="text-sm font-semibold text-rose-900 mb-1">{title}</h3>
      <p className="text-xs text-rose-700 max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-300 rounded-lg hover:bg-rose-50 transition-colors shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
}
