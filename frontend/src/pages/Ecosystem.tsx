import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api } from '../api/client';
import './FeaturePage.css';
import './CrudPage.css';
import '../components/Charts.css';

type Integration = { id: string; provider: string; integration_type: string; status: string; config_json: string };

export default function Ecosystem() {
  const [list, setList] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Integration | null>(null);
  const [form, setForm] = useState({ provider: '', integration_type: 'custodian', status: 'active', config_json: '{}' });

  const load = () => api<Integration[]>('/ecosystem/integrations').then(setList).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openModal = (i?: Integration) => {
    setEdit(i ?? null);
    setForm(i ? { provider: i.provider, integration_type: i.integration_type, status: i.status, config_json: i.config_json || '{}' } : { provider: '', integration_type: 'custodian', status: 'active', config_json: '{}' });
    setModal(true);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (edit) await api(`/ecosystem/integrations/${edit.id}`, { method: 'PUT', body: JSON.stringify(form) });
    else await api('/ecosystem/integrations', { method: 'POST', body: JSON.stringify(form) });
    setModal(false);
    load();
  };
  const deleteIntegration = async (id: string) => {
    if (!confirm('Remove this integration?')) return;
    await api(`/ecosystem/integrations/${id}`, { method: 'DELETE' });
    load();
  };

  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    list.forEach((i) => { m[i.integration_type] = (m[i.integration_type] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [list]);
  const COLORS = ['#3b82f6', '#22c55e', '#d4a853'];

  return (
    <div className="feature-page feature-page--wide">
      <h1>Ecosystem and Infrastructure</h1>
      <p className="feature-desc">Integrations with asset servicers, custodians, brokers, and data providers.</p>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{list.length}</div>
          <div className="stat-label">Integrations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{list.filter((i) => i.status === 'active').length}</div>
          <div className="stat-label">Active</div>
        </div>
      </div>
      {byType.length > 0 && (
        <div className="charts-row">
          <div className="chart-card">
            <h3>Integrations by type</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
          <h2>Integrations</h2>
          <button type="button" className="btn-primary" onClick={() => openModal()}>Add integration</button>
        </div>
        {loading ? (
          <div className="loading-block" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <span>Loading…</span>
          </div>
        ) : list.length === 0 ? (
          <div className="empty-state">
            <p>No integrations yet. Add your first integration.</p>
            <button type="button" className="btn-primary" onClick={() => openModal()}>Add integration</button>
          </div>
        ) : (
          <table className="crud-table">
            <thead><tr><th>Provider</th><th>Type</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id}>
                  <td>{i.provider}</td>
                  <td>{i.integration_type}</td>
                  <td>{i.status}</td>
                  <td>
                    <button type="button" className="btn-sm" onClick={() => openModal(i)}>Edit</button>
                    <button type="button" className="btn-sm danger" onClick={() => deleteIntegration(i.id)}>Delete</button>
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
            <h3>{edit ? 'Edit integration' : 'New integration'}</h3>
            <form onSubmit={save}>
              <label>Provider <input value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} required /></label>
              <label>Type <select value={form.integration_type} onChange={(e) => setForm((f) => ({ ...f, integration_type: e.target.value }))}>
                <option value="custodian">Custodian</option>
                <option value="broker">Broker</option>
                <option value="data">Data provider</option>
              </select></label>
              <label>Status <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
              <label>Config (JSON) <input value={form.config_json} onChange={(e) => setForm((f) => ({ ...f, config_json: e.target.value }))} /></label>
              <div className="modal-actions"><button type="button" onClick={() => setModal(false)}>Cancel</button><button type="submit">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
