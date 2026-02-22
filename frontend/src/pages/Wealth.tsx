import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api } from '../api/client';
import './FeaturePage.css';
import './CrudPage.css';
import '../components/Charts.css';

type Model = { id: string; name: string; allocation_json: string };
type ClientAccount = { id: string; model_id: string; name: string };

export default function Wealth() {
  const [models, setModels] = useState<Model[]>([]);
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'model' | 'account' | null>(null);
  const [editModel, setEditModel] = useState<Model | null>(null);
  const [editAccount, setEditAccount] = useState<ClientAccount | null>(null);
  const [modelForm, setModelForm] = useState({ name: '', allocation_json: '{}' });
  const [accountForm, setAccountForm] = useState({ model_id: '', name: '' });

  const load = () => {
    api<Model[]>('/wealth/models').then(setModels);
    api<ClientAccount[]>('/wealth/client-accounts').then(setAccounts);
  };
  useEffect(() => { load(); setLoading(false); }, []);

  const openModelModal = (m?: Model) => {
    setEditModel(m ?? null);
    setModelForm(m ? { name: m.name, allocation_json: m.allocation_json || '{}' } : { name: '', allocation_json: '{}' });
    setModal('model');
  };
  const openAccountModal = (a?: ClientAccount) => {
    setEditAccount(a ?? null);
    setAccountForm(a ? { model_id: a.model_id, name: a.name } : { model_id: models[0]?.id || '', name: '' });
    setModal('account');
  };

  const saveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editModel) await api(`/wealth/models/${editModel.id}`, { method: 'PUT', body: JSON.stringify(modelForm) });
    else await api('/wealth/models', { method: 'POST', body: JSON.stringify(modelForm) });
    setModal(null);
    load();
  };
  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editAccount) await api(`/wealth/client-accounts/${editAccount.id}`, { method: 'PUT', body: JSON.stringify(accountForm) });
    else await api('/wealth/client-accounts', { method: 'POST', body: JSON.stringify(accountForm) });
    setModal(null);
    load();
  };
  const deleteModel = async (id: string) => {
    if (!confirm('Delete this model portfolio and linked client accounts?')) return;
    await api(`/wealth/models/${id}`, { method: 'DELETE' });
    load();
  };
  const deleteAccount = async (id: string) => {
    if (!confirm('Delete this client account?')) return;
    await api(`/wealth/client-accounts/${id}`, { method: 'DELETE' });
    load();
  };

  const accountsByModel = useMemo(() => {
    const m: Record<string, number> = {};
    accounts.forEach((a) => {
      const modelName = models.find((mod) => mod.id === a.model_id)?.name ?? 'Model';
      m[modelName] = (m[modelName] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [accounts, models]);
  const COLORS = ['#3b82f6', '#22c55e', '#d4a853', '#a855f7'];

  return (
    <div className="feature-page feature-page--wide">
      <h1>Wealth Management</h1>
      <p className="feature-desc">Model portfolios and client accounts. Personalize at scale with centrally managed programs.</p>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{models.length}</div>
          <div className="stat-label">Model portfolios</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{accounts.length}</div>
          <div className="stat-label">Client accounts</div>
        </div>
      </div>
      {accountsByModel.length > 0 && (
        <div className="charts-row">
          <div className="chart-card">
            <h3>Client accounts by model</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={accountsByModel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {accountsByModel.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
          <h2>Model portfolios</h2>
          <button type="button" className="btn-primary" onClick={() => openModelModal()}>Add model</button>
        </div>
        {loading ? (
          <div className="loading-block" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <span>Loading…</span>
          </div>
        ) : models.length === 0 ? (
          <div className="empty-state">
            <p>No model portfolios yet. Add your first model to get started.</p>
            <button type="button" className="btn-primary" onClick={() => openModelModal()}>Add model</button>
          </div>
        ) : (
          <table className="crud-table">
            <thead><tr><th>Name</th><th></th></tr></thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>
                    <button type="button" className="btn-sm" onClick={() => openModelModal(m)}>Edit</button>
                    <button type="button" className="btn-sm danger" onClick={() => deleteModel(m.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="crud-section">
        <div className="crud-header">
          <h2>Client accounts</h2>
          <button type="button" className="btn-primary" onClick={() => openAccountModal()}>Add account</button>
        </div>
        {accounts.length === 0 ? (
          <div className="empty-state">
            <p>No client accounts yet. Add your first client account.</p>
            <button type="button" className="btn-primary" onClick={() => openAccountModal()}>Add account</button>
          </div>
        ) : (
        <table className="crud-table">
          <thead><tr><th>Name</th><th>Model</th><th></th></tr></thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{models.find((m) => m.id === a.model_id)?.name ?? a.model_id}</td>
                <td>
                  <button type="button" className="btn-sm" onClick={() => openAccountModal(a)}>Edit</button>
                  <button type="button" className="btn-sm danger" onClick={() => deleteAccount(a.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
      {modal === 'model' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editModel ? 'Edit model' : 'New model portfolio'}</h3>
            <form onSubmit={saveModel}>
              <label>Name <input value={modelForm.name} onChange={(e) => setModelForm((f) => ({ ...f, name: e.target.value }))} required /></label>
              <label>Allocation (JSON) <input value={modelForm.allocation_json} onChange={(e) => setModelForm((f) => ({ ...f, allocation_json: e.target.value }))} /></label>
              <div className="modal-actions"><button type="button" onClick={() => setModal(null)}>Cancel</button><button type="submit">Save</button></div>
            </form>
          </div>
        </div>
      )}
      {modal === 'account' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editAccount ? 'Edit account' : 'New client account'}</h3>
            <form onSubmit={saveAccount}>
              <label>Model <select value={accountForm.model_id} onChange={(e) => setAccountForm((f) => ({ ...f, model_id: e.target.value }))} required>
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select></label>
              <label>Name <input value={accountForm.name} onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))} required /></label>
              <div className="modal-actions"><button type="button" onClick={() => setModal(null)}>Cancel</button><button type="submit">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
