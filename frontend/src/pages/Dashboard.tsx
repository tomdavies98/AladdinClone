import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { api } from '../api/client';
import './FeaturePage.css';
import '../components/Charts.css';

type Order = { status: string };
type Portfolio = { id: string };
type Account = { id: string };

const STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  FILLED: '#22c55e',
  CANCELLED: '#ef4444',
  PENDING: '#d4a853',
};

export default function Dashboard() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<Portfolio[]>('/portfolios'),
      api<Order[]>('/trading/orders'),
      api<Account[]>('/operations/accounts'),
    ])
      .then(([p, o, a]) => {
        setPortfolios(p);
        setOrders(o);
        setAccounts(a);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const orderByStatus = Object.entries(
    orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="feature-page feature-page--wide">
      <h1>Dashboard</h1>
      <p className="feature-desc">
        Aladdin-style investment platform. Overview and quick access to each feature area.
      </p>
      {!loading && (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{portfolios.length}</div>
              <div className="stat-label">Portfolios</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{orders.length}</div>
              <div className="stat-label">Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{accounts.length}</div>
              <div className="stat-label">Accounts</div>
            </div>
          </div>
          {orderByStatus.length > 0 && (
            <div className="charts-row">
              <div className="chart-card">
                <h3>Orders by status</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderByStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {orderByStatus.map((e) => (
                          <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#8b9cb3'} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <h2 style={{ marginTop: '1.5rem', fontSize: '1.1rem' }}>Features</h2>
      <ul className="feature-links">
        <li><Link to="/app/portfolio">Whole-Portfolio Management</Link></li>
        <li><Link to="/app/risk">Risk Analytics</Link></li>
        <li><Link to="/app/trading">Trading and Order Management</Link></li>
        <li><Link to="/app/operations">Operations and Accounting</Link></li>
        <li><Link to="/app/private-markets">Private Markets and Alternatives</Link></li>
        <li><Link to="/app/data-analytics">Data and Analytics</Link></li>
        <li><Link to="/app/esg-climate">ESG and Climate</Link></li>
        <li><Link to="/app/wealth">Wealth Management</Link></li>
        <li><Link to="/app/ecosystem">Ecosystem and Infrastructure</Link></li>
        <li><Link to="/app/design-principles">Design Principles</Link></li>
      </ul>
    </div>
  );
}
