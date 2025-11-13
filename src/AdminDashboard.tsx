import { useEffect, useState } from 'react';

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
}

interface AdminDashboardProps {
  readonly token: string;
  readonly onLogout: () => void;
}

export default function AdminDashboard({ token, onLogout }: AdminDashboardProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/customers', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }

        const data = await response.json();
        setCustomers(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load customers';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [token]);

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/customers/${customerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      setCustomers(customers.filter(c => c._id !== customerId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete customer';
      setError(errorMessage);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>👥 Admin Dashboard</h2>
          <p>Manage KYC Registrations</p>
        </div>
        <button onClick={onLogout} className="btn btn-logout">
          🚪 Logout
        </button>
      </div>

      <div className="dashboard-content">
        {loading && (
          <div className="loading-state">
            <p>⏳ Loading customers...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>❌ {error}</p>
          </div>
        )}

        {!loading && !error && customers.length === 0 && (
          <div className="empty-state">
            <p>📭 No customers registered yet</p>
          </div>
        )}

        {!loading && !error && customers.length > 0 && (
          <div className="customers-cards-grid">
            {customers.map((customer) => (
              <div key={customer._id} className="customer-info-card">
                <div className="card-header">
                  <h3>{customer.firstName} {customer.lastName}</h3>
                  <span className="customer-id">ID: {customer._id.substring(0, 8)}...</span>
                </div>

                <div className="card-content">
                  <div className="info-group">
                    <label>Email</label>
                    <p>{customer.email}</p>
                  </div>

                  <div className="info-group">
                    <label>Phone</label>
                    <p>{customer.phone}</p>
                  </div>

                  <div className="info-group">
                    <label>Age & Gender</label>
                    <p>{customer.age} years old, {customer.gender}</p>
                  </div>

                  <div className="info-group">
                    <label>Nationality</label>
                    <p>{customer.nationality}</p>
                  </div>

                  <div className="info-group">
                    <label>Current Address</label>
                    <p>{customer.currentAddress}</p>
                  </div>

                  <div className="info-group">
                    <label>Permanent Address</label>
                    <p>{customer.permanentAddress}</p>
                  </div>

                  <div className="info-group">
                    <label>Yearly Income</label>
                    <p>${customer.yearlyIncome}</p>
                  </div>

                  {customer.notes && (
                    <div className="info-group">
                      <label>Notes</label>
                      <p>{customer.notes}</p>
                    </div>
                  )}

                  {customer.summary && (
                    <div className="summary-section">
                      <label>AI Summary</label>
                      <p>{customer.summary}</p>
                    </div>
                  )}

                  <div className="info-group">
                    <label>Registered</label>
                    <p>{new Date(customer.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="btn btn-accept">✅ Accept</button>
                  <button 
                    className="btn btn-delete"
                    onClick={() => handleDelete(customer._id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
