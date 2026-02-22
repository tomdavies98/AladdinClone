import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api } from '../api/client';
import './FeaturePage.css';
import './CrudPage.css';
import '../components/Charts.css';

type Report = { id: string; name: string; report_type: string; config_json: string; created_at: string };

export default function DataAnalytics() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editReport, setEditReport] = useState<Report | null>(null);
  const [form, setForm] = useState({ name: '', report_type: 'custom', config_json: '{}' });

  const load = () => api<Report[]>('/data-analytics/reports').then(setReports).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openModal = (r?: Report) => {
    setEditReport(r ?? null);
    setForm(r ? { name: r.name, report_type: r.report_type, config_json: r.config_json || '{}' } : { name: '', report_type: 'custom', config_json: '{}' });
    setModal(true);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editReport) await api(`/data-analytics/reports/${editReport.id}`, { method: 'PUT', body: JSON.stringify(form) });
    else await api('/data-analytics/reports', { method: 'POST', body: JSON.stringify(form) });
    setModal(false);
    load();
  };
  const deleteReport = async (id: string) => {
    if (!confirm('Delete this report?')) return;
    await api(`/data-analytics/reports/${id}`, { method: 'DELETE' });
    load();
  };

  const reportsByType = useMemo(() => {
    const m: Record<string, number> = {};
    reports.forEach((r) => { m[r.report_type] = (m[r.report_type] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [reports]);
  const COLORS = ['#3b82f6', '#22c55e', '#d4a853', '#a855f7'];

  return (
    <div className="feature-page feature-page--wide">
      <h1>Data and Analytics</h1>
      <p className="feature-desc">Unified investment data, custom analytics, and reporting. Save and manage report configurations.</p>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{reports.length}</div>
          <div className="stat-label">Saved reports</div>
        </div>
      </div>
      {reportsByType.length > 0 && (
        <div className="charts-row">
          <div className="chart-card">
            <h3>Reports by type</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reportsByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {reportsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
          <h2>Saved reports</h2>
          <button type="button" className="btn-primary" onClick={() => openModal()}>Add report</button>
        </div>
        {loading ? (
          <div className="loading-block" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <span>Loading…</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <p>No reports yet. Add your first report to get started.</p>
            <button type="button" className="btn-primary" onClick={() => openModal()}>Add report</button>
          </div>
        ) : (
          <table className="crud-table">
            <thead><tr><th>Name</th><th>Type</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.report_type}</td>
                  <td>{r.created_at?.slice(0, 10)}</td>
                  <td>
                    <button type="button" className="btn-sm" onClick={() => openModal(r)}>Edit</button>
                    <button type="button" className="btn-sm danger" onClick={() => deleteReport(r.id)}>Delete</button>
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
            <h3>{editReport ? 'Edit report' : 'New report'}</h3>
            <form onSubmit={save}>
              <label>Name <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></label>
              <label>Type <input value={form.report_type} onChange={(e) => setForm((f) => ({ ...f, report_type: e.target.value }))} /></label>
              <label>Config (JSON) <input value={form.config_json} onChange={(e) => setForm((f) => ({ ...f, config_json: e.target.value }))} /></label>
              <div className="modal-actions"><button type="button" onClick={() => setModal(false)}>Cancel</button><button type="submit">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
