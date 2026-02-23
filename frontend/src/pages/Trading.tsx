import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import './FeaturePage.css';
import './CrudPage.css';
import '../components/Charts.css';

type Order = { id: string; portfolio_id: string; symbol: string; side: string; quantity: string; order_type: string; status: string; created_at: string };
type Portfolio = { id: string; name: string }[];

export default function Trading() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [form, setForm] = useState({ portfolio_id: '', symbol: '', side: 'BUY', quantity: '', order_type: 'MARKET' });

  const load = () => {
    Promise.all([api<Order[]>('/trading/orders'), api<Portfolio>('/portfolios')]).then(([ordersData, portfolioData]) => {
      setOrders(ordersData);
      setPortfolios(portfolioData);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openModal = (o?: Order) => {
    setEditOrder(o ?? null);
    if (o) {
      setForm({ portfolio_id: o.portfolio_id, symbol: o.symbol, side: o.side, quantity: o.quantity, order_type: o.order_type });
    } else {
      setForm({ portfolio_id: portfolios[0]?.id || '', symbol: '', side: 'BUY', quantity: '', order_type: 'MARKET' });
    }
    setModal(true);
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editOrder) {
      await api(`/trading/orders/${editOrder.id}`, { method: 'PUT', body: JSON.stringify({ status: editOrder.status }) });
    } else {
      await api('/trading/orders', { method: 'POST', body: JSON.stringify(form) });
    }
    setModal(false);
    load();
  };
  const updateStatus = async (order: Order, status: string) => {
    await api(`/trading/orders/${order.id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    load();
  };
  const deleteOrder = async (id: string) => {
    if (!confirm('Cancel/delete this order?')) return;
    await api(`/trading/orders/${id}`, { method: 'DELETE' });
    load();
  };

  const orderByStatus = useMemo(() => {
    const m: Record<string, number> = {};
    orders.forEach((o) => { m[o.status] = (m[o.status] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [orders]);
  const orderBySide = useMemo(() => {
    const m: Record<string, number> = {};
    orders.forEach((o) => { m[o.side] = (m[o.side] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [orders]);
  const STATUS_COLORS: Record<string, string> = { NEW: '#3b82f6', FILLED: '#22c55e', CANCELLED: '#ef4444' };

  return (
    <div className="feature-page feature-page--wide">
      <h1>Trading and Order Management</h1>
      <p className="feature-desc">
        Centralized execution, order management, and compliance support with links to execution platforms.
      </p>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Total orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{orders.filter((o) => o.status === 'NEW').length}</div>
          <div className="stat-label">Open (NEW)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{orders.filter((o) => o.status === 'FILLED').length}</div>
          <div className="stat-label">Filled</div>
        </div>
      </div>
      {(orderByStatus.length > 0 || orderBySide.length > 0) && (
        <div className="charts-row">
          {orderByStatus.length > 0 && (
            <div className="chart-card">
              <h3>Orders by status</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={orderByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {orderByStatus.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#8b9cb3'} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {orderBySide.length > 0 && (
            <div className="chart-card">
              <h3>Orders by side</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderBySide} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #2d3a4a)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted, #8b9cb3)' }} />
                    <YAxis tick={{ fill: 'var(--text-muted, #8b9cb3)' }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#d4a853" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="crud-section">
        <div className="crud-header">
          <h2>Orders</h2>
          <button type="button" className="btn-primary" onClick={() => openModal()}>New order</button>
        </div>
        {loading ? (
          <div className="loading-block" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <span>Loading…</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet. Create your first order to get started.</p>
            <button type="button" className="btn-primary" onClick={() => openModal()}>New order</button>
          </div>
        ) : (
          <table className="crud-table">
            <thead>
              <tr><th>Portfolio</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{portfolios.find((p) => p.id === o.portfolio_id)?.name ?? o.portfolio_id}</td>
                  <td>{o.symbol}</td>
                  <td>{o.side}</td>
                  <td>{o.quantity}</td>
                  <td>
                    {o.status === 'NEW' && (
                      <>
                        <button type="button" className="btn-sm" onClick={() => updateStatus(o, 'FILLED')}>Fill</button>
                        <button type="button" className="btn-sm" onClick={() => updateStatus(o, 'CANCELLED')}>Cancel</button>
                      </>
                    )}
                    {o.status !== 'NEW' && o.status}
                  </td>
                  <td>
                    <button type="button" className="btn-sm danger" onClick={() => deleteOrder(o.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editOrder ? 'Order (status only)' : 'New order'}</h3>
            <form onSubmit={saveOrder}>
              {editOrder ? (
                <label>Status <select value={editOrder.status} onChange={(e) => setEditOrder((o) => o ? { ...o, status: e.target.value } : null)}>
                  <option value="NEW">NEW</option>
                  <option value="FILLED">FILLED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select></label>
              ) : (
                <>
                  <label>Portfolio <select value={form.portfolio_id} onChange={(e) => setForm((f) => ({ ...f, portfolio_id: e.target.value }))} required>
                    {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select></label>
                  <label>Symbol <input value={form.symbol} onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))} required /></label>
                  <label>Side <select value={form.side} onChange={(e) => setForm((f) => ({ ...f, side: e.target.value }))}><option value="BUY">BUY</option><option value="SELL">SELL</option></select></label>
                  <label>Quantity <input value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} required /></label>
                  <label>Order type <input value={form.order_type} onChange={(e) => setForm((f) => ({ ...f, order_type: e.target.value }))} /></label>
                </>
              )}
              <div className="modal-actions">
                <button type="button" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
