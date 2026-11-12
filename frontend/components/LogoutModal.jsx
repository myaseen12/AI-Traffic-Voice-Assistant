"use client";
import React from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";

export default function LogoutModal() {
  const { logoutModalOpen, closeLogoutDialog, logout } = useAuth();

  if (!logoutModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={closeLogoutDialog}
        className="fixed inset-0 bg-[#061D38]/80 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-200 z-10 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl font-bold mb-3 shadow-subtle">
          🚪
        </div>

        <h3 className="font-extrabold text-base text-deepNavy mb-1.5">
          Confirm Citizen Sign Out
        </h3>
        <p className="text-xs text-mutedGrey leading-relaxed mb-6">
          Are you sure you want to log out? Your active encrypted session token will be destroyed. You will need to verify via SMS OTP to access your driving citations again.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={closeLogoutDialog}
            className="w-full"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={logout}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white shadow-none"
          >
            Yes, Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
