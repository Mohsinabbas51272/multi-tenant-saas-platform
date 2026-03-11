import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Package, Loader2, ShoppingCart, 
  ExternalLink, Search, Star, Store, ShieldCheck, Zap, ChevronRight,
  Sun, Moon, Droplets, Monitor, Heart
} from 'lucide-react';
import SEO from '../components/SEO';

const Marketplace = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [theme, setTheme] = useState(localStorage.getItem('marketplace-theme') || 'midnight-onyx');
  const navigate = useNavigate();

  const themeConfigs = [
    { id: 'alabaster-silk', label: 'Champagne Luxe', icon: Sun },
    { id: 'midnight-onyx', label: 'Royal Amethyst', icon: Moon },
    { id: 'rose-gold', label: 'Rose Gold', icon: Heart },
    { id: 'cyber-emerald', label: 'Cyber Emerald', icon: Zap }
  ];

  // Theme Application Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('marketplace-theme', theme);
  }, [theme]);

  const fetchGlobalProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      
      const res = await api.get(`/products/global?${params.toString()}`);
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalProducts();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchGlobalProducts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory]);

  const handleBuyNow = (product) => {
    // Redirect to the specific store's registration page with tenant info
    navigate(`/register?tenant_id=${product.tenant_id}&store=${encodeURIComponent(product.tenant.name)}`);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-main text-display transition-colors duration-500">
      <Loader2 className="animate-spin w-10 h-10 text-primary-500 mb-6 opacity-80" />
      <p className="font-black text-display-muted uppercase tracking-[0.2em] text-[10px] animate-pulse">Initializing Global Hub...</p>
    </div>
  );

  return (
    <div className="bg-main min-h-screen text-display transition-colors duration-500 font-sans selection:bg-primary-500/30 selection:text-primary-900">
      <SEO 
        title="Global Hub | Marketplace" 
        description="Access the unified commerce network. Premium products from verified merchant nodes."
      />

      {/* Glassmorphic Navigation Header - Seamless transitions */}
      <nav className="bg-main/70 backdrop-blur-xl sticky top-0 z-50 px-6 lg:px-12 py-3.5 transition-all">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center gap-8">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
             <div className="w-10 h-10 bg-display text-main rounded-2xl flex items-center justify-center font-black text-lg shadow-xl shadow-black/10 group-hover:scale-105 transition-transform">
                M
             </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black text-display tracking-tighter uppercase leading-none italic font-serif">Global Hub</h1>
                <p className="text-[9px] font-black text-display-muted uppercase tracking-widest mt-1 opacity-60">Unified Network</p>
             </div>
          </div>

           <div className="flex-1 max-w-xl relative group hidden md:block">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-display-muted w-3.5 h-3.5 opacity-40 group-focus-within:opacity-100 transition-opacity" />
             <input 
               type="text" 
               placeholder="SYNC NETWORK SEARCH..." 
               className="w-full pl-11 pr-5 py-2.5 bg-main-card/50 border border-trim rounded-xl outline-none focus:bg-main-card focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-black text-[10px] uppercase tracking-widest text-display placeholder:opacity-20"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>

           <div className="flex items-center gap-4">
            <div className="flex bg-main-card/50 border border-trim p-1 rounded-xl items-center mr-2">
                {themeConfigs.map(cfg => (
                  <button
                    key={cfg.id}
                    onClick={() => setTheme(cfg.id)}
                    className={`p-1.5 rounded-lg transition-all ${theme === cfg.id ? 'bg-display text-main shadow-lg' : 'text-display-muted hover:bg-main'}`}
                    title={cfg.label}
                  >
                    <cfg.icon className="w-3.5 h-3.5" />
                  </button>
                ))}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/register')}
                className="hidden sm:flex items-center gap-2 px-5 py-2 bg-display text-main font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-display-muted transition-all active:scale-95 shadow-lg shadow-black/5"
              >
                <Store className="w-3.5 h-3.5" />
                Register Store
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-primary-500 text-white font-black rounded-xl text-[10px] uppercase tracking-[0.2em] hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 active:scale-95"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="px-6 lg:px-12 max-w-screen-2xl mx-auto pb-24 transition-colors">
        {/* Ultra-Compact Filters & Network Status */}
         <div className="flex flex-col lg:flex-row items-center justify-between mb-6 gap-6 py-4 transition-all">
            <div className="flex bg-main-card/50 p-1 rounded-xl border border-trim shadow-sm overflow-x-auto no-scrollbar max-w-full">
               {['All', 'Electronics', 'Clothing', 'Home', 'Beauty', 'Food'].map(cat => (
                 <button 
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={`px-5 py-2 rounded-lg font-black transition-all whitespace-nowrap text-[8px] uppercase tracking-widest ${selectedCategory === cat ? 'bg-display text-main shadow-sm' : 'text-display-muted hover:bg-main'}`}
                 >
                   {cat}
                 </button>
               ))}
            </div>
 
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 opacity-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse"></div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-display-muted">Pipeline Linked</span>
               </div>
            </div>
         </div>

        {/* High-Density Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
           {products.map((product) => (
            <div key={product.id} className="bg-main-card rounded-[24px] overflow-hidden border border-trim hover:border-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/5 transition-all group relative flex flex-col">
              <div className="aspect-[4/3] bg-main relative overflow-hidden flex items-center justify-center p-4">
                {product.image_url ? (
                  <img 
                    src={product.image_url.startsWith('http') ? product.image_url : `http://localhost:5000${product.image_url}`} 
                    alt={product.name} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" 
                  />
                ) : (
                  <Package className="text-display-muted w-8 h-8 opacity-10" />
                )}
                                {/* Refined Store Label */}
                <div className="absolute top-3 left-3 bg-main-card/80 backdrop-blur-md px-2.5 py-1 rounded-lg font-black text-[8px] shadow-sm border border-trim/50 uppercase tracking-[0.15em] flex items-center gap-1.5 transition-all">
                  <div className="w-1 h-1 rounded-full bg-primary-500"></div>
                  <span className="text-display opacity-80">{product.tenant.name}</span>
                </div>
 
                <div className="absolute bottom-3 right-3 bg-display text-main px-3 py-1.5 rounded-lg font-black text-[10px] shadow-xl tracking-tighter">
                    ${product.price}
                </div>
              </div>

             <div className="p-4 flex flex-col flex-1">
                <div className="mb-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-[10px] font-black text-display uppercase tracking-tight leading-tight italic truncate">{product.name}</h3>
                    <span className="text-[7px] font-black text-primary-500 bg-primary-500/5 px-1.5 py-0.5 rounded border border-primary-500/10 uppercase tracking-widest flex-shrink-0">
                       {product.category}
                    </span>
                  </div>
                </div>
 
                <p className="text-display-muted text-[8px] mb-4 line-clamp-2 min-h-[24px] font-black uppercase tracking-tight opacity-30 leading-tight">
                  {product.description}
                </p>
                                <button 
                  onClick={() => handleBuyNow(product)}
                  className="w-full mt-auto py-2.5 bg-main-card/50 text-display font-black rounded-lg border border-trim hover:bg-primary-500 hover:text-white hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/20 transition-all flex items-center justify-center gap-2 group/btn active:scale-95"
                >
                  <span className="uppercase tracking-[0.2em] text-[7px]">Initialize</span>
                  <ChevronRight className="w-2.5 h-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}

           {products.length === 0 && !loading && (
            <div className="col-span-full py-40 bg-main-card rounded-[40px] border border-trim border-dashed flex flex-col items-center justify-center text-center px-6">
               <div className="w-20 h-20 bg-main rounded-[30px] flex items-center justify-center mb-8 border border-trim/30">
                  <Package className="w-8 h-8 text-display-muted opacity-10" />
               </div>
               <h3 className="text-2xl font-black text-display uppercase italic font-serif transition-colors">No Network Signal</h3>
               <p className="text-display-muted mt-4 text-[10px] font-black uppercase tracking-widest opacity-40">Your query returned zero matches in the global grid.</p>
            </div>
          )}
        </div>
      </div>

       <footer className="bg-main py-16 px-6 lg:px-12 transition-colors">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-4 opacity-40">
                <ShieldCheck className="w-4 h-4 text-accent-emerald" />
                <span className="text-[10px] font-black text-display-muted uppercase tracking-[0.2em]">Secure Node Network Authorized</span>
            </div>
            <p className="text-[9px] font-black text-display-muted uppercase tracking-widest opacity-20">
                &copy; 2026 Unified Commerce Grid. Global Node 01.
            </p>
         </div>
      </footer>
    </div>
  );
};

export default Marketplace;
