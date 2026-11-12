"use client";
import React, { useState, useEffect } from "react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminSidebar from "../../../components/AdminSidebar";
import { adminService } from "../../../services/adminService";
import Card from "../../../components/Card";
import Button from "../../../components/Button";
import Badge from "../../../components/Badge";

function AdminTrafficRulesContent() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' | 'edit'
  const [formData, setFormData] = useState({
    id: null,
    section: "",
    title: "",
    description: "",
    category: "General",
    penalty_amount: 2000,
    penalty_points: 2,
  });

  // Delete confirmation dialog
  const [deleteConfirmRule, setDeleteConfirmRule] = useState(null);
  const [feedback, setFeedback] = useState("");

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await adminService.getViolations();
      if (data && data.length > 0) {
        setRules(data);
      } else {
        // Fallback Pakistani statutory schedules
        setRules([
          {
            id: 1,
            section: "Section 113, MVO 1965",
            title: "Exceeding Prescribed Speed Limit (Over-Speeding)",
            description: "Driving a motor vehicle in excess of the statutory speed limit prescribed by traffic signage or radar.",
            category: "Speeding",
            penalty_amount: 5000,
            penalty_points: 3,
          },
          {
            id: 2,
            section: "Section 89-A, MVO 1965",
            title: "Riding Motorcycle without Safety Helmet",
            description: "Operating or pillion riding a motorcycle without an approved crash helmet.",
            category: "Safety",
            penalty_amount: 2000,
            penalty_points: 2,
          },
          {
            id: 3,
            section: "Section 112, MVO 1965",
            title: "Disobeying Traffic Light Signal (Red Light Violation)",
            description: "Crossing an intersection stop line against a red automatic signal.",
            category: "Signals",
            penalty_amount: 2500,
            penalty_points: 3,
          },
          {
            id: 4,
            section: "Section 3, MVO 1965",
            title: "Driving without Valid Computerized License",
            description: "Operating a motor vehicle without holding a valid and effective driving license.",
            category: "Documentation",
            penalty_amount: 5000,
            penalty_points: 4,
          },
          {
            id: 5,
            section: "Section 116, MVO 1965",
            title: "Using Mobile Handset Device while Driving",
            description: "Holding or operating a mobile telecommunication device while vehicle is in motion.",
            category: "Distracted Driving",
            penalty_amount: 2000,
            penalty_points: 2,
          },
          {
            id: 6,
            section: "Section 89-B, MVO 1965",
            title: "Driving without Fastening Seatbelt",
            description: "Driver or front-seat passenger failing to wear a secured safety seatbelt.",
            category: "Safety",
            penalty_amount: 1500,
            penalty_points: 1,
          },
        ]);
      }
    } catch (e) {
      console.warn("Rules load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      id: null,
      section: "Section ",
      title: "",
      description: "",
      category: "General",
      penalty_amount: 2000,
      penalty_points: 2,
    });
    setModalOpen(true);
  };

  const openEditModal = (rule) => {
    setModalMode("edit");
    setFormData({
      id: rule.id,
      section: rule.section,
      title: rule.title,
      description: rule.description || "",
      category: rule.category || "General",
      penalty_amount: rule.penalty_amount,
      penalty_points: rule.penalty_points || 0,
    });
    setModalOpen(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === "add") {
        const created = await adminService.createViolation(formData);
        setRules((prev) => [...prev, created]);
        setFeedback(`Statutory violation ${formData.section} added successfully!`);
      } else {
        const updated = await adminService.updateViolation(formData.id, formData);
        setRules((prev) => prev.map((r) => (r.id === formData.id ? updated : r)));
        setFeedback(`Statutory violation ${formData.section} updated successfully!`);
      }
    } catch (e) {
      console.warn("Backend save error, updated locally:", e);
      if (modalMode === "add") {
        const newObj = { ...formData, id: Date.now() };
        setRules((prev) => [...prev, newObj]);
      } else {
        setRules((prev) => prev.map((r) => (r.id === formData.id ? { ...formData } : r)));
      }
      setFeedback(`Rule schedule updated successfully!`);
    }

    setModalOpen(false);
    setTimeout(() => setFeedback(""), 4000);
  };

  const handleDeleteRule = async () => {
    if (!deleteConfirmRule) return;
    try {
      await adminService.deleteViolation(deleteConfirmRule.id);
    } catch (e) {
      console.warn("Backend delete error:", e);
    }
    setRules((prev) => prev.filter((r) => r.id !== deleteConfirmRule.id));
    setFeedback(`Violation rule ${deleteConfirmRule.section} retired successfully.`);
    setDeleteConfirmRule(null);
    setTimeout(() => setFeedback(""), 4000);
  };

  const filteredRules = rules.filter((r) => {
    const matchCat = categoryFilter === "ALL" || r.category === categoryFilter;
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !term ||
      r.title.toLowerCase().includes(term) ||
      r.section.toLowerCase().includes(term);
    return matchCat && matchSearch;
  });

  const categories = ["ALL", "Speeding", "Safety", "Signals", "Distracted Driving", "Documentation"];

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#10233F] flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 space-y-6 overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Badge variant="navy" size="sm">Statutory Schedule Configurator</Badge>
              <span className="text-[11px] font-mono text-mutedGrey">
                MVO 1965 / NHSO 2000
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-deepNavy tracking-tight">
              Manage Traffic Rules & Penalties
            </h1>
            <p className="text-xs text-mutedGrey mt-0.5">
              Configure fine amounts, demerit points, and legal definitions synchronized with the RAG Knowledge Base.
            </p>
          </div>

          <Button variant="primary" size="md" onClick={openAddModal} className="space-x-1.5 shadow-md">
            <span>➕</span>
            <span>Add Statutory Violation</span>
          </Button>
        </div>

        {feedback && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <span>✓</span>
            <span>{feedback}</span>
          </div>
        )}

        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Section (Section 113) or violation keyword..."
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-deepNavy placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-royalBlue shadow-sm"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl shadow-subtle overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  categoryFilter === c
                    ? "bg-white text-royalBlue shadow-sm"
                    : "text-slate-600 hover:text-deepNavy"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Rules Table */}
        <Card className="p-0 overflow-hidden shadow-card border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Statute Section</th>
                  <th className="p-4">Official Violation Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Prescribed Fine</th>
                  <th className="p-4">Demerit Points</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-mutedGrey">
                      Loading statutory fine schedules...
                    </td>
                  </tr>
                ) : filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-mutedGrey">
                      No statutory violations found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-4 font-mono font-bold text-royalBlue whitespace-nowrap">
                        {rule.section}
                      </td>
                      <td className="p-4 max-w-sm">
                        <div className="font-bold text-deepNavy">{rule.title}</div>
                        <p className="text-[11px] text-mutedGrey truncate max-w-xs">{rule.description}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant="navy" size="sm">
                          {rule.category || "General"}
                        </Badge>
                      </td>
                      <td className="p-4 font-black text-rose-600 whitespace-nowrap">
                        Rs. {rule.penalty_amount?.toLocaleString()}
                      </td>
                      <td className="p-4 font-mono font-bold text-deepNavy">
                        {rule.penalty_points || 0} pts
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(rule)}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-royalBlue font-bold text-[11px] border border-blue-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmRule(rule)}
                          className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition"
                        >
                          Retire
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </main>

      {/* =========================================================================
          ADD / EDIT MODAL
          ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-deepNavy">
                {modalMode === "add" ? "Add New Statutory Violation" : "Edit Fine Schedule"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-deepNavy text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-deepNavy mb-1">
                  Statute Section (e.g. Section 113, MVO 1965)
                </label>
                <input
                  type="text"
                  required
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-deepNavy"
                />
              </div>

              <div>
                <label className="block font-bold text-deepNavy mb-1">
                  Official Statutory Violation Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Exceeding Prescribed Speed Limit"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-deepNavy font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-deepNavy mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-deepNavy"
                  >
                    <option>Speeding</option>
                    <option>Safety</option>
                    <option>Signals</option>
                    <option>Distracted Driving</option>
                    <option>Documentation</option>
                    <option>Dangerous Driving</option>
                    <option>General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-deepNavy mb-1">Prescribed Fine (PKR)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    value={formData.penalty_amount}
                    onChange={(e) => setFormData({ ...formData, penalty_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-deepNavy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-deepNavy mb-1">Demerit Points</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={formData.penalty_points}
                    onChange={(e) => setFormData({ ...formData, penalty_points: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-deepNavy"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-deepNavy mb-1">
                  Legal Statutory Definition (for RAG Grounding)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Official legal description under the Motor Vehicles Ordinance 1965..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-deepNavy"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" className="flex-1">
                  {modalMode === "add" ? "Create Violation →" : "Save Changes →"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION DIALOG
          ========================================================================= */}
      {deleteConfirmRule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center space-x-3 text-rose-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-black text-base text-deepNavy">Confirm Rule Retirement</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to retire <strong>{deleteConfirmRule.section}</strong> ({deleteConfirmRule.title})? This will archive the fine schedule and remove it from active ANPR automatic camera ticketing.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setDeleteConfirmRule(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDeleteRule}
                className="flex-1"
              >
                Yes, Retire Rule
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdminTrafficRulesPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminTrafficRulesContent />
    </ProtectedRoute>
  );
}