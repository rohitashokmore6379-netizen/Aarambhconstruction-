import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowRight, ShieldCheck, Award, HardHat, CheckCircle2, ChevronRight, Phone, Clock, MapPin, Mail, MessageSquare } from 'lucide-react';
import api from '../../services/api.ts';

export function HomePage() {
  const [featuredProjects, setFeaturedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await api.get('/public/projects');
        if (res.data.success) {
          setFeaturedProjects(res.data.data.slice(0, 4));
        }
      } catch (err) {
        console.error('Failed to load public projects', err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[640px] flex items-center justify-center bg-slate-950 overflow-hidden border-b border-slate-800">
        {/* Background Image with Dark Contrast Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1920&q=80"
            alt="Arambh Construction Engineering"
            className="w-full h-full object-cover object-center opacity-20 filter grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
          {/* Prominent Official Emblem */}
          <div className="mb-6 p-2 rounded-2xl bg-black/80 border border-slate-800 shadow-2xl shadow-amber-500/10 hover:border-amber-500/40 transition-all">
            <img
              src="/logo.jpg"
              alt="|| आरंभ || कन्स्ट्रक्शन - इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर"
              referrerPolicy="no-referrer"
              className="h-20 sm:h-28 w-auto object-contain rounded-xl"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wider uppercase mb-6">
            <HardHat className="w-4 h-4" /> Civil Engineer & Government Contractor (Maharashtra)
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            ARAMBH CONSTRUCTION <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
              इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर
            </span>
          </h1>

          <div className="mt-4 text-base sm:text-xl font-bold text-amber-300 font-serif">
            Er. Sudarshan Bajrang Naik
          </div>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Leading government infrastructure contracts (PWD, Zilla Parishad), rural road networks, RCC water reservoirs, and premium residential & commercial projects across Shengaon, Bhudargad, and Kolhapur.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Shengaon, Bhudargad, Kolhapur - 416209</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>+91 7796853434</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>arambhconstruction9977@gmail.com</span>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
            <Link
              to="/projects"
              className="w-full sm:w-auto flex-1 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <span>Explore Projects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/917796853434?text=Hello%20Er.%20Sudarshan%20Naik,%20I%20would%20like%20to%20consult%20regarding%20construction%20work."
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex-1 px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-28 relative z-20">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">35+</div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">Government & Civil Works</div>
            <p className="text-[11px] text-slate-400 mt-1">PWD roads, culverts & grampanchayat halls</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">100%</div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">PWD Compliance</div>
            <p className="text-[11px] text-slate-400 mt-1">Rigid adherence to govt technical specifications</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">15+</div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">Villages Served</div>
            <p className="text-[11px] text-slate-400 mt-1">Bhudargad and surrounding Kolhapur talukas</p>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight">Grade-A</div>
            <div className="text-xs font-bold text-white uppercase tracking-wider mt-1">Engineering Precision</div>
            <p className="text-[11px] text-slate-400 mt-1">Certified quality testing & licensed supervision</p>
          </div>
        </div>
      </section>

      {/* Featured Projects Portfolio */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              Ongoing & Showcase Landmarks
            </div>
            <h2 className="text-3xl font-extrabold text-white">Active Civil & Government Contracts</h2>
          </div>
          <Link
            to="/projects"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5"
          >
            <span>View All Projects</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuredProjects.map((p) => (
            <div
              key={p._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all group flex flex-col shadow-xl"
            >
              <div className="relative h-64 overflow-hidden bg-slate-950">
                <img
                  src={p.publicImages?.[0] || 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1200&q=80'}
                  alt={p.projectName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-xs font-bold text-amber-400">
                  {p.projectType}
                </div>
                <div className="absolute top-4 right-4 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700 text-xs font-mono font-bold text-white">
                  {p.publicProgress}% Complete
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                    {p.projectName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{p.location}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1">
                      <span>Milestone: {p.publicStatus || 'In Progress'}</span>
                      <span className="font-bold text-white">{p.publicProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${p.publicProgress}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    to={`/projects/${p._id}`}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Project Specs & Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Engineering Disciplines */}
      <section className="bg-slate-900/60 border-y border-slate-800/80 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              Capabilities & Contracting
            </div>
            <h2 className="text-3xl font-extrabold text-white">Engineering Disciplines & Services</h2>
            <p className="text-xs text-slate-400 mt-2">
              Supervised on-site by Er. Sudarshan Bajrang Naik with high-grade equipment and verified testing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Government Infrastructure (PWD & ZP)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Asphalt and concrete roadways, RCC box culverts, retaining walls, grampanchayat halls, and drinking water reservoirs under state schemes.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Strict PWD Quality Compliance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Cube Strength Lab Certifications</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Commercial Showrooms & Plazas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Commercial market retail shops, multi-level showroom frameworks, heavy foundations, and commercial frontage across Bhudargad.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>Heavy RCC Column Sizing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>Turnkey Architectural Execution</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Modern Country Bungalows</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Architect-designed 3BHK and 4BHK independent bungalows, modern elevations, landscape integration, and premium interior finishings.
              </p>
              <ul className="text-xs text-slate-300 space-y-2 pt-2 border-t border-slate-800">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Custom Floor Planning & 3D Elevations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>High-Grade Waterproof Plastering</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Contact Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 p-8 sm:p-14 text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl space-y-2">
            <div className="text-xs font-black uppercase tracking-widest bg-slate-950 text-amber-400 px-3 py-1 rounded-md inline-block">
              Direct Engineer Consultation
            </div>
            <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight">
              Ready to construct your project with Er. Sudarshan Bajrang Naik?
            </h3>
            <p className="text-sm font-semibold text-slate-900">
              Head Office: At/Post Shengaon, Tal: Bhudargad, District: Kolhapur, PIN 416209.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="tel:+917796853434"
              className="px-6 py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-sm rounded-xl transition-all shadow-xl shadow-slate-950/30 flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span>Call +91 7796853434</span>
            </a>
            <Link
              to="/contact"
              className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-sm rounded-xl transition-all shadow-md"
            >
              Submit Tender / Inquiry
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
