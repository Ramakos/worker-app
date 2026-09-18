import { useState, useEffect } from 'react';
import { User, DollarSign, LogOut, UtensilsCrossed, Table2, Sparkles, ChevronRight, BarChart3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Worker } from '../types';
import { FloatManager } from './FloatManager';
import { DashboardSummary } from './DashboardSummary';
import { ActiveTables, TableLineItem } from './ActiveTables';
import { MenuReference } from './MenuReference';
import { PersonalPerformance } from './PersonalPerformance';
import { MySales } from './MySales';

type Tab = 'float' | 'tables' | 'menu' | 'performance' | 'sales';

const DEV_WORKER: Worker = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Dev Server',
  username: 'dev@server.app',
  worker_id: 'DEV-001',
  role: 'general_worker',
  is_active: true,
};

const PENDING_MENU_ITEMS_KEY = 'pendingMenuItems';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('tables');
  const { currentWorker, signOut } = useAuth();
  const worker = currentWorker || DEV_WORKER;
  const [tablesKey, setTablesKey] = useState(0);

  const tabs = [
    { id: 'float' as Tab, label: 'Float', icon: DollarSign },
    { id: 'tables' as Tab, label: 'Tables', icon: Table2, pocket: true },
    { id: 'menu' as Tab, label: 'Menu', icon: UtensilsCrossed, pocket: true },
    { id: 'sales' as Tab, label: 'Sales', icon: BarChart3, pocket: true },
    { id: 'performance' as Tab, label: 'Vibe', icon: Sparkles, pocket: true },
  ];

  useEffect(() => {
    const checkPending = () => {
      const pending = localStorage.getItem(PENDING_MENU_ITEMS_KEY);
      if (pending) {
        try {
          const items: { name: string; price: number }[] = JSON.parse(pending);
          if (items.length > 0) {
            const savedTables = localStorage.getItem('activeTables');
            if (savedTables) {
              const tables = JSON.parse(savedTables);
              if (tables.length > 0) {
                const newItems: TableLineItem[] = items.map(item => ({
                  id: Date.now().toString() + Math.random(),
                  name: item.name,
                  price: item.price,
                  quantity: 1,
                }));
                tables[0].items = [...tables[0].items, ...newItems];
                localStorage.setItem('activeTables', JSON.stringify(tables));
                setTablesKey(k => k + 1);
              }
            }
            localStorage.removeItem(PENDING_MENU_ITEMS_KEY);
          }
        } catch {
          // ignore corrupted pending menu items
        }
      }
    };

    if (activeTab === 'tables') checkPending();

    const interval = setInterval(checkPending, 500);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleAddFromMenu = (item: { name: string; price: number }) => {
    const pending = localStorage.getItem(PENDING_MENU_ITEMS_KEY);
    let items: { name: string; price: number }[] = [];
    try {
      items = pending ? JSON.parse(pending) : [];
    } catch {
      // ignore parse errors and start empty
    }
    items.push(item);
    localStorage.setItem(PENDING_MENU_ITEMS_KEY, JSON.stringify(items));
    setActiveTab('tables');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/40">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-card/80 border-b border-border/50">
        <div className="px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-brand flex items-center justify-center shadow-brand">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary border-2 border-card rounded-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm leading-tight">{worker.full_name}</span>
                <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                  {worker.role}
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            <button
              onClick={signOut}
              className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all active:scale-95"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="sticky top-[60px] z-30 px-3 py-2 bg-card/60 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-1.5 p-1 bg-muted/80 rounded-xl">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg font-medium text-xs transition-all ${
                    isActive
                      ? 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <span className="leading-none">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="px-3 py-4 pb-24 max-w-lg mx-auto">
        {activeTab === 'float' && (
          <div className="space-y-4 fade-in">
            <DashboardSummary workerId={worker.id} />
            <FloatManager workerId={worker.id} />
          </div>
        )}
        {activeTab === 'tables' && (
          <div className="fade-in">
            <ActiveTables key={tablesKey} />
          </div>
        )}
        {activeTab === 'menu' && (
          <div className="fade-in">
            <MenuReference onAddToTable={handleAddFromMenu} />
          </div>
        )}
        {activeTab === 'sales' && (
          <div className="fade-in">
            <MySales workerId={worker.id} />
          </div>
        )}
        {activeTab === 'performance' && (
          <div className="fade-in">
            <PersonalPerformance />
          </div>
        )}
      </main>
    </div>
  );
};
