import React from 'react';

export function ConfirmModal({ modal, onCancel }) {
  if (!modal) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <p className="text-slate-100 text-lg font-semibold mb-1">{modal.title}</p>
        <p className="text-slate-400 text-sm mb-5 leading-relaxed">{modal.message}</p>
        <div className="flex flex-col gap-2">
          {modal.secondaryConfirm && (
            <button
              onClick={modal.secondaryConfirm.onAction}
              className="w-full py-3 rounded-xl bg-[#d7f24c] text-slate-950 font-bold active:scale-95 transition shadow-lg shadow-[#d7f24c]/10"
            >
              {modal.secondaryConfirm.label}
            </button>
          )}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold active:scale-95 transition hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={modal.onConfirm}
              className={`flex-1 py-2.5 rounded-xl text-white font-semibold active:scale-95 transition ${modal.confirmColor || 'bg-red-600 hover:bg-red-500'}`}
            >
              {modal.confirmLabel || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
