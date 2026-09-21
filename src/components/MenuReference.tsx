import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { useMenuReference } from './menuReference/useMenuReference';
import { MenuReferenceHeader } from './menuReference/MenuReferenceHeader';
import { MenuCategoryCard } from './menuReference/MenuCategoryCard';
import { PickedItemsSheet } from './menuReference/PickedItemsSheet';

interface MenuReferenceProps {
  onAddToTable?: (item: { name: string; price: number }) => void;
}

export const MenuReference: React.FC<MenuReferenceProps> = ({ onAddToTable }) => {
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
    handleConfirmPickedItems,
    handleClearPickedItems,
    pickedTotal,
  } = useMenuReference(onAddToTable);

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
        onConfirm={handleConfirmPickedItems}
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
