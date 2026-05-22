import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  CreditCard,
  PiggyBank,
  Database,
  Calendar,
  AlertCircle,
  Menu,
  X,
  Wallet
} from 'lucide-react';
import { useAcademyStore } from '../store/academyStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { closures, activeAdapter, changePersistenceAdapter } = useAcademyStore();

  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const todayClosure = closures.find((c) => c.fecha === todayDateStr);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: '/enroll', label: 'Inscribir Alumno', icon: <CreditCard className="w-5 h-5" /> },
    { path: '/courses', label: 'Gestión Cursos', icon: <BookOpen className="w-5 h-5" /> },
    { path: '/teachers', label: 'Gestión Profesores', icon: <Users className="w-5 h-5" /> },
    { path: '/students', label: 'Gestión Estudiantes', icon: <GraduationCap className="w-5 h-5" /> },
    { path: '/payments', label: 'Cobros', icon: <Wallet className="w-5 h-5" /> },
    { path: '/cash-register', label: 'Cierre de Caja', icon: <PiggyBank className="w-5 h-5" /> },
  ];

  const handleAdapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changePersistenceAdapter(e.target.value as 'localStorage' | 'supabase');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 text-slate-400 border-r border-slate-800 shrink-0">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800 bg-slate-950">
          <div className="p-2 rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-500/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-white tracking-tight leading-none uppercase">Academia</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Control Panel</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Database Switcher in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex flex-col gap-2 p-3 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Database className="w-4 h-4 text-brand-500" />
              <span>Base de Datos</span>
            </div>
            <select
              value={activeAdapter}
              onChange={handleAdapterChange}
              className="w-full text-xs font-semibold px-2 py-1.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg focus:outline-hidden focus:border-brand-500 cursor-pointer"
            >
              <option value="localStorage">LocalStorage (Activo)</option>
              <option value="supabase">Supabase DB (Demo/Mock)</option>
            </select>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE HEADER & MENU */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white flex items-center justify-between px-6 py-4 shadow-md no-print">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-brand-500" />
          <span className="font-extrabold text-sm uppercase tracking-tight">Academia</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs no-print" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute top-16 left-0 right-0 bg-slate-900 text-slate-300 p-6 flex flex-col gap-4 shadow-xl border-t border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-tight cursor-pointer ${
                    isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-slate-850 pt-4 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Persistencia</span>
              <select
                value={activeAdapter}
                onChange={handleAdapterChange}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg focus:outline-hidden"
              >
                <option value="localStorage">LocalStorage</option>
                <option value="supabase">Supabase DB (Futuro)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden mt-16 lg:mt-0">
        {/* Upper Header (Status Panel) */}
        <header className="hidden sm:flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100 shrink-0 no-print">
          {/* Active Cash Register Status */}
          <div className="flex items-center gap-3">
            {todayClosure ? (
              todayClosure.cerrado ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-bold text-slate-500">Caja Cerrada Hoy</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700 tracking-tight">
                    Caja Activa (Efectivo: ${todayClosure.totalEfectivo.toLocaleString()} | Transf: ${todayClosure.totalTransferencia.toLocaleString()})
                  </span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100">
                <AlertCircle className="w-4 h-4 text-amber-500 animate-bounce" />
                <span className="text-xs font-bold text-amber-700">Inicializando Caja...</span>
              </div>
            )}
          </div>

          {/* Current Date in Header */}
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span className="capitalize">{format(new Date(), "eeee, d 'de' MMMM", { locale: es })}</span>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <section className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
