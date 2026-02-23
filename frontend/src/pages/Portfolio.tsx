import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api } from '../api/client';
import './FeaturePage.css';
import './CrudPage.css';
import '../components/Charts.css';

type Portfolio = { id: string; name: string; currency: string; created_at: string };
type Holding = { id: string; portfolio_id: string; symbol: string; asset_class: string; quantity: string; avg_cost: string };

export default function Portfolio() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [portfolioTotals, setPortfolioTotals] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'portfolio' | 'holding' | null>(null);
  const [editPortfolio, setEditPortfolio] = useState<Portfolio | null>(null);
  const [editHolding, setEditHolding] = useState<Holding | null>(null);
  const [form, setForm] = useState({ name: '', currency: 'USD' });
  const [holdingForm, setHoldingForm] = useState({ symbol: '', asset_class: 'equity', quantity: '', avg_cost: '' });

  const load = () => api<Portfolio[]>('/portfolios').then(setPortfolios).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (portfolios.length === 0) {
      queueMicrotask(() => setPortfolioTotals({}));
      return;
    }
    Promise.all(
      portfolios.map((p) =>
        api<Holding[]>(`/portfolios/${p.id}/holdings`).then((h) => ({
          id: p.id,
          total: h.reduce((sum, x) => sum + (parseFloat(x.quantity) || 0) * (parseFloat(x.avg_cost) || 0), 0),
        }))
      )
    ).then((results) => setPortfolioTotals(Object.fromEntries(results.map((r) => [r.id, Math.round(r.total * 100) / 100]))));
  }, [portfolios]);

  useEffect(() => {
    if (!selected) {
      queueMicrotask(() => setHoldings([]));
      return;
    }
    api<Holding[]>(`/portfolios/${selected.id}/holdings`).then((h) => {
      setHoldings(h);
      const total = h.reduce((sum, x) => sum + (parseFloat(x.quantity) || 0) * (parseFloat(x.avg_cost) || 0), 0);
      setPortfolioTotals((prev) => ({ ...prev, [selected.id]: Math.round(total * 100) / 100 }));
    });
  }, [selected]);

  const openPortfolioModal = (p?: Portfolio) => {
    setEditPortfolio(p ?? null);
    setForm(p ? { name: p.name, currency: p.currency } : { name: '', currency: 'USD' });
    setModal('portfolio');
  };
  const openHoldingModal = (h?: Holding) => {
    if (!selected) return;
    setEditHolding(h ?? null);
    setHoldingForm(h ? { symbol: h.symbol, asset_class: h.asset_class, quantity: h.quantity, avg_cost: h.avg_cost } : { symbol: '', asset_class: 'equity', quantity: '', avg_cost: '' });
    setModal('holding');
  };

  const savePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editPortfolio) {
      await api(`/portfolios/${editPortfolio.id}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await api('/portfolios', { method: 'POST', body: JSON.stringify(form) });
    }
    setModal(null);
    load();
  };
  const saveHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (editHolding) {
      await api(`/portfolios/${selected.id}/holdings/${editHolding.id}`, { method: 'PUT', body: JSON.stringify(holdingForm) });
    } else {
      await api(`/portfolios/${selected.id}/holdings`, { method: 'POST', body: JSON.stringify(holdingForm) });
    }
    setModal(null);
    api<Holding[]>(`/portfolios/${selected.id}/holdings`).then(setHoldings);
  };
  const deletePortfolio = async (id: string) => {
    if (!confirm('Delete this portfolio and its holdings?')) return;
    await api(`/portfolios/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    load();
  };
  const deleteHolding = async (id: string) => {
    if (!selected || !confirm('Delete this holding?')) return;
    await api(`/portfolios/${selected.id}/holdings/${id}`, { method: 'DELETE' });
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  const allocationByAssetClass = useMemo(() => {
    const byClass: Record<string, number> = {};
    holdings.forEach((h) => {
      const q = parseFloat(h.quantity) || 0;
      const c = parseFloat(h.avg_cost) || 0;
      const val = q * c;
      byClass[h.asset_class] = (byClass[h.asset_class] || 0) + val;
    });
    return Object.entries(byClass).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [holdings]);

  const allocationBySymbol = useMemo(() => {
    return holdings.map((h) => {
      const q = parseFloat(h.quantity) || 0;
      const c = parseFloat(h.avg_cost) || 0;
      return { name: h.symbol, value: Math.round(q * c * 100) / 100 };
    });
  }, [holdings]);

  const CHART_COLORS = ['#3b82f6', '#22c55e', '#d4a853', '#a855f7', '#ec4899', '#8b9cb3'];

  return (
    <div className="feature-page feature-page--wide">
      <h1>Whole-Portfolio Management</h1>
      <p className="feature-desc">
        One place to see risk and performance across equities, fixed income, derivatives, and alternatives. Build and optimize portfolios with a common data model.
      </p>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{portfolios.length}</div>
          <div className="stat-label">Portfolios</div>
        </div>
        {selected && (
          <div className="stat-card">
            <div className="stat-value">{holdings.length}</div>
            <div className="stat-label">Holdings in {selected.name}</div>
          </div>
        )}
      </div>
      {selected && (allocationByAssetClass.length > 0 || allocationBySymbol.length > 0) && (
        <div className="charts-row">
          {allocationByAssetClass.length > 0 && (
            <div className="chart-card">
              <h3>Allocation by asset class</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocationByAssetClass} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {allocationByAssetClass.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {allocationBySymbol.length > 0 && (
            <div className="chart-card">
              <h3>Allocation by holding</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocationBySymbol} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {allocationBySymbol.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="crud-section">
        <div className="crud-header">
          <h2>Portfolios</h2>
          <button type="button" className="btn-primary" onClick={() => openPortfolioModal()}>Add portfolio</button>
        </div>
        {loading ? (
          <div className="loading-block" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <span>Loading…</span>
          </div>
        ) : portfolios.length === 0 ? (
          <div className="empty-state">
            <p>No portfolios yet. Add your first portfolio to get started.</p>
            <button type="button" className="btn-primary" onClick={() => openPortfolioModal()}>Add portfolio</button>
          </div>
        ) : (
          <table className="crud-table">
            <thead>
              <tr><th>Name</th><th>Currency</th><th>Total value</th><th></th></tr>
            </thead>
            <tbody>
              {portfolios.map((p) => (
                <tr key={p.id} className={selected?.id === p.id ? 'selected' : ''}>
                  <td><button type="button" className="link" onClick={() => setSelected(p)}>{p.name}</button></td>
                  <td>{p.currency}</td>
                  <td>{portfolioTotals[p.id] != null ? portfolioTotals[p.id].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
                  <td>
                    <button type="button" className="btn-sm" onClick={() => openPortfolioModal(p)}>Edit</button>
                    <button type="button" className="btn-sm danger" onClick={() => deletePortfolio(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && (
        <div className="crud-section">
          <div className="crud-header">
            <h2>Holdings — {selected.name}</h2>
            <button type="button" className="btn-primary" onClick={() => openHoldingModal()}>Add holding</button>
          </div>
          {holdings.length === 0 ? (
            <div className="empty-state">
              <p>No holdings yet. Add your first holding to this portfolio.</p>
              <button type="button" className="btn-primary" onClick={() => openHoldingModal()}>Add holding</button>
            </div>
          ) : (
            <table className="crud-table">
              <thead>
                <tr><th>Symbol</th><th>Asset class</th><th>Quantity</th><th>Avg cost</th><th></th></tr>
              </thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h.id}>
                    <td>{h.symbol}</td>
                    <td>{h.asset_class}</td>
                    <td>{h.quantity}</td>
                    <td>{h.avg_cost}</td>
                    <td>
                      <button type="button" className="btn-sm" onClick={() => openHoldingModal(h)}>Edit</button>
                      <button type="button" className="btn-sm danger" onClick={() => deleteHolding(h.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {modal === 'portfolio' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editPortfolio ? 'Edit portfolio' : 'New portfolio'}</h3>
            <form onSubmit={savePortfolio}>
              <label>Name <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></label>
              <label>Currency <input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} /></label>
              <div className="modal-actions">
                <button type="button" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === 'holding' && selected && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editHolding ? 'Edit holding' : 'New holding'}</h3>
            <form onSubmit={saveHolding}>
              <label>Symbol <input value={holdingForm.symbol} onChange={(e) => setHoldingForm((f) => ({ ...f, symbol: e.target.value }))} required /></label>
              <label>Asset class <select value={holdingForm.asset_class} onChange={(e) => setHoldingForm((f) => ({ ...f, asset_class: e.target.value }))}>
                <option value="equity">Equity</option>
                <option value="fixed_income">Fixed income</option>
                <option value="derivative">Derivative</option>
                <option value="alternative">Alternative</option>
              </select></label>
              <label>Quantity <input type="number" value={holdingForm.quantity} onChange={(e) => setHoldingForm((f) => ({ ...f, quantity: e.target.value }))} required /></label>
              <label>Avg cost <input value={holdingForm.avg_cost} onChange={(e) => setHoldingForm((f) => ({ ...f, avg_cost: e.target.value }))} /></label>
              <div className="modal-actions">
                <button type="button" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
