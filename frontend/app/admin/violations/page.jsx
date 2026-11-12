"use client";
import React from "react";

export default function AdminViolationsPage() {
  const violationsStats = [
    { violation: "Riding without Helmet", count: 480, penalty: 1000, revenue: 480000, percentage: 38 },
    { violation: "Jumping Traffic Red Signal", count: 320, penalty: 1000, revenue: 320000, percentage: 26 },
    { violation: "Over-Speeding", count: 210, penalty: 2000, revenue: 420000, percentage: 17 },
    { violation: "Illegal / No-Parking Zone", count: 140, penalty: 500, revenue: 70000, percentage: 11 },
    { violation: "Driving without Seatbelt", count: 90, penalty: 1000, revenue: 90000, percentage: 8 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Violations Analytics & Enforcement Breakdown</h1>
      <p className="text-xs text-slate-500 mb-8">Statistical trends of traffic infractions detected by RLVD and speed sensors.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Violation Frequency Ranking</h2>
          <div className="space-y-4">
            {violationsStats.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{item.violation}</span>
                  <span>{item.percentage}% ({item.count} cases)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">Automated Sensor Hotspots</h2>
            <p className="text-xs text-slate-500 mb-4">Intersections generating maximum RLVD and helmet sensor alerts:</p>
            <ul className="text-xs text-slate-700 space-y-2.5">
              <li className="flex justify-between p-2 rounded bg-slate-50">
                <span className="font-medium">1. Shivaji Nagar Junction Signal 4</span>
                <span className="font-bold text-rose-600">312 alerts</span>
              </li>
              <li className="flex justify-between p-2 rounded bg-slate-50">
                <span className="font-medium">2. Ring Road Outer Flyover Speed Cam</span>
                <span className="font-bold text-rose-600">224 alerts</span>
              </li>
              <li className="flex justify-between p-2 rounded bg-slate-50">
                <span className="font-medium">3. FC Road Multi-Lane Crossing</span>
                <span className="font-bold text-rose-600">188 alerts</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500">
            Sensor sync frequency: Real-time via MQTT WebSocket
          </div>
        </div>
      </div>
    </div>
  );
}
