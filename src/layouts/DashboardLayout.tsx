import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  Users,
  GraduationCap,
  UserPlus,
  PiggyBank,
  Calendar,
  AlertCircle,
  Menu,
  X,
  Banknote,
  User,
  Settings
} from 'lucide-react';
import { useAcademyStore } from '../store/academyStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { closures} = useAcademyStore();

  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const todayClosure = closures.find((c) => c.fecha === todayDateStr);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    { path: '/enroll', label: 'Inscribir Alumno', icon: <UserPlus className="w-5 h-5 shrink-0" /> },
    { path: '/courses', label: 'Gestión Cursos', icon: <Files className="w-5 h-5 shrink-0" /> },
    { path: '/teachers', label: 'Gestión Profesores', icon: <Users className="w-5 h-5 shrink-0" /> },
    { path: '/students', label: 'Gestión Estudiantes', icon: <GraduationCap className="w-5 h-5 shrink-0" /> },
    { path: '/payments', label: 'Cobros', icon: <Banknote className="w-5 h-5 shrink-0" /> },
    { path: '/cash-register', label: 'Cierre de Caja', icon: <PiggyBank className="w-5 h-5 shrink-0" /> },
    { path: '/settings', label: 'Configuración', icon: <Settings className="w-5 h-5 shrink-0" /> },
  ];

  // const handleAdapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   changePersistenceAdapter(e.target.value as 'localStorage' | 'supabase');
  // };

  return (
    <div className="flex h-screen bg-[#070e17] overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 h-[calc(100vh-2rem)] my-4 ml-4 shrink-0 relative overflow-hidden rounded-[32px] border border-white/5 shadow-2xl">
        {/* Background Landscape Image */}
        <div 
          className="absolute inset-0 bg-cover z-0" 
          style={{ 
            backgroundImage: "url('/src/assets/sidebar_bg.png')",
            backgroundPosition: 'center bottom'
          }}
        />
        {/* Deep blue semi-transparent backdrop overlay to match mock color palette */}
        <div className="absolute inset-0 bg-[#081225]/85 backdrop-blur-xs z-0" />
        
        {/* Sidebar Content Wrapper */}
        <div className="relative z-10 flex flex-col h-full p-6 justify-between select-none">
          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7c3aed] to-[#a855f7] text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-white tracking-widest leading-none uppercase">Academia</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Control Panel</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white/10 text-white border border-white/10 shadow-inner'
                        : 'text-slate-300/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile Card in Sidebar Footer */}
          <div className="pt-4 border-t border-white/5 mt-auto">
            <div className="flex items-center gap-3 p-3 bg-slate-950/40 rounded-2xl border border-white/5 backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-center text-slate-400 shrink-0">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate">Admin Central</span>
                <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mt-0.5 truncate">Campus Principal</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE HEADER & MENU */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a1224] border-b border-white/5 text-white flex items-center justify-between px-6 py-4 shadow-md no-print">
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

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col overflow-hidden mt-16 lg:mt-4 lg:my-4 lg:mr-4 lg:ml-2 lg:rounded-[32px] lg:h-[calc(100vh-2rem)] lg:bg-slate-50 lg:border lg:border-slate-200/80 lg:shadow-sm">
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
