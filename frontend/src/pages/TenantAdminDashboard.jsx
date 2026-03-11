import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { logout, getCurrentUser } from '../services/authService';
import { 
  Package, Plus, Loader2, Trash2, Edit2, LogOut, 
  Upload, X, Users, LayoutDashboard, Search, Mail, UserPlus, ShoppingBag, 
  CheckCircle, Clock, AlertCircle, CreditCard, Wallet, BadgeCheck, Link, Copy, Tag, BarChart2,
  Receipt, Zap, Shield, ExternalLink, TrendingUp, Settings, ArrowRight, Sun, Moon, Droplets,
  ChevronLeft, ChevronRight, LayoutGrid, BarChart3, FileText, Puzzle, Heart, Globe
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Card, Button, Badge, Input } from '../components/ui';

const TenantAdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', category: 'General', image: null, stock: 0, variants: [] });
  const [imagePreview, setImagePreview] = useState(null);

  // Staff Modal State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffFormData, setStaffFormData] = useState({ name: '', email: '', password: '' });

  // Coupon State
  const [coupons, setCoupons] = useState([]);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discount_percentage: '', expiry_date: '', usage_limit: '100' });

  // Analytics State
  const [analytics, setAnalytics] = useState({ revenueByDay: [], topProducts: [] });
  const [merchantStats, setMerchantStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    lowStockCount: 0,
    topProducts: []
  });

  // Billing State
  const [billing, setBilling] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('admin-theme') || 'midnight-onyx');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const navigate = useNavigate();

  // Theme Application Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setSubscriptionError(null);
    try {
      if (activeTab === 'inventory' || activeTab === 'analytics') {
        try {
          const statsRes = await api.get('/analytics/merchant-stats');
          setMerchantStats(statsRes.data);
        } catch (e) {
          console.error('Failed to fetch merchant stats', e);
        }
      }

      if (activeTab === 'inventory') {
        const res = await api.get('/products');
        setProducts(res.data);
      } else if (activeTab === 'staff') {
        const res = await api.get('/products/staff');
        setStaff(res.data);
      } else if (activeTab === 'orders') {
        const res = await api.get('/orders');
        setOrders(res.data);
      } else if (activeTab === 'coupons') {
        const res = await api.get('/coupons');
        setCoupons(res.data);
      } else if (activeTab === 'billing') {
        setBillingLoading(true);
        try {
          const res = await api.get('/payments/billing-info');
          setBilling(res.data);
        } catch (e) { console.error('Billing fetch error:', e); }
        finally { setBillingLoading(false); }
      } else if (activeTab === 'analytics') {
        const res = await api.get('/orders');
        const ordersData = res.data;
        const revenueByDay = {};
        ordersData.forEach(order => {
          const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          revenueByDay[date] = (revenueByDay[date] || 0) + parseFloat(order.total_amount);
        });
        
        setAnalytics({
          revenueByDay: Object.entries(revenueByDay).slice(-7).map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) })),
          topProducts: merchantStats.topProducts || []
        });
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.subscription_status) {
        setSubscriptionError(err.response.data.message);
      }
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };
  // Theme Selection Configuration
  const themeConfigs = [
    { id: 'alabaster-silk', icon: Sun, label: 'Champagne Luxe' },
    { id: 'midnight-onyx', icon: Moon, label: 'Royal Amethyst' },
    { id: 'rose-gold', icon: Heart, label: 'Rose Gold' },
    { id: 'cyber-emerald', icon: Zap, label: 'Cyber Emerald' }
  ];

  // Handlers
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', price: '', description: '', category: 'General', image: null, stock: 0, variants: [] });
    setImagePreview(null);
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ name: product.name, price: product.price, description: product.description, category: product.category || 'General', image: null, stock: product.stock || 0, variants: product.variants || [] });
      const fullImageUrl = product.image_url?.startsWith('http') 
        ? product.image_url 
        : `http://localhost:5000${product.image_url}`;
      setImagePreview(product.image_url ? fullImageUrl : null);
    } else {
      setEditingProduct(null);
      setFormData({ name: '', price: '', description: '', category: 'General', image: null, stock: 0, variants: [] });
      setImagePreview(null);
    }
    setModalOpen(true);
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post('/coupons', couponForm);
      setCouponModalOpen(false);
      setCouponForm({ code: '', discount_percentage: '', expiry_date: '', usage_limit: '100' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm('Delete this coupon?')) {
      try {
        await api.delete(`/coupons/${id}`);
        fetchData();
      } catch (err) {
        alert('Failed to delete coupon');
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('price', formData.price);
    data.append('description', formData.description);
    data.append('category', formData.category);
    data.append('stock', formData.stock);
    if (formData.image) data.append('image', formData.image);
    if (formData.variants && formData.variants.length > 0) {
      data.append('variants', JSON.stringify(formData.variants));
    }

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      closeModal();
      fetchData();
    } catch (err) {
      alert('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchData();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products/staff', staffFormData);
      setStaffModalOpen(false);
      setStaffFormData({ name: '', email: '', password: '' });
      fetchData();
    } catch (err) {
      alert('Failed to add staff');
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('Are you sure you want to delete this order record? This action cannot be undone.')) {
      try {
        await api.delete(`/orders/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete order');
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      DELIVERED: 'success',
      SHIPPED: 'primary',
      PROCESSING: 'neutral',
      PENDING: 'warning',
      CANCELLED: 'error',
    };
    return <Badge variant={variants[status] || 'neutral'}>{status}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DELIVERED': return <BadgeCheck className="w-4 h-4 text-green-500" />;
      case 'SHIPPED': return <Package className="w-4 h-4 text-primary-500" />;
      case 'PROCESSING': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'CANCELLED': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED': return 'text-green-600';
      case 'SHIPPED': return 'text-primary-600';
      case 'PROCESSING': return 'text-blue-600';
      case 'PENDING': return 'text-orange-600';
      case 'CANCELLED': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getPaymentBadge = (method, status) => {
    const isPaid = status === 'PAID';
    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {method === 'COD' ? <Wallet className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
          <span>{method}</span>
        </div>
        <div className={`px-2 py-0.5 rounded-md text-[9px] font-black text-center w-fit ${isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {status}
        </div>
      </div>
    );
  };

  if (loading && (products.length === 0 && staff.length === 0 && orders.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin w-12 h-12 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-main transition-all duration-700 overflow-hidden">
      {/* Expandable Sidebar */}
      <aside className={`h-screen sticky top-0 bg-main-card/80 backdrop-blur-xl border-r border-trim flex flex-col transition-all duration-500 z-[100] ${isSidebarExpanded ? 'w-72 p-6' : 'w-24 p-4 items-center'}`}>
        
        {/* Toggle / Logo Area */}
        <div className={`flex items-center gap-3 mb-10 relative ${!isSidebarExpanded && 'justify-center'}`}>
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg border border-[rgb(var(--border-subtle))] flex-shrink-0">
            <Zap className="text-white w-5 h-5" />
          </div>
          {isSidebarExpanded && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <h2 className="text-sm font-black text-display uppercase tracking-tighter leading-none">Merchant</h2>
              <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">Console</p>
            </div>
          )}
          
           <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className={`absolute -right-10 top-2 w-8 h-8 rounded-full bg-main-card border border-trim flex items-center justify-center text-display-muted hover:text-primary-500 hover:border-primary-500/50 shadow-sm transition-all z-[110]`}
          >
            {isSidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

         <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${activeTab === 'inventory' ? 'bg-primary-500/10 text-primary-500 shadow-sm' : 'text-display-muted hover:bg-main'}`}>
            <LayoutGrid className={`w-5 h-5 flex-shrink-0 ${activeTab === 'inventory' ? 'text-primary-500' : 'text-display-muted'}`} />
            {isSidebarExpanded && <span className="text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">Storefront</span>}
          </button>
          
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${activeTab === 'orders' ? 'bg-primary-500/10 text-primary-500 shadow-sm' : 'text-display-muted hover:bg-main'}`}>
            <ShoppingBag className={`w-5 h-5 flex-shrink-0 ${activeTab === 'orders' ? 'text-primary-500' : 'text-display-muted'}`} />
            {isSidebarExpanded && <span className="text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">Sales Orders</span>}
          </button>
 
          <button onClick={() => setActiveTab('staff')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${activeTab === 'staff' ? 'bg-primary-500/10 text-primary-500 shadow-sm' : 'text-display-muted hover:bg-main'}`}>
            <Users className={`w-5 h-5 flex-shrink-0 ${activeTab === 'staff' ? 'text-primary-500' : 'text-display-muted'}`} />
            {isSidebarExpanded && <span className="text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">Staff Roster</span>}
          </button>
 
          <button onClick={() => setActiveTab('coupons')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${activeTab === 'coupons' ? 'bg-primary-500/10 text-primary-500 shadow-sm' : 'text-display-muted hover:bg-main'}`}>
            <Tag className={`w-5 h-5 flex-shrink-0 ${activeTab === 'coupons' ? 'text-primary-500' : 'text-display-muted'}`} />
            {isSidebarExpanded && <span className="text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">Promotionals</span>}
          </button>
 
          <button onClick={() => setActiveTab('billing')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${activeTab === 'billing' ? 'bg-primary-500/10 text-primary-500 shadow-sm' : 'text-display-muted hover:bg-main'}`}>
            <Receipt className={`w-5 h-5 flex-shrink-0 ${activeTab === 'billing' ? 'text-primary-500' : 'text-display-muted'}`} />
            {isSidebarExpanded && <span className="text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">Billing & Plan</span>}
          </button>
 
          <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${activeTab === 'analytics' ? 'bg-primary-500/10 text-primary-500 shadow-sm' : 'text-display-muted hover:bg-main'}`}>
            <BarChart3 className={`w-5 h-5 flex-shrink-0 ${activeTab === 'analytics' ? 'text-primary-500' : 'text-display-muted'}`} />
            {isSidebarExpanded && <span className="text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">Performance</span>}
          </button>
        </nav>

        <div className={`mt-auto ${isSidebarExpanded ? 'px-2' : ''}`}>
           <div className="w-full flex items-center gap-4 p-3 rounded-2xl bg-primary-500/5 group">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center font-black text-main text-xs shadow-lg shadow-primary-500/20">
              TR
            </div>
            {isSidebarExpanded && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
                <p className="text-[10px] font-black text-display uppercase whitespace-nowrap line-clamp-1">{getCurrentUser()?.name || 'Trusted'}</p>
                <p className="text-[8px] font-black text-primary-500 uppercase tracking-widest">{getCurrentUser()?.tenant_name || 'Merchant'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
        {/* Compact Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
             <h1 className="text-2xl font-black text-display tracking-tight flex items-center gap-3">
              {merchantStats.tenantName || getCurrentUser()?.tenant_name || 'Store'} <span className="text-primary-500">Hub</span>
               <span className="text-[10px] font-black bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-full uppercase tracking-widest">{activeTab}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex bg-main-card/50 p-1.5 rounded-2xl border border-trim gap-1.5 shadow-sm">
               {themeConfigs.map(t => (
                 <button 
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-500 ${theme === t.id ? 'bg-primary-500 text-white shadow-lg' : 'text-display-muted hover:bg-main'}`}
                    title={t.label}
                 >
                    <t.icon className="w-4 h-4" />
                    {theme === t.id && <span className="text-[10px] font-black uppercase tracking-tight">{t.label}</span>}
                 </button>
               ))}
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" className="px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-widest border-[rgb(var(--border-subtle))]" onClick={() => {
                const url = `${window.location.origin}/store/${getCurrentUser().tenant_slug}`;
                navigator.clipboard.writeText(url);
                alert('Store link copied!');
              }}>
                <Link className="w-3.5 h-3.5" />
                <span>Store Link</span>
              </Button>

              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-black text-[10px]">
                  TR
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
                <LogOut className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </header>

        {/* Dash Tabs */}
        <div className="flex space-x-2 mb-10 bg-main-card p-1.5 rounded-2xl shadow-sm border border-trim w-fit overflow-x-auto max-w-full custom-scrollbar">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-black transition-all ${activeTab === 'inventory' ? 'bg-display text-main shadow-lg' : 'text-display-muted hover:bg-main hover:text-display uppercase text-[11px] tracking-widest'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Storefront</span>
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-black transition-all ${activeTab === 'orders' ? 'bg-display text-main shadow-lg' : 'text-display-muted hover:bg-main hover:text-display uppercase text-[11px] tracking-widest'}`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Sales Orders</span>
          </button>
          <button 
            onClick={() => setActiveTab('staff')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-black transition-all ${activeTab === 'staff' ? 'bg-display text-main shadow-lg' : 'text-display-muted hover:bg-main hover:text-display uppercase text-[11px] tracking-widest'}`}
          >
            <Users className="w-5 h-5" />
            <span>Staff Roster</span>
          </button>
          <button 
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-black transition-all ${activeTab === 'coupons' ? 'bg-display text-main shadow-lg' : 'text-display-muted hover:bg-main hover:text-display uppercase text-[11px] tracking-widest'}`}
          >
            <Tag className="w-5 h-5" />
            <span>Coupons</span>
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-black transition-all ${activeTab === 'billing' ? 'bg-display text-main shadow-lg' : 'text-display-muted hover:bg-main hover:text-display uppercase text-[11px] tracking-widest'}`}
          >
            <Receipt className="w-5 h-5" />
            <span>Billing</span>
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-black transition-all ${activeTab === 'analytics' ? 'bg-display text-main shadow-lg' : 'text-display-muted hover:bg-main hover:text-display uppercase text-[11px] tracking-widest'}`}
          >
            <BarChart2 className="w-5 h-5" />
            <span>Analytics</span>
          </button>
        </div>

        {/* High-Density Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-main-card border border-trim flex items-center gap-4 group hover:border-primary-500/50 transition-all">
                <div className="w-10 h-10 bg-primary-500/10 text-primary-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-display-muted uppercase tracking-widest">Total Yield</p>
                    <h3 className="text-xl font-black text-display">${merchantStats.totalRevenue}</h3>
                </div>
            </div>
            <div className="p-5 rounded-2xl bg-main-card border border-trim flex items-center gap-4 group hover:border-primary-500/50 transition-all">
                <div className="w-10 h-10 bg-accent-emerald/10 text-accent-emerald rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-display-muted uppercase tracking-widest">Total Sales</p>
                    <h3 className="text-xl font-black text-display">{merchantStats.totalOrders}</h3>
                </div>
            </div>
            <div className="p-5 rounded-2xl bg-main-card border border-trim flex items-center gap-4 group hover:border-primary-500/50 transition-all">
                <div className="w-10 h-10 bg-accent-amber/10 text-accent-amber rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-display-muted uppercase tracking-widest">In Queue</p>
                    <h3 className="text-xl font-black text-display">{merchantStats.pendingOrders}</h3>
                </div>
            </div>
            <div className={`p-5 rounded-2xl border flex items-center gap-4 shadow-lg transition-all ${merchantStats.lowStockCount > 0 ? 'bg-accent-rose text-white shadow-accent-rose/20 border-transparent' : 'bg-main-card border-trim group hover:border-primary-500/50'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${merchantStats.lowStockCount > 0 ? 'bg-white/20' : 'bg-accent-rose/10 text-accent-rose'}`}>
                    <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${merchantStats.lowStockCount > 0 ? 'text-white/70' : 'text-display-muted'}`}>Stock Alert</p>
                    <h3 className="text-xl font-black">{merchantStats.lowStockCount} <span className="text-[10px] opacity-70 ml-1 italic font-bold">Items</span></h3>
                </div>
            </div>
        </div>

        {activeTab === 'inventory' && (
          <>
            {products.some(p => p.stock <= 5) && (
              <div className="mb-8 bg-accent-rose/10 border border-accent-rose/20 p-5 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-700">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-accent-rose text-white rounded-xl flex items-center justify-center shadow-lg shadow-accent-rose/20">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-accent-rose font-black uppercase tracking-widest text-[10px]">Stock Warning</h4>
                    <p className="text-display-muted text-[11px] font-bold italic opacity-80">Critical inventory levels detected. Replenishment recommended.</p>
                  </div>
                </div>
                <button 
                 onClick={() => alert('Low stock replenishment system coming soon!')}
                 className="bg-accent-rose/20 hover:bg-accent-rose text-accent-rose hover:text-white px-5 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border border-accent-rose/10"
                >
                  Action Required
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-main-card rounded-2xl overflow-hidden shadow-sm border border-trim hover:shadow-xl hover:shadow-primary-500/10 transition-all group flex flex-col">
                <div className="h-44 bg-main relative overflow-hidden flex items-center justify-center">
                  {product.image_url ? (
                    <img 
                      src={product.image_url.startsWith('http') ? product.image_url : `http://localhost:5000${product.image_url}`} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                  ) : (
                    <Package className="text-display-muted/20 w-12 h-12" />
                  )}
                  <div className="absolute top-3 right-3 bg-main-card/80 backdrop-blur-md px-3 py-1.5 rounded-xl font-black text-primary-500 shadow-sm border border-trim text-xs">
                    ${product.price}
                  </div>
                  <div className={`absolute top-3 left-3 bg-main-card/80 backdrop-blur-md px-2.5 py-1 rounded-lg font-black text-[8px] uppercase tracking-widest shadow-sm border ${product.stock <= 5 && (!product.variants || product.variants.length === 0) ? 'text-accent-rose border-accent-rose/20' : 'text-display-muted border-trim'}`}>
                    {product.variants?.length > 0 ? `${product.variants.length} VAR` : `QTY: ${product.stock}`}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-black text-display mb-1 truncate uppercase tracking-tight italic">{product.name}</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-main text-[8px] font-black text-display-muted px-1.5 py-0.5 rounded-md uppercase tracking-[0.1em]">{product.category}</span>
                  </div>
                  <p className="text-display-muted text-[10px] mb-4 line-clamp-2 min-h-[30px] font-bold leading-relaxed">{product.description}</p>
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => openModal(product)}
                      className="flex-1 py-2 bg-main text-display font-black rounded-xl hover:bg-primary-500 hover:text-white transition-all flex items-center justify-center space-x-1 border border-trim text-[9px] uppercase tracking-widest"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 bg-accent-rose/10 text-accent-rose rounded-xl hover:bg-accent-rose hover:text-white transition-all border border-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="col-span-full py-32 bg-main-card rounded-3xl border border-dashed border-trim flex flex-col items-center justify-center text-center">
                 <Package className="w-12 h-12 text-display-muted/20 mb-4" />
                 <p className="text-display-muted font-black uppercase tracking-widest text-[10px]">Your inventory is empty. Launch your first product!</p>
              </div>
            )}
          </div>
        </>
      )}

        {activeTab === 'orders' && (
          <div className="bg-main-card rounded-2xl border border-trim shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-main border-b border-trim">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-display-muted">ID & Date</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-display-muted">Customer</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-display-muted">Payment</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-display-muted">Revenue</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-display-muted">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-display-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-trim">
                   {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-main/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-black text-display text-[11px] truncate w-24 uppercase">#{order.id.split('-')[0]}</div>
                        <div className="text-display-muted text-[8px] mt-0.5 font-bold uppercase tracking-widest italic">{new Date(order.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-black text-display text-[11px] uppercase tracking-tighter">{order.customer?.name}</div>
                        <div className="text-display-muted text-[9px] font-bold truncate max-w-[150px]">{order.customer?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-display-muted">
                            {order.payment_method === 'COD' ? <Wallet className="w-2.5 h-2.5" /> : <CreditCard className="w-2.5 h-2.5" />}
                            <span>{order.payment_method}</span>
                          </div>
                          <Badge variant={order.payment_status === 'PAID' ? 'success' : 'warning'} className="text-[7px] px-1.5 py-0 shadow-none border-none h-3.5 flex items-center justify-center w-fit uppercase font-black">{order.payment_status}</Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-primary-500 font-black tracking-tighter text-sm">${order.total_amount}</div>
                         <p className="text-[8px] font-bold text-display-muted uppercase tracking-tighter">{order.items.length} units ordered</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 grayscale group-hover:grayscale-0 transition-all">
                          {getStatusIcon(order.status)}
                          <span className={`text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {order.status === 'PENDING' && (
                            <button 
                              onClick={() => handleUpdateOrderStatus(order.id, 'PROCESSING')}
                              className="bg-primary-500 text-white px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase hover:bg-primary-600 shadow-sm transition-all"
                            >
                              Process
                            </button>
                          )}
                          {order.status === 'PROCESSING' && (
                            <button 
                              onClick={() => handleUpdateOrderStatus(order.id, 'SHIPPED')}
                              className="bg-accent-indigo text-white px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase hover:bg-accent-indigo/80 shadow-sm transition-all flex items-center gap-1"
                            >
                              <Package className="w-3 h-3" />
                              <span>Ship</span>
                            </button>
                          )}
                          {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                            <button 
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-1.5 bg-accent-rose/10 text-accent-rose rounded-lg hover:bg-accent-rose hover:text-white transition-all shadow-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orders.length === 0 && (
              <div className="py-24 text-center">
                <ShoppingBag className="w-10 h-10 text-display-muted/20 mx-auto mb-4" />
                <p className="text-display-muted font-black uppercase tracking-widest text-[10px]">Your store has no sales yet.</p>
              </div>
            )}
          </div>
        )}

         {activeTab === 'staff' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {staff.map((user) => (
              <div key={user.id} className="bg-main-card p-5 rounded-2xl border border-trim flex items-center gap-4 hover:shadow-lg hover:border-primary-500/50 transition-all group cursor-default shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center font-black text-lg group-hover:bg-primary-500 group-hover:text-white transition-all duration-300 flex-shrink-0 shadow-sm border border-trim">
                  {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-black text-display uppercase tracking-tight text-xs truncate italic">{user.name}</h4>
                  <div className="flex items-center text-display-muted text-[9px] font-bold mt-0.5 truncate">
                    <Mail className="w-2.5 h-2.5 mr-1.5 opacity-50" />
                    {user.email}
                  </div>
                </div>
              </div>
            ))}
            <button 
              onClick={() => setStaffModalOpen(true)}
              className="p-5 rounded-2xl border-2 border-dashed border-trim flex items-center justify-center gap-2 hover:bg-primary-500/5 hover:border-primary-500/50 transition-all group"
            >
              <UserPlus className="w-4 h-4 text-display-muted group-hover:text-primary-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-display-muted group-hover:text-primary-500">Hire Staff</span>
            </button>
          </div>
        )}
         {activeTab === 'coupons' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {coupons.map((coupon) => (
                  <Card key={coupon.id} className="bg-main-card border border-trim relative overflow-hidden group p-5 shadow-sm">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary-500/20 transition-all duration-700"></div>
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                           <div className="px-2 py-0.5 bg-primary-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary-500/20">{coupon.discount_percentage}% OFF</div>
                           <button onClick={() => handleDeleteCoupon(coupon.id)} className="text-display-muted hover:text-accent-rose transition-colors"><X className="w-3.5 h-3.5" /></button>
                        </div>
                        <h3 className="text-xl font-black text-display tracking-[0.2em] mb-1 italic uppercase truncate">"{coupon.code}"</h3>
                        <p className="text-display-muted text-[8px] font-bold uppercase tracking-widest opacity-60">Expires: {new Date(coupon.expiry_date).toLocaleDateString()}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-trim pt-3">
                           <div className="text-display-muted text-[8px] font-black uppercase tracking-tighter opacity-60">Uses: {coupon.usage_limit}</div>
                           <Button variant="ghost" className="text-display hover:bg-main h-6 px-2 py-0 text-[8px] font-black uppercase tracking-widest border-trim">Copy</Button>
                        </div>
                     </div>
                  </Card>
                ))}
                <button 
                  onClick={() => setCouponModalOpen(true)}
                  className="rounded-2xl border-2 border-dashed border-trim flex flex-col items-center justify-center p-6 group hover:bg-primary-500/5 hover:border-primary-500/50 transition-all h-full min-h-[140px]"
                >
                   <Tag className="w-6 h-6 text-display-muted group-hover:scale-110 transition-transform group-hover:text-primary-500" />
                   <p className="mt-3 font-black uppercase tracking-widest text-[9px] text-display-muted group-hover:text-primary-500">Launch Campaign</p>
                </button>
             </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-2 p-6 bg-main-card border border-trim relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-xl">
                   <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                   <div className="relative z-10 flex-1">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary-500 mb-1">Active Cluster</p>
                      <h2 className="text-3xl font-black italic tracking-tighter mb-2 uppercase text-display">{billing?.plan === 'pro' ? 'Enterprise Pro' : 'Cluster Basic'}</h2>
                      <p className="text-display-muted font-bold text-[10px] leading-relaxed max-w-xs italic opacity-80">Full cluster access enabled. Scaling infrastructure with global priority support.</p>
                      <div className="mt-6 flex gap-2">
                         <Button className="px-5 py-1.5 h-auto text-[9px] font-black uppercase tracking-widest bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20">Upgrade</Button>
                         <Button variant="ghost" className="px-5 py-1.5 h-auto text-[9px] font-black uppercase tracking-widest text-display border-trim hover:bg-main">Methods</Button>
                      </div>
                   </div>
                   <div className="relative z-10 w-full md:w-auto">
                      <div className="p-5 rounded-2xl bg-main border border-trim shadow-sm">
                         <p className="text-[8px] font-black uppercase tracking-[0.2em] text-display-muted mb-4 opacity-60">Subscription Vitals</p>
                         <div className="space-y-3">
                            <div className="flex justify-between items-center gap-8">
                               <span className="text-[9px] font-bold text-display-muted">Next billing</span>
                               <span className="text-[9px] font-black text-display">{new Date(billing?.subscription_end_date || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center gap-8">
                               <span className="text-[9px] font-bold text-display-muted">Base amount</span>
                               <span className="text-[9px] font-black text-display">{billing?.plan === 'pro' ? '$49.00/mo' : 'Free'}</span>
                            </div>
                            <div className="h-px bg-trim"></div>
                            <div className="flex items-center gap-2 text-primary-500 text-[9px] font-black uppercase tracking-widest">
                               <Shield className="w-3 h-3" />
                               Verified Cluster
                            </div>
                         </div>
                      </div>
                   </div>
                </Card>
                <Card className="p-6 flex flex-col justify-center items-center text-center bg-main-card border border-trim transition-all shadow-sm">
                   <div className="w-12 h-12 rounded-2xl bg-primary-500/10 text-primary-500 flex items-center justify-center mb-4 border border-trim shadow-sm"><Wallet className="w-6 h-6" /></div>
                   <h4 className="text-sm font-black text-display mb-1 uppercase tracking-tight italic">Metrics</h4>
                   <p className="text-[9px] text-display-muted font-bold mb-6 italic opacity-70">Resource consumption breakdown.</p>
                   <Button variant="secondary" className="w-full text-[9px] font-black uppercase tracking-widest h-8">Usage Statement</Button>
                </Card>
             </div>
          </div>
        )}

         {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-8 bg-main-card border border-trim shadow-sm">
                   <div className="flex justify-between items-start mb-8">
                      <div>
                         <h4 className="text-[9px] font-black uppercase tracking-widest text-display-muted mb-1">Store Revenue</h4>
                         <h2 className="text-4xl font-black text-display tracking-tighter italic">${merchantStats.totalRevenue}</h2>
                      </div>
                      <Badge variant="success" className="text-[8px] px-2 py-0.5 font-black uppercase">+12% vs LY</Badge>
                   </div>
                   <div className="h-[200px] w-full mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.revenueByDay}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgb(var(--primary-rgb))" stopOpacity={1} />
                            <stop offset="100%" stopColor="rgb(var(--primary-rgb))" stopOpacity={0.4} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--border-subtle))" opacity={0.3} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: 'rgb(var(--text-muted))' }} dy={10} />
                        <YAxis hide={true} />
                        <Tooltip cursor={{ fill: 'rgba(var(--primary-rgb), 0.05)' }} contentStyle={{ borderRadius: '15px', border: '1px solid rgb(var(--border-subtle))', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', fontWeight: 'black', background: 'rgb(var(--bg-card))', color: 'rgb(var(--text-main))', fontSize: '10px' }} />
                        <Bar dataKey="revenue" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                   </div>
                </Card>
 
                <Card className="p-8 flex flex-col bg-main-card border border-trim shadow-sm">
                   <h4 className="text-[9px] font-black uppercase tracking-widest text-display-muted mb-8">Product Velocity</h4>
                   <div className="flex-1 space-y-3">
                      {analytics.topProducts?.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-main border border-trim group hover:border-primary-500/30 transition-all shadow-sm">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-main-card border border-trim rounded-lg flex items-center justify-center font-black text-display-muted text-[10px] shadow-sm">{i+1}</div>
                              <div>
                                 <p className="font-extrabold text-display uppercase tracking-tight text-[10px] truncate max-w-[120px] italic">{p.name}</p>
                                 <p className="text-[8px] font-black text-display-muted uppercase tracking-widest">{p.order_count || 0} Units</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-primary-500 italic text-sm">${p.total_revenue}</p>
                           </div>
                        </div>
                      ))}
                      {(!analytics.topProducts || analytics.topProducts.length === 0) && (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30 text-display-muted">
                           <TrendingUp className="w-8 h-8 mb-3" />
                           <p className="font-black uppercase tracking-widest text-[8px]">No Velocity Data</p>
                        </div>
                      )}
                   </div>
                </Card>
             </div>
          </div>
        )}
      </main>

      {/* Modals Section */}
      {modalOpen && (
        <div className="fixed inset-0 bg-display/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl p-0 overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[90vh] bg-main-card border-none">
            <div className="p-6 border-b border-trim flex justify-between items-center bg-main/50">
               <div><h2 className="text-2xl font-black text-display tracking-tight">{editingProduct ? 'Refine SKU' : 'New Cluster Item'}</h2><p className="text-[10px] font-black text-display-muted uppercase tracking-widest mt-1">Resource Allocation</p></div>
               <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center bg-main border border-trim rounded-xl text-display-muted hover:text-display transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div className="aspect-square bg-main border-4 border-dashed border-trim rounded-[40px] flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-primary-400 transition-all">
                     {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <Upload className="w-10 h-10 text-display-muted/30" />}
                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                  </div>
                  <Card className="bg-main border-none"><p className="text-[10px] font-black text-display-muted uppercase mb-4 tracking-widest">Pricing Model</p><div className="text-4xl font-black text-display italic tracking-tighter">${formData.price || '0.00'}</div></Card>
               </div>
               <div className="space-y-6">
                  <Input label="Item Identity" placeholder="e.g. Quantum CPU" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Base Price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                     <Input label="Units" type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-display-muted uppercase ml-1 mb-2 block tracking-widest">Category</label>
                    <select 
                      className="w-full px-5 py-4 rounded-3xl bg-main border-none outline-none focus:ring-4 focus:ring-primary-500/5 transition-all font-bold text-display"
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})} 
                      required
                    >
                      {['General', 'Electronics', 'Clothing', 'Home', 'Beauty', 'Food'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-display-muted uppercase ml-1 mb-2 block tracking-widest">Metadata Description</label>
                     <textarea className="w-full px-5 py-4 rounded-3xl bg-main border-none outline-none focus:ring-4 focus:ring-primary-500/5 transition-all font-bold text-display min-h-[120px]" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full py-5 text-sm">{editingProduct ? 'SYNC UPDATES' : 'ALLOCATE RESOURCE'}</Button>
               </div>
            </form>
          </Card>
        </div>
      )}

      {staffModalOpen && (
        <div className="fixed inset-0 bg-display/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-0 overflow-hidden shadow-2xl animate-in zoom-in duration-300 bg-main-card">
            <div className="p-8 border-b border-trim flex justify-between items-center">
               <div><h2 className="text-2xl font-black text-display uppercase tracking-tight">Hire Agent</h2><p className="text-[10px] font-black text-display-muted uppercase tracking-widest">Access Authorization</p></div>
               <button onClick={() => setStaffModalOpen(false)} className="text-display-muted hover:text-display transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleStaffSubmit} className="p-8 space-y-6">
               <Input label="Agent Name" value={staffFormData.name} onChange={(e) => setStaffFormData({...staffFormData, name: e.target.value})} required />
               <Input label="Identity Email" value={staffFormData.email} onChange={(e) => setStaffFormData({...staffFormData, email: e.target.value})} required />
               <Input label="Passcode" type="password" value={staffFormData.password} onChange={(e) => setStaffFormData({...staffFormData, password: e.target.value})} required />
               <Button type="submit" className="w-full py-5">REGISTER PERSONNEL</Button>
            </form>
          </Card>
        </div>
      )}

      {couponModalOpen && (
        <div className="fixed inset-0 bg-display/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-0 overflow-hidden shadow-2xl animate-in zoom-in duration-300 bg-main-card">
            <div className="p-8 border-b border-trim flex justify-between items-center">
               <div><h2 className="text-2xl font-black text-display uppercase tracking-tight">Initiate Promo</h2><p className="text-[10px] font-black text-display-muted uppercase tracking-widest">Yield Optimization</p></div>
               <button onClick={() => setCouponModalOpen(false)} className="text-display-muted hover:text-display transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateCoupon} className="p-8 space-y-6">
               <Input label="Secret Code" placeholder="e.g. ALPHA" value={couponForm.code} onChange={(e) => setCouponForm({...couponForm, code: e.target.value})} required />
               <div className="grid grid-cols-2 gap-4">
                  <Input label="Reduction %" value={couponForm.discount_percentage} onChange={(e) => setCouponForm({...couponForm, discount_percentage: e.target.value})} required />
                  <Input label="Max Uses" value={couponForm.usage_limit} onChange={(e) => setCouponForm({...couponForm, usage_limit: e.target.value})} required />
               </div>
               <Input label="Expiry Data-point" type="date" value={couponForm.expiry_date} onChange={(e) => setCouponForm({...couponForm, expiry_date: e.target.value})} required />
               <Button type="submit" className="w-full py-5">LAUNCH CAMPAIGN</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TenantAdminDashboard;
