"use client";
import React, { useState } from "react";
import { challanService } from "../services/challanService";

export default function ChallanCard({ challan, onPaymentSuccess }) {
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const isPending = challan.status === "PENDING";

  const handlePay = async () => {
    setPaying(true);
    setPayError("");
    try {
      const res = await challanService.pay(challan.id);
      if (onPaymentSuccess) {
        onPaymentSuccess(res);
      }
    } catch (err) {
      setPayError(err.message || "Payment settlement failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-card border border-slate-200/90 text-left hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs font-mono font-bold text-royalBlue uppercase tracking-wider block">
            {challan.vehicle_no}
          </span>
          <h3 className="text-sm font-bold text-deepNavy mt-0.5">
            {challan.violation?.title || "Traffic Violation"}
          </h3>
          <span className="inline-block text-[11px] font-medium text-mutedGrey bg-slate-100 px-2 py-0.5 rounded mt-1">
            {challan.violation?.section || "Motor Vehicles Ordinance 1965"}
          </span>
        </div>
        <div className="text-right">
          <span
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
              isPending
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {challan.status}
          </span>
          <div className="text-lg font-black text-deepNavy mt-1">
            Rs. {challan.amount?.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg mb-4 border border-slate-100">
        <div>
          <span className="text-mutedGrey block text-[10px]">Challan No:</span>
          <span className="font-mono font-medium text-deepNavy">{challan.challan_no}</span>
        </div>
        <div>
          <span className="text-mutedGrey block text-[10px]">Location:</span>
          <span className="font-medium text-deepNavy truncate block">{challan.location}</span>
        </div>
        <div>
          <span className="text-mutedGrey block text-[10px]">Issued Date:</span>
          <span>{challan.issued_at ? new Date(challan.issued_at).toLocaleDateString() : "N/A"}</span>
        </div>
        <div>
          <span className="text-mutedGrey block text-[10px]">Due Date:</span>
          <span className={isPending ? "text-red-600 font-bold" : "text-deepNavy"}>
            {challan.due_date ? new Date(challan.due_date).toLocaleDateString() : "N/A"}
          </span>
        </div>
      </div>

      {payError && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded mb-3">
          {payError}
        </div>
      )}

      {isPending ? (
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full bg-royalBlue hover:bg-brightBlue text-white font-semibold text-xs py-2.5 rounded-full shadow-sm transition flex items-center justify-center space-x-2"
        >
          {paying ? (
            <span>Processing 1Link Settlement...</span>
          ) : (
            <span>Settle Rs. {challan.amount?.toLocaleString()} via 1Link</span>
          )}
        </button>
      ) : (
        <div className="text-center text-xs font-bold text-emerald-700 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
          ✓ Paid Online (Ref: {challan.payment_transaction_id || "1LINK"})
        </div>
      )}
    </div>
  );
}
