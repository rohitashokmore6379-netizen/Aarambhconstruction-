import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, MapPin, ArrowLeft, ShieldCheck, CheckCircle2, Phone, Mail, Clock, Send, AlertCircle } from 'lucide-react';
import api from '../../services/api.ts';

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeImage, setActiveImage] = useState<string>('');

  // Inquiry Form
  const [inquiryName, setInquiryName] = useState<string>('');
  const [inquiryPhone, setInquiryPhone] = useState<string>('');
  const [inquiryEmail, setInquiryEmail] = useState<string>('');
  const [inquiryMessage, setInquiryMessage] = useState<string>('');
  const [submittingInquiry, setSubmittingInquiry] = useState<boolean>(false);
  const [inquirySuccess, setInquirySuccess] = useState<boolean>(false);
  const [inquiryError, setInquiryError] = useState<string>('');

  useEffect(() => {
    async function loadProject() {
      try {
        const res = await api.get(`/public/projects/${id}`);
        if (res.data.success) {
          setProject(res.data.data);
          if (res.data.data.publicImages?.length > 0) {
            setActiveImage(res.data.data.publicImages[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load project', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProject();
  }, [id]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName || !inquiryPhone) {
      setInquiryError('Name and Phone number are required.');
      return;
    }

    setSubmittingInquiry(true);
    setInquiryError('');

    try {
      const res = await api.post('/public/inquiry', {
        name: inquiryName,
        phone: inquiryPhone,
        email: inquiryEmail,
        message: inquiryMessage,
        projectId: id,
      });

      if (res.data.success) {
        setInquirySuccess(true);
        setInquiryName('');
        setInquiryPhone('');
        setInquiryEmail('');
        setInquiryMessage('');
      }
    } catch (err: any) {
      setInquiryError(err.response?.data?.message || 'Failed to submit inquiry.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-slate-400">
        Loading project blueprint and site specifications...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Project Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">The requested landmark project is either private or unavailable.</p>
        <Link to="/projects" className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl">
          Back to Portfolio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Back button */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Showcase Projects</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {project.projectType}
            </span>
            <span className="text-xs text-slate-400">Site Status: {project.publicStatus}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">{project.projectName}</h1>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
            <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{project.location}</span>
          </div>
        </div>

        <div className="w-full md:w-72 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
            <span>Milestone Construction</span>
            <span className="text-amber-400 font-mono font-bold">{project.publicProgress}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${project.publicProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-right">Audited by Arambh Senior Engineer</p>
        </div>
      </div>

      {/* Media & Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left 2 Cols: Images & Engineering Notes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Showcase Image */}
          <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 h-96 sm:h-[480px]">
            <img
              src={activeImage || 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?auto=format&fit=crop&w=1200&q=80'}
              alt={project.projectName}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails */}
          {project.publicImages && project.publicImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {project.publicImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-24 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImage === img ? 'border-amber-400 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Project Overview */}
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider text-xs text-amber-400">
              Architectural & Structural Specifications
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {project.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Fe550 High-Yield TMT Steel Reinforcements</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>M25 / M30 Ready-Mix Concrete Specifications</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Anti-Termite Soil Chemical Treatment Done</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Polymer Waterproofing Membrane on Slabs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Inquiry & Site Visit Form */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                Site Inspection Request
              </div>
              <h3 className="text-lg font-bold text-white">Inquire About This Project</h3>
              <p className="text-xs text-slate-400 mt-1">
                Schedule a personal consultation or request civil blueprints with Arambh Construction engineering office.
              </p>
            </div>

            {inquirySuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Inquiry Dispatched Successfully
                </div>
                <p>Our site management team will contact you within 24 business hours.</p>
                <button
                  onClick={() => setInquirySuccess(false)}
                  className="text-amber-400 underline pt-1 font-semibold"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3.5 text-xs">
                {inquiryError && (
                  <div className="p-2.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{inquiryError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    placeholder="e.g. Rajesh Patil"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    placeholder="rajesh@example.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Remarks / Query</label>
                  <textarea
                    rows={3}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="I am interested in scheduling a site walkthrough..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingInquiry ? 'Dispatching...' : 'Submit Site Inquiry'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Direct Assistance Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 space-y-3">
            <h4 className="font-bold text-white">Direct Engineering Helpline</h4>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <a href="tel:+917796853434" className="hover:text-amber-300 font-bold">
                +91 7796853434 (Er. Sudarshan Bajrang Naik)
              </a>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <a href="mailto:arambhconstruction9977@gmail.com" className="hover:text-amber-300">
                arambhconstruction9977@gmail.com
              </a>
            </div>
            <div className="text-[11px] text-amber-400/90 pt-1">
              At/Post Shengaon, Tal: Bhudargad, Kolhapur
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
