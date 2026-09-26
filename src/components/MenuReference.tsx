import React, { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { useMenuReference } from './menuReference/useMenuReference';
import { MenuReferenceHeader } from './menuReference/MenuReferenceHeader';
import { MenuCategoryCard } from './menuReference/MenuCategoryCard';
import { PickedItemsSheet } from './menuReference/PickedItemsSheet';
import { SelectTableModal } from './menuReference/SelectTableModal';
import { TableOrder } from './activeTables/types';
import { useToast } from './Toast';

interface MenuReferenceProps {
  onAddToTable?: (tableId?: string) => void;
}

export const MenuReference: React.FC<MenuReferenceProps> = ({ onAddToTable }) => {
  const { toast } = useToast();
  const [isSelectTableOpen, setIsSelectTableOpen] = useState(false);
  const [activeTables, setActiveTables] = useState<TableOrder[]>([]);

  const {
    categories,
    expandedCategories,
    searchQuery,
    setSearchQuery,
    isLoading,
    lastSynced,
    pickedItems,
    isOffline,
    recentlyPickedId,
    fetchMenu,
    toggleCategory,
    handlePickItem,
    handleRemovePickedItem,
    handleClearPickedItems,
    pickedTotal,
  } = useMenuReference();

  const handleOpenSelectTable = () => {
    try {
      const saved = localStorage.getItem('activeTables');
      const tables: TableOrder[] = saved ? JSON.parse(saved) : [];
      setActiveTables(tables);
    } catch {
      setActiveTables([]);
    }
    setIsSelectTableOpen(true);
  };

  const handleTableSelected = (tableId: string, isNew?: boolean, newTableName?: string) => {
    if (pickedItems.length === 0) return;

    try {
      const saved = localStorage.getItem('activeTables');
      let tables: TableOrder[] = saved ? JSON.parse(saved) : [];

      const newItemsToAdd = pickedItems.map((item) => ({
        id: Date.now().toString() + Math.random(),
        name: item.name,
        price: item.price,
        quantity: 1,
      }));

      let finalTableId = tableId;
      let targetTableName = '';

      if (isNew || !tableId) {
        const tableName = newTableName?.trim() || `Table ${tables.length + 1}`;
        const newTable: TableOrder = {
          id: Date.now().toString(),
          tableName,
          items: newItemsToAdd,
          notes: '',
          timestamp: Date.now(),
        };
        tables.push(newTable);
        finalTableId = newTable.id;
        targetTableName = tableName;
      } else {
        const found = tables.find((t) => t.id === tableId);
        if (found) {
          found.items = [...found.items, ...newItemsToAdd];
          targetTableName = found.tableName;
        } else {
          const tableName = newTableName?.trim() || `Table ${tables.length + 1}`;
          const newTable: TableOrder = {
            id: Date.now().toString(),
            tableName,
            items: newItemsToAdd,
            notes: '',
            timestamp: Date.now(),
          };
          tables.push(newTable);
          finalTableId = newTable.id;
          targetTableName = tableName;
        }
      }

      localStorage.setItem('activeTables', JSON.stringify(tables));
      handleClearPickedItems();
      setIsSelectTableOpen(false);

      toast.success(
        'Items Added to Table',
        `Added ${pickedItems.length} item(s) to ${targetTableName} (GHS ${pickedTotal.toFixed(2)})`
      );

      // Transition to tables tab
      onAddToTable?.(finalTableId);
    } catch (err) {
      console.error('Error adding items to table:', err);
      toast.error('Failed to Add', 'Could not save items to the selected table');
    }
  };

  return (
    <div className="space-y-3 pb-32">
      <MenuReferenceHeader
        lastSynced={lastSynced}
        isOffline={isOffline}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onRefresh={fetchMenu}
      />

      {categories.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No items found</p>
          <p className="text-muted-foreground/70 text-sm mt-1">Try a different search or refresh</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(category => (
            <MenuCategoryCard
              key={category.id}
              category={category}
              isExpanded={expandedCategories.has(category.id) || searchQuery !== ''}
              searchQuery={searchQuery}
              recentlyPickedId={recentlyPickedId}
              onToggle={toggleCategory}
              onPickItem={handlePickItem}
            />
          ))}
        </div>
      )}

      <PickedItemsSheet
        pickedItems={pickedItems}
        total={pickedTotal}
        onClear={handleClearPickedItems}
        onRemoveItem={handleRemovePickedItem}
        onConfirm={handleOpenSelectTable}
      />

      <SelectTableModal
        isOpen={isSelectTableOpen}
        onClose={() => setIsSelectTableOpen(false)}
        tables={activeTables}
        itemsToAdd={pickedItems}
        totalAmount={pickedTotal}
        onSelectTable={handleTableSelected}
      />

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes animate-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-in {
          animation: animate-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};
