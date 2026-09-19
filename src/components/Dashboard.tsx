import { useState } from 'react';
import { User, DollarSign, LogOut, UtensilsCrossed, Table2, Sparkles, ChevronRight, BarChart3, ClipboardList } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrders';
import ramakosLogo from '../assets/ramakos-logo.png';
import { Worker } from '../types';
import { FloatManager } from './FloatManager';
import { DashboardSummary } from './DashboardSummary';
import { ActiveTables, TableLineItem } from './ActiveTables';
import { MenuReference } from './MenuReference';
import { PersonalPerformance } from './PersonalPerformance';
import { MySales } from './MySales';
import { OrderTracker } from './OrderTracker';

type Tab = 'orders' | 'tables' | 'float' | 'menu' | 'sales' | 'performance';

const DEV_WORKER: Worker = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Dev Server',
  username: 'dev@server.app',
  worker_id: 'DEV-001',
  role: 'general_worker',
  is_active: true,
};

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const { currentWorker, signOut } = useAuth();
  const worker = currentWorker || DEV_WORKER;
  const [tablesKey, setTablesKey] = useState(0);

  const { allOrders } = useOrders(worker.id);
  const activeOrdersCount = allOrders.filter(o => o.status !== 'served').length;

  const tabs = [
    { id: 'orders' as Tab, label: 'Orders', icon: ClipboardList },
    { id: 'tables' as Tab, label: 'Tables', icon: Table2 },
    { id: 'float' as Tab, label: 'Float', icon: DollarSign },
    { id: 'menu' as Tab, label: 'Menu', icon: UtensilsCrossed },
    { id: 'sales' as Tab, label: 'Sales', icon: BarChart3 },
    { id: 'performance' as Tab, label: 'Vibe', icon: Sparkles },
  ];

  const handleAddFromMenu = (item: { name: string; price: number }) => {
    try {
      const savedTables = localStorage.getItem('activeTables');
      let tables: any[] = savedTables ? JSON.parse(savedTables) : [];
      if (tables.length === 0) {
        tables = [{
          id: Date.now().toString(),
          tableName: 'Table 1',
          items: [],
          notes: '',
          timestamp: Date.now(),
        }];
      }
      const newItem: TableLineItem = {
        id: Date.now().toString() + Math.random(),
        name: item.name,
        price: item.price,
        quantity: 1,
      };
      tables[0].items = [...tables[0].items, newItem];
      localStorage.setItem('activeTables', JSON.stringify(tables));
      setTablesKey(k => k + 1);
    } catch {
      // ignore
    }
    setActiveTab('tables');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/40">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-card/80 border-b border-border/50">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-brand flex items-center justify-center shadow-brand">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary border-2 border-card rounded-full" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-foreground text-xs sm:text-sm leading-tight truncate">{worker.full_name}</span>
                <span className="text-[11px] sm:text-xs text-muted-foreground capitalize flex items-center gap-0.5 truncate">
                  {worker.role.replace(/_/g, ' ')}
                  <ChevronRight className="w-3 h-3 shrink-0" />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <img
                src={ramakosLogo}
                alt="Ramakos"
                className="h-7 sm:h-8 w-auto object-contain shrink-0"
              />
              <button
                onClick={signOut}
                className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all active:scale-95"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="sticky top-[53px] sm:top-[60px] z-30 px-2 sm:px-3 py-1.5 sm:py-2 bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-lg mx-auto overflow-x-auto no-scrollbar">
          <div className="flex gap-1 p-1 bg-muted/80 rounded-xl min-w-max sm:min-w-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasBadge = tab.id === 'orders' && activeOrdersCount > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 min-w-[58px] sm:min-w-0 flex flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-medium text-xs transition-all haptic ${
                    isActive
                      ? 'bg-card shadow-sm text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isActive ? 'scale-110 text-primary' : ''}`} />
                    {hasBadge && (
                      <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        {activeOrdersCount > 9 ? '9+' : activeOrdersCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] leading-none whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="px-3 py-4 pb-24 max-w-lg mx-auto safe-bottom">
        {activeTab === 'orders' && (
          <div className="fade-in">
            <OrderTracker workerId={worker.id} workerRole={worker.role} />
          </div>
        )}
        {activeTab === 'tables' && (
          <div className="fade-in">
            <ActiveTables key={tablesKey} />
          </div>
        )}
        {activeTab === 'float' && (
          <div className="space-y-4 fade-in">
            <DashboardSummary workerId={worker.id} />
            <FloatManager workerId={worker.id} />
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
