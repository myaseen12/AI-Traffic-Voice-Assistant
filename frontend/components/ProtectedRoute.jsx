"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import Card from "./Card";
import Badge from "./Badge";

export default function ProtectedRoute({ children, requiredRole = "citizen" }) {
  const pathname = usePathname();
  const { user, loading, isAuthenticated } = useAuth();

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
        <div className="w-12 h-12 rounded-2xl bg-lightBlue border border-blue-200 text-royalBlue flex items-center justify-center text-2xl font-bold animate-pulse shadow-subtle mb-4">
          🛡️
        </div>
        <div className="w-6 h-6 border-2 border-royalBlue border-t-transparent rounded-full animate-spin mb-3"></div>
        <h3 className="text-sm font-extrabold text-deepNavy">
          Verifying Citizen Credentials...
        </h3>
        <p className="text-xs text-mutedGrey mt-1">
          Decrypting session token and checking permissions
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F7F9FC]">
        <Card className="max-w-md w-full p-8 text-center border-slate-200 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-3xl font-bold mb-4 shadow-subtle">
            🔒
          </div>

          <Badge variant="warning" className="mb-2">
            Authentication Required
          </Badge>

          <h2 className="text-xl font-black text-deepNavy tracking-tight mb-2">
            Citizen Portal Access Restricted
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
            This portal accesses confidential vehicle registration telemetry, driving license points, and private citation history. To protect citizen privacy, two-factor SMS authentication is required.
          </p>

          <div className="space-y-2.5">
            <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
              <Button variant="primary" size="lg" className="w-full">
                Verify Mobile with SMS OTP →
              </Button>
            </Link>

            <Link href="/">
              <Button variant="ghost" size="sm" className="w-full text-slate-500">
                ← Return to Public Homepage
              </Button>
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-mutedGrey">
            <span>Need immediate traffic laws info? </span>
            <Link href="/traffic-rules" className="text-royalBlue font-bold hover:underline">
              Browse Public Rules
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Role Restriction (e.g. citizen accessing admin route or vice-versa)
  const isAdminRole = ["admin", "super_admin", "traffic_officer"].includes(user?.role?.toLowerCase());
  if (requiredRole === "admin" && !isAdminRole) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-[#F7F9FC]">
        <Card className="max-w-md w-full p-8 text-center border-slate-200 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-3xl font-bold mb-4">
            ⛔
          </div>
          <Badge variant="error" className="mb-2">
            Elevated Privilege Required
          </Badge>
          <h2 className="text-xl font-black text-deepNavy mb-2">
            Officer Clearance Required
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            You are logged in as a citizen. Departmental management routes require official police authority clearance.
          </p>
          <Link href="/citizen/dashboard">
            <Button variant="primary" size="md" className="w-full">
              Go to Citizen Dashboard →
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // 4. Authorized Access
  return <>{children}</>;
}
