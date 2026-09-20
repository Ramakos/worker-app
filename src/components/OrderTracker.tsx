import { useState } from 'react';
import { ClipboardList, Clock, ChefHat, CheckCircle, Truck, Users, RefreshCw, UserCheck } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { useToast } from './Toast';
import { Order } from '../types';

interface OrderTrackerProps {
  workerId?: string;
  workerRole?: string;
}

export const OrderTracker = ({ workerId }: OrderTrackerProps) => {
  const [activeView, setActiveView] = useState<'all' | 'personal'>('all');
  const { allOrders, personalOrders, isLoading, updateOrderStatus, assignOrder, refreshOrders } = useOrders(workerId);
  const { toast } = useToast();

  const handleRefresh = async () => {
    await refreshOrders();
    toast.info('Orders Refreshed', 'Synced with live kitchen queue');
  };

  const handleClaim = async (orderId: number, orderNumber?: string | number) => {
    if (!workerId) return;
    const res = await assignOrder(orderId, workerId);
    if (res?.success) {
      toast.success('Order Claimed', `Order #${orderNumber || orderId} is now assigned to you.`);
    } else {
      toast.error('Claim Failed', res?.error || 'Could not claim this order.');
    }
  };

  const handleAdvanceStatus = async (orderId: number, currentStatus: Order['status'], orderNumber?: string | number) => {
    const nextStatus = getNextStatus(currentStatus);
    const label = getNextStatusLabel(currentStatus);
    const res = await updateOrderStatus(orderId, nextStatus);
    if (res?.success) {
      toast.success(
        nextStatus === 'served' ? 'Order Served!' : `Order Advanced: ${nextStatus.toUpperCase()}`,
        `Order #${orderNumber || orderId} marked as ${nextStatus}.`
      );
    } else {
      toast.error('Update Failed', res?.error || `Could not update to ${label}.`);
    }
  };

  const orders = activeView === 'all' ? allOrders : personalOrders;

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-3.5 h-3.5" />;
      case 'in_kitchen': return <ChefHat className="w-3.5 h-3.5" />;
      case 'ready': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'served':
      case 'delivered': return <Truck className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'text-amber-700 bg-amber-50 border-amber-200/60';
      case 'in_kitchen': return 'text-blue-700 bg-blue-50 border-blue-200/60';
      case 'ready': return 'text-emerald-700 bg-emerald-50 border-emerald-200/60';
      case 'served':
      case 'delivered': return 'text-muted-foreground bg-muted border-border';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] => {
    switch (currentStatus) {
      case 'pending': return 'in_kitchen';
      case 'in_kitchen': return 'ready';
      case 'ready': return 'served';
      default: return currentStatus;
    }
  };

  const getNextStatusLabel = (currentStatus: Order['status']): string => {
    switch (currentStatus) {
      case 'pending': return 'Start Preparing';
      case 'in_kitchen': return 'Mark Ready';
      case 'ready': return 'Mark Served';
      default: return 'Next';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 min ago';
    if (diff < 60) return `${diff} mins ago`;
    const hours = Math.floor(diff / 60);
    return `${hours}h ${diff % 60}m ago`;
  };

  const calculateTotal = (items: Order['items']) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className="space-y-4">
      {/* Header & Status KPI Grid */}
      <div className="bg-card rounded-2xl shadow-sm p-4 sm:p-5 border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">Live Orders</h2>
                <p className="text-[11px] text-muted-foreground">From Express Order & Counter</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="sm:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50 haptic"
              aria-label="Refresh orders"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="hidden sm:flex p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50 haptic"
              aria-label="Refresh orders"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex bg-muted p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setActiveView('all')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === 'all'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-3.5 h-3.5 inline mr-1" />
                All ({allOrders.length})
              </button>
              <button
                onClick={() => setActiveView('personal')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === 'personal'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 inline mr-1" />
                Mine ({personalOrders.length})
              </button>
            </div>
          </div>
        </div>

        {/* 4 Pipeline Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-1 border-t border-border/60">
          {[
            { id: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length, color: 'text-amber-600' },
            { id: 'preparing', label: 'In Kitchen', count: orders.filter(o => o.status === 'in_kitchen').length, color: 'text-blue-600' },
            { id: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length, color: 'text-emerald-600' },
            { id: 'served', label: 'Served', count: orders.filter(o => o.status === 'served' || o.status === 'delivered').length, color: 'text-muted-foreground' },
          ].map(s => (
            <div key={s.id} className="bg-muted/40 rounded-xl p-2.5 text-center">
              <div className={`text-xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-[11px] text-muted-foreground font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {isLoading && orders.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3"></div>
            <p className="text-xs text-muted-foreground">Checking live order stream...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border">
            <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              {activeView === 'personal' ? 'No orders claimed by you yet' : 'No active orders'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              New orders from Express Order will appear here instantly.
            </p>
          </div>
        ) : (
          orders
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(order => {
              const totalAmount = order.total_paid || calculateTotal(order.items);
              const isClaimedByMe = order.claimed_by === workerId;

              return (
                <div key={order.id} className="bg-card rounded-2xl shadow-sm p-4 border border-border hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="font-bold text-sm text-foreground">
                          #{order.id}
                        </span>
                        {order.customer_name && (
                          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md text-[11px] font-medium">
                            {order.customer_name}
                          </span>
                        )}
                        <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md text-[11px] font-medium capitalize">
                          {order.order_type || order.mode || 'dine-in'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(order.created_at)}
                      </p>
                    </div>

                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status === 'in_kitchen' ? 'preparing' : order.status}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-muted/30 rounded-xl p-2.5 space-y-1.5 mb-3 text-xs">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between items-start gap-2">
                        <span className="text-foreground">
                          <span className="font-semibold">{item.quantity}x</span> {item.name}
                          {item.modifiers && (
                            <span className="text-muted-foreground italic ml-1">
                              ({item.modifiers})
                            </span>
                          )}
                        </span>
                        <span className="text-muted-foreground font-mono font-medium shrink-0">
                          GH₵ {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer & Quick Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-border/60">
                    <div className="flex items-baseline justify-between sm:justify-start gap-2">
                      <span className="text-xs text-muted-foreground">Total:</span>
                      <span className="text-base font-bold text-primary">
                        GH₵ {totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!order.claimed_by && (
                        <button
                          onClick={() => handleClaim(order.id, order.order_number)}
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl text-xs font-semibold transition-all haptic"
                        >
                          Claim
                        </button>
                      )}

                      {order.status !== 'served' && order.status !== 'delivered' && (
                        <button
                          onClick={() => handleAdvanceStatus(order.id, order.status, order.order_number)}
                          className="flex-1 sm:flex-none px-3.5 py-1.5 bg-primary hover:bg-brand-dark text-primary-foreground rounded-xl text-xs font-semibold shadow-sm transition-all haptic"
                        >
                          {getNextStatusLabel(order.status)}
                        </button>
                      )}
                    </div>
                  </div>

                  {order.claimed_by && (
                    <div className="mt-2 text-[11px] text-muted-foreground pt-1.5 border-t border-dashed border-border/40 flex items-center justify-between">
                      <span>
                        Claimed by: <strong className="text-foreground">{isClaimedByMe ? 'You' : `Staff #${order.claimed_by.slice(0, 6)}`}</strong>
                      </span>
                      {order.claimed_at && (
                        <span>{new Date(order.claimed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
