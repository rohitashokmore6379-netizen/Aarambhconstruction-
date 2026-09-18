import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  HardHat,
  Banknote,
  Package,
  ShoppingCart,
  Boxes,
  Truck,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  PieChart,
  Bell,
  History,
  Settings,
  Search,
  Plus,
  LogOut,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import api from '../../services/api.ts';
import { GlobalSearchModal } from '../search/GlobalSearchModal.tsx';
import { ReceivePaymentModal } from '../payments/ReceivePaymentModal.tsx';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: any;
  highlight?: boolean;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut Cmd+K or Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await api.get('/admin/notifications');
      if (res.data.success) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // silent
    }
  };

  const navSections: NavSection[] = [
    {
      title: 'CORE MANAGEMENT',
      items: [
        { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Projects', path: '/admin/projects', icon: Building2 },
        { label: 'Sites & Plots', path: '/admin/sites', icon: MapPin },
      ],
    },
    {
      title: 'FINANCIAL LEDGERS',
      items: [
        { label: 'Unified Payments', path: '/admin/payments', icon: Receipt, highlight: true },
        { label: 'Site Owner Receipts', path: '/admin/client-payments', icon: CreditCard },
        { label: 'Direct Expenses', path: '/admin/expenses', icon: Banknote },
        { label: 'Financial Reports', path: '/admin/reports', icon: PieChart },
      ],
    },
    {
      title: 'LABOR & WORKFORCE',
      items: [
        { label: 'Workers Directory', path: '/admin/workers', icon: Users },
        { label: 'Daily Work Logs', path: '/admin/work-logs', icon: HardHat },
        { label: 'Worker Wage Payouts', path: '/admin/worker-payments', icon: Banknote },
      ],
    },
    {
      title: 'MATERIALS & VENDORS',
      items: [
        { label: 'Materials Catalog', path: '/admin/materials', icon: Package },
        { label: 'Procurement Purchases', path: '/admin/material-purchases', icon: ShoppingCart },
        { label: 'Inventory Audit', path: '/admin/inventory', icon: Boxes },
        { label: 'Vendors Directory', path: '/admin/vendors', icon: Truck },
        { label: 'Vendor Settlements', path: '/admin/vendor-payments', icon: CreditCard },
      ],
    },
    {
      title: 'SYSTEM & SECURITY',
      items: [
        { label: 'Audit Logs', path: '/admin/audit-logs', icon: History },
        { label: 'Notifications', path: '/admin/notifications', icon: Bell, badge: unreadCount },
        { label: 'Company Settings', path: '/admin/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-72 bg-slate-900 border-r border-slate-800/80 flex flex-col shrink-0 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <img
              src="/logo.jpg"
              alt="आरंभ कन्स्ट्रक्शन"
              referrerPolicy="no-referrer"
              className="h-10 w-auto object-contain rounded-lg border border-slate-800 bg-black shadow-sm"
            />
            <div>
              <div className="font-extrabold text-white text-sm tracking-wider flex items-center gap-1.5">
                <span>ARAMBH ERP</span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  PWD
                </span>
              </div>
              <div className="text-[10px] text-amber-400 font-semibold truncate max-w-[150px]">
                Er. Sudarshan Naik
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="p-4 border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => setPaymentModalOpen(true)}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 text-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            Receive Client Payment
          </button>
        </div>

        {/* Navigation items list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : item.highlight
                        ? 'text-amber-300 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-slate-950 text-amber-400' : 'bg-rose-500 text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</div>
              <div className="text-[10px] text-amber-400/80 font-mono truncate">Role: ADMIN</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 px-3.5 py-2 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 rounded-xl text-xs text-slate-400 w-52 sm:w-80 transition-colors text-left"
            >
              <Search className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Search projects, sites, receipts...</span>
              <kbd className="hidden sm:inline-block ml-auto text-[10px] font-mono bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* View Public Portal */}
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Client Showcase</span>
            </Link>

            {/* Notifications Bell */}
            <Link
              to="/admin/notifications"
              className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
              )}
            </Link>

            {/* Primary Action */}
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Record Receipt</span>
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-8 min-w-0">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Quick Receive Payment Modal */}
      <ReceivePaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          // Trigger refresh if on payments or dashboard
          window.dispatchEvent(new CustomEvent('arambh-payment-recorded'));
        }}
      />
    </div>
  );
}
