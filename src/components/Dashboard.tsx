import { useState, useEffect, useMemo } from 'react';
import { User, DollarSign, LogOut, UtensilsCrossed, Table2, Sparkles, ChevronRight, BarChart3, ClipboardList, History, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrders';
import ramakosLogo from '../assets/ramakos-logo.png';
import { Worker, Order } from '../types';
import { FloatManager } from './FloatManager';
import { DashboardSummary } from './DashboardSummary';
import { ActiveTables, TableLineItem } from './ActiveTables';
import { MenuReference } from './MenuReference';
import { PersonalPerformance } from './PersonalPerformance';
import { MySales } from './MySales';
import { OrderTracker } from './OrderTracker';
import { WorkerActivityTimeline } from './WorkerActivityTimeline';
import { IncomingOrderModal } from './IncomingOrderModal';
import { playOrderAlertChime, isAudioAlertEnabled, setAudioAlertEnabled } from '../lib/audioAlert';

import { useToast } from './Toast';

type Tab = 'orders' | 'tables' | 'activity' | 'float' | 'menu' | 'sales' | 'performance';

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

  const { allOrders, assignOrder, updateOrderStatus } = useOrders(worker.id);
  const activeOrdersCount = allOrders.filter(o => o.status !== 'served').length;

  // Audio chime enabled state
  const [soundEnabled, setSoundEnabled] = useState(isAudioAlertEnabled());

  // Incoming orders alerting state
  const [activeIncomingOrder, setActiveIncomingOrder] = useState<Order | null>(null);
  const [dismissedOrderIds, setDismissedOrderIds] = useState<Set<number>>(new Set());
  const [seenOrderIds, setSeenOrderIds] = useState<Set<number>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Unclaimed incoming orders from Express Order
  const unclaimedOrders = useMemo(() => {
    return allOrders.filter(o => !o.claimed_by && (o.status === 'pending' || o.status === 'in_kitchen'));
  }, [allOrders]);

  // Alert detection: when a new unclaimed order arrives from Express Order, trigger chime and modal
  useEffect(() => {
    if (allOrders.length === 0 && !isInitialized) return;

    if (!isInitialized) {
      // First load: seed seenOrderIds with existing orders so old orders don't chime immediately
      setSeenOrderIds(new Set(allOrders.map(o => o.id)));
      setIsInitialized(true);
      return;
    }

    // Identify genuinely new incoming unclaimed order
    const freshOrder = unclaimedOrders.find(
      o => !seenOrderIds.has(o.id) && !dismissedOrderIds.has(o.id)
    );

    if (freshOrder) {
      playOrderAlertChime();
      setActiveIncomingOrder(freshOrder);
      setSeenOrderIds(prev => new Set([...prev, freshOrder.id]));
    }
  }, [allOrders, isInitialized, seenOrderIds, dismissedOrderIds, unclaimedOrders]);

  const { toast } = useToast();

  // If the active incoming order was claimed by another worker in real-time, auto-dismiss modal immediately
  useEffect(() => {
    if (activeIncomingOrder) {
      const liveOrder = allOrders.find(o => o.id === activeIncomingOrder.id);
      if (liveOrder && liveOrder.claimed_by && liveOrder.claimed_by !== worker.id) {
        setActiveIncomingOrder(null);
      }
    }
  }, [allOrders, activeIncomingOrder, worker.id]);

  const handleClaimIncomingOrder = async (order: Order) => {
    if (!worker?.id) return;
    const res = await assignOrder(order.id, worker.id);
    if (res?.success) {
      await updateOrderStatus(order.id, 'in_kitchen');
      setActiveIncomingOrder(null);
      setActiveTab('orders');
      toast.success('Order Claimed! 👨‍🍳', `Order #${order.id} is now assigned to you.`);
    } else {
      setActiveIncomingOrder(null);
      toast.warning(
        'Order Already Claimed',
        res?.error || 'Another staff member claimed this order just now.'
      );
    }
  };

  const handleDismissIncomingOrder = () => {
    if (activeIncomingOrder) {
      setDismissedOrderIds(prev => new Set([...prev, activeIncomingOrder.id]));
      setActiveIncomingOrder(null);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setAudioAlertEnabled(next);
    if (next) {
      playOrderAlertChime();
    }
  };

  const tabs = [
    { id: 'orders' as Tab, label: 'Orders', icon: ClipboardList },
    { id: 'tables' as Tab, label: 'Tables', icon: Table2 },
    { id: 'activity' as Tab, label: 'Activity', icon: History },
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
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 max-w-4xl mx-auto">
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
              <button
                onClick={toggleSound}
                className={`p-1.5 sm:p-2 rounded-xl transition-all active:scale-95 ${
                  soundEnabled
                    ? 'text-primary bg-primary/10 hover:bg-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title={soundEnabled ? 'Kitchen chime active (click to mute)' : 'Kitchen chime muted (click to unmute)'}
                aria-label="Toggle alert chime"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                ) : (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
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
      <nav className="sticky top-[53px] sm:top-[60px] z-30 px-2 sm:px-6 py-1.5 sm:py-2 bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto overflow-x-auto no-scrollbar touch-pan-x">
          <div className="flex gap-1 p-1 bg-muted/80 rounded-xl min-w-max sm:min-w-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasUnclaimed = tab.id === 'orders' && unclaimedOrders.length > 0;
              const hasBadge = tab.id === 'orders' && activeOrdersCount > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 min-w-[58px] sm:min-w-0 flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 sm:px-3 rounded-lg font-medium text-xs transition-all haptic ${
                    isActive
                      ? 'bg-card shadow-sm text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isActive ? 'scale-110 text-primary' : ''}`} />
                    {hasUnclaimed ? (
                      <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-md animate-bounce">
                        {unclaimedOrders.length}
                      </span>
                    ) : hasBadge ? (
                      <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        {activeOrdersCount > 9 ? '9+' : activeOrdersCount}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[11px] leading-none whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="px-3 sm:px-6 py-4 pb-24 max-w-4xl mx-auto safe-bottom">
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
        {activeTab === 'activity' && (
          <div className="fade-in">
            <WorkerActivityTimeline workerId={worker.id} />
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

      {/* Incoming Order Alert Modal */}
      <IncomingOrderModal
        order={activeIncomingOrder}
        pendingCount={unclaimedOrders.length}
        onClaim={handleClaimIncomingOrder}
        onDismiss={handleDismissIncomingOrder}
        onGoToOrders={() => {
          setActiveIncomingOrder(null);
          setActiveTab('orders');
        }}
      />
    </div>
  );
};
