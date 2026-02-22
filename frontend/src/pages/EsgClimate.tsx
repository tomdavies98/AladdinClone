import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import './FeaturePage.css';
import './CrudPage.css';
import '../components/Charts.css';

type Esg = { id: string; portfolio_id: string; score_type: string; value: string; as_of_date: string };
type Portfolio = { id: string; name: string }[];

export default function EsgClimate() {
  const [list, setList] = useState<Esg[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editEsg, setEditEsg] = useState<Esg | null>(null);
  const [form, setForm] = useState({ portfolio_id: '', score_type: 'ESG', value: '', as_of_date: new Date().toISOString().slice(0, 10) });

  const load = () => {
    api<Esg[]>('/esg-climate').then(setList);
    api<Portfolio>('/portfolios').then(setPortfolios);
  };
  useEffect(() => { load(); setLoading(false); }, []);

  const openModal = (e?: Esg) => {
    setEditEsg(e ?? null);
    setForm(e ? { portfolio_id: e.portfolio_id, score_type: e.score_type, value: e.value, as_of_date: e.as_of_date } : { portfolio_id: portfolios[0]?.id || '', score_type: 'ESG', value: '', as_of_date: new Date().toISOString().slice(0, 10) });
    setModal(true);
  };
  const save = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (editEsg) await api(`/esg-climate/${editEsg.id}`, { method: 'PUT', body: JSON.stringify({ score_type: form.score_type, value: form.value, as_of_date: form.as_of_date }) });
    else await api('/esg-climate', { method: 'POST', body: JSON.stringify(form) });
    setModal(false);
    load();
  };
  const deleteEsg = async (id: string) => {
    if (!confirm('Delete this ESG record?')) return;
    await api(`/esg-climate/${id}`, { method: 'DELETE' });
    load();
  };

  const chartData = useMemo(() => {
    return list.map((e) => {
      const portfolioName = portfolios.find((p) => p.id === e.portfolio_id)?.name ?? 'Portfolio';
      return { name: `${portfolioName} – ${e.score_type}`, value: parseFloat(e.value) || 0, score_type: e.score_type };
    });
  }, [list, portfolios]);

  return (
    <div className="feature-page feature-page--wide">
      <h1>ESG and Climate</h1>
      <p className="feature-desc">Sustainability and ESG analytics. Quantify climate-related risk and support reporting and disclosure.</p>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{list.length}</div>
          <div className="stat-label">ESG / climate scores</div>
        </div>
      </div>
      {chartData.length > 0 && (
        <div className="charts-row">
          <div className="chart-card">
            <h3>Portfolio ESG & climate scores</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #2d3a4a)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted, #8b9cb3)', fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: 'var(--text-muted, #8b9cb3)' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#22c55e" name="Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      <div className="crud-section">
        <div className="crud-header">
          <h2>Portfolio ESG scores</h2>
          <button type="button" className="btn-primary" onClick={() => openModal()}>Add score</button>
        </div>
        {loading ? (
          <div className="loading-block" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <span>Loading…</span>
          </div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <p>No ESG scores yet. Add your first portfolio ESG score.</p>
            <button type="button" className="btn-primary" onClick={() => openModal()}>Add score</button>
          </div>
        ) : (
          <table className="crud-table">
            <thead><tr><th>Portfolio</th><th>Score type</th><th>Value</th><th>As of</th><th></th></tr></thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td>{portfolios.find((p) => p.id === e.portfolio_id)?.name ?? e.portfolio_id}</td>
                  <td>{e.score_type}</td>
                  <td>{e.value}</td>
                  <td>{e.as_of_date}</td>
                  <td>
                    <button type="button" className="btn-sm" onClick={() => openModal(e)}>Edit</button>
                    <button type="button" className="btn-sm danger" onClick={() => deleteEsg(e.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={(ev) => ev.stopPropagation()}>
            <h3>{editEsg ? 'Edit ESG score' : 'New ESG score'}</h3>
            <form onSubmit={save}>
              <label>Portfolio <select value={form.portfolio_id} onChange={(e) => setForm((f) => ({ ...f, portfolio_id: e.target.value }))} required disabled={!!editEsg}>
                {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></label>
              <label>Score type <select value={form.score_type} onChange={(e) => setForm((f) => ({ ...f, score_type: e.target.value }))}><option value="ESG">ESG</option><option value="Carbon">Carbon</option><option value="Climate">Climate</option></select></label>
              <label>Value <input value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} required /></label>
              <label>As of date <input type="date" value={form.as_of_date} onChange={(e) => setForm((f) => ({ ...f, as_of_date: e.target.value }))} required /></label>
              <div className="modal-actions"><button type="button" onClick={() => setModal(false)}>Cancel</button><button type="submit">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
