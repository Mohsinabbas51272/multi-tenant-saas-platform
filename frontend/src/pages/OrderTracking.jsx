import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Package, CheckCircle, Clock, Truck, ArrowLeft, 
  Loader2, Hash, Calendar, AlertCircle, ShieldCheck
} from 'lucide-react';

const OrderTracking = () => {
  const { id } = useParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, [id]);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/orders/${id}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch tracking history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'processing': return <Package className="w-5 h-5" />;
      case 'shipped': return <Truck className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'cancelled': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-orange-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-primary-500 text-white';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <Loader2 className="animate-spin w-12 h-12 text-primary-600 mb-4" />
      <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Retrieving Shipment Log...</p>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-slate-400 hover:text-slate-900 transition-colors mb-10 font-black uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Hash className="w-4 h-4 text-primary-600" />
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Tracking Order</h1>
              </div>
              <p className="text-slate-500 font-medium font-mono text-sm">ID: {id}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</span>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(history[0]?.status || 'pending')}`}>
                {history[0]?.status || 'pending'}
              </div>
            </div>
          </div>

          <div className="p-10">
            <div className="relative">
              {/* Vertical line connecting events */}
              <div className="absolute left-6 top-10 bottom-10 w-[2px] bg-slate-100" />

              <div className="space-y-12">
                {history.map((event, idx) => (
                  <div key={event.id} className="relative flex items-start space-x-8">
                    <div className={`relative z-10 w-12 h-12 rounded-[20px] flex items-center justify-center shadow-lg transition-transform hover:scale-110 duration-300 ${idx === 0 ? getStatusColor(event.status) : 'bg-white text-slate-300 border-2 border-slate-100'}`}>
                      {getStatusIcon(event.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none">{event.status}</h3>
                        <div className="flex items-center space-x-1.5 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{new Date(event.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-slate-500 font-medium text-sm italic">"{event.comment || 'No additional details provided.'}"</p>
                    </div>
                  </div>
                ))}

                {history.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No history found for this order.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-3 text-slate-400">
            <ShieldCheck className="w-5 h-5 opacity-30" />
            <p className="text-[10px] font-black uppercase tracking-widest italic">Encrypted tracking log provided by Multi-Tenant Trust Services</p>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
