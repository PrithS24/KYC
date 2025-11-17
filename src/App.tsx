import React, { useEffect, useState } from 'react';
import './App.css';
import AdminDashboard from './AdminDashboard';

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

type AuthMode = 'login' | 'signup';

function EKYCMark() {
  return (
    <div className="logo-mark">
      <div className="logo-ring" />
      <div className="logo-core" />
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

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

interface AdminAuthModalProps {
  open: boolean;
  mode: AuthMode;
  onClose: () => void;
  onToggleMode: () => void;
  form: { email: string; password: string; confirmPassword: string };
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  emailStatus: 'valid' | 'invalid' | null;
  visibility: { password: boolean; confirm: boolean };
  onToggleVisibility: (field: 'password' | 'confirm') => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

function AdminAuthModal({
  open,
  mode,
  onClose,
  onToggleMode,
  form,
  status,
  message,
  emailStatus,
  visibility,
  onToggleVisibility,
  onChange,
  onSubmit,
}: AdminAuthModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card glass-card">
        <button className="modal-close" onClick={onClose} aria-label="Close admin modal">
          ×
        </button>
        <p className="eyebrow">{mode === 'login' ? 'Admin access' : 'Create admin account'}</p>
        <h3>{mode === 'login' ? 'Admin Login' : 'Admin Signup'}</h3>
        <p className="modal-subtitle">
          {mode === 'login'
            ? 'Sign in to manage customer PDFs and review analytics.'
            : 'Provision a secure admin identity with 2-step verification.'}
        </p>

        {message && <div className={`message message-${status}`}>{message}</div>}

        <form className="admin-form" onSubmit={onSubmit} autoComplete="off">
          <label className="form-control full-width">
            <span>Email</span>
            <input
              type="email"
              name="adminEmail"
              value={form.email}
              onChange={onChange}
              required
              autoComplete="off"
              className={emailStatus === 'invalid' ? 'input-error' : undefined}
            />
            {emailStatus === 'invalid' && (
              <small className="email-hint error">Use a valid @selise.ac.sw email.</small>
            )}
            {emailStatus === 'valid' && (
              <small className="email-hint success">Domain accepted.</small>
            )}
          </label>
          <label className="form-control full-width">
            <span>Password</span>
            <div className="input-with-action">
              <input
                type={visibility.password ? 'text' : 'password'}
                name="adminPassword"
                value={form.password}
                onChange={onChange}
                minLength={6}
                required
                autoComplete="off"
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => onToggleVisibility('password')}
                aria-label={visibility.password ? 'Hide password' : 'Show password'}
              >
                {visibility.password ? '🙈' : '👁'}
              </button>
            </div>
          </label>
          {mode === 'signup' && (
            <label className="form-control full-width">
              <span>Confirm password</span>
              <div className="input-with-action">
                <input
                  type={visibility.confirm ? 'text' : 'password'}
                  name="adminConfirmPassword"
                  value={form.confirmPassword}
                  onChange={onChange}
                  minLength={6}
                  required
                  autoComplete="off"
              />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => onToggleVisibility('confirm')}
                  aria-label={visibility.confirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {visibility.confirm ? '🙈' : '👁'}
                </button>
              </div>
            </label>
          )}
          <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
            {status === 'loading'
              ? 'Processing...'
              : mode === 'login'
              ? 'Login'
              : 'Create account'}
          </button>
        </form>

        <p className="modal-switch">
          {mode === 'login' ? "Don't have admin access?" : 'Already verified?'}{' '}
          <button type="button" onClick={onToggleMode}>
            {mode === 'login' ? 'Create account' : 'Login instead'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [formData, setFormData] = useState<FormData>(createInitialFormState());
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [emailStatus, setEmailStatus] = useState<'valid' | 'invalid' | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [adminEmailStatus, setAdminEmailStatus] = useState<'valid' | 'invalid' | null>(null);
  const [passwordVisibility, setPasswordVisibility] = useState({ password: false, confirm: false });
  const [adminStatus, setAdminStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [adminMessage, setAdminMessage] = useState('');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [view, setView] = useState<'public' | 'admin'>('public');
  const fieldOrder = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'dateOfBirth',
    'nationality',
    'gender',
    'age',
    'yearlyIncome',
    'currentAddress',
    'permanentAddress',
    'notes',
  ] as const;
  const fieldRefs = React.useRef<Record<
    (typeof fieldOrder)[number],
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
  >>({
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    dateOfBirth: null,
    nationality: null,
    gender: null,
    age: null,
    yearlyIncome: null,
    currentAddress: null,
    permanentAddress: null,
    notes: null,
  });
  const REGISTRATION_LIMIT = 1000;

  const adminEmailAllowed = (val: string) =>
    /^[^\s@]+@selise\.ac\.sw$/i.test(val.trim());

  const focusField = (name: (typeof fieldOrder)[number]) => {
    const el = fieldRefs.current[name];
    if (!el || el.hasAttribute('disabled')) return;
    el.focus();
    if ('select' in el && typeof el.select === 'function') {
      el.select();
    }
  };

  const handleFieldNav = (
    name: (typeof fieldOrder)[number],
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { key } = event;
    const forward = key === 'ArrowDown' || key === 'ArrowRight';
    const backward = key === 'ArrowUp' || key === 'ArrowLeft';
    if (!forward && !backward) return;
    event.preventDefault();
    const currentIndex = fieldOrder.indexOf(name);
    let nextIndex = currentIndex + (forward ? 1 : -1);
    while (nextIndex >= 0 && nextIndex < fieldOrder.length) {
      const targetName = fieldOrder[nextIndex];
      const target = fieldRefs.current[targetName];
      if (target && !target.hasAttribute('disabled')) {
        focusField(targetName);
        return;
      }
      nextIndex += forward ? 1 : -1;
    }
  };

  useEffect(() => {
    const fetchTotal = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/customers`);
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

  useEffect(() => {
    const stored = localStorage.getItem('adminToken');
    if (stored) {
      verifyAdminToken(stored);
    }
  }, []);

  const verifyAdminToken = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Invalid token');
      setAdminToken(token);
      setView('admin');
    } catch {
      localStorage.removeItem('adminToken');
      setAdminToken(null);
      setView('public');
    }
  };

  const isGmail = (email: string) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email.trim());

  const openAdminModal = (mode: AuthMode) => {
    setAuthMode(mode);
    setAdminModalOpen(true);
    setAdminStatus('idle');
    setAdminMessage('');
    setAdminForm({ email: '', password: '', confirmPassword: '' });
    setAdminEmailStatus(null);
    setPasswordVisibility({ password: false, confirm: false });
  };

  const closeAdminModal = () => {
    setAdminModalOpen(false);
    setAdminForm({ email: '', password: '', confirmPassword: '' });
    setAdminStatus('idle');
    setAdminMessage('');
    setAdminEmailStatus(null);
    setPasswordVisibility({ password: false, confirm: false });
  };

  const toggleAuthMode = () => {
    setAuthMode(prev => (prev === 'login' ? 'signup' : 'login'));
    setAdminStatus('idle');
    setAdminMessage('');
    setAdminForm({ email: '', password: '', confirmPassword: '' });
    setAdminEmailStatus(null);
    setPasswordVisibility({ password: false, confirm: false });
  };

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

  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setAdminForm(prev => {
      if (name === 'adminEmail') return { ...prev, email: value };
      if (name === 'adminPassword') return { ...prev, password: value };
      if (name === 'adminConfirmPassword') return { ...prev, confirmPassword: value };
      return prev;
    });
    if (name === 'adminEmail') {
      if (!value.trim()) {
        setAdminEmailStatus(null);
      } else {
        setAdminEmailStatus(adminEmailAllowed(value) ? 'valid' : 'invalid');
      }
    }
  };

  const handlePasswordVisibility = (field: 'password' | 'confirm') => {
    setPasswordVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAdminSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (authMode === 'signup' && adminForm.password !== adminForm.confirmPassword) {
      setAdminStatus('error');
      setAdminMessage('Passwords do not match.');
      return;
    }

    try {
      setAdminStatus('loading');
      setAdminMessage('');

      if (!adminEmailAllowed(adminForm.email)) {
        setAdminStatus('error');
        setAdminMessage('Email must end with @selise.ac.sw');
        return;
      }

      const endpoint = authMode === 'login' ? 'login' : 'signup';
      const response = await fetch(`${API_BASE}/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminForm.email.trim(),
          password: adminForm.password,
          ...(authMode === 'signup' ? { confirmPassword: adminForm.confirmPassword } : {}),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.token && authMode === 'login') {
        localStorage.setItem('adminToken', data.token);
        setAdminToken(data.token);
        setView('admin');
      }

      setAdminStatus('success');
      setAdminMessage(
        authMode === 'login'
          ? 'Login successful.'
          : 'Account created. You can login now.'
      );

      if (authMode === 'login' && data.token) {
        setTimeout(() => {
          closeAdminModal();
        }, 600);
      } else if (authMode === 'signup') {
        setAuthMode('login');
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Authentication error';
      setAdminStatus('error');
      setAdminMessage(errMsg);
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
      const response = await fetch(`${API_BASE}/api/customers`, {
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
  const usedPercentage = (totalRegistrations / REGISTRATION_LIMIT) * 100;
  const progressPercent = Math.min(100, Number(usedPercentage.toFixed(1)));
  const progressDisplay = progressPercent % 1 === 0
    ? progressPercent.toFixed(0)
    : progressPercent.toFixed(1);

  const stats = [
    { label: 'Registrations', value: totalRegistrations, meta: 'Verified customers' },
    { label: 'Slots left', value: availableRegistrations, meta: 'Available seats' },
    { label: 'Daily throughput', value: '200+', meta: 'Requests handled' },
  ];

  const journeySteps = [
    { icon: '🛰️', title: 'Pre-screening', desc: 'Instant sanctions & watchlist scan before submission.' },
    { icon: '🤖', title: 'LLM insights', desc: 'AI summarises every profile for analyst hand-off.' },
    { icon: '🔐', title: 'Secure vault', desc: 'Bank-grade encryption for every data point.' },
  ];

  const insightTips = [
    'Use an institutional email to accelerate verification.',
    'Double-check DOB and ID numbers for instant approval.',
    'Keep emergency contact handy for on-demand follow-ups.',
  ];

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken(null);
    setView('public');
  };

  if (view === 'admin' && adminToken) {
    return (
      <div className="app">
        <AdminDashboard token={adminToken} onLogout={handleAdminLogout} />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="bg-shape bg-shape-1" />
      <div className="bg-shape bg-shape-2" />
      <nav className="top-bar">
        <div className="container nav-content">
          <div className="brand">
            <EKYCMark />
            <div>
              <span className="brand-kicker">ELECTRONIC KNOW YOUR CUSTOMER</span>
              <p className="brand-title">eKYC System</p>
            </div>
          </div>
          <button
            className="admin-button"
            onClick={() => openAdminModal('login')}
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
                <span>{progressDisplay}%</span>
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
                    ref={el => (fieldRefs.current.firstName = el)}
                    value={formData.firstName}
                    onChange={handleChange}
                    onKeyDown={e => handleFieldNav('firstName', e)}
                    required
                    disabled={status === 'loading'}
                  />
                </label>
                <label className="form-control">
                  <span>Last name *</span>
                  <input
                    type="text"
                    name="lastName"
                    ref={el => (fieldRefs.current.lastName = el)}
                    value={formData.lastName}
                    onChange={handleChange}
                    onKeyDown={e => handleFieldNav('lastName', e)}
                    required
                    disabled={status === 'loading'}
                  />
                </label>
                <label className="form-control">
                  <span>Email *</span>
                  <input
                    type="email"
                    name="email"
                    ref={el => (fieldRefs.current.email = el)}
                    value={formData.email}
                    onChange={handleChange}
                    onKeyDown={e => handleFieldNav('email', e)}
                    required
                    disabled={status === 'loading'}
                    className={emailStatus === 'invalid' ? 'input-error' : undefined}
                  />
                  {emailStatus === 'invalid' && (
                    <small className="email-hint error">Please use a gmail.com address.</small>
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
                    ref={el => (fieldRefs.current.phone = el)}
                    value={formData.phone}
                    onChange={handleChange}
                    onKeyDown={e => handleFieldNav('phone', e)}
                    required
                    disabled={status === 'loading'}
                  />
                </label>
                <label className="form-control">
                  <span>Date of birth *</span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    ref={el => (fieldRefs.current.dateOfBirth = el)}
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    onKeyDown={e => handleFieldNav('dateOfBirth', e)}
                    required
                    disabled={status === 'loading'}
                  />
                </label>
                <label className="form-control">
                  <span>Nationality *</span>
                  <input
                    type="text"
                    name="nationality"
                    ref={el => (fieldRefs.current.nationality = el)}
                    value={formData.nationality}
                    onChange={handleChange}
                    onKeyDown={e => handleFieldNav('nationality', e)}
                    required
                    disabled={status === 'loading'}
                  />
                </label>
                <label className="form-control">
                  <span>Gender *</span>
                  <select
                    name="gender"
                    ref={el => (fieldRefs.current.gender = el)}
                    value={formData.gender}
                    onChange={handleChange}
                    onKeyDown={e => handleFieldNav('gender', e)}
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
                    ref={el => (fieldRefs.current.age = el)}
                    value={formData.age}
                    onChange={handleChange}
                    onKeyDown={e => handleFieldNav('age', e)}
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
                    ref={el => (fieldRefs.current.yearlyIncome = el)}
                    value={formData.yearlyIncome}
                    onChange={handleChange}
                    onKeyDown={e => handleFieldNav('yearlyIncome', e)}
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
                  ref={el => (fieldRefs.current.currentAddress = el)}
                  value={formData.currentAddress}
                  onChange={handleChange}
                  onKeyDown={e => handleFieldNav('currentAddress', e)}
                  rows={3}
                  required
                  disabled={status === 'loading'}
                />
              </label>
              <label className="form-control full-width">
                <span>Permanent address *</span>
                <textarea
                  name="permanentAddress"
                  ref={el => (fieldRefs.current.permanentAddress = el)}
                  value={formData.permanentAddress}
                  onChange={handleChange}
                  onKeyDown={e => handleFieldNav('permanentAddress', e)}
                  rows={3}
                  required
                  disabled={status === 'loading'}
                />
              </label>
              <label className="form-control full-width">
                <span>Notes</span>
                <textarea
                  name="notes"
                  ref={el => (fieldRefs.current.notes = el)}
                  value={formData.notes}
                  onChange={handleChange}
                  onKeyDown={e => handleFieldNav('notes', e)}
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

      <AdminAuthModal
        open={adminModalOpen}
        mode={authMode}
        onClose={closeAdminModal}
        onToggleMode={toggleAuthMode}
        form={adminForm}
        status={adminStatus}
        message={adminMessage}
        emailStatus={adminEmailStatus}
        visibility={passwordVisibility}
        onToggleVisibility={handlePasswordVisibility}
        onChange={handleAdminChange}
        onSubmit={handleAdminSubmit}
      />
    </div>
  );
}
