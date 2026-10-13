import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  RotateCcw, 
  Crown, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';

export function OrderStatusBadge({ status, className = '' }) {
  const normalized = (status || 'unknown').toLowerCase();

  switch (normalized) {
    case 'completed':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Completed
        </span>
      );
    case 'processing':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 ${className}`}>
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          Processing
        </span>
      );
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 ${className}`}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Pending Payment
        </span>
      );
    case 'on-hold':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/60 ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
          On Hold
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
          <XCircle className="w-3.5 h-3.5 text-slate-500" />
          Cancelled
        </span>
      );
    case 'refunded':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 ${className}`}>
          <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
          Refunded
        </span>
      );
    case 'failed':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 ${className}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Failed
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
          {status || 'Unknown'}
        </span>
      );
  }
}

export function CustomerTierBadge({ tier, className = '' }) {
  const normalized = (tier || '').toLowerCase();

  if (normalized.includes('vip') || normalized.includes('gold')) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300/80 shadow-xs ${className}`}>
        <Crown className="w-3 h-3 text-amber-600" />
        {tier || 'VIP Gold'}
      </span>
    );
  }

  if (normalized.includes('silver') || normalized.includes('growth')) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60 ${className}`}>
        <Sparkles className="w-3 h-3 text-indigo-500" />
        {tier || 'Growth'}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/80 ${className}`}>
      <ShieldCheck className="w-3 h-3 text-slate-400" />
      {tier || 'Standard'}
    </span>
  );
}
