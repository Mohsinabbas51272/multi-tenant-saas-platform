import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { registerTenant, registerCustomer } from '../services/authService';
import { Mail, Layout, User, Lock, Store, Loader2, ArrowRight, ShieldCheck, Info, UserPlus, Search, Star, Heart, MessageSquare
} from 'lucide-react';
import SEO from '../components/SEO';

const Register = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tenantId = queryParams.get('tenant_id');
  const storeName = queryParams.get('store');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
    tenant_id: tenantId || ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isCustomerRegistration = !!tenantId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isCustomerRegistration) {
        await registerCustomer(formData);
      } else {
        await registerTenant(formData);
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            {isCustomerRegistration ? <User className="text-green-600 w-8 h-8" /> : <Store className="text-green-600 w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isCustomerRegistration ? 'Welcome!' : 'Registration Sent!'}
          </h2>
          <p className="text-slate-600">
            {isCustomerRegistration 
              ? `You have successfully registered for ${storeName || 'the store'}. Redirecting to login...` 
              : 'Your store request has been sent to the Superadmin for approval. Redirecting to login...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO title="Create Store" description="Register your merchant store on MultiTenancy SaaS." />
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100 relative">
        {isCustomerRegistration && (
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 flex items-center space-x-1"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Back</span>
          </button>
        )}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isCustomerRegistration ? `Join ${storeName}` : 'Create Your Store'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isCustomerRegistration ? 'Register as a customer to start shopping' : 'Join our Multi-Tenant platform today'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {!isCustomerRegistration && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Store className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Store Name (e.g. My Awesome Shop)"
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                />
              </div>
            )}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isCustomerRegistration ? 'Join Official Store' : 'Register Store')}
            </button>
          </div>
          
          <div className="text-center">
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
