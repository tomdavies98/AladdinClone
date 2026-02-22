import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api } from '../api/client';
import './FeaturePage.css';
import './CrudPage.css';
import '../components/Charts.css';

type Account = { id: string; name: string; account_type: string; currency: string };
type Transaction = { id: string; account_id: string; type: string; amount: string; date: string; description: string };

export default function Operations() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'account' | 'transaction' | null>(null);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [accountForm, setAccountForm] = useState({ name: '', account_type: 'general', currency: 'USD' });
  const [txForm, setTxForm] = useState({ account_id: '', type: 'buy', amount: '', date: '', description: '' });

  const load = () => api<Account[]>('/operations/accounts').then(setAccounts).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selected) { setTransactions([]); return; }
    api<Transaction[]>(`/operations/accounts/${selected.id}/transactions`).then(setTransactions);
  }, [selected?.id]);

  const openAccountModal = (a?: Account) => {
    setEditAccount(a ?? null);
    setAccountForm(a ? { name: a.name, account_type: a.account_type, currency: a.currency } : { name: '', account_type: 'general', currency: 'USD' });
    setModal('account');
  };
  const openTransactionModal = (t?: Transaction) => {
    setEditTransaction(t ?? null);
    setTxForm(t ? { account_id: selected?.id || '', type: t.type, amount: t.amount, date: t.date, description: t.description } : { account_id: selected?.id || '', type: 'buy', amount: '', date: new Date().toISOString().slice(0, 10), description: '' });
    setModal('transaction');
  };

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editAccount) {
      await api(`/operations/accounts/${editAccount.id}`, { method: 'PUT', body: JSON.stringify(accountForm) });
    } else {
      await api('/operations/accounts', { method: 'POST', body: JSON.stringify(accountForm) });
    }
    setModal(null);
    load();
  };
  const saveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...txForm, account_id: selected?.id || txForm.account_id };
    if (editTransaction) {
      await api(`/operations/transactions/${editTransaction.id}`, { method: 'PUT', body: JSON.stringify({ type: txForm.type, amount: txForm.amount, date: txForm.date, description: txForm.description }) });
    } else {
      await api('/operations/transactions', { method: 'POST', body: JSON.stringify(payload) });
    }
    setModal(null);
    if (selected) api<Transaction[]>(`/operations/accounts/${selected.id}/transactions`).then(setTransactions);
  };
  const deleteAccount = async (id: string) => {
    if (!confirm('Delete this account and its transactions?')) return;
    await api(`/operations/accounts/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    load();
  };
  const deleteTransaction = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    await api(`/operations/transactions/${id}`, { method: 'DELETE' });
    if (selected) setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const transactionsByType = useMemo(() => {
    const m: Record<string, number> = {};
    transactions.forEach((t) => {
      const amt = Math.abs(parseFloat(t.amount) || 0);
      m[t.type] = (m[t.type] || 0) + amt;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [transactions]);
  const COLORS = ['#3b82f6', '#22c55e', '#d4a853', '#ef4444', '#a855f7'];

  return (
    <div className="feature-page feature-page--wide">
      <h1>Operations and Accounting</h1>
      <p className="feature-desc">
        Investment accounting, performance measurement, and middle-office workflows with connectivity to custodians.
      </p>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{accounts.length}</div>
          <div className="stat-label">Accounts</div>
        </div>
        {selected && (
          <div className="stat-card">
            <div className="stat-value">{transactions.length}</div>
            <div className="stat-label">Transactions in {selected.name}</div>
          </div>
        )}
      </div>
      {selected && transactionsByType.length > 0 && (
        <div className="charts-row">
          <div className="chart-card">
            <h3>Transaction volume by type — {selected.name}</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={transactionsByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {transactionsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
          <h2>Accounts</h2>
          <button type="button" className="btn-primary" onClick={() => openAccountModal()}>Add account</button>
        </div>
        {loading ? (
          <div className="loading-block" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <span>Loading…</span>
          </div>
        ) : accounts.length === 0 ? (
          <div className="empty-state">
            <p>No accounts yet. Add your first account to get started.</p>
            <button type="button" className="btn-primary" onClick={() => openAccountModal()}>Add account</button>
          </div>
        ) : (
          <table className="crud-table">
            <thead>
              <tr><th>Name</th><th>Type</th><th>Currency</th><th></th></tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className={selected?.id === a.id ? 'selected' : ''}>
                  <td><button type="button" className="link" onClick={() => setSelected(a)}>{a.name}</button></td>
                  <td>{a.account_type}</td>
                  <td>{a.currency}</td>
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
      {selected && (
        <div className="crud-section">
          <div className="crud-header">
            <h2>Transactions — {selected.name}</h2>
            <button type="button" className="btn-primary" onClick={() => openTransactionModal()}>Add transaction</button>
          </div>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions yet. Add a transaction to this account.</p>
              <button type="button" className="btn-primary" onClick={() => openTransactionModal()}>Add transaction</button>
            </div>
          ) : (
            <table className="crud-table">
              <thead>
                <tr><th>Type</th><th>Amount</th><th>Date</th><th>Description</th><th></th></tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{t.type}</td>
                    <td>{t.amount}</td>
                    <td>{t.date}</td>
                    <td>{t.description}</td>
                    <td>
                      <button type="button" className="btn-sm" onClick={() => openTransactionModal(t)}>Edit</button>
                      <button type="button" className="btn-sm danger" onClick={() => deleteTransaction(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {modal === 'account' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editAccount ? 'Edit account' : 'New account'}</h3>
            <form onSubmit={saveAccount}>
              <label>Name <input value={accountForm.name} onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))} required /></label>
              <label>Type <input value={accountForm.account_type} onChange={(e) => setAccountForm((f) => ({ ...f, account_type: e.target.value }))} /></label>
              <label>Currency <input value={accountForm.currency} onChange={(e) => setAccountForm((f) => ({ ...f, currency: e.target.value }))} /></label>
              <div className="modal-actions">
                <button type="button" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === 'transaction' && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editTransaction ? 'Edit transaction' : 'New transaction'}</h3>
            <form onSubmit={saveTransaction}>
              <label>Type <select value={txForm.type} onChange={(e) => setTxForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="dividend">Dividend</option>
                <option value="fee">Fee</option>
              </select></label>
              <label>Amount <input value={txForm.amount} onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))} required /></label>
              <label>Date <input type="date" value={txForm.date} onChange={(e) => setTxForm((f) => ({ ...f, date: e.target.value }))} required /></label>
              <label>Description <input value={txForm.description} onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))} /></label>
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
