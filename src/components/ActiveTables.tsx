import { Plus, Hash, Trash2 } from 'lucide-react';
import { useActiveTables } from './activeTables/useActiveTables';
import { TableCard } from './activeTables/TableCard';
import { TableSummaryModal } from './activeTables/TableSummaryModal';
import { ConfirmActionDialog } from './activeTables/ConfirmActionDialog';

export type { TableLineItem, TableOrder } from './activeTables/types';

export const ActiveTables = () => {
  const {
    tables,
    newTable,
    setNewTable,
    expandedId,
    setExpandedId,
    editingNotesId,
    setEditingNotesId,
    editNotes,
    setEditNotes,
    justAddedId,
    newItemName,
    setNewItemName,
    newItemPrice,
    setNewItemPrice,
    newItemQty,
    setNewItemQty,
    summaryTable,
    setSummaryTable,
    confirmAction,
    setConfirmAction,
    setConfirmTableId,
    itemInputRef,
    getTableTotal,
    handleAddTable,
    handleAddItem,
    handleRemoveItem,
    handleUndoLastItem,
    handleClearItems,
    handleUpdateQuantity,
    handleUpdateNotes,
    getTimeSince,
    grandTotal,
    executeConfirm,
  } = useActiveTables();

  return (
    <div className="space-y-3">
      {/* Add New Table - Quick Add */}
      <div className="card-elevated p-3 scale-in">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand">
            <Plus className="w-5 h-5 text-primary-foreground" />
          </div>
          <input
            type="text"
            value={newTable}
            onChange={(e) => setNewTable(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
            placeholder="Add table (e.g. Table 4)"
            className="input flex-1 bg-muted/50 border-border h-11 text-sm"
          />
          <button
            onClick={handleAddTable}
            disabled={!newTable.trim()}
            className="btn btn-primary px-4 py-2.5 h-11 text-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0 haptic"
          >
            Add Table
          </button>
        </div>
      </div>

      {/* Empty State */}
      {tables.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <Hash className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No active tables</p>
          <p className="text-muted-foreground/70 text-sm mt-1">Add a table above to get started</p>
        </div>
      ) : (
        <>
          {/* Tables List */}
          <div className="space-y-2">
            {tables.map((table, index) => {
              const total = getTableTotal(table);
              const isExpanded = expandedId === table.id;
              const isJustAdded = justAddedId === table.id;

              return (
                <TableCard
                  key={table.id}
                  table={table}
                  tableNumber={index + 1}
                  isExpanded={isExpanded}
                  isJustAdded={isJustAdded}
                  total={total}
                  timeSince={getTimeSince(table.timestamp)}
                  onToggleExpand={() => setExpandedId(isExpanded ? null : table.id)}
                  newItemName={newItemName}
                  setNewItemName={setNewItemName}
                  newItemPrice={newItemPrice}
                  setNewItemPrice={setNewItemPrice}
                  newItemQty={newItemQty}
                  setNewItemQty={setNewItemQty}
                  itemInputRef={itemInputRef}
                  onAddItem={() => handleAddItem(table.id)}
                  onUpdateQuantity={(itemId, delta) => handleUpdateQuantity(table.id, itemId, delta)}
                  onRemoveItem={(itemId) => handleRemoveItem(table.id, itemId)}
                  isEditingNotes={editingNotesId === table.id}
                  onStartEditNotes={() => {
                    setEditingNotesId(table.id);
                    setEditNotes(table.notes);
                  }}
                  editNotes={editNotes}
                  setEditNotes={setEditNotes}
                  onSaveNotes={(notes) => handleUpdateNotes(table.id, notes)}
                  onUndo={() => {
                    setConfirmAction('undo');
                    setConfirmTableId(table.id);
                  }}
                  onClear={() => {
                    setConfirmAction('clear');
                    setConfirmTableId(table.id);
                  }}
                  onViewSummary={() => setSummaryTable(table)}
                  onDelete={() => {
                    setConfirmAction('deleteTable');
                    setConfirmTableId(table.id);
                  }}
                />
              );
            })}
          </div>

          {/* Summary Footer */}
          <div className="card p-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {tables.length} active table{tables.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xl font-bold text-foreground mt-0.5">
                  GHS {grandTotal.toFixed(2)} total
                </p>
              </div>
              <button
                onClick={() => setConfirmAction('clearAll')}
                className="btn text-destructive bg-destructive/10 hover:bg-destructive/20 px-4 py-2.5 text-sm haptic"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Receipt-style Summary Modal */}
      <TableSummaryModal
        summaryTable={summaryTable}
        onClose={() => setSummaryTable(null)}
        getTableTotal={getTableTotal}
      />

      {/* Confirmation Modal */}
      <ConfirmActionDialog
        confirmAction={confirmAction}
        onCancel={() => {
          setConfirmAction(null);
          setConfirmTableId(null);
        }}
        onConfirm={executeConfirm}
      />
    </div>
  );
};
