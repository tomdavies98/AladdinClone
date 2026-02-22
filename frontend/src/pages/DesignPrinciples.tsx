import { useState, useMemo } from 'react';
import { api } from '../api/client';
import { usePreferences } from '../contexts/PreferencesContext';
import './FeaturePage.css';
import './CrudPage.css';

const PREFERENCE_OPTIONS: Record<string, { label: string; values: { value: string; label: string }[] }> = {
  theme: {
    label: 'Theme',
    values: [
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'system', label: 'System' },
    ],
  },
  default_currency: {
    label: 'Default currency',
    values: [
      { value: 'USD', label: 'USD' },
      { value: 'EUR', label: 'EUR' },
      { value: 'GBP', label: 'GBP' },
      { value: 'JPY', label: 'JPY' },
      { value: 'CHF', label: 'CHF' },
    ],
  },
  reporting_frequency: {
    label: 'Reporting frequency',
    values: [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'annually', label: 'Annually' },
    ],
  },
  dashboard_layout: {
    label: 'Dashboard layout',
    values: [
      { value: 'sidebar', label: 'Sidebar' },
      { value: 'grid', label: 'Grid' },
      { value: 'compact', label: 'Compact' },
    ],
  },
};

const PREF_KEYS = Object.entries(PREFERENCE_OPTIONS).map(([value, { label }]) => ({ value, label }));

export default function DesignPrinciples() {
  const { preferences: prefs, refresh } = usePreferences();
  const [modal, setModal] = useState(false);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [isEdit, setIsEdit] = useState(false);

  const valueOptions = useMemo(() => {
    const opts = key ? PREFERENCE_OPTIONS[key]?.values ?? [] : [];
    const current = key && prefs[key] ? prefs[key] : value;
    const hasCurrent = opts.some((o) => o.value === current);
    if (current && !hasCurrent) {
      return [{ value: current, label: current }, ...opts];
    }
    return opts;
  }, [key, prefs, value]);

  const openModal = (k?: string, v?: string) => {
    setKey(k ?? '');
    setValue(v ?? '');
    setIsEdit(!!k);
    setModal(true);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/design-principles/preferences', { method: 'PUT', body: JSON.stringify({ key, value }) });
    setModal(false);
    await refresh();
  };
  const deletePref = async (k: string) => {
    if (!confirm('Remove this preference?')) return;
    await api(`/design-principles/preferences/${encodeURIComponent(k)}`, { method: 'DELETE' });
    await refresh();
  };

  return (
    <div className="feature-page">
      <h1>Design Principles</h1>
      <p className="feature-desc">
        Common data language, API-first, front-to-back coverage. Use the settings below to store key-value preferences.
      </p>
      <div className="crud-section">
        <div className="crud-header">
          <h2>Your preferences</h2>
          <button type="button" className="btn-primary" onClick={() => openModal()}>Add preference</button>
        </div>
        <table className="crud-table">
          <thead><tr><th>Key</th><th>Value</th><th></th></tr></thead>
          <tbody>
            {Object.entries(prefs).filter(([, v]) => v).map(([k, v]) => (
              <tr key={k}>
                <td>{PREFERENCE_OPTIONS[k]?.label ?? k}</td>
                <td>{PREFERENCE_OPTIONS[k]?.values.find((o) => o.value === v)?.label ?? v}</td>
                <td>
                  <button type="button" className="btn-sm" onClick={() => openModal(k, v)}>Edit</button>
                  <button type="button" className="btn-sm danger" onClick={() => deletePref(k)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{key ? 'Edit preference' : 'New preference'}</h3>
            <form onSubmit={save}>
              <label>
                Key
                {isEdit ? (
                  <input value={PREFERENCE_OPTIONS[key]?.label ?? key} readOnly disabled />
                ) : (
                  <select value={key} onChange={(e) => { setKey(e.target.value); setValue(''); }} required>
                    <option value="">Select…</option>
                    {PREF_KEYS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </label>
              <label>
                Value
                <select value={value} onChange={(e) => setValue(e.target.value)} required>
                  <option value="">Select…</option>
                  {valueOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <div className="modal-actions"><button type="button" onClick={() => setModal(false)}>Cancel</button><button type="submit">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
