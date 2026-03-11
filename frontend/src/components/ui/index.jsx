import React from 'react';

export const Card = ({ children, className = "" }) => (
  <div className={`bg-main-card rounded-3xl border border-trim shadow-sm p-6 transition-colors duration-500 ${className}`}>
    {children}
  </div>
);

export const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "premium-button-primary",
    secondary: "premium-button-secondary",
    danger: "premium-button bg-accent-rose/10 text-accent-rose hover:bg-accent-rose hover:text-white border border-accent-rose/20",
    ghost: "premium-button text-slate-500 hover:bg-slate-100/50 hover:text-slate-900",
  };
  
  return (
    <button className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Badge = ({ children, variant = "neutral", className = "" }) => {
  const variants = {
    neutral: "bg-main text-display-muted border border-trim",
    success: "bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20",
    warning: "bg-accent-amber/10 text-accent-amber border border-accent-amber/20",
    error: "bg-accent-rose/10 text-accent-rose border border-accent-rose/20",
    primary: "bg-primary-500/10 text-primary-500 border border-primary-500/20",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Input = ({ label, icon: Icon, className = "", ...props }) => (
  <div className="space-y-1.5 transition-colors">
    {label && <label className="block text-[11px] font-black text-display-muted uppercase tracking-widest ml-1 opacity-60">{label}</label>}
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-display-muted group-focus-within:text-primary-500 transition-colors" />}
      <input 
        className={`w-full ${Icon ? 'pl-11' : 'px-5'} pr-5 py-3 rounded-2xl bg-main-card border border-trim focus:bg-main focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all font-semibold text-display placeholder:text-display-muted/20 ${className}`}
        {...props}
      />
    </div>
  </div>
);
