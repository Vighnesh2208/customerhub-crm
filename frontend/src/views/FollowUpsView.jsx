import React, { useState, useMemo } from 'react';
import { useCrm } from '../context/CrmContext';
import {
  CheckSquare,
  Plus,
  User,
  ShoppingBag,
  ExternalLink,
  Trash2,
  Sparkles
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export function FollowUpsView() {
  const {
    followUpTasks,
    toggleTaskComplete,
    deleteTask,
    openNewTaskModal,
    openCustomerModal,
    openOrderModal,
  } = useCrm();

  const [statusFilter, setStatusFilter] = useState('pending'); // 'all' | 'pending' | 'completed'
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'

  const counts = useMemo(() => {
    const total = followUpTasks.length;
    const pending = followUpTasks.filter(t => t.status !== 'completed').length;
    const completed = followUpTasks.filter(t => t.status === 'completed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, pending, completed, rate };
  }, [followUpTasks]);

  const filteredTasks = useMemo(() => {
    return followUpTasks.filter(task => {
      if (statusFilter === 'pending' && task.status === 'completed') return false;
      if (statusFilter === 'completed' && task.status !== 'completed') return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [followUpTasks, statusFilter, priorityFilter]);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'order_status':
        return <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />;
      case 'vip_care':
        return <Sparkles className="w-3.5 h-3.5 text-amber-600" />;
      case 'repeat_buyer':
        return <User className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Rule engine explanation & KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Pending Tasks</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">{counts.pending}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Require retention action</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Completed</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{counts.completed}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Resolved follow-ups</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Resolution Rate</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{counts.rate}%</span>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${counts.rate}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-indigo-150 bg-indigo-50/40 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-indigo-900 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Rule-Based Engine
            </span>
            <p className="text-[11px] text-indigo-700/80 mt-1">
              Continuously flags pending orders, VIP threshold crossings, and repeat customers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openNewTaskModal()}
            className="inline-flex items-center justify-center gap-1.5 w-full mt-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Task
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({counts.completed})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({counts.total})
          </button>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={statusFilter === 'pending' ? 'No pending follow-ups' : 'No tasks match criteria'}
            description={
              statusFilter === 'pending'
                ? 'Great job! You have addressed all recommended customer tasks.'
                : 'Try clearing your priority or status filters.'
            }
            actionLabel="Create Follow-up Task"
            onAction={() => openNewTaskModal()}
          />
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'completed';

            return (
              <div
                key={task.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'bg-slate-50/80 border-slate-200/70 opacity-75'
                    : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* Left: Checkbox & Content */}
                <div className="flex items-start gap-3.5 flex-1">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleTaskComplete(task.id)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                    title={isDone ? 'Mark as pending' : 'Mark as completed'}
                  />

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        {getTypeIcon(task.type)}
                        <h4 className={`text-sm font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {task.title}
                        </h4>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getPriorityStyle(task.priority)}`}>
                        {task.priority}
                      </span>

                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Due: {task.dueDate}
                      </span>
                    </div>

                    <p className={`text-xs ${isDone ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                      {task.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                      {task.customerName && (
                        <span>
                          Customer:{' '}
                          <button
                            type="button"
                            onClick={() => task.customerId && openCustomerModal(task.customerId)}
                            className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline cursor-pointer"
                          >
                            {task.customerName}
                          </button>
                        </span>
                      )}

                      {task.orderId && (
                        <span>
                          Order:{' '}
                          <button
                            type="button"
                            onClick={() => openOrderModal(task.orderId)}
                            className="font-mono font-semibold text-indigo-700 hover:underline cursor-pointer"
                          >
                            #{task.orderId}
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => toggleTaskComplete(task.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {isDone ? 'Reopen' : 'Complete'}
                  </button>

                  {task.customerId && (
                    <button
                      type="button"
                      onClick={() => openCustomerModal(task.customerId)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="View Customer Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
