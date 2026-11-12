"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { challanService } from "../../../services/challanService";
import ChallanCard from "../../../components/ChallanCard";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Badge from "../../../components/Badge";
import Button from "../../../components/Button";

function CitizenChallansContent() {
  const [challans, setChallans] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        let data = [];
        try {
          data = await challanService.getMyChallans();
        } catch (myErr) {
          data = await challanService.search("ICT-LE-402");
        }
        if (!data || data.length === 0) {
          data = await challanService.search("ICT-LE-402");
        }
        setChallans(data || []);
      } catch (e) {
        console.error("Could not load challans:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = challans.filter((c) => {
    if (filter === "PENDING") return c.status === "PENDING";
    if (filter === "PAID") return c.status === "PAID";
    return true;
  });

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <Badge variant="navy" className="mb-2 bg-deepNavy text-sky-300">
            Registered Vehicle Citations
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black text-deepNavy tracking-tight">
            My Vehicle Challans
          </h1>
          <p className="text-xs text-mutedGrey mt-1">
            Linked registration plate: <strong className="font-mono text-royalBlue font-bold">ICT-LE-402</strong>
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {["ALL", "PENDING", "PAID"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === tab
                  ? "bg-white text-royalBlue shadow-sm"
                  : "text-slate-500 hover:text-deepNavy"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <div className="w-6 h-6 border-2 border-royalBlue border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-xs text-mutedGrey font-medium">Loading citation records...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-card">
          <div className="text-3xl mb-2">🎉</div>
          <h3 className="font-bold text-deepNavy text-sm">No Citations in this Category</h3>
          <p className="text-xs text-mutedGrey mt-1 max-w-sm mx-auto">
            You do not have any {filter.toLowerCase()} citations for this vehicle registration.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((c) => (
            <ChallanCard
              key={c.id}
              challan={c}
              onPaymentSuccess={(updated) => {
                setChallans(
                  challans.map((item) =>
                    item.challan_no === updated.challan_no
                      ? { ...item, status: "PAID", payment_transaction_id: updated.transaction_id }
                      : item
                  )
                );
              }}
            />
          ))}
        </div>
      )}

      {/* Quick Voice Prompt Link */}
      <div className="bg-lightBlue border border-blue-200/90 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-extrabold text-sm text-deepNavy mb-1">
            Unsure about a citation or want to dispute a camera mistake?
          </h4>
          <p className="text-xs text-slate-700">
            Ask the AI Traffic Voice Assistant in Urdu, Pashto, or English for statutory contestation advice.
          </p>
        </div>
        <Link href="/assistant">
          <Button variant="primary" size="sm">
            🎙️ Ask Assistant Now
          </Button>
        </Link>
      </div>

    </div>
  );
}

export default function CitizenChallansPage() {
  return (
    <ProtectedRoute requiredRole="citizen">
      <CitizenChallansContent />
    </ProtectedRoute>
  );
}
