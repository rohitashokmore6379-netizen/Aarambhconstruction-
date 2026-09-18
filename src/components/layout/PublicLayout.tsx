import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Mail, MapPin, ShieldCheck, Menu, X, Lock, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ArambhHeaderBrand } from '../common/ArambhLogo.tsx';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Projects Showcase', path: '/projects' },
    { label: 'About & Leadership', path: '/about' },
    { label: 'Consultation & Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Announcement / Accreditation Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 text-xs font-bold py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 text-amber-300 text-[10px] px-2 py-0.5 rounded font-black tracking-wider uppercase">
              PWD Govt Contractor
            </span>
            <span>इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर • Er. Sudarshan Bajrang Naik</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="tel:+917796853434" className="hover:underline flex items-center gap-1 font-extrabold">
              <Phone className="w-3 h-3" /> +91 7796853434
            </a>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline text-[11px] font-semibold">
              At/Post Shengaon, Tal: Bhudargad, Dist: Kolhapur - 416209
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <ArambhHeaderBrand />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-semibold tracking-wide transition-colors ${
                    isActive ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-1' : 'text-slate-300 hover:text-amber-300'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Quick Contact & Admin Portal Action */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://wa.me/917796853434?text=Hello%20Er.%20Sudarshan%20Naik,%20I%20would%20like%20to%20inquire%20about%20construction%20services."
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <Link
              to={isAuthenticated ? '/admin/dashboard' : '/admin/login'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 transition-all shadow-md shadow-amber-500/20"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isAuthenticated ? 'ERP Dashboard' : 'Admin ERP Portal'}</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-semibold text-slate-200 hover:text-amber-400"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <a
                href="tel:+917796853434"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-amber-400 font-bold text-xs"
              >
                <Phone className="w-4 h-4" />
                <span>Call +91 7796853434</span>
              </a>
              <Link
                to={isAuthenticated ? '/admin/dashboard' : '/admin/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                <Lock className="w-4 h-4" />
                <span>{isAuthenticated ? 'Enter ERP Dashboard' : 'Admin ERP Login'}</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 pt-16 pb-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="आरंभ कन्स्ट्रक्शन"
                referrerPolicy="no-referrer"
                className="h-12 w-auto object-contain rounded-lg border border-slate-800 bg-black"
              />
              <div>
                <div className="font-extrabold text-white text-base tracking-wider">
                  ARAMBH CONSTRUCTION
                </div>
                <div className="text-[11px] text-amber-400 font-semibold">
                  इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर
                </div>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Specialized civil infrastructure, government PWD contracts, residential complexes, and turnkey structural engineering led by Er. Sudarshan Bajrang Naik.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Government Registered Class-A Civil Contractor</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5">
              <li><Link to="/" className="hover:text-amber-400 transition-colors">Corporate Home</Link></li>
              <li><Link to="/projects" className="hover:text-amber-400 transition-colors">Government & Private Projects</Link></li>
              <li><Link to="/about" className="hover:text-amber-400 transition-colors">Er. Sudarshan Naik & Profile</Link></li>
              <li><Link to="/contact" className="hover:text-amber-400 transition-colors">Direct Consultation & Estimates</Link></li>
            </ul>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-4">Engineering Capabilities</h4>
            <ul className="space-y-2.5">
              <li>PWD Asphalt Roads & RCC Box Culverts</li>
              <li>Grampanchayat Administrative Buildings</li>
              <li>Elevated RCC Water Reservoirs (ESR)</li>
              <li>Commercial Complexes & Market Yards</li>
              <li>Turnkey Luxury Residential Bungalows</li>
            </ul>
          </div>

          {/* Office Contact */}
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-4">Head Office & Contact</h4>
            <div className="text-slate-200 font-bold text-sm text-amber-400">
              Er. Sudarshan Bajrang Naik
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>At/Post Shengaon, Tal: Bhudargad, District: Kolhapur, Maharashtra - PIN 416209</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <a href="tel:+917796853434" className="hover:text-white transition-colors">
                +91 7796853434
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <a href="mailto:arambhconstruction9977@gmail.com" className="hover:text-white transition-colors">
                arambhconstruction9977@gmail.com
              </a>
            </div>
            <div className="pt-2">
              <Link
                to="/admin/login"
                className="text-[11px] text-amber-400/90 hover:text-amber-300 underline font-medium"
              >
                Authorized Personnel ERP Login →
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-12 border-t border-slate-800 text-center text-slate-500 text-[11px] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} ARAMBH CONSTRUCTION • Er. Sudarshan Bajrang Naik. All rights reserved.</div>
          <div>At/Post Shengaon, Tal: Bhudargad, Dist: Kolhapur 416209</div>
        </div>
      </footer>
    </div>
  );
}
