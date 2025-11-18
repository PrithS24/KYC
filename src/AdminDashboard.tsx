import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
  gender: string;
  age: string;
  yearlyIncome: string;
  notes: string;
  currentAddress: string;
  permanentAddress: string;
  summary?: string;
  createdAt: string;
  status?: 'pending' | 'approved' | 'rejected';
  pdfPath?: string;
  pdfGeneratedAt?: string;
}

interface AdminDashboardProps {
  readonly token: string;
  readonly onLogout: () => void;
}

export default function AdminDashboard({ token, onLogout }: AdminDashboardProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfState, setPdfState] = useState<Record<string, 'idle' | 'generating'>>({});

  useEffect(() => {
    void fetchCustomers();
  }, [token]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setCustomers(list.filter((c: Customer) => c.status !== 'rejected'));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = (updated: Customer) => {
    setCustomers(prev => {
      if (updated.status === 'rejected') {
        return prev.filter(c => c._id !== updated._id);
      }
      return prev.map(c => (c._id === updated._id ? { ...c, ...updated } : c));
    });
  };

  const removeCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c._id !== id));
  };

  const handleDecision = async (customerId: string, decision: 'approve' | 'reject') => {
    try {
      const response = await fetch(`${API_BASE}/api/customers/${customerId}/${decision}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || `Failed to ${decision} customer`);
      if (decision === 'reject') {
        removeCustomer(customerId);
      } else if (body.data) {
        updateCustomer(body.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decision failed');
    }
  };

  const pollForPdf = async (customerId: string, attempts = 10) => {
    for (let i = 0; i < attempts; i += 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const res = await fetch(`${API_BASE}/api/customers/${customerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) continue;
        const data = await res.json();
        if (data.pdfPath) {
          updateCustomer(data);
          setPdfState(prev => ({ ...prev, [customerId]: 'idle' }));
          return;
        }
      } catch (err) {
        console.warn('PDF polling failed', err);
      }
    }
    setPdfState(prev => ({ ...prev, [customerId]: 'idle' }));
  };

  const handleGeneratePdf = async (customerId: string) => {
    try {
      setPdfState(prev => ({ ...prev, [customerId]: 'generating' }));
      const response = await fetch(`${API_BASE}/api/customers/${customerId}/pdf`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Failed to generate PDF');

      if (response.status === 202) {
        void pollForPdf(customerId);
      } else if (body.data) {
        updateCustomer(body.data);
        setPdfState(prev => ({ ...prev, [customerId]: 'idle' }));
      }
    } catch (err) {
      setPdfState(prev => ({ ...prev, [customerId]: 'idle' }));
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    }
  };

  const handleDownloadPdf = (pdfPath?: string) => {
    if (!pdfPath) return;
    window.open(`${API_BASE}${pdfPath}`, '_blank', 'noopener,noreferrer');
  };

  const statusPill = (status?: string) => {
    switch (status) {
      case 'approved':
        return <span className="status-pill status-approved">Approved</span>;
      case 'rejected':
        return <span className="status-pill status-rejected">Rejected</span>;
      default:
        return <span className="status-pill status-pending">Pending</span>;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>Admin Dashboard</h2>
          <p>Review and action KYC submissions</p>
        </div>
        <button onClick={onLogout} className="btn btn-logout">
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        {loading && (
          <div className="loading-state">
            <p>Loading customers...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && customers.length === 0 && (
          <div className="empty-state">
            <p>No customers registered yet.</p>
          </div>
        )}

        {!loading && !error && customers.length > 0 && (
          <div className="customers-cards-grid">
            {customers.map(customer => (
              <div key={customer._id} className="customer-info-card">
                <div className="card-header">
                  <div>
                    <h3>
                      {customer.firstName} {customer.lastName}
                    </h3>
                    <span className="customer-id">ID: {customer._id.slice(0, 8)}...</span>
                  </div>
                  {statusPill(customer.status)}
                </div>

                <div className="card-content">
                  <div className="info-grid">
                    <Info label="Email" value={customer.email} />
                    <Info label="Phone" value={customer.phone} />
                    <Info label="Age / Gender" value={`${customer.age} · ${customer.gender}`} />
                    <Info label="Nationality" value={customer.nationality} />
                    <Info
                      label="Date of Birth"
                      value={new Date(customer.dateOfBirth).toLocaleDateString()}
                    />
                    <Info label="Yearly Income" value={`$${customer.yearlyIncome}`} />
                    <Info label="Current Address" value={customer.currentAddress} />
                    <Info label="Permanent Address" value={customer.permanentAddress} />
                    <Info label="Registered" value={new Date(customer.createdAt).toLocaleString()} />
                  </div>

                  {customer.summary && (
                    <div className="summary-section">
                      <label>AI Summary</label>
                      <p>{customer.summary}</p>
                    </div>
                  )}

                  {customer.notes && (
                    <div className="summary-section">
                      <label>Notes</label>
                      <p>{customer.notes}</p>
                    </div>
                  )}

                  {customer.pdfGeneratedAt && customer.pdfPath && (
                    <Info
                      label="PDF Generated"
                      value={new Date(customer.pdfGeneratedAt).toLocaleString()}
                    />
                  )}
                </div>

                <div className="card-actions">
                  {customer.status !== 'approved' && (
                    <button className="btn btn-accept" onClick={() => handleDecision(customer._id, 'approve')}>
                      Approve
                    </button>
                  )}
                  {customer.status === 'pending' && (
                    <button className="btn btn-delete" onClick={() => handleDecision(customer._id, 'reject')}>
                      Reject
                    </button>
                  )}
                  {customer.status === 'approved' && (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleGeneratePdf(customer._id)}
                        disabled={pdfState[customer._id] === 'generating'}
                      >
                        {pdfState[customer._id] === 'generating' ? 'Generating PDF...' : 'Generate PDF'}
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleDownloadPdf(customer.pdfPath)}
                        disabled={!customer.pdfPath}
                      >
                        Download PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="info-group">
      <label>{label}</label>
      <p>{value || 'N/A'}</p>
    </div>
  );
}
