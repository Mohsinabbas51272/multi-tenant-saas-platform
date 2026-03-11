import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  MapPin, Truck, Tag, TrendingUp, ArrowRight, Wallet, Receipt, BarChart2, LayoutDashboard, Users, ShoppingBag, Zap,
  Sun, Moon, Droplets, Monitor, Package, CheckCircle2, Clock, XCircle, Loader2, LayoutGrid, History, Heart, ShoppingCart, 
  LogOut, Search, Star, ChevronRight, MessageSquare, Trash2, X, Minus, Plus, ShieldCheck, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/authService';
import { Card, Button, Badge, Input } from '../components/ui';

const TenantUserDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog', 'orders', 'wishlist'
  const [wishlist, setWishlist] = useState([]);
  const [orderStatus, setOrderStatus] = useState(null); 
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState(null); // { valid, discount_percentage } or null
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [shippingData, setShippingData] = useState({ name: '', address: '', city: '', state: '', zip: '', country: 'US' });
  const [theme, setTheme] = useState(localStorage.getItem('dashboard-theme') || 'midnight-onyx');

  const themeConfigs = [
    { id: 'alabaster-silk', label: 'Champagne Luxe', icon: Sun },
    { id: 'midnight-onyx', label: 'Royal Amethyst', icon: Moon },
    { id: 'rose-gold', label: 'Rose Gold', icon: Heart },
    { id: 'cyber-emerald', label: 'Cyber Emerald', icon: Zap }
  ];
  const navigate = useNavigate();

  // Theme Application Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dashboard-theme', theme);
  }, [theme]);
 
  // Payment Verification Effect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      const verify = async () => {
        try {
          const res = await api.get(`/payments/verify-order?session_id=${sessionId}`);
          if (res.data.status === 'PAID') {
            alert('🎉 Payment Confirmed! Your order is now being processed.');
            setActiveTab('orders');
            fetchOrders();
          }
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          console.error('Verification failed', e);
        }
      };
      verify();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'wishlist') {
      fetchWishlist();
    }
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      
      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Trigger search when query or category changes
  useEffect(() => {
    if (activeTab === 'catalog') {
      const delayDebounceFn = setTimeout(() => {
        fetchProducts();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchQuery, selectedCategory]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Cart Functions
  const addToCart = (product, variant = null) => {
    // Unique ID based on product + variant
    const cartItemId = variant ? `${product.id}-${variant.id}` : product.id;
    const existing = cart.find(item => item.cartItemId === cartItemId);
    
    // Price depends on variant adjustment
    const price = variant ? parseFloat(product.price) + parseFloat(variant.price_adjustment) : parseFloat(product.price);

    if (existing) {
      setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, cartItemId, price: price.toFixed(2), quantity: 1, variant }]);
    }
    setCartOpen(true);
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart(cart.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2);

  const discountedTotal = couponStatus?.valid 
    ? (parseFloat(cartTotal) * (1 - couponStatus.discount_percentage / 100)).toFixed(2)
    : cartTotal;

  // Shipping & Tax calculations
  const shippingCost = parseFloat(discountedTotal) >= 50 ? 0 : 5.99;
  const taxAmount = parseFloat((parseFloat(discountedTotal) * 0.08).toFixed(2));
  const grandTotal = (parseFloat(discountedTotal) + shippingCost + taxAmount).toFixed(2);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api.post('/coupons/validate', { code: couponCode });
      if (res.data.valid) {
        setCouponStatus(res.data);
      } else {
        setCouponStatus(null);
        alert(res.data.message || 'Invalid coupon');
      }
    } catch (err) {
      setCouponStatus(null);
      alert(err.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = async () => {
    try {
      const itemsPayload = cart.map(item => ({
        product_id: item.id,
        variant_id: item.variant ? item.variant.id : null,
        quantity: item.quantity,
        price: item.price
      }));

      if (paymentMethod === 'STRIPE') {
        // Redirect to Stripe Checkout
        const res = await api.post('/payments/create-checkout-session', {
          items: itemsPayload,
          coupon_code: couponStatus?.valid ? couponCode : undefined,
          shipping: shippingData
        });
        window.location.href = res.data.url;
        return;
      }

      // COD flow
      const orderData = {
        total_amount: discountedTotal,
        payment_method: 'COD',
        coupon_code: couponStatus?.valid ? couponCode : undefined,
        items: itemsPayload,
        shipping: shippingData
      };
      await api.post('/orders', orderData);
      setCart([]);
      setCheckoutModalOpen(false);
      setCartOpen(false);
      setCouponCode('');
      setCouponStatus(null);
      setShippingData({ name: '', address: '', city: '', state: '', zip: '', country: 'US' });
      setOrderStatus('success');
      setTimeout(() => setOrderStatus(null), 5000);
      if (activeTab === 'orders') fetchOrders();
    } catch (err) {
      alert('Checkout failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wishlist');
      setWishlist(res.data);
    } catch (err) {
      console.error('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId) => {
    try {
      await api.post('/wishlist/toggle', { product_id: productId });
      if (activeTab === 'wishlist') fetchWishlist();
      else fetchProducts();
    } catch (err) {
      console.error('Wishlist toggle failed');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', { 
        product_id: selectedProduct.id, 
        rating: reviewData.rating, 
        comment: reviewData.comment 
      });
      setReviewModalOpen(false);
      setReviewData({ rating: 5, comment: '' });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Review failed');
    }
  };

  const deleteOrderRecord = async (id) => {
    if (window.confirm('Would you like to remove this order from your history?')) {
      try {
        await api.delete(`/orders/${id}`);
        fetchOrders();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete order record');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED': 
        return <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> Delivered</Badge>;
      case 'SHIPPED':
        return <Badge variant="primary"><Truck className="w-3 h-3 mr-1" /> Shipped</Badge>;
      case 'PROCESSING':
        return <Badge variant="warning"><Package className="w-3 h-3 mr-1" /> Processing</Badge>;
      case 'PENDING':
        return <Badge variant="neutral"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'CANCELLED':
        return <Badge variant="error"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (loading && (products.length === 0 && orders.length === 0)) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-main transition-colors duration-500">
      <Loader2 className="animate-spin w-12 h-12 text-primary-500 mb-4" />
      <p className="text-[10px] font-black text-display-muted uppercase tracking-widest animate-pulse opacity-60">Synchronizing Storefront...</p>
    </div>
  );

  return (
    <div className="bg-main min-h-screen flex flex-col font-sans selection:bg-primary-500/30 selection:text-primary-900 transition-colors duration-500">
      {/* Immersive Store Header */}
      <header className="sticky top-0 z-40 bg-main/70 backdrop-blur-xl border-b border-trim/50 px-6 lg:px-12 py-3 transition-colors duration-500">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 shrink-0">
             <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Package className="text-white w-5 h-5" />
             </div>
             <div className="hidden sm:block">
              <h1 className="text-lg font-black tracking-tighter text-display leading-none uppercase italic">
                {getCurrentUser()?.tenant_name || 'Boutique'} <span className="text-primary-500">Hub</span>
              </h1>
              <p className="text-[9px] font-black text-display-muted uppercase tracking-widest mt-1 opacity-60">Elite Marketplace Node</p>
             </div>
          </div>

          {/* Navigation Pill */}
          <nav className="hidden md:flex bg-main-card/50 p-1 rounded-xl border border-trim backdrop-blur-md transition-all">
             {[
               { id: 'catalog', label: 'Gallery', icon: LayoutGrid },
               { id: 'orders', label: 'History', icon: History },
               { id: 'wishlist', label: 'Archived', icon: Heart }
             ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-black transition-all duration-300 ${activeTab === item.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-display-muted hover:bg-main'}`}
                >
                  <item.icon className={`w-3.5 h-3.5`} />
                  <span className="text-[9px] uppercase tracking-widest text-inherit">{item.label}</span>
                </button>
             ))}
          </nav>

          {/* Theme & User Ops */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Premium Theme Switcher */}
            <div className="hidden sm:flex bg-main-card/50 p-1 rounded-xl border border-trim gap-1 mr-1">
               {themeConfigs.map(t => (
                 <button 
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-500 ${theme === t.id ? 'bg-primary-500 text-white shadow-lg' : 'text-display-muted hover:bg-main'}`}
                    title={t.label}
                 >
                    <t.icon className="w-3.5 h-3.5" />
                 </button>
               ))}
            </div>

            <button 
               onClick={() => setCartOpen(!cartOpen)}
               className="relative w-9 h-9 flex items-center justify-center bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-500/20 hover:scale-110 active:scale-95 transition-all duration-300 group"
            >
               <ShoppingCart className="w-3.5 h-3.5 group-hover:animate-bounce" />
               {cart.length > 0 && (
                 <span className="absolute -top-1 -right-1 bg-display text-main text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-primary-500 font-black shadow-sm text-center leading-none">
                   {cart.reduce((s, i) => s + i.quantity, 0)}
                 </span>
               )}
            </button>
            <div className="h-6 w-px bg-[rgb(var(--border-subtle))] mx-1 hidden sm:block"></div>
            
            <div className="hidden sm:flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl bg-main-card border border-trim">
               <div className="w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center font-black text-[10px]">
                 {getCurrentUser()?.name?.slice(0, 1).toUpperCase() || 'U'}
               </div>
               <span className="text-[10px] font-black text-display uppercase tracking-tight max-w-[80px] truncate">{getCurrentUser()?.name || 'User'}</span>
               <button 
                 onClick={handleLogout}
                 className="w-7 h-7 flex items-center justify-center text-display-muted hover:text-accent-rose transition-colors"
               >
                 <LogOut className="w-3.5 h-3.5" />
               </button>
            </div>
          </div>
        </div>
      </header>


      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-12 py-10">
        {orderStatus === 'success' && (
          <div className="mb-10 p-8 bg-display rounded-[40px] text-main flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-primary-500/10 animate-in fade-in slide-in-from-top-12 duration-1000">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-accent-emerald rounded-[24px] flex items-center justify-center shadow-lg shadow-accent-emerald/30">
                   <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                   <h3 className="text-2xl font-black tracking-tight uppercase italic font-serif leading-none">Authorization Success</h3>
                   <p className="text-main font-bold text-[10px] uppercase tracking-[0.2em] mt-2 opacity-60">Unit transfer initiated</p>
                </div>
             </div>
             <button className="bg-primary-500 text-white hover:bg-primary-600 px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95" onClick={() => setActiveTab('orders')}>Trace Shipment</button>
          </div>
        )}

        {/* Catalog Operations */}
        {activeTab === 'catalog' && (
          <div className="mb-12 space-y-8">
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-display-muted opacity-40 w-5 h-5 group-focus-within:text-primary-500 transition-all duration-300" />
                <input 
                  type="text" 
                  placeholder="QUERY THE REPOSITORY..." 
                  className="w-full pl-16 pr-8 py-5 rounded-2xl bg-main-card border border-trim shadow-sm focus:border-primary-500 focus:ring-8 focus:ring-primary-500/5 outline-none transition-all font-black text-display placeholder:text-display-muted placeholder:opacity-30 text-sm uppercase"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex bg-main-card p-1.5 rounded-2xl border border-trim shadow-sm overflow-x-auto no-scrollbar max-w-full">
                {['All', 'Electronics', 'Clothing', 'Home', 'Beauty', 'Food'].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-7 py-3 rounded-xl font-black transition-all duration-500 whitespace-nowrap text-[10px] uppercase tracking-widest ${selectedCategory === cat ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-display-muted hover:bg-main'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
                  {activeTab === 'catalog' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="group relative">
                <div className="bg-main-card rounded-2xl border border-trim overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-500 hover:-translate-y-1 flex flex-col h-full group/card">
                  <div className="h-48 bg-main relative overflow-hidden flex items-center justify-center p-6 group/img">
                    {product.image_url ? (
                      <img 
                        src={product.image_url.startsWith('http') ? product.image_url : `http://localhost:5000${product.image_url}`} 
                        alt={product.name} 
                        className="w-full h-full object-contain group-hover/img:scale-110 transition-transform duration-700 drop-shadow-xl" 
                      />
                    ) : (
                      <Package className="text-[rgb(var(--text-muted))] opacity-20 w-12 h-12" />
                    )}
                    
                    <div className="absolute top-4 left-4 bg-main-card/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-trim shadow-sm">
                       <span className="text-display font-black tracking-tighter text-sm italic font-serif">${product.price}</span>
                    </div>

                    {product.stock <= 5 && product.stock > 0 && (
                      <div className="absolute top-4 right-4 bg-accent-rose text-white px-2 py-1 rounded-md shadow-lg shadow-accent-rose/20 animate-pulse">
                         <p className="text-[7px] font-black uppercase tracking-widest">Low Stock</p>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-display truncate uppercase tracking-tight italic font-serif mb-1.5">
                            {product.name}
                          </h3>
                         {product.avgRating > 0 && (
                            <div className="flex items-center gap-1">
                               <Star className="w-2.5 h-2.5 text-accent-amber fill-current" />
                               <span className="text-[9px] font-black text-accent-amber">{product.avgRating.toFixed(1)}</span>
                            </div>
                         )}
                      </div>
                    </div>
                    
                    <p className="text-display-muted text-[10px] font-bold mb-6 line-clamp-2 min-h-[30px] leading-relaxed italic opacity-70">
                      {product.description}
                    </p>

                    <div className="mt-auto flex gap-2">
                      <div className="flex-1 relative group/variants">
                        {product.variants?.length > 0 ? (
                           <div className="relative">
                              <button className="w-full py-2.5 bg-display text-main font-black rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 group/btn active:scale-95">
                                 <span className="uppercase tracking-widest text-[8px]">Details</span>
                                 <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                              </button>
                              
                              <div className="absolute bottom-full left-0 w-full mb-2 bg-main-card rounded-xl shadow-2xl border border-trim p-2 hidden group-hover/variants:block z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                 <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                    {product.variants.map(v => (
                                      <button 
                                        key={v.id} 
                                        onClick={() => addToCart(product, v)} 
                                        className="w-full text-left p-2 rounded-lg hover:bg-main flex justify-between items-center transition-all group/vitem"
                                      >
                                        <div className="flex flex-col">
                                           <span className="text-[9px] font-black text-display uppercase">{v.size || 'Std'}</span>
                                           {v.color && <span className="text-[7px] font-bold text-display-muted uppercase">{v.color}</span>}
                                        </div>
                                        <span className="text-[8px] text-primary-500 font-black">+${v.price_adjustment}</span>
                                      </button>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        ) : (
                          <button 
                            onClick={() => addToCart(product)}
                            className="w-full py-2.5 bg-primary-500 text-white font-black rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 active:scale-95 group/acquire"
                          >
                             <Zap className="w-3 h-3 group-hover/acquire:animate-pulse" />
                             <span className="uppercase tracking-widest text-[8px]">Acquire</span>
                          </button>
                        )}
                      </div>

                      <button 
                        onClick={() => toggleWishlist(product.id)}
                        className={`p-2.5 rounded-xl border transition-all ${product.isWishlisted ? 'bg-accent-rose text-white border-transparent shadow-lg shadow-accent-rose/20' : 'bg-main-card text-display-muted border-trim hover:text-accent-rose hover:border-accent-rose/20'}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${product.isWishlisted ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'orders' ? (
          <div className="space-y-10 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 transition-colors">
               <div>
                  <h2 className="text-2xl font-black text-display tracking-tighter uppercase italic font-serif leading-none transition-colors">Order Pipeline</h2>
                  <p className="text-display-muted font-bold text-[9px] uppercase tracking-[0.2em] mt-2 opacity-60 transition-colors">Tracing your acquisitions</p>
               </div>
               <div className="flex gap-3">
                  <div className="bg-main-card px-5 py-2.5 rounded-xl border border-trim shadow-sm flex items-center gap-2.5 transition-colors">
                     <div className="w-1.5 h-1.5 bg-accent-emerald rounded-full animate-pulse"></div>
                     <span className="text-[9px] font-black text-display-muted uppercase tracking-widest transition-colors">{orders.length} Records</span>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div key={order.id} className="bg-main-card rounded-2xl border border-trim shadow-sm transition-all duration-300 overflow-hidden group">
                    <div className="p-5">
                      <div className="flex flex-col lg:flex-row justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="w-10 h-10 bg-main rounded-lg flex items-center justify-center border border-trim group-hover:bg-primary-500 group-hover:text-white transition-colors">
                                <Receipt className="w-4 h-4" />
                             </div>
                             <div>
                                <p className="text-[8px] font-black text-display-muted uppercase tracking-widest mb-0.5 opacity-60">Serial ID</p>
                                <p className="text-display font-black text-[11px] uppercase tracking-tight">#{order.id.slice(-8).toUpperCase()}</p>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div>
                               <p className="text-[8px] font-black text-display-muted uppercase tracking-widest mb-1 opacity-60">Date</p>
                               <p className="text-display font-bold text-[10px]">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                               <p className="text-[8px] font-black text-display-muted uppercase tracking-widest mb-1 opacity-60">Amount</p>
                               <p className="text-primary-500 font-black text-[12px] tracking-tight">${order.total_amount}</p>
                            </div>
                            <div className="flex flex-col">
                               <p className="text-[8px] font-black text-display-muted uppercase tracking-widest mb-1.5 opacity-60">Status</p>
                               <div className="flex">
                                  {getStatusBadge(order.status)}
                               </div>
                            </div>
                          </div>
                        </div>

                         <div className="lg:w-64 flex flex-col justify-between items-end gap-4">
                            <div className="flex -space-x-1.5">
                               {order.items?.slice(0, 3).map((item, idx) => (
                                  <div key={idx} className="w-9 h-9 rounded-lg border border-trim bg-main relative overflow-hidden shadow-sm">
                                     {item.product?.image_url ? (
                                        <img src={item.product.image_url.startsWith('http') ? item.product.image_url : `http://localhost:5000${item.product.image_url}`} className="w-full h-full object-cover p-1" />
                                      ) : (
                                         <div className="w-full h-full flex items-center justify-center text-display-muted opacity-20"><Package className="w-3 h-3" /></div>
                                      )}
                                   </div>
                                ))}
                               {order.items?.length > 3 && (
                                  <div className="w-9 h-9 rounded-lg bg-display text-main flex items-center justify-center text-[8px] font-black">
                                     +{order.items.length - 3}
                                  </div>
                                )}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                               <button 
                                  onClick={() => deleteOrderRecord(order.id)}
                                  className="w-9 h-9 bg-main text-display-muted border border-trim rounded-lg hover:text-accent-rose hover:border-accent-rose/20 transition-all flex items-center justify-center"
                                >
                                   <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => navigate(`/orders/${order.id}/track`)}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-display text-main rounded-lg text-[8px] tracking-widest uppercase font-black hover:opacity-90 transition-all"
                                >
                                 Trace
                               </button>
                            </div>
                         </div>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1 w-full bg-main relative overflow-hidden transition-colors">
                       <div className={`h-full bg-primary-500 transition-all duration-1000 ${order.status === 'DELIVERED' ? 'w-full' : order.status === 'SHIPPED' ? 'w-2/3' : 'w-1/3 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse'}`}></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-32 bg-main-card rounded-[60px] border border-trim border-dashed transition-colors">
                  <div className="w-20 h-20 bg-main rounded-[30px] flex items-center justify-center mx-auto mb-8 border border-trim/30 transition-colors">
                     <History className="w-8 h-8 text-display-muted opacity-20" />
                  </div>
                  <h3 className="text-2xl font-black text-display uppercase italic font-serif transition-colors">No Transaction Records</h3>
                  <p className="text-display-muted mt-4 text-sm font-medium opacity-60 transition-colors">Initialize your first acquisition to start tracing history.</p>
                  <button onClick={() => setActiveTab('catalog')} className="mt-10 px-10 py-4 bg-display text-main rounded-2xl font-black uppercase tracking-widest text-[10px]">Jump to Gallery</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-10 max-w-5xl mx-auto">
             <div className="flex justify-between items-end mb-6 transition-colors">
                <div>
                   <h2 className="text-2xl font-black text-display tracking-tighter uppercase italic font-serif leading-none transition-colors">Archived Units</h2>
                   <p className="text-display-muted font-bold text-[9px] uppercase tracking-[0.2em] mt-2 opacity-60 transition-colors">Saved for validation</p>
                </div>
             </div>
              {wishlist.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {wishlist.map((item) => (
                    <div key={item.id} className="group relative">
                        <div className="bg-main-card rounded-2xl border border-trim overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1 flex flex-col h-full group/wcard">
                          <div className="h-40 bg-main relative overflow-hidden flex items-center justify-center p-4">
                             {item.image_url ? (
                               <img src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                             ) : (
                               <Package className="text-display-muted opacity-20 w-12 h-12" />
                             )}
                             <button 
                                onClick={() => toggleWishlist(item.id)}
                                className="absolute top-3 right-3 w-8 h-8 bg-main-card rounded-lg border border-trim text-accent-rose flex items-center justify-center hover:scale-110 transition-all shadow-sm"
                             >
                                <Trash2 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                          <div className="p-4 flex-1 flex flex-col">
                             <h3 className="text-[11px] font-black text-display truncate uppercase tracking-tight italic font-serif mb-1">{item.name}</h3>
                             <p className="text-primary-500 font-black text-sm mb-4 tracking-tight">${item.price}</p>
                             <button 
                                onClick={() => addToCart(item)}
                                className="w-full mt-auto py-2.5 bg-display text-main rounded-lg uppercase tracking-widest text-[8px] font-black hover:opacity-90 transition-all active:scale-95"
                             >
                                Restore Unit
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                 <div className="text-center py-32 bg-main-card rounded-[60px] border border-trim border-dashed transition-colors">
                   <div className="w-20 h-20 bg-main rounded-[30px] flex items-center justify-center mx-auto mb-8 border border-trim/30 transition-colors">
                      <Heart className="w-8 h-8 text-display-muted opacity-20" />
                   </div>
                   <h3 className="text-2xl font-black text-display uppercase italic font-serif transition-colors">Archive Empty</h3>
                   <p className="text-display-muted mt-4 text-sm font-medium opacity-60 transition-colors">Save items to this vault for future acquisitions.</p>
                 </div>
              )}
          </div>
        )}
      </main>
      {/* Refined Cart Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-full max-w-[380px] bg-main shadow-[-40px_0_80px_-20px_rgba(0,0,0,0.1)] z-50 transform transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${cartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
         <div className="p-6 border-b border-trim/50 flex items-center justify-between bg-main">
            <div className="flex-1">
               <h2 className="text-xl font-black text-display tracking-tighter uppercase italic font-serif transition-colors">Boutique Cart</h2>
               <p className="text-[9px] font-black text-display-muted uppercase tracking-widest mt-1 opacity-60 transition-colors">{cart.reduce((s, i) => s + i.quantity, 0)} Units ready</p>
            </div>
            <button onClick={() => setCartOpen(false)} className="w-9 h-9 flex items-center justify-center bg-main-card border border-trim rounded-xl text-display-muted hover:text-display transition-all group shadow-sm">
               <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-500" />
            </button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {cart.map(item => (
              <div key={item.cartItemId} className="flex gap-4 group">
                 <div className="w-20 h-20 bg-main rounded-[24px] overflow-hidden shadow-sm flex-shrink-0 relative border border-trim/30">
                    {item.image_url ? (
                       <img 
                        src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`} 
                        className="w-full h-full object-contain p-2" 
                       />
                     ) : (
                       <Package className="w-full h-full p-6 text-display-muted/20 stroke-[1]" />
                     )}
                     <div className="absolute inset-0 bg-display/0 group-hover:bg-display/5 transition-colors"></div>
                 </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-display truncate uppercase tracking-tighter text-[11px] italic transition-colors">
                        {item.name}
                      </h4>
                      <button onClick={() => removeFromCart(item.cartItemId)} className="text-display-muted/30 hover:text-accent-rose transition-colors p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    {item.variant && (
                      <div className="flex gap-1.5 mb-1.5">
                         <span className="text-[8px] font-black text-display-muted bg-main px-2 py-0.5 rounded-md uppercase border border-trim italic">
                            {item.variant.size} {item.variant.color}
                         </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-auto">
                       <span className="text-primary-500 font-black text-sm tracking-tight transition-colors">${item.price}</span>
                       <div className="flex items-center bg-main-card border border-trim rounded-xl px-1.5 py-0.5 shadow-sm">
                          <button onClick={() => updateQuantity(item.cartItemId, -1)} className="p-1 text-display-muted/40 hover:text-display transition-colors"><Minus className="w-2.5 h-2.5" /></button>
                          <span className="w-6 text-center font-black text-[10px] text-display">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartItemId, 1)} className="p-1 text-display-muted/40 hover:text-display transition-colors"><Plus className="w-2.5 h-2.5" /></button>
                       </div>
                    </div>
                 </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center py-24">
                  <div className="w-16 h-16 bg-main rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-trim/30">
                     <ShoppingCart className="w-6 h-6 text-display-muted opacity-20" />
                  </div>
                  <p className="text-display-muted opacity-40 font-black uppercase tracking-widest text-[9px] transition-colors">Collection queue is empty</p>
                  <button className="mt-8 px-6 py-2 border border-trim rounded-lg italic text-[10px] text-display-muted hover:text-display transition-all" onClick={() => setCartOpen(false)}>Continue Browsing</button>
              </div>
            )}
         </div>          <div className="p-6 bg-main border-t border-trim/50 transition-colors">
             <div className="flex justify-between items-end mb-6">
                <div>
                   <p className="text-[9px] font-black text-display-muted uppercase tracking-widest opacity-60">Transaction Value</p>
                   <p className="text-3xl font-black text-display tracking-tighter mt-1 italic transition-colors">${cartTotal}</p>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[8px] font-black text-accent-emerald uppercase tracking-widest bg-accent-emerald/5 px-2 py-0.5 rounded-md border border-accent-emerald/10">Authorized</span>
                </div>
             </div>
             <button 
               disabled={cart.length === 0}
               onClick={() => setCheckoutModalOpen(true)}
               className="w-full py-4.5 bg-primary-500 text-white font-black rounded-2xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group/btn active:scale-95"
             >
                <span className="uppercase tracking-widest text-[10px]">Execute Selection</span>
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
             </button>
          </div>
      </div>       {/* High-Fidelity Checkout Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-display/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto transition-all">
            <div className="bg-main w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500 flex flex-col lg:flex-row border border-trim/30 transition-colors">
              
              <div className="flex-1 p-6 lg:p-10 space-y-8">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <h2 className="text-xl font-black text-display tracking-tighter uppercase italic font-serif transition-colors">Secure Terminal</h2>
                    <p className="text-display-muted text-[8px] font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2 opacity-60">
                       <ShieldCheck className="w-2.5 h-2.5 text-primary-500" /> End-to-End Encrypted
                    </p>
                  </div>
                  <button onClick={() => setCheckoutModalOpen(false)} className="w-9 h-9 flex items-center justify-center bg-main-card border border-trim rounded-xl text-display-muted hover:text-display transition-all shadow-sm"><X className="w-3.5 h-3.5" /></button>
                </div>
                
                <div className="space-y-12 overflow-y-auto p-1 custom-scrollbar">
                  {/* Payment Selection */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-display-muted uppercase tracking-widest flex items-center gap-2 opacity-60 transition-colors">
                       <span className="w-5 h-5 rounded-lg bg-display text-main flex items-center justify-center text-[9px]">01</span> Authorization Strategy
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={() => setPaymentMethod('COD')}
                        className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group ${paymentMethod === 'COD' ? 'border-primary-500 bg-main-card shadow-xl shadow-black/10' : 'border-trim bg-main/50 hover:bg-main'}`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${paymentMethod === 'COD' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-main-card text-display-muted opacity-30 shadow-sm border border-trim'}`}>
                          <Package className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="font-black text-display text-sm uppercase tracking-tight transition-colors">Manual</h4>
                          <p className="text-[9px] font-bold text-display-muted uppercase tracking-tighter opacity-60">On-Site Liquidation</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => setPaymentMethod('STRIPE')}
                        className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group ${paymentMethod === 'STRIPE' ? 'border-primary-500 bg-main-card shadow-xl shadow-black/10' : 'border-trim bg-main/50 hover:bg-main'}`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${paymentMethod === 'STRIPE' ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-main-card text-display-muted opacity-30 shadow-sm border border-trim'}`}>
                          <CreditCard className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="font-black text-display text-sm uppercase tracking-tight transition-colors">Digital</h4>
                          <p className="text-[9px] font-bold text-display-muted uppercase tracking-tighter opacity-60">Gateway Authorized</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-4 pt-4 border-t border-trim/30 transition-colors">
                    <label className="text-[10px] font-black text-display-muted uppercase tracking-widest flex items-center gap-2 opacity-60">
                       <span className="w-5 h-5 rounded-lg bg-display text-main flex items-center justify-center text-[9px]">02</span> Geographic Logistics
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 relative group">
                        <input
                          type="text" placeholder="Full Transferee Name" value={shippingData.name}
                          onChange={(e) => setShippingData({ ...shippingData, name: e.target.value })}
                          className="w-full px-6 py-4 rounded-xl bg-main-card border border-trim focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all font-bold text-display placeholder:text-display-muted placeholder:opacity-20 text-sm italic"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text" placeholder="Allocation Target (Full Address)" value={shippingData.address}
                          onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                          className="w-full px-6 py-4 rounded-xl bg-main-card border border-trim focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all font-bold text-display placeholder:text-display-muted placeholder:opacity-20 text-sm italic"
                        />
                      </div>
                      <input
                        type="text" placeholder="City Hub" value={shippingData.city}
                        onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                        className="px-6 py-3.5 rounded-xl bg-main-card border border-trim focus:border-primary-500 outline-none transition-all font-bold text-display placeholder:text-display-muted placeholder:opacity-20 text-sm italic"
                      />
                      <input
                        type="text" placeholder="State/Region" value={shippingData.state}
                        onChange={(e) => setShippingData({ ...shippingData, state: e.target.value })}
                        className="px-6 py-3.5 rounded-xl bg-main-card border border-trim focus:border-primary-500 outline-none transition-all font-bold text-display placeholder:text-display-muted placeholder:opacity-20 text-sm italic"
                      />
                      <input
                        type="text" placeholder="Postal Route" value={shippingData.zip}
                        onChange={(e) => setShippingData({ ...shippingData, zip: e.target.value })}
                        className="px-6 py-3.5 rounded-xl bg-main-card border border-trim focus:border-primary-500 outline-none transition-all font-bold text-display placeholder:text-display-muted placeholder:opacity-20 text-sm italic"
                      />
                      <select
                        value={shippingData.country}
                        onChange={(e) => setShippingData({ ...shippingData, country: e.target.value })}
                        className="px-6 py-3.5 rounded-xl bg-main-card border border-trim focus:border-primary-500 outline-none transition-all font-black text-[9px] uppercase tracking-widest text-display appearance-none cursor-pointer"
                      >
                         <option value="US" className="bg-main text-display">USA Cluster</option>
                         <option value="CA" className="bg-main text-display">Canada Zone</option>
                         <option value="UK" className="bg-main text-display">UK Protocol</option>
                         <option value="AU" className="bg-main text-display">Australia Node</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

                {/* Right Column: Allocation Summary */}
                <div className="w-full lg:w-[360px] bg-main border-l border-trim/30 p-6 flex flex-col relative overflow-hidden transition-colors">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <h3 className="text-base font-black text-display uppercase tracking-tighter italic font-serif mb-6 flex items-center justify-between">
                       Allocation Recap
                       <ShoppingCart className="w-3.5 h-3.5 text-display-muted opacity-20" />
                    </h3>

                    {/* Items Mini Strip */}
                    <div className="space-y-4 mb-8">
                       {cart.map(item => (
                          <div key={item.cartItemId} className="flex justify-between items-center group">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 bg-main-card rounded-lg overflow-hidden flex-shrink-0 border border-trim/30">
                                 {item.image_url ? (
                                   <img src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:5000${item.image_url}`} className="w-full h-full object-contain p-1" />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center text-display-muted opacity-20"><Package className="w-3 h-3" /></div>
                                 )}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-display uppercase truncate max-w-[120px] italic">{item.name}</span>
                                  <span className="text-[8px] font-bold text-display-muted uppercase tracking-widest opacity-60">Qty: {item.quantity}</span>
                               </div>
                            </div>
                            <span className="text-[11px] font-black text-display tracking-tight">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                         </div>
                       ))}
                    </div>

                    {/* Economic Adjustment (Coupon) */}
                    <div className="relative mb-6">
                       <input 
                          type="text" 
                          value={couponCode} 
                          onChange={(e) => { setCouponCode(e.target.value); setCouponStatus(null); }}
                          placeholder="AUTH-COUPON CODE"
                          className="w-full pl-4 pr-16 py-3 rounded-xl bg-main-card border border-trim focus:border-primary-500 outline-none font-black text-[9px] uppercase tracking-widest text-display placeholder:opacity-20 transition-all font-sans"
                       />
                       <button 
                          onClick={handleValidateCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-display text-main font-black rounded-lg hover:opacity-90 transition-all text-[8px] uppercase tracking-widest disabled:opacity-30"
                       >
                          Apply
                       </button>
                    </div>

                    {couponStatus?.valid && (
                      <div className="flex items-center gap-2.5 text-accent-emerald bg-accent-emerald/5 px-3 py-2.5 rounded-xl border border-accent-emerald/10 mb-6">
                         <Tag className="w-3.5 h-3.5" />
                         <span className="text-[9px] font-black uppercase tracking-widest">{couponStatus.discount_percentage}% Authorized</span>
                      </div>
                    )}

                    <div className="space-y-3">
                       <div className="flex justify-between text-[9px] font-black text-display-muted uppercase tracking-widest opacity-60">
                         <span>Subtotal</span>
                         <span className="text-display">${cartTotal}</span>
                       </div>
                       {couponStatus?.valid && (
                         <div className="flex justify-between text-[9px] font-black text-accent-emerald uppercase tracking-widest">
                            <span>Adjusted</span>
                            <span>-${(parseFloat(cartTotal) - parseFloat(discountedTotal)).toFixed(2)}</span>
                         </div>
                       )}
                       <div className="flex justify-between text-[9px] font-black text-display-muted uppercase tracking-widest opacity-60">
                         <span>Logistics</span>
                         <span className={shippingCost === 0 ? 'text-accent-emerald' : 'text-display'}>{shippingCost === 0 ? 'NOMINAL' : `$${shippingCost.toFixed(2)}`}</span>
                       </div>
                       <div className="flex justify-between text-[9px] font-black text-display-muted uppercase tracking-widest opacity-60">
                         <span>Surcharge</span>
                         <span className="text-display">${taxAmount.toFixed(2)}</span>
                       </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-trim mt-6">
                    <div className="flex justify-between items-end mb-4">
                       <div>
                          <p className="text-[8px] font-black text-display-muted uppercase tracking-widest mb-0.5 opacity-60">Net Settlement</p>
                          <p className="text-2xl font-black text-display tracking-tighter italic font-serif transition-colors">${grandTotal}</p>
                       </div>
                       <div className="h-8 w-8 bg-main-card border border-trim rounded-lg flex items-center justify-center transition-colors">
                          <ShieldCheck className="w-3.5 h-3.5 text-display opacity-20" />
                       </div>
                    </div>
                    
                    <button 
                       onClick={handleCheckout}
                       disabled={loading}
                       className="w-full py-4 bg-primary-500 text-white font-black rounded-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20 flex flex-col items-center justify-center group/btn active:scale-95 disabled:opacity-50"
                    >
                       <span className="uppercase tracking-widest text-[9px] mb-0.5">{loading ? 'Processing...' : 'Authorize Access'}</span>
                    </button>
                  </div>
                </div>
           </div>
        </div>
      )}      {/* Review Modal Redesign (Mini) */}
      {reviewModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[110] flex items-center justify-center p-6">
           <div className="bg-main w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500 border border-trim/30 transition-colors">
              <div className="p-8 text-center">
                 <div className="w-24 h-24 bg-main-card rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-trim relative group shadow-sm transition-colors">
                    {selectedProduct.image_url ? (
                       <img src={selectedProduct.image_url.startsWith('http') ? selectedProduct.image_url : `http://localhost:5000${selectedProduct.image_url}`} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                       <MessageSquare className="w-8 h-8 text-display-muted opacity-20" />
                    )}
                 </div>
                 <h3 className="text-2xl font-black text-display uppercase italic font-serif tracking-tight mb-2 transition-colors">Feedback Loop</h3>
                 <p className="text-display-muted text-[10px] font-black uppercase tracking-widest mb-10 opacity-60 transition-colors">Syncing experience for {selectedProduct.name}</p>
                 
                 <form onSubmit={submitReview} className="space-y-8">
                    <div className="flex justify-center gap-2">
                       {[1, 2, 3, 4, 5].map((star) => (
                         <button
                           key={star}
                           type="button"
                           onClick={() => setReviewData({ ...reviewData, rating: star })}
                           className={`p-3 rounded-2xl transition-all ${reviewData.rating >= star ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-main-card text-display-muted opacity-30 hover:opacity-100 border border-trim shadow-sm'}`}
                         >
                           <Star className={`w-6 h-6 ${reviewData.rating >= star ? 'fill-current' : ''}`} />
                         </button>
                       ))}
                    </div>
                    
                    <textarea 
                       placeholder="DESCRIBE THE ACOUSTICS OF YOUR EXPERIENCE..."
                       value={reviewData.comment}
                       onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                       className="w-full px-8 py-6 rounded-[32px] bg-main-card border border-trim focus:bg-main focus:border-primary-500 outline-none transition-all font-bold text-display min-h-[160px] text-[10px] uppercase tracking-widest placeholder:italic placeholder:opacity-20 transition-colors"
                    />

                    <div className="flex gap-4">
                       <button 
                          type="button" 
                          onClick={() => setReviewModalOpen(false)}
                          className="flex-1 py-5 bg-main-card text-display-muted font-black rounded-[24px] border border-trim hover:opacity-80 transition-all uppercase tracking-widest text-[9px]"
                       >
                          Abort
                       </button>
                       <button 
                          type="submit"
                          className="flex-[2] py-5 bg-display text-main font-black rounded-[24px] hover:opacity-90 transition-all shadow-xl uppercase tracking-widest text-[9px]"
                       >
                          Broadcast Review
                       </button>
                    </div>
                  </form>
               </div>
            </div>
        </div>
      )}
      
      {/* Background Overlay for Sidebar */}
      {cartOpen && (
        <div 
          onClick={() => setCartOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 transition-opacity"
        />
      )}
    </div>
  );
};

export default TenantUserDashboard;
