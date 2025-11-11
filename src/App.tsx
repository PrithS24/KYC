import React, { useEffect, useState } from 'react';
import './App.css';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: string;
  age?: string;
  notes?: string;
}

export default function App() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    nationality: '',
    gender: '',
    age: '',
    notes: '',
  });

  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const REGISTRATION_LIMIT = 1000;

  // Fetch total registrations from backend on mount
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.currentTarget;
    
    let processedValue: string | number = value;
    if (type === 'number') {
      processedValue = value ? Number.parseInt(value, 10) : '';
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check if limit reached before submission
    if (totalRegistrations >= REGISTRATION_LIMIT) {
      setStatus('error');
      setMessage(`🔴 Registration limit of ${REGISTRATION_LIMIT} has been reached. Thank you for your interest!`);
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
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register customer');
      }

      await response.json();
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        nationality: '',
        gender: '',
        age: '',
        notes: '',
      });

      // Update registration count
      const newTotal = totalRegistrations + 1;
      setTotalRegistrations(newTotal);

      setStatus('success');
      const available = REGISTRATION_LIMIT - newTotal;
      setMessage(`✅ Registration successful!\n📊 Available registrations: ${available} / ${REGISTRATION_LIMIT}`);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setMessage('');
        setStatus('idle');
      }, 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setStatus('error');
      setMessage(`❌ Error: ${errorMessage}`);
    }
  };

  const availableRegistrations = Math.max(0, REGISTRATION_LIMIT - totalRegistrations);

  return (
    <div className="app">
      <div className="header">
        <div className="container">
          <h1>🏛️ KYC System</h1>
          <p>Know Your Customer Registration Platform</p>
          <div className="registration-counter">
            <span className="counter-badge">
              📊 Registrations Available: <strong>{availableRegistrations}</strong> / {REGISTRATION_LIMIT}
            </span>
          </div>
        </div>
      </div>

      <div className="container">
        <section className="form-section">
          <h2>Register Customer</h2>
          
          {message && (
            <div className={`message message-${status}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="customer-form">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={status === 'loading' || totalRegistrations >= REGISTRATION_LIMIT}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={status === 'loading' || totalRegistrations >= REGISTRATION_LIMIT}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={status === 'loading' || totalRegistrations >= REGISTRATION_LIMIT}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={status === 'loading' || totalRegistrations >= REGISTRATION_LIMIT}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                id="dateOfBirth"
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                disabled={status === 'loading' || totalRegistrations >= REGISTRATION_LIMIT}
              />
            </div>

            <div className="form-group">
              <label htmlFor="nationality">Nationality</label>
              <input
                id="nationality"
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                disabled={status === 'loading' || totalRegistrations >= REGISTRATION_LIMIT}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={status === 'loading' || totalRegistrations >= REGISTRATION_LIMIT}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="18"
                max="120"
                disabled={status === 'loading' || totalRegistrations >= REGISTRATION_LIMIT}
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                disabled={status === 'loading' || totalRegistrations >= REGISTRATION_LIMIT}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={status === 'loading' || totalRegistrations >= REGISTRATION_LIMIT}
            >
              {status === 'loading' ? '⏳ Processing...' : '✅ Submit Registration'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
