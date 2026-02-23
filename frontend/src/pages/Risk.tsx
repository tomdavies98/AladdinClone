import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import './FeaturePage.css';
import './CrudPage.css';
import '../components/Charts.css';

type Scenario = { id: string; name: string; scenario_type: string; params_json: string };
type Result = { id: string; scenario_id: string; portfolio_id: string; metric: string; value: string };
type Portfolio = { id: string; name: string }[];

export default function Risk() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'scenario' | 'result' | null>(null);
  const [editScenario, setEditScenario] = useState<Scenario | null>(null);
  const [form, setForm] = useState({ name: '', scenario_type: 'stress', params_json: '{}' });
  const [resultForm, setResultForm] = useState({ scenario_id: '', portfolio_id: '', metric: '', value: '' });

  const load = () => api<Scenario[]>('/risk/scenarios').then(setScenarios).finally(() => setLoading(false));
  useEffect(() => { load(); api<Portfolio>('/portfolios').then(setPortfolios); }, []);

  useEffect(() => {
    if (!selected) {
      queueMicrotask(() => setResults([]));
      return;
    }
    api<Result[]>(`/risk/scenarios/${selected.id}/results`).then(setResults);
  }, [selected]);

  const openScenarioModal = (s?: Scenario) => {
    setEditScenario(s ?? null);
    setForm(s ? { name: s.name, scenario_type: s.scenario_type, params_json: s.params_json || '{}' } : { name: '', scenario_type: 'stress', params_json: '{}' });
    setModal('scenario');
  };
  const openResultModal = () => {
    if (!selected) return;
    setResultForm({ scenario_id: selected.id, portfolio_id: portfolios[0]?.id || '', metric: '', value: '' });
    setModal('result');
  };

  const saveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editScenario) {
      await api(`/risk/scenarios/${editScenario.id}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await api('/risk/scenarios', { method: 'POST', body: JSON.stringify(form) });
    }
    setModal(null);
    load();
  };
  const saveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/risk/results', { method: 'POST', body: JSON.stringify({ ...resultForm, scenario_id: selected?.id || resultForm.scenario_id }) });
    setModal(null);
    if (selected) api<Result[]>(`/risk/scenarios/${selected.id}/results`).then(setResults);
  };
  const deleteScenario = async (id: string) => {
    if (!confirm('Delete this scenario and its results?')) return;
    await api(`/risk/scenarios/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    load();
  };
  const deleteResult = async (id: string) => {
    if (!confirm('Delete this result?')) return;
    await api(`/risk/results/${id}`, { method: 'DELETE' });
    if (selected) setResults((prev) => prev.filter((r) => r.id !== id));
  };

  const chartData = useMemo(() => {
    return results.map((r) => {
      const num = parseFloat(r.value.replace('%', '')) || 0;
      const portfolioName = portfolios.find((p) => p.id === r.portfolio_id)?.name ?? 'Portfolio';
      return { name: `${portfolioName} – ${r.metric}`, value: num, metric: r.metric };
    });
  }, [results, portfolios]);

  return (
    <div className="feature-page feature-page--wide">
      <h1>Risk Analytics</h1>
      <p className="feature-desc">
        Multi-asset risk models, risk decomposition, stress and scenario analysis, and configurable risk dashboards.
      </p>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{scenarios.length}</div>
          <div className="stat-label">Scenarios</div>
        </div>
        {selected && (
          <div className="stat-card">
            <div className="stat-value">{results.length}</div>
            <div className="stat-label">Results in {selected.name}</div>
          </div>
        )}
      </div>
      {selected && chartData.length > 0 && (
        <div className="charts-row">
          <div className="chart-card">
            <h3>Risk metrics — {selected.name}</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #2d3a4a)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted, #8b9cb3)', fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: 'var(--text-muted, #8b9cb3)' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" name="Value (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      <div className="crud-section">
        <div className="crud-header">
          <h2>Scenarios</h2>
          <button type="button" className="btn-primary" onClick={() => openScenarioModal()}>Add scenario</button>
        </div>
        {loading ? (
          <div className="loading-block" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <span>Loading…</span>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="empty-state">
            <p>No scenarios yet. Add your first scenario to run risk analytics.</p>
            <button type="button" className="btn-primary" onClick={() => openScenarioModal()}>Add scenario</button>
          </div>
        ) : (
          <table className="crud-table">
            <thead>
              <tr><th>Name</th><th>Type</th><th></th></tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.id} className={selected?.id === s.id ? 'selected' : ''}>
                  <td><button type="button" className="link" onClick={() => setSelected(s)}>{s.name}</button></td>
                  <td>{s.scenario_type}</td>
                  <td>
                    <button type="button" className="btn-sm" onClick={() => openScenarioModal(s)}>Edit</button>
                    <button type="button" className="btn-sm danger" onClick={() => deleteScenario(s.id)}>Delete</button>
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
            <h2>Results — {selected.name}</h2>
            <button type="button" className="btn-primary" onClick={openResultModal}>Add result</button>
          </div>
          {results.length === 0 ? (
            <div className="empty-state">
              <p>No results yet. Add a result for this scenario.</p>
              <button type="button" className="btn-primary" onClick={openResultModal}>Add result</button>
            </div>
          ) : (
            <table className="crud-table">
              <thead>
                <tr><th>Portfolio</th><th>Metric</th><th>Value</th><th></th></tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td>{portfolios.find((p) => p.id === r.portfolio_id)?.name ?? r.portfolio_id}</td>
                    <td>{r.metric}</td>
                    <td>{r.value}</td>
                    <td>
                      <button type="button" className="btn-sm danger" onClick={() => deleteResult(r.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {modal === 'scenario' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editScenario ? 'Edit scenario' : 'New scenario'}</h3>
            <form onSubmit={saveScenario}>
              <label>Name <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></label>
              <label>Type <input value={form.scenario_type} onChange={(e) => setForm((f) => ({ ...f, scenario_type: e.target.value }))} /></label>
              <label>Params (JSON) <input value={form.params_json} onChange={(e) => setForm((f) => ({ ...f, params_json: e.target.value }))} /></label>
              <div className="modal-actions">
                <button type="button" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === 'result' && selected && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New result</h3>
            <form onSubmit={saveResult}>
              <label>Portfolio <select value={resultForm.portfolio_id} onChange={(e) => setResultForm((f) => ({ ...f, portfolio_id: e.target.value }))} required>
                {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></label>
              <label>Metric <input value={resultForm.metric} onChange={(e) => setResultForm((f) => ({ ...f, metric: e.target.value }))} required /></label>
              <label>Value <input value={resultForm.value} onChange={(e) => setResultForm((f) => ({ ...f, value: e.target.value }))} required /></label>
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
