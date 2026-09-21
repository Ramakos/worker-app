import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ConfirmAction } from './types';

interface ConfirmActionDialogProps {
  confirmAction: ConfirmAction;
  onCancel: () => void;
  onConfirm: () => void;
}

const confirmConfig: Record<Exclude<ConfirmAction, null>, { title: string; message: string; confirmLabel: string }> = {
  undo: {
    title: 'Undo Last Item?',
    message: 'This will remove the most recently added item from this table.',
    confirmLabel: 'Undo',
  },
  clear: {
    title: 'Clear All Items?',
    message: 'This will remove all items from this table. You will need to re-add them.',
    confirmLabel: 'Clear All',
  },
  clearAll: {
    title: 'Clear All Tables?',
    message: 'This will remove every table and all their items. This cannot be undone.',
    confirmLabel: 'Clear All Tables',
  },
  deleteTable: {
    title: 'Remove This Table?',
    message: 'This will permanently remove the table and all its items.',
    confirmLabel: 'Remove Table',
  },
};

export const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
  confirmAction,
  onCancel,
  onConfirm,
}) => {
  if (!confirmAction) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-card w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="font-semibold text-foreground">{confirmConfig[confirmAction].title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{confirmConfig[confirmAction].message}</p>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 btn btn-outline py-2.5 text-sm haptic"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 btn btn-destructive py-2.5 text-sm haptic"
          >
            {confirmConfig[confirmAction].confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
