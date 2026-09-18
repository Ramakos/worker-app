import { useState } from 'react';
import { ClipboardList, Clock, ChefHat, CheckCircle, Truck, Users, RefreshCw } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { Order } from '../types';

interface OrderTrackerProps {
  workerId?: string;
  workerRole?: string;
}

export const OrderTracker = ({ workerId, workerRole }: OrderTrackerProps) => {
  const [activeView, setActiveView] = useState<'all' | 'personal'>('all');
  const { allOrders, personalOrders, isLoading, updateOrderStatus, assignOrder, refreshOrders } = useOrders(workerId);

  const filteredAllOrders = workerRole === 'server'
    ? allOrders.filter(o => o.status === 'ready' || o.claimed_by === workerId)
    : allOrders;

  const orders = activeView === 'all' ? filteredAllOrders : personalOrders;

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'preparing': return <ChefHat className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'served': return <Truck className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'text-muted-foreground bg-muted';
      case 'preparing': return 'text-secondary-foreground bg-secondary';
      case 'ready': return 'text-secondary-foreground bg-accent';
      case 'served': return 'text-muted-foreground bg-muted';
    }
  };

  const canUpdateStatus = (order: Order) => {
    if (workerRole === 'manager') return true;
    if (workerRole === 'cook') return order.status === 'pending' || order.status === 'preparing';
    if (workerRole === 'server') return order.claimed_by === workerId && (order.status === 'ready' || order.status === 'served');
    return false;
  };

  const getNextStatus = (currentStatus: Order['status']) => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'served';
      default: return currentStatus;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 minute ago';
    return `${diff} minutes ago`;
  };

  const calculateTotal = (items: Order['items']) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <ClipboardList className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Order Tracker</h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={refreshOrders}
              disabled={isLoading}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setActiveView('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'all'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-4 h-4 inline mr-1" />
                All Orders
              </button>
              <button
                onClick={() => setActiveView('personal')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'personal'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                My Orders
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['pending', 'preparing', 'ready', 'served'].map(status => {
            const count = orders.filter(o => o.status === status).length;
            return (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold text-foreground">{count}</div>
                <div className="text-sm text-muted-foreground capitalize">{status}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-card rounded-xl shadow-sm p-8 text-center border border-border">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card rounded-xl shadow-sm p-8 text-center border border-border">
            <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {activeView === 'personal' ? 'No orders assigned to you' : 'No orders found'}
            </p>
          </div>
        ) : (
          orders
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(order => (
              <div key={order.id} className="bg-card rounded-xl shadow-sm p-6 border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        Order #{order.id}
                      </h3>
                      {order.customer_name && (
                        <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-sm">
                          {order.customer_name}
                        </span>
                      )}
                      <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm capitalize">
                        {order.order_type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatTimeAgo(order.created_at)}
                    </p>
                  </div>

                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-foreground">
                        {item.quantity}x {item.name}
                        {item.modifiers && (
                          <span className="text-muted-foreground italic ml-2">
                            ({item.modifiers})
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-lg font-semibold text-foreground">
                    Total: ${order.total_paid?.toFixed(2) || calculateTotal(order.items).toFixed(2)}
                  </div>

                  <div className="flex space-x-2">
                    {!order.claimed_by && workerRole === 'server' && (
                      <button
                        onClick={() => workerId && assignOrder(order.id, workerId)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium
                                 hover:bg-brand-dark transition-colors"
                      >
                        Claim Order
                      </button>
                    )}

                    {canUpdateStatus(order) && order.status !== 'served' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status))}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium
                                 hover:bg-brand-dark transition-colors"
                      >
                        Mark {getNextStatus(order.status)}
                      </button>
                    )}
                  </div>
                </div>

                {order.claimed_by && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Claimed by: {order.claimed_by === workerId ? 'You' : `Worker ${order.claimed_by}`}
                    {order.claimed_at && (
                      <span> at {new Date(order.claimed_at).toLocaleTimeString()}</span>
                    )}
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
};
