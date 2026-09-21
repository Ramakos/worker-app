import { useState, useEffect, useMemo } from 'react';
import { User, ChevronDown, UtensilsCrossed, Table2, ClipboardList, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrders';
import ramakosLogo from '../assets/ramakos-logo.png';
import { Worker, Order } from '../types';
import { DashboardSummary } from './DashboardSummary';
import { FloatManager } from './FloatManager';
import { ActiveTables, TableLineItem } from './ActiveTables';
import { MenuReference } from './MenuReference';
import { PersonalPerformance } from './PersonalPerformance';
import { MySales } from './MySales';
import { OrderTracker } from './OrderTracker';
import { WorkerActivityTimeline } from './WorkerActivityTimeline';
import { IncomingOrderModal } from './IncomingOrderModal';
import { WorkerProfileModal } from './profile/WorkerProfileModal';
import { playOrderAlertChime, isAudioAlertEnabled, setAudioAlertEnabled } from '../lib/audioAlert';

import { useToast } from './Toast';

type Tab = 'orders' | 'tables' | 'menu' | 'activity' | 'float' | 'sales' | 'performance';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  // Primary Floor Operation Tabs
  const primaryTabs = [
    { id: 'orders' as Tab, label: 'Live Orders', icon: ClipboardList },
    { id: 'tables' as Tab, label: 'Tables', icon: Table2 },
    { id: 'menu' as Tab, label: 'Menu Catalog', icon: UtensilsCrossed },
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
      <header className="sticky top-0 z-40 backdrop-blur-md bg-card/85 border-b border-border/60 shadow-xs">
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Sleek Touch-Friendly Profile Chip */}
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 sm:gap-2.5 py-1 px-1.5 pr-2.5 sm:pr-3 rounded-full bg-secondary/60 hover:bg-secondary border border-border/60 active:scale-95 transition-all text-left cursor-pointer group shrink-0"
              title="Open Staff Profile, Shifts & Settings"
              aria-label="Open staff profile and settings"
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-brand flex items-center justify-center shadow-xs group-hover:ring-2 group-hover:ring-primary/40 transition-all">
                  <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-primary-foreground" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full ring-1 ring-emerald-400/30" />
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-bold text-foreground text-xs sm:text-sm truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[200px] group-hover:text-primary transition-colors">
                  {worker.full_name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
            </button>

            {/* Right Action Controls: Audio Chime & Ramakos Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={toggleSound}
                className={`p-2 rounded-xl transition-all active:scale-95 ${
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
                className="h-6 sm:h-7.5 w-auto object-contain shrink-0"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Streamlined Floor Navigation Bar */}
      <nav className="sticky top-[53px] sm:top-[60px] z-30 px-2 sm:px-6 py-1.5 sm:py-2 bg-card/85 backdrop-blur-md border-b border-border/60">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-1.5 p-1 bg-muted/80 rounded-2xl">
            {primaryTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasUnclaimed = tab.id === 'orders' && unclaimedOrders.length > 0;
              const hasBadge = tab.id === 'orders' && activeOrdersCount > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl font-semibold text-xs transition-all haptic ${
                    isActive
                      ? 'bg-card shadow-sm text-primary font-bold'
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
                  <span className="text-xs leading-none whitespace-nowrap">{tab.label}</span>
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

      {/* Worker Profile, Shift & Settings Modal */}
      <WorkerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        worker={worker}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onSignOut={signOut}
      />
    </div>
  );
};
