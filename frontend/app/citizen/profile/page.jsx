"use client";
import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage, SUPPORTED_LANGUAGES } from "../../../context/LanguageContext";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Card from "../../../components/Card";
import Button from "../../../components/Button";
import Badge from "../../../components/Badge";
import Input from "../../../components/Input";

function CitizenProfileContent() {
  const { user, openLogoutDialog } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <Badge variant="navy" className="mb-2 bg-deepNavy text-sky-300">
          Citizen Credentials
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-deepNavy tracking-tight">
          Driver Profile & Language Dialect
        </h1>
        <p className="text-xs text-mutedGrey mt-1">
          Manage your verified driving identity, vehicle linkage, and regional voice preferences.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-semibold mb-6 text-center flex items-center justify-center space-x-2">
            <span>✓</span>
            <span>Profile and voice language preferences updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Legal Name"
            defaultValue={user?.full_name || "Muhammad Yaseen"}
          />

          <div>
            <label className="block text-xs font-bold text-deepNavy mb-1.5">
              Mobile Number (2FA Verified)
            </label>
            <div className="relative">
              <input
                type="text"
                disabled
                defaultValue={`+92 ${user?.phone_number || "03009876543"}`}
                className="w-full bg-slate-100 border border-slate-300 text-slate-500 font-mono text-xs sm:text-sm py-2.5 px-3.5 rounded-xl cursor-not-allowed"
              />
              <span className="absolute right-3 top-2.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>
            <p className="text-[10px] text-mutedGrey mt-1">
              Mobile number can only be updated with official Excise & Taxation records.
            </p>
          </div>

          <Input
            label="Driving License Number"
            defaultValue={user?.driving_license_no || "ICT-DL-2019-88392"}
            helperText="Used to compute demerit points across motorway checks"
          />

          <Input
            label="Primary Vehicle Registration"
            defaultValue="ICT-LE-402"
            helperText="Automatically syncs Safe City electronic citations"
          />

          <div>
            <label className="block text-xs font-bold text-deepNavy mb-1.5">
              Preferred Voice Assistant Dialect
            </label>
            <select
              value={language}
              onChange={(e) => changeLanguage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-deepNavy font-medium py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-royalBlue/20 focus:border-royalBlue"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="md" className="w-full">
              Save Profile Preferences
            </Button>
          </div>
        </form>

        {/* Sign Out Card Button */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="font-bold text-xs text-deepNavy">Active Citizen Session</div>
            <p className="text-[11px] text-mutedGrey">Sign out of this browser device</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openLogoutDialog}
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            🚪 Log Out Session
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function CitizenProfilePage() {
  return (
    <ProtectedRoute requiredRole="citizen">
      <CitizenProfileContent />
    </ProtectedRoute>
  );
}
