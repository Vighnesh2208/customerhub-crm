import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { X, CheckSquare, Plus } from 'lucide-react';

export function NewTaskModal() {
  const {
    isNewTaskModalOpen,
    newTaskInitialCustomer,
    closeNewTaskModal,
    addTask,
    customers,
  } = useCrm();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    newTaskInitialCustomer?.id ? String(newTaskInitialCustomer.id) : ''
  );
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('Today');

  if (!isNewTaskModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    let custName = 'Customer';
    let custEmail = '';
    const custId = selectedCustomerId ? parseInt(selectedCustomerId, 10) : null;

    if (custId) {
      const match = customers.find(c => c.id === custId);
      if (match) {
        custName = `${match.first_name} ${match.last_name}`.trim();
        custEmail = match.email;
      }
    } else if (newTaskInitialCustomer) {
      custName = `${newTaskInitialCustomer.first_name || ''} ${newTaskInitialCustomer.last_name || ''}`.trim() || 'Customer';
      custEmail = newTaskInitialCustomer.email || '';
    }

    addTask({
      title: title.trim(),
      description: description.trim(),
      customerId: custId,
      customerName: custName,
      customerEmail: custEmail,
      priority,
      dueDate,
    });

    closeNewTaskModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Create Follow-up Task</h3>
              <p className="text-xs text-slate-500">Add an actionable retention or support item</p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeNewTaskModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Call VIP customer regarding order inquiries"
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link to Customer (Optional)
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- No specific customer linked --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Due Date
              </label>
              <select
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Today">Today</option>
                <option value="Tomorrow">Tomorrow</option>
                <option value="This week">This week</option>
                <option value="Next week">Next week</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background context or steps to take..."
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-150 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeNewTaskModal}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
