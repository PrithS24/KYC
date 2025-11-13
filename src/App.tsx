import React, { useEffect, useState } from 'react';
import './App.css';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  age: string;
  yearlyIncome: string;
  currentAddress: string;
  permanentAddress: string;
  notes: string;
}

function EKYCMark() {
  return (
    <div className="logo-mark">
      <div className="logo-ring" />
      <div className="logo-core" />
    </div>
  );
}

const createInitialFormState = (): FormData => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  nationality: '',
  gender: '',
  age: '',
  yearlyIncome: '',
  currentAddress: '',
  permanentAddress: '',
  notes: '',
});

export default function App() {
  const [formData, setFormData] = useState<FormData>(createInitialFormState());
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [emailStatus, setEmailStatus] = useState<'valid' | 'invalid' | null>(null);
  const REGISTRATION_LIMIT = 1000;

  useEffect(() => {
    const fetchTotal = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/customers');
        if (response.ok) {
          const data = await response.json();
          setTotalRegistrations(Array.isArray(data) ? data.length : 0);
        }
      } catch (err) {
        console.error('Failed to fetch registration count:', err);
      }
    };
    fetchTotal();
  }, []);

  const isGmail = (email: string) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email.trim());

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'email') {
      if (!value) {
        setEmailStatus(null);
      } else {
        setEmailStatus(isGmail(value) ? 'valid' : 'invalid');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (totalRegistrations >= REGISTRATION_LIMIT) {
      setStatus('error');
      setMessage(`Registration limit of ${REGISTRATION_LIMIT} has been reached. Thanks for your interest!`);
      return;
    }

    if (!isGmail(formData.email)) {
      setEmailStatus('invalid');
      setStatus('error');
      setMessage('Please provide a valid gmail.com address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          age: formData.age.trim(),
          yearlyIncome: formData.yearlyIncome.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register customer');
      }

      await response.json();
      setFormData(createInitialFormState());
      setEmailStatus(null);

      const newTotal = totalRegistrations + 1;
      setTotalRegistrations(newTotal);

      setStatus('success');
      const available = REGISTRATION_LIMIT - newTotal;
      setMessage(`Registration successful! Available slots: ${available}/${REGISTRATION_LIMIT}`);

      setTimeout(() => {
        setMessage('');
        setStatus('idle');
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setStatus('error');
      setMessage(`Error: ${errorMessage}`);
    }
  };

  const availableRegistrations = Math.max(0, REGISTRATION_LIMIT - totalRegistrations);
  const progressPercent = Math.min(100, Math.round((totalRegistrations / REGISTRATION_LIMIT) * 100));
  const stats = [
    { label: 'Registrations', value: totalRegistrations, meta: 'Verified customers' },
    { label: 'Slots left', value: availableRegistrations, meta: 'Available seats' },
    { label: 'Daily throughput', value: '200+', meta: 'Requests handled' },
  ];

  const journeySteps = [
    { icon: 'PS', title: 'Pre-screening', desc: 'Instant sanctions & watchlist scan before submission.' },
    { icon: 'AI', title: 'LLM insights', desc: 'AI summarises every profile for analyst hand-off.' },
    { icon: 'SEC', title: 'Secure vault', desc: 'Bank-grade encryption for every data point.' },
  ];


  const insightTips = [
    'Use an institutional email to accelerate verification.',
    'Double-check DOB and ID numbers for instant approval.',
    'Keep emergency contact handy for on-demand follow-ups.',
  ];

  return (
    <div className="app">
      <div className="bg-shape bg-shape-1" />
      <div className="bg-shape bg-shape-2" />
      <nav className="top-bar">
        <div className="container nav-content">
          <div className="brand">
            <EKYCMark />
            <div>
              <span className="brand-kicker">NOVA ID LAB</span>
              <p className="brand-title">eKYC Copilot</p>
            </div>
          </div>
          <button
            className="admin-button"
            onClick={() => {
              window.location.href = '/admin';
            }}
          >
            Admin Login
          </button>
        </div>
      </nav>
      <header className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <p className="eyebrow">AI-native compliance workspace</p>
            <h1>Generate customer summary PDFs with one click.</h1>
            <p className="hero-subtitle">
              Our eKYC copilot ingests form data, synthesizes AI-powered customer briefs, and exports branded
              PDF dossiers in seconds - perfect for rapid analyst review and regulator-ready archives.
            </p>
            <div className="hero-chips">
              <span className="chip">Realtime PDF composer</span>
              <span className="chip">LLM fact guardrails</span>
              <span className="chip">Secure distribution links</span>
            </div>
          </div>

          <div className="hero-widget glass-card">
            <div className="progress-widget">
              <div
                className="progress-ring"
                style={{ '--progress': `${progressPercent}%` } as React.CSSProperties}
              >
                <span>{progressPercent}%</span>
              </div>
              <div className="progress-copy">
                <p>Capacity</p>
                <strong>{availableRegistrations} slots available</strong>
                <small>Auto-updates every submission</small>
              </div>
            </div>
            <ul className="hero-list">
              <li>Instant identity orchestration</li>
              <li>Auditable actions & insights</li>
              <li>Edge-encrypted transmission</li>
            </ul>
          </div>
        </div>
      </header>

      <main className="content container">
        <section className="stats-grid">
          {stats.map(stat => (
            <article key={stat.label} className="glass-card stat-card">
              <p>{stat.label}</p>
              <h3>{stat.value}</h3>
              <span>{stat.meta}</span>
            </article>
          ))}
          <article className="glass-card stat-card pulse-card">
            <p>Health Monitor</p>
            <h3>99.99%</h3>
            <span>System uptime</span>
          </article>
        </section>

        <div className="experience-grid">
          <section className="glass-card form-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Customer workflow</p>
                <h2>Submit new KYC profile</h2>
              </div>
              <div className="badge badge-soft">Limit: {REGISTRATION_LIMIT}</div>
            </div>

            {message && (
              <div className={`message message-${status}`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="modern-form">
              <div className="form-grid">
                <label className="form-control">
                  <span>First name *</span>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={status === 'loading'}
                  />
                </label>
                <label className="form-control">
                  <span>Last name *</span>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={status === 'loading'}
                  />
                </label>
                <label className="form-control">
                  <span>Email *</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={status === 'loading'}
                    className={emailStatus === 'invalid' ? 'input-error' : undefined}
                  />
                  {emailStatus === 'invalid' && (
                    <small className="email-hint error">Please use a valid gmail.com address.</small>
                  )}
                  {emailStatus === 'valid' && (
                    <small className="email-hint success">gmail.com address detected.</small>
                  )}
                </label>
                <label className="form-control">
                  <span>Phone *</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={status === 'loading'}
                  />
                </label>
                <label className="form-control">
                  <span>Date of birth *</span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    disabled={status === 'loading'}
                  />
                </label>
                <label className="form-control">
                  <span>Nationality *</span>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    required
                    disabled={status === 'loading'}
                  />
                </label>
                <label className="form-control">
                  <span>Gender *</span>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    disabled={status === 'loading'}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="form-control">
                  <span>Age *</span>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min={18}
                    max={120}
                    required
                    disabled={status === 'loading'}
                  />
                </label>
                <label className="form-control">
                  <span>Yearly income (USD) *</span>
                  <input
                    type="number"
                    name="yearlyIncome"
                    value={formData.yearlyIncome}
                    onChange={handleChange}
                    min={0}
                    step={100}
                    required
                    disabled={status === 'loading'}
                  />
                </label>
              </div>
              <label className="form-control full-width">
                <span>Current address *</span>
                <textarea
                  name="currentAddress"
                  value={formData.currentAddress}
                  onChange={handleChange}
                  rows={3}
                  required
                  disabled={status === 'loading'}
                />
              </label>
              <label className="form-control full-width">
                <span>Permanent address *</span>
                <textarea
                  name="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={handleChange}
                  rows={3}
                  required
                  disabled={status === 'loading'}
                />
              </label>
              <label className="form-control full-width">
                <span>Notes</span>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  disabled={status === 'loading'}
                />
              </label>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Processing…' : 'Submit registration'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setFormData(createInitialFormState())}
                  disabled={status === 'loading'}
                >
                  Reset form
                </button>
              </div>
            </form>
          </section>

          <aside className="insights-column">
            <div className="glass-card journey-card">
              <p className="eyebrow">Experience previews</p>
              <h3>Live onboarding flow</h3>
              <ul className="journey-list">
                {journeySteps.map(step => (
                  <li key={step.title}>
                    <span className="journey-icon">{step.icon}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <p>{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card tips-card">
              <p className="eyebrow">Analyst notes</p>
              <h3>Compliance micro-tips</h3>
              <ul>
                {insightTips.map(tip => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
