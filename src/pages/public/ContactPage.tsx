import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, AlertCircle, Building2, MessageSquare } from 'lucide-react';
import api from '../../services/api.ts';

export function ContactPage() {
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Name and Phone number are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/public/inquiry', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: message.trim(),
      });

      if (res.data.success) {
        setSuccess(true);
        setName('');
        setPhone('');
        setEmail('');
        setMessage('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit consultation request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
          Direct Civil Engineering & Government Contracting
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white">Consultation & Estimates</h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          Contact Er. Sudarshan Bajrang Naik for government tenders, PWD asphalt roads, commercial structures, or residential planning across Shengaon, Bhudargad, and Kolhapur district.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Contact Info Cards */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <img
                src="/logo.jpg"
                alt="आरंभ कन्स्ट्रक्शन"
                referrerPolicy="no-referrer"
                className="h-14 w-auto object-contain rounded-lg border border-slate-800 bg-black"
              />
              <div>
                <h3 className="text-lg font-bold text-white">ARAMBH CONSTRUCTION</h3>
                <div className="text-xs text-amber-400 font-semibold">
                  इंजिनिअर ॲण्ड गव्हर्नमेंट कॉन्ट्रॅक्टर
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm">Head Office Address</strong>
                  <span className="text-slate-300">
                    At/Post Shengaon, Taluka: Bhudargad, District: Kolhapur, Maharashtra - PIN 416209
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm">Direct Contact Number</strong>
                  <a href="tel:+917796853434" className="text-amber-400 font-bold hover:underline text-sm">
                    +91 7796853434
                  </a>
                  <span className="text-slate-400 block mt-0.5">Er. Sudarshan Bajrang Naik (Civil Engineer)</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm">Official Email Address</strong>
                  <a href="mailto:arambhconstruction9977@gmail.com" className="text-amber-400 hover:underline">
                    arambhconstruction9977@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block text-sm">Operating Hours</strong>
                  <span>Monday - Saturday: 8:00 AM to 8:00 PM (Site inspections by appointment)</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <a
                href="tel:+917796853434"
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call +91 7796853434</span>
              </a>
              <a
                href="https://wa.me/917796853434?text=Hello%20Er.%20Sudarshan%20Naik,%20I%20would%20like%20to%20inquire%20about%20construction%20work."
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Directly</span>
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-2xl p-6 text-xs text-amber-300/90 space-y-2">
            <h4 className="font-bold text-amber-300 text-sm">Government Tenders & Drawing Review</h4>
            <p>
              For PWD / ZP tender documentation, structural drawings, or BOQ evaluation in Kolhapur district, please email plans to <strong>arambhconstruction9977@gmail.com</strong> or send via WhatsApp to <strong>+91 7796853434</strong>.
            </p>
          </div>
        </div>

        {/* Inquiry Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Send Site Inquiry / Message</h3>
            <p className="text-xs text-slate-400 mt-1">
              Directly routed to Er. Sudarshan Bajrang Naik.
            </p>
          </div>

          {success ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm space-y-3 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
              <h4 className="text-base font-bold text-white">Inquiry Received!</h4>
              <p className="text-xs text-slate-300">
                Thank you. Er. Sudarshan Naik will review your requirements and reach out to you directly at the earliest.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-400"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Project Scope / Location / Details</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe project type (e.g. residential bungalow in Gargoti, commercial arcade, RCC drainage, roadwork) or site area..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting Details...' : 'Submit Inquiry'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
