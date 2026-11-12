"use client";
import React, { useState } from "react";
import Link from "next/link";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    challanId: "",
    category: "clarification",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState(null);

  const validate = () => {
    const newErrors = {};

    // Name
    if (!formData.name.trim()) {
      newErrors.name = "Full legal name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone (Pakistani format 03XX XXXXXXX or +923XXXXXXXXX)
    const phoneClean = formData.phone.replace(/[\s-]/g, "");
    const phoneRegex = /^((\+92)|(0092)|(03))(\d{9,10})$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile phone number is required";
    } else if (!phoneRegex.test(phoneClean)) {
      newErrors.phone = "Enter a valid Pakistani mobile number (e.g. 0300 1234567 or +92 300 1234567)";
    }

    // Message
    if (!formData.message.trim()) {
      newErrors.message = "Message details are required";
    } else if (formData.message.trim().length < 15) {
      newErrors.message = "Please provide more details (at least 15 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate API dispatch
    setTimeout(() => {
      const refCode = `PK-CIT-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedRef(refCode);
      setIsSubmitting(false);
    }, 800);
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      challanId: "",
      category: "clarification",
      message: "",
    });
    setErrors({});
    setSubmittedRef(null);
  };

  return (
    <div className="bg-[#F7F9FC] text-[#10233F] min-h-screen">
      
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-[#061D38] via-[#09254A] to-[#0A2B55] text-white py-14 sm:py-16 border-b border-[#0D3868] relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 text-xs text-sky-200/80 mb-3">
              <Link href="/" className="hover:text-white transition">Home</Link>
              <span>/</span>
              <span className="text-white font-semibold">Contact & Support</span>
            </div>

            <Badge variant="navy" className="mb-3 border border-sky-400/30 text-sky-300 bg-[#0E2F54]">
              Citizen Support Desk & Emergency Lines
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              Contact Us & <br />
              <span className="bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#1685F5] bg-clip-text text-transparent">
                Helplines Directory
              </span>
            </h1>

            <div className="flex items-center space-x-2 text-sky-200 font-bold text-sm sm:text-base mb-4">
              <span>Ask. Understand. Follow.</span>
              <span className="w-8 h-0.5 bg-sky-400 inline-block"></span>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              Need assistance with an electronic citation, technical guidance, or emergency road safety contact numbers? Reach out below.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Inquiry Form with Validation */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-deepNavy">
                    Submit Citizen Inquiry / Grievance
                  </h2>
                  <p className="text-xs text-mutedGrey mt-0.5">
                    Our civic support desk responds within 24 business hours.
                  </p>
                </div>
                <Badge variant="info" size="sm">
                  Online Desk
                </Badge>
              </div>

              {submittedRef ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-emerald-900">
                      Inquiry Successfully Submitted!
                    </h3>
                    <p className="text-xs text-emerald-700 mt-1">
                      Your tracking reference code is:
                    </p>
                    <div className="mt-2 inline-block bg-white border border-emerald-300 px-4 py-2 rounded-xl font-mono font-bold text-sm text-emerald-900 tracking-wider shadow-sm">
                      {submittedRef}
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed max-w-md mx-auto">
                    A confirmation SMS has been dispatched to {formData.phone}. You can cite this reference number if you visit the departmental adjudication office.
                  </p>
                  <Button variant="primary" size="sm" onClick={handleReset}>
                    Submit Another Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Full Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Legal Name"
                      placeholder="e.g. Muhammad Yaseen"
                      required
                      value={formData.name}
                      error={errors.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: null });
                      }}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="e.g. yaseen@example.com"
                      required
                      value={formData.email}
                      error={errors.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: null });
                      }}
                    />
                  </div>

                  {/* Phone & Vehicle/Challan ID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Mobile Phone (Pakistani +92)"
                      type="tel"
                      placeholder="0300 1234567"
                      required
                      value={formData.phone}
                      error={errors.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: null });
                      }}
                      helperText="Used for SMS tracking updates"
                    />
                    <Input
                      label="Challan No / Vehicle Plate"
                      placeholder="e.g. PK-2024-883921 or ICT-LE-1234"
                      value={formData.challanId}
                      onChange={(e) => setFormData({ ...formData, challanId: e.target.value })}
                      helperText="Optional reference identifier"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-deepNavy mb-1.5">
                      Inquiry Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-deepNavy font-medium py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-royalBlue/20 focus:border-royalBlue"
                    >
                      <option value="clarification">Citation Legal Clarification (Speeding, Signal, Helmet, etc.)</option>
                      <option value="dispute">Camera Plate Mismatch or Erroneous Ticket Dispute</option>
                      <option value="payment">1Link / Easypaisa Digital Payment Issue</option>
                      <option value="technical">Voice Assistant / Audio Playback Issue</option>
                      <option value="general">General Traffic Rules & Demerit Points Question</option>
                    </select>
                  </div>

                  {/* Message Details */}
                  <div>
                    <label className="block text-xs font-bold text-deepNavy mb-1.5">
                      Message / Grievance Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Please explain your question or citation situation in detail..."
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (errors.message) setErrors({ ...errors, message: null });
                      }}
                      className={`w-full bg-slate-50 border rounded-xl text-xs sm:text-sm text-deepNavy placeholder-slate-400 font-medium p-3.5 focus:outline-none focus:ring-2 focus:ring-royalBlue/20 focus:bg-white transition ${
                        errors.message ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-royalBlue"
                      }`}
                    ></textarea>
                    {errors.message && (
                      <p className="mt-1 text-[11px] text-red-600 font-medium">{errors.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isSubmitting}
                    className="w-full"
                  >
                    Send Citizen Inquiry →
                  </Button>
                </form>
              )}
            </Card>
          </div>

          {/* Right Column: Emergency Helplines & Office Addresses */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* National Emergency Numbers */}
            <div className="bg-[#061D38] text-white rounded-2xl p-6 sm:p-7 shadow-card border border-sky-500/20">
              <Badge variant="navy" className="mb-3 border border-sky-400/40 text-cyan-300 bg-[#0E2F54]">
                Official Helplines (24/7)
              </Badge>
              <h3 className="text-base sm:text-lg font-bold text-white mb-4">
                Emergency Traffic Police Lines
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div>
                    <div className="font-bold text-white">Islamabad Traffic Police (ITP)</div>
                    <div className="text-[11px] text-slate-400">Capital Territory Hotline & Info</div>
                  </div>
                  <a href="tel:1915" className="bg-royalBlue hover:bg-brightBlue px-3 py-1.5 rounded-lg text-white font-mono font-bold text-xs transition">
                    1915 / 15
                  </a>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div>
                    <div className="font-bold text-white">National Highways & Motorway (NHMP)</div>
                    <div className="text-[11px] text-slate-400">All Motorways & National Highways</div>
                  </div>
                  <a href="tel:130" className="bg-royalBlue hover:bg-brightBlue px-3 py-1.5 rounded-lg text-white font-mono font-bold text-xs transition">
                    130
                  </a>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                  <div>
                    <div className="font-bold text-white">Emergency Medical / Rescue</div>
                    <div className="text-[11px] text-slate-400">Accident Response & Ambulance</div>
                  </div>
                  <a href="tel:1122" className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg text-white font-mono font-bold text-xs transition">
                    1122
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white">Punjab Safe Cities Authority (PSCA)</div>
                    <div className="text-[11px] text-slate-400">Lahore e-Challan Citizen Inquiries</div>
                  </div>
                  <a href="tel:15" className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-white font-mono font-bold text-xs transition">
                    15 (Ext. 2)
                  </a>
                </div>
              </div>
            </div>

            {/* Departmental Physical Helpdesks */}
            <Card className="p-6">
              <h4 className="text-xs font-bold text-deepNavy uppercase tracking-wider mb-3">
                Key Adjudication Centers (Islamabad / Rawalpindi)
              </h4>
              <div className="space-y-3 text-xs text-slate-600">
                <div>
                  <div className="font-bold text-deepNavy">ITP Headquarters & Citizen Licensing Hall</div>
                  <div className="text-[11px] text-mutedGrey">Sector F-8/1, Islamabad, ICT</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Mon - Sat: 9:00 AM - 4:00 PM</div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="font-bold text-deepNavy">Safe City Command & Traffic Center</div>
                  <div className="text-[11px] text-mutedGrey">Sector H-11, Near Police Lines, Islamabad</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Automated Electronic Citations Division</div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="font-bold text-deepNavy">CTO Rawalpindi Traffic Office</div>
                  <div className="text-[11px] text-mutedGrey">Mall Road / Faizabad Interchange, Rawalpindi</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">Regional Verification Desk</div>
                </div>
              </div>
            </Card>

          </div>

        </div>
      </div>

    </div>
  );
}
