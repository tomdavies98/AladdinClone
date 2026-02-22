import { Link } from 'react-router-dom';
import './Landing.css';

const FEATURES = [
  {
    title: 'Whole-Portfolio Management',
    description: 'Unified views across public and private assets. Track holdings, allocations, and performance in one place.',
    icon: '📊',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
  },
  {
    title: 'Risk Analytics',
    description: 'Run scenarios, stress tests, and risk attribution. Understand exposure and capital at risk.',
    icon: '📈',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80',
  },
  {
    title: 'Trading & Order Management',
    description: 'Create, route, and monitor orders. Full lifecycle from intent to execution and settlement.',
    icon: '⚡',
    image: 'https://images.pexels.com/photos/210607/pexels-photo-210607.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: 'Operations & Accounting',
    description: 'General ledger, positions, and reconciliation. Keep books and operations in sync.',
    icon: '📋',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80',
  },
  {
    title: 'Private Markets & Alternatives',
    description: 'Funds, commitments, and capital calls. End-to-end workflows for illiquid assets.',
    icon: '🏛️',
    image: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: 'ESG & Climate',
    description: 'Portfolio ESG scores, carbon metrics, and climate alignment. Report and steer sustainability.',
    icon: '🌱',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80',
  },
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-logo">Aladdin Clone</span>
        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#platform">Platform</a>
          <a href="#cta">Get started</a>
        </nav>
        <div className="landing-header-actions">
          <Link to="/signup" className="landing-signup">Create account</Link>
          <Link to="/login" className="landing-signin">Sign in</Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="landing-hero">
          <div className="landing-hero-content">
            <h1 className="landing-title">
              Investment management and risk, unified
            </h1>
            <p className="landing-tagline">
              The platform institutions use to manage portfolios across public and private markets—whole-portfolio views, risk analytics, trading, operations, and more in one place.
            </p>
            <div className="landing-hero-ctas">
              <Link to="/login" className="landing-cta landing-cta--primary">Sign in to get started</Link>
              <a href="#features" className="landing-cta landing-cta--secondary">See features</a>
            </div>
          </div>
          <div className="landing-hero-media">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=85"
              alt="Analytics dashboard and investment data"
              width={1200}
              height={675}
              className="landing-hero-img"
            />
          </div>
        </section>

        {/* Trust strip */}
        <section className="landing-trust" aria-hidden="true">
          <p className="landing-trust-text">Built for institutional workflows</p>
          <div className="landing-trust-pills">
            <span>Portfolio management</span>
            <span>Risk analytics</span>
            <span>Trading & OMS</span>
            <span>Operations</span>
            <span>Private markets</span>
            <span>ESG & climate</span>
          </div>
        </section>

        {/* Features grid */}
        <section id="features" className="landing-section landing-features">
          <div className="landing-section-inner">
            <h2 className="landing-section-title">One platform, full capability set</h2>
            <p className="landing-section-lead">
              From portfolio construction to risk, execution, operations, and reporting—everything you need to run institutional investment and risk management.
            </p>
            <div className="landing-features-grid">
              {FEATURES.map((f) => (
                <article key={f.title} className="landing-feature-card">
                  <div className="landing-feature-card-media">
                    <img src={f.image} alt="" width={600} height={400} loading="lazy" />
                  </div>
                  <div className="landing-feature-card-body">
                    <span className="landing-feature-icon" aria-hidden="true">{f.icon}</span>
                    <h3 className="landing-feature-title">{f.title}</h3>
                    <p className="landing-feature-desc">{f.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Platform / About */}
        <section id="platform" className="landing-section landing-platform">
          <div className="landing-section-inner landing-platform-inner">
            <div className="landing-platform-content">
              <h2 className="landing-section-title">The Aladdin platform</h2>
              <p className="landing-platform-text">
                Aladdin (Asset, Liability, Debt and Derivative Investment Network) is an investment management and risk platform used by institutions worldwide to manage portfolios across public and private markets.
              </p>
              <p className="landing-platform-text">
                This clone demonstrates core capabilities: whole-portfolio views, risk analytics, trading and order management, operations and accounting, private markets and alternatives, data and analytics, ESG and climate, wealth management, and ecosystem integrations—all through a single, unified experience.
              </p>
              <p className="landing-platform-text landing-platform-cta">
                Sign in to explore portfolios, run risk scenarios, manage orders, and use the full feature set with sample data.
              </p>
              <Link to="/login" className="landing-cta landing-cta--primary">Sign in to the platform</Link>
            </div>
            <div className="landing-platform-media">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                alt="Charts and data visualization"
                width={800}
                height={500}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="cta" className="landing-section landing-cta-section">
          <div className="landing-section-inner landing-cta-inner">
            <h2 className="landing-cta-section-title">Ready to explore?</h2>
            <p className="landing-cta-section-text">
              Sign in with demo credentials to access the full platform and sample data.
            </p>
            <Link to="/login" className="landing-cta landing-cta--primary landing-cta--large">Sign in to get started</Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span className="landing-footer-logo">Aladdin Clone</span>
          <p className="landing-footer-tagline">Investment management and risk platform (demo)</p>
          <nav className="landing-footer-links">
            <Link to="/login">Sign in</Link>
          </nav>
          <p className="landing-footer-copy">© Aladdin Clone. Demo only.</p>
        </div>
      </footer>
    </div>
  );
}
