import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Package, Loader2, ShoppingCart, ShoppingBag, 
  ExternalLink, ArrowLeft, ShieldCheck, Info, UserPlus, Star, Heart, Search
} from 'lucide-react';
import SEO from '../components/SEO';

const PublicStore = () => {
  const { slug } = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  const fetchStoreData = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      
      const res = await api.get(`/tenants/public/${slug}?${params.toString()}`);
      setTenant(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Store not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, [slug]);

  // Handle live filtering
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (tenant) fetchStoreData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="animate-spin w-12 h-12 text-primary-600 mb-4" />
      <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Accessing Storefront...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8">
      <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-slate-200 text-center max-w-md">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Info className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">Access Denied</h2>
        <p className="text-slate-500 font-medium leading-relaxed mb-8">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center space-x-2 hover:bg-black transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="uppercase tracking-widest text-xs">Return to Home</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen">
      <SEO 
        title={tenant.name || 'Store'} 
        description={`Welcome to ${tenant.name} Official Store. Premium selection curated for you.`}
        name={tenant.name}
      />
      {/* Dynamic Header */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
             <div className="w-12 h-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary-100">
                {tenant.name.charAt(0)}
             </div>
             <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">{tenant.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                   <ShieldCheck className="w-3 h-3 text-green-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Seller Hub</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(`/register?tenant_id=${tenant.id}&store=${encodeURIComponent(tenant.name)}`)}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white font-black rounded-2xl shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all text-xs uppercase tracking-widest"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center space-x-2 px-6 py-3 bg-white text-slate-900 font-black rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white px-8 py-20 border-b border-slate-100">
         <div className="max-w-7xl mx-auto text-center">
            <span className="bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-100">Discover Collection</span>
            <h2 className="text-6xl font-black text-slate-900 mt-6 mb-4 tracking-tighter uppercase italic">{tenant.name} Official</h2>
            <p className="max-w-2xl mx-auto text-slate-400 font-medium text-lg leading-relaxed italic">"Premium selection curated for the refined audience. Experience exclusivity at your fingertips."</p>
         </div>
      </div>

      <div className="p-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
           <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Featured Products</h3>
           
           <div className="flex flex-1 max-w-md w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Find in store..." 
                className="w-full pl-11 pr-5 py-3.5 bg-white border border-slate-200 rounded-[24px] outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500 transition-all font-bold text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>

           <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
              {['All', 'Electronics', 'Clothing', 'Home', 'Beauty', 'Food'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2 rounded-xl font-black transition-all whitespace-nowrap text-[9px] uppercase tracking-widest ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  {cat}
                </button>
              ))}
           </div>

           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-200 shrink-0">
              {tenant.products.length} Results
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {tenant.products.map((product) => (
            <div key={product.id} className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-200 hover:shadow-2xl hover:shadow-primary-100/50 transition-all group relative">
              <div className="h-72 bg-slate-50 relative overflow-hidden flex items-center justify-center">
                {product.image_url ? (
                  <img 
                    src={product.image_url.startsWith('http') ? product.image_url : `http://localhost:5000${product.image_url}`} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                ) : (
                  <Package className="text-slate-200 w-16 h-16" />
                )}
                <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-[15px] font-black text-[10px] shadow-sm border border-white/50 uppercase tracking-widest">
                  {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
                </div>
                  <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-[20px] font-black text-slate-900 shadow-sm border border-white/50 text-lg">
                    ${product.price}
                  </div>
                  {product.avgRating > 0 && (
                    <div className="absolute bottom-6 right-6 bg-orange-50/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-orange-100 flex items-center space-x-1 shadow-sm">
                      <Star className="w-3 h-3 text-orange-500 fill-current" />
                      <span className="text-[10px] font-black text-orange-600">{product.avgRating.toFixed(1)}</span>
                      <span className="text-[8px] font-bold text-orange-400">({product.reviewCount})</span>
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-2 group-hover:translate-x-1 transition-transform">
                    <h3 className="text-2xl font-black text-slate-900 truncate uppercase tracking-tight">{product.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="bg-slate-100 text-[10px] font-black text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-widest">{product.category}</span>
                  </div>
                  <p className="text-slate-400 text-sm mb-8 line-clamp-2 min-h-[40px] font-medium leading-relaxed italic">"{product.description}"</p>
                <button 
                  onClick={() => navigate('/login')}
                  disabled={product.stock <= 0}
                  className={`w-full py-5 ${product.stock > 0 ? 'bg-slate-900' : 'bg-slate-300 cursor-not-allowed'} text-white font-black rounded-[24px] hover:bg-black transition-all flex items-center justify-center space-x-3 group/btn relative overflow-hidden shadow-xl shadow-slate-100`}
                >
                  <ShoppingCart className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                  <span className="uppercase tracking-widest text-xs">{product.stock > 0 ? 'Buy From Official' : 'Out of Stock'}</span>
                  <ExternalLink className="w-3 h-3 opacity-30" />
                </button>
              </div>
            </div>
          ))}
          {tenant.products.length === 0 && (
            <div className="col-span-full py-40 bg-white rounded-[40px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
               <Package className="w-16 h-16 text-slate-200 mb-4" />
               <p className="text-slate-300 font-extrabold uppercase tracking-widest text-xs">The catalog is currently empty for this merchant.</p>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-white border-t border-slate-100 py-12 px-8">
         <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Protected Multi-Tenant Architecture &copy; 2026 {tenant.name} Hub. All Rights Reserved.
            </p>
         </div>
      </footer>
    </div>
  );
};

export default PublicStore;
