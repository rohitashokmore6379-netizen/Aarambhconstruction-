import React from 'react';
import { Building2, ShieldCheck, Award, HardHat, CheckCircle2, Users, Compass, Phone, Mail, MapPin } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <HardHat className="w-3.5 h-3.5" /> PWD & Zilla Parishad Government Contractor
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
          ARAMBH CONSTRUCTION
        </h1>
        <p className="text-amber-400 font-serif text-lg font-bold">
          || आरंभ || कन्स्ट्रक्शन - इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर
        </p>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
          Led by Er. Sudarshan Bajrang Naik, Arambh Construction is a dedicated civil engineering and government contracting enterprise headquartered in Shengaon, Bhudargad, Kolhapur. We execute high-standard public works, asphalt roadways, water distribution schemes, and bespoke residential architecture.
        </p>
      </div>

      {/* Leadership Profile */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-10 items-center shadow-2xl">
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 h-80 flex items-center justify-center p-4">
          <img
            src="/logo.jpg"
            alt="Er. Sudarshan Bajrang Naik - Arambh Construction"
            referrerPolicy="no-referrer"
            className="max-h-full max-w-full object-contain rounded-xl"
          />
          <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Proprietor & Chief Engineer</span>
            <span className="text-sm font-bold text-white">Er. Sudarshan Bajrang Naik</span>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4 text-sm text-slate-300 leading-relaxed">
          <div className="inline-block px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            Engineer Profile & Vision
          </div>
          <h3 className="text-2xl font-bold text-white">Message from Er. Sudarshan Bajrang Naik</h3>
          <p>
            "At Arambh Construction, our civil engineering philosophy is anchored in structural durability and honest execution. Whether we are constructing public works roads for the PWD or building someone’s dream home in Shengaon, we employ certified concrete mixes, rigorous steel reinforcement calculations, and strict timeline adherence."
          </p>
          <p>
            "Operating from Bhudargad taluka, we understand the local geological strata, rainfall patterns, and construction material requirements of Kolhapur district intimately. Our digital ERP system tracks every cubic meter of concrete, raw material invoice, and worker wage transparently."
          </p>

          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>+91 7796853434</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">arambhconstruction9977@gmail.com</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Shengaon, Bhudargad, Kolhapur</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-bold text-white">Government Quality Norms</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Adherence to Maharashtra PWD Red Book and Indian Standard specifications (IS 456, IS 1786) for all RCC casting, box culverts, and asphalt paving.
          </p>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-bold text-white">Scientific Leveling & Layout</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Auto-level instruments and laser measurement for slope drainage, road gradient alignment, and column centerline verification.
          </p>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-bold text-white">Skilled Local Workforce</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Direct coordination with experienced local mistris, shuttering masters, and bar benders with timely, transparent wage disbursements.
          </p>
        </div>
      </div>
    </div>
  );
}
