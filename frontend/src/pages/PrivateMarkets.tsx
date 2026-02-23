import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api } from '../api/client';
import './FeaturePage.css';
import './CrudPage.css';
import '../components/Charts.css';

type Fund = { id: string; name: string; strategy: string; vintage_year: string };
type Commitment = { id: string; fund_id: string; amount: string; currency: string; date: string };

export default function PrivateMarkets() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selected, setSelected] = useState<Fund | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'fund' | 'commitment' | null>(null);
  const [editFund, setEditFund] = useState<Fund | null>(null);
  const [editCommitment, setEditCommitment] = useState<Commitment | null>(null);
  const [fundForm, setFundForm] = useState({ name: '', strategy: '', vintage_year: '' });
  const [commForm, setCommForm] = useState({ fund_id: '', amount: '', currency: 'USD', date: '' });

  const load = () => api<Fund[]>('/private-markets/funds').then(setFunds).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selected) {
      queueMicrotask(() => setCommitments([]));
      return;
    }
    api<Commitment[]>(`/private-markets/funds/${selected.id}/commitments`).then(setCommitments);
  }, [selected]);

  const openFundModal = (f?: Fund) => {
    setEditFund(f ?? null);
    setFundForm(f ? { name: f.name, strategy: f.strategy, vintage_year: f.vintage_year } : { name: '', strategy: '', vintage_year: '' });
    setModal('fund');
  };
  const openCommitmentModal = (c?: Commitment) => {
    setEditCommitment(c ?? null);
    setCommForm(c ? { fund_id: selected?.id || '', amount: c.amount, currency: c.currency, date: c.date } : { fund_id: selected?.id || '', amount: '', currency: 'USD', date: new Date().toISOString().slice(0, 10) });
    setModal('commitment');
  };

  const saveFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editFund) await api(`/private-markets/funds/${editFund.id}`, { method: 'PUT', body: JSON.stringify(fundForm) });
    else await api('/private-markets/funds', { method: 'POST', body: JSON.stringify(fundForm) });
    setModal(null);
    load();
  };
  const saveCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...commForm, fund_id: selected?.id || commForm.fund_id };
    if (editCommitment) await api(`/private-markets/commitments/${editCommitment.id}`, { method: 'PUT', body: JSON.stringify({ amount: commForm.amount, currency: commForm.currency, date: commForm.date }) });
    else await api('/private-markets/commitments', { method: 'POST', body: JSON.stringify(payload) });
    setModal(null);
    if (selected) api<Commitment[]>(`/private-markets/funds/${selected.id}/commitments`).then(setCommitments);
  };
  const deleteFund = async (id: string) => {
    if (!confirm('Delete this fund and its commitments?')) return;
    await api(`/private-markets/funds/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    load();
  };
  const deleteCommitment = async (id: string) => {
    if (!confirm('Delete this commitment?')) return;
    await api(`/private-markets/commitments/${id}`, { method: 'DELETE' });
    if (selected) setCommitments((prev) => prev.filter((c) => c.id !== id));
  };

  const commitmentPieData = useMemo(() => {
    return commitments.map((c) => ({ name: `${c.date} (${c.currency})`, value: parseFloat(c.amount) || 0 }));
  }, [commitments]);
  const COLORS = ['#3b82f6', '#22c55e', '#d4a853', '#a855f7', '#ec4899'];

  return (
    <div className="feature-page feature-page--wide">
      <h1>Private Markets and Alternatives</h1>
      <p className="feature-desc">Post-investment workflows for private equity, credit, real estate, and infrastructure. Track funds and commitments.</p>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{funds.length}</div>
          <div className="stat-label">Funds</div>
        </div>
        {selected && (
          <div className="stat-card">
            <div className="stat-value">{commitments.length}</div>
            <div className="stat-label">Commitments in {selected.name}</div>
          </div>
        )}
      </div>
      {selected && commitmentPieData.length > 0 && (
        <div className="charts-row">
          <div className="chart-card">
            <h3>Commitments by date — {selected.name}</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={commitmentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ value }) => `${value}`}>
                    {commitmentPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      <div className="crud-section">
        <div className="crud-header">
          <h2>Funds</h2>
          <button type="button" className="btn-primary" onClick={() => openFundModal()}>Add fund</button>
        </div>
        {loading ? (
          <div className="loading-block" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <span>Loading…</span>
          </div>
        ) : funds.length === 0 ? (
          <div className="empty-state">
            <p>No funds yet. Add your first fund to get started.</p>
            <button type="button" className="btn-primary" onClick={() => openFundModal()}>Add fund</button>
          </div>
        ) : (
          <table className="crud-table">
            <thead><tr><th>Name</th><th>Strategy</th><th>Vintage</th><th></th></tr></thead>
            <tbody>
              {funds.map((f) => (
                <tr key={f.id} className={selected?.id === f.id ? 'selected' : ''}>
                  <td><button type="button" className="link" onClick={() => setSelected(f)}>{f.name}</button></td>
                  <td>{f.strategy}</td>
                  <td>{f.vintage_year}</td>
                  <td>
                    <button type="button" className="btn-sm" onClick={() => openFundModal(f)}>Edit</button>
                    <button type="button" className="btn-sm danger" onClick={() => deleteFund(f.id)}>Delete</button>
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
            <h2>Commitments — {selected.name}</h2>
            <button type="button" className="btn-primary" onClick={() => openCommitmentModal()}>Add commitment</button>
          </div>
          {commitments.length === 0 ? (
            <div className="empty-state">
              <p>No commitments yet. Add a commitment to this fund.</p>
              <button type="button" className="btn-primary" onClick={() => openCommitmentModal()}>Add commitment</button>
            </div>
          ) : (
          <table className="crud-table">
            <thead><tr><th>Amount</th><th>Currency</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {commitments.map((c) => (
                <tr key={c.id}>
                  <td>{c.amount}</td>
                  <td>{c.currency}</td>
                  <td>{c.date}</td>
                  <td>
                    <button type="button" className="btn-sm" onClick={() => openCommitmentModal(c)}>Edit</button>
                    <button type="button" className="btn-sm danger" onClick={() => deleteCommitment(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      )}
      {modal === 'fund' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editFund ? 'Edit fund' : 'New fund'}</h3>
            <form onSubmit={saveFund}>
              <label>Name <input value={fundForm.name} onChange={(e) => setFundForm((f) => ({ ...f, name: e.target.value }))} required /></label>
              <label>Strategy <input value={fundForm.strategy} onChange={(e) => setFundForm((f) => ({ ...f, strategy: e.target.value }))} /></label>
              <label>Vintage year <input value={fundForm.vintage_year} onChange={(e) => setFundForm((f) => ({ ...f, vintage_year: e.target.value }))} /></label>
              <div className="modal-actions"><button type="button" onClick={() => setModal(null)}>Cancel</button><button type="submit">Save</button></div>
            </form>
          </div>
        </div>
      )}
      {modal === 'commitment' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editCommitment ? 'Edit commitment' : 'New commitment'}</h3>
            <form onSubmit={saveCommitment}>
              <label>Amount <input value={commForm.amount} onChange={(e) => setCommForm((f) => ({ ...f, amount: e.target.value }))} required /></label>
              <label>Currency <input value={commForm.currency} onChange={(e) => setCommForm((f) => ({ ...f, currency: e.target.value }))} /></label>
              <label>Date <input type="date" value={commForm.date} onChange={(e) => setCommForm((f) => ({ ...f, date: e.target.value }))} required /></label>
              <div className="modal-actions"><button type="button" onClick={() => setModal(null)}>Cancel</button><button type="submit">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
