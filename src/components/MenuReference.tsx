import React from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { useMenuReference } from './menuReference/useMenuReference';
import { MenuReferenceHeader } from './menuReference/MenuReferenceHeader';
import { MenuCategoryCard } from './menuReference/MenuCategoryCard';

export const MenuReference: React.FC = () => {
  const {
    categories,
    expandedCategories,
    searchQuery,
    setSearchQuery,
    isLoading,
    lastSynced,
    isOffline,
    fetchMenu,
    toggleCategory,
  } = useMenuReference();

  return (
    <div className="space-y-3 pb-6">
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
              onToggle={toggleCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};
