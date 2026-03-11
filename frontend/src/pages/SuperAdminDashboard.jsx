import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { logout } from '../services/authService';
import { 
  CheckCircle, XCircle, Users, Activity, Loader2, LogOut, 
  Store, UserX, Trash2, Mail, ShieldCheck, UserCheck, AlertOctagon,
  LayoutDashboard, Search, Bell, Settings, Globe, ArrowUpRight, TrendingUp, Sun, Moon, Droplets, Heart, Zap,
  ChevronLeft, ChevronRight, LayoutGrid, BarChart3, FileText, Puzzle, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Input } from '../components/ui';

const SuperAdminDashboard = () => {
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tenants');
  const [analytics, setAnalytics] = useState(null);
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
    try {
      if (activeTab === 'tenants') {
        const res = await api.get('/tenants');
        setTenants(res.data);
      } else if (activeTab === 'users') {
        const res = await api.get('/tenants/users');
        setUsers(res.data);
      } else if (activeTab === 'analytics') {
        const res = await api.get('/analytics/revenue');
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/tenants/${id}/approve`);
      fetchData();
    } catch (err) { alert('Approval failed'); }
  };

  const handleReject = async (id) => {
    if (window.confirm('Reject this proposal?')) {
      try {
        await api.patch(`/tenants/${id}/reject`);
        fetchData();
      } catch (err) { alert('Rejection failed'); }
    }
  };

  const handleDeleteTenant = async (id) => {
    if (window.confirm('Delete this proposal permanently?')) {
      try {
        await api.delete(`/tenants/${id}`);
        fetchData();
      } catch (err) { alert('Delete failed'); }
    }
  };

  const handleBlockUser = async (id, currentStatus) => {
    try {
      await api.patch(`/tenants/users/${id}/block`, { block: !currentStatus });
      fetchData();
    } catch (err) { alert('Failed to update user status'); }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Delete this user permanently?')) {
      try {
        await api.delete(`/tenants/users/${id}`);
        fetchData();
      } catch (err) { alert('Delete failed'); }
    }
  };

  // Theme Selection Configuration
  const themeConfigs = [
    { id: 'alabaster-silk', icon: Sun, label: 'Champagne Luxe' },
    { id: 'midnight-onyx', icon: Moon, label: 'Royal Amethyst' },
    { id: 'rose-gold', icon: Heart, label: 'Rose Gold' },
    { id: 'cyber-emerald', icon: Zap, label: 'Cyber Emerald' }
  ];

  if (loading && (tenants.length === 0 && users.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-main">
        <Loader2 className="animate-spin w-10 h-10 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-main transition-all duration-700 overflow-hidden">
      {/* Expandable Sidebar */}
      <aside className={`h-screen sticky top-0 bg-main-card/80 backdrop-blur-xl border-r border-trim flex flex-col transition-all duration-500 z-[100] ${isSidebarExpanded ? 'w-72 p-6' : 'w-24 p-4 items-center'}`}>
        
        {/* Toggle / Logo Area */}
        <div className={`flex items-center gap-3 mb-12 relative ${!isSidebarExpanded && 'justify-center'}`}>
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 flex-shrink-0">
            <Globe className="text-white w-5 h-5" />
          </div>
          {isSidebarExpanded && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <h2 className="text-sm font-black text-display uppercase tracking-tighter leading-none">Superadmin</h2>
              <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">Dashboard</p>
            </div>
          )}
          
          {/* Collapse/Expand Toggle Button */}
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className={`absolute -right-10 top-2 w-8 h-8 rounded-full bg-main-card border border-trim flex items-center justify-center text-display-muted hover:text-primary-500 hover:border-primary-500/50 shadow-sm transition-all z-[110]`}
          >
            {isSidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('tenants')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${activeTab === 'tenants' ? 'bg-primary-500/10 text-primary-500 shadow-sm' : 'text-display-muted hover:bg-main'}`}
          >
            <LayoutGrid className={`w-5 h-5 flex-shrink-0 ${activeTab === 'tenants' ? 'text-primary-500' : 'text-display-muted'}`} />
            {isSidebarExpanded && <span className="text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">Dashboard</span>}
            {!isSidebarExpanded && <span className="absolute left-full ml-4 px-2 py-1 bg-display text-main text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Proposals</span>}
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${activeTab === 'analytics' ? 'bg-primary-500/10 text-primary-500 shadow-sm' : 'text-display-muted hover:bg-main'}`}
          >
            <BarChart3 className={`w-5 h-5 flex-shrink-0 ${activeTab === 'analytics' ? 'text-primary-500' : 'text-display-muted'}`} />
            {isSidebarExpanded && <span className="text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">Analytics</span>}
            {!isSidebarExpanded && <span className="absolute left-full ml-4 px-2 py-1 bg-display text-main text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Analytics</span>}
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${activeTab === 'users' ? 'bg-primary-500/10 text-primary-500 shadow-sm' : 'text-display-muted hover:bg-main'}`}
          >
            <Users className={`w-5 h-5 flex-shrink-0 ${activeTab === 'users' ? 'text-primary-500' : 'text-display-muted'}`} />
            {isSidebarExpanded && <span className="text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">Users</span>}
            {!isSidebarExpanded && <span className="absolute left-full ml-4 px-2 py-1 bg-display text-main text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">Identity Manager</span>}
          </button>

        </nav>

        <div className={`mt-auto ${isSidebarExpanded ? 'px-2' : ''}`}>
          <div className="w-full flex items-center gap-4 p-3 rounded-2xl bg-primary-500/5 group">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center font-black text-main text-xs shadow-lg shadow-primary-500/20">
              SM
            </div>
            {isSidebarExpanded && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
                <p className="text-[10px] font-black text-display uppercase whitespace-nowrap">Super Master</p>
                <p className="text-[8px] font-black text-primary-500 uppercase tracking-widest">Admin Site</p>
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
              Control <span className="text-primary-500">Center</span>
              <span className="text-[10px] font-black bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-full uppercase tracking-widest">{activeTab}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Theme Switcher - Mockup Style */}
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
              <button className="p-2.5 rounded-xl bg-main-card border border-trim text-display-muted hover:text-primary-500 transition-all shadow-sm relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent-rose rounded-full"></span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-black text-[10px]">
                  ADM
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
                <LogOut className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </header>

        {activeTab === 'tenants' && (
          <>
            {/* Compact Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-main-card border border-trim flex items-center gap-4 group hover:border-primary-500/50 transition-all">
                <div className="w-10 h-10 bg-primary-500/10 text-primary-500 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-display-muted uppercase tracking-widest">Store Proposals</p>
                    <h3 className="text-xl font-black text-display">{tenants.filter(t => t.subscription_status === 'pending').length} <span className="text-[10px] text-accent-amber ml-1 italic">Pending</span></h3>
                </div>
            </div>
            <div className="p-5 rounded-2xl bg-main-card border border-trim flex items-center gap-4 group hover:border-primary-500/50 transition-all">
                <div className="w-10 h-10 bg-accent-emerald/10 text-accent-emerald rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-display-muted uppercase tracking-widest">Active Clusters</p>
                    <h3 className="text-xl font-black text-display">{tenants.filter(t => t.subscription_status === 'active').length} <span className="text-[10px] text-accent-emerald ml-1 italic">Online</span></h3>
                </div>
            </div>
            <div className="p-5 rounded-2xl bg-main-card border border-trim flex items-center gap-4 group hover:border-primary-500/50 transition-all">
                <div className="w-10 h-10 bg-primary-500/10 text-primary-500 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-display-muted uppercase tracking-widest">Global identities</p>
                    <h3 className="text-xl font-black text-display">{users.length} <span className="text-[10px] text-primary-500 ml-1 italic">Users</span></h3>
                </div>
            </div>
            <div className="p-5 rounded-2xl bg-primary-500 text-white flex items-center gap-4 shadow-lg shadow-primary-500/20">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">System Health</p>
                    <h3 className="text-xl font-black">99.9% <span className="text-[10px] opacity-70 ml-1 italic font-bold">Optimal</span></h3>
                </div>
            </div>
        </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-2 mb-2">
                <h4 className="text-[10px] font-black text-display-muted uppercase tracking-widest">Active Proposals & Clusters</h4>
              </div>
              {tenants.map((tenant) => (
                <div key={tenant.id} className="p-4 rounded-2xl bg-main-card border border-trim group hover:border-primary-500/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                        tenant.subscription_status === 'active' ? 'bg-accent-emerald/10 text-accent-emerald' : 
                        tenant.subscription_status === 'rejected' ? 'bg-accent-rose/10 text-accent-rose' : 
                        'bg-accent-amber/10 text-accent-amber'
                      }`}>
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-display">{tenant.name}</h3>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${
                            tenant.subscription_status === 'active' ? 'bg-accent-emerald/10 text-accent-emerald' : 
                            tenant.subscription_status === 'rejected' ? 'bg-accent-rose/10 text-accent-rose' : 'bg-accent-amber/10 text-accent-amber'
                          }`}>
                            {tenant.subscription_status}
                          </span>
                        </div>
                        <div className="text-[10px] text-display-muted font-bold mt-0.5 flex items-center gap-2 italic">
                          <span>{tenant.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {tenant.subscription_status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(tenant.id)} className="bg-primary-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-md shadow-primary-500/10">Validate</button>
                          <button onClick={() => handleReject(tenant.id)} className="bg-main text-display px-4 py-1.5 rounded-xl text-[10px] font-black border border-trim uppercase tracking-widest hover:bg-main-card transition-all">Reject</button>
                        </>
                      )}
                      {tenant.subscription_status === 'active' && (
                           <div className="flex items-center gap-4">
                               <div className="text-right">
                                  <p className="text-[10px] font-bold text-accent-emerald leading-none uppercase tracking-widest italic">Encrypted Connection</p>
                               </div>
                               <button className="bg-main text-display px-3 py-1.5 rounded-xl text-[10px] font-black border border-trim">OPEN HUB</button>
                           </div>
                      )}
                      <button onClick={() => handleDeleteTenant(tenant.id)} className="p-2 text-display-muted hover:text-accent-rose transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                </div>
              ))}
              {tenants.length === 0 && (
                <div className="text-center py-24 bg-main-card rounded-3xl border border-dashed border-trim">
                  <div className="w-16 h-16 bg-main text-display-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Store className="w-8 h-8" />
                  </div>
                  <p className="text-display-muted font-bold uppercase tracking-widest text-xs">No pending requests in queue.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="rounded-2xl border border-trim bg-main-card overflow-hidden shadow-xl">
            <div className="p-5 border-b border-trim flex justify-between items-center bg-main-card/50 backdrop-blur-md sticky top-0 z-10">
              <h4 className="text-[10px] font-black text-display-muted uppercase tracking-widest">Global Identity Register</h4>
              <Badge variant="primary" className="text-[9px] px-2 py-0.5">{users.length} Active Nodes</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-main border-b border-trim">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-display-muted">User Profile</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-display-muted">Access Tier</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-display-muted">Cluster Hub</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-display-muted text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-trim/40">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-main/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-sm ${user.is_blocked ? 'bg-accent-rose/10 text-accent-rose' : 'bg-primary-500/10 text-primary-500'}`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-display text-sm flex items-center gap-2">
                              {user.name}
                              {user.is_blocked && <span className="w-1.5 h-1.5 bg-accent-rose rounded-full"></span>}
                            </div>
                            <div className="text-display-muted text-[10px] font-bold italic">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-500/10 text-slate-500'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-display-muted text-xs italic">
                        {user.tenant?.name || 'CORE HUB'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-1 justify-end transition-all">
                          <button 
                            onClick={() => handleBlockUser(user.id, user.is_blocked)}
                            className={`p-2 rounded-xl transition-all ${user.is_blocked ? 'text-accent-emerald hover:bg-accent-emerald/10' : 'text-accent-amber hover:bg-accent-amber/10'}`}
                          >
                            {user.is_blocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-display-muted hover:text-accent-rose transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <Card className="p-8 bg-main-card border border-trim/50 relative overflow-hidden shadow-2xl group transition-all duration-500 hover:border-primary-500/30">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/5 blur-[100px] -mr-32 -mt-32"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 mb-3">Aggregate Platform GMV</p>
                  <div className="text-6xl font-black italic tracking-tighter leading-none text-display flex items-baseline gap-1">
                    <span className="text-2xl not-italic opacity-40">$</span>
                    {analytics?.totalRevenue?.toLocaleString() || '0'}
                  </div>
                  <p className="mt-4 text-[11px] text-display-muted font-bold flex items-center gap-2 italic">
                    <TrendingUp className="w-3.5 h-3.5 text-accent-emerald" />
                    <span className="text-accent-emerald">+24%</span> Growth vs Last Period
                  </p>
                </div>
                <div className="flex gap-2">
                   <Button className="px-5 py-1.5 h-auto text-[10px] font-black uppercase tracking-widest bg-primary-500 text-white hover:bg-primary-600 transition-all shadow-lg overflow-hidden relative group/btn">
                     <span className="relative z-10 transition-transform group-hover/btn:-translate-y-px">Global Export</span>
                   </Button>
                   <Button variant="ghost" className="px-5 py-1.5 h-auto text-[10px] font-black uppercase tracking-widest text-display border-trim hover:bg-main transition-all">History</Button>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {/* Bento style widgets */}
               <Card className="col-span-1 md:col-span-2 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-display-muted">Market Momentum</h4>
                    <TrendingUp className="text-primary-500 w-4 h-4" />
                  </div>
                  <div className="h-24 flex items-end gap-2 px-1">
                     {[40, 70, 45, 90, 65, 80, 50, 95].map((h, i) => (
                       <div key={i} className="flex-1 bg-main rounded-md relative group h-full cursor-pointer hover:bg-primary-500/10 transition-all">
                          <div className="absolute bottom-0 left-0 right-0 bg-primary-500/40 rounded-md group-hover:bg-primary-500 transition-all" style={{ height: `${h}%` }}></div>
                       </div>
                     ))}
                  </div>
                  <p className="mt-4 text-[9px] font-bold text-display-muted uppercase tracking-tight italic">Global market share +4.2% optimized</p>
               </Card>
               {analytics?.stats?.map((stat, idx) => (
                <Card key={idx} className="p-4 group hover:scale-[1.02] transition-all cursor-pointer border-trim bg-main-card">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center font-black text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors text-xs">
                      {stat.name.charAt(0)}
                    </div>
                    <Badge variant="primary" className="text-[8px] px-1.5 py-0.5">{stat.orderCount} Orders</Badge>
                  </div>
                  <h4 className="text-[11px] font-black text-display truncate uppercase italic tracking-tight">{stat.name}</h4>
                  <div className="text-xl font-black text-primary-500 tracking-tighter mt-0.5">${stat.revenue.toLocaleString()}</div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
