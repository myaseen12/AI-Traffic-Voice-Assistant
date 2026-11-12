"use client";
import React, { createContext, useContext, useState } from "react";

const ChallanContext = createContext(null);

export function ChallanProvider({ children }) {
  const [activeChallan, setActiveChallan] = useState(null);
  const [scannedQrCode, setScannedQrCode] = useState(null);
  const [verificationPending, setVerificationPending] = useState(false);

  const selectChallan = (challan) => {
    setActiveChallan(challan);
  };

  const clearChallan = () => {
    setActiveChallan(null);
    setScannedQrCode(null);
    setVerificationPending(false);
  };

  return (
    <ChallanContext.Provider
      value={{
        activeChallan,
        scannedQrCode,
        verificationPending,
        selectChallan,
        setScannedQrCode,
        setVerificationPending,
        clearChallan,
      }}
    >
      {children}
    </ChallanContext.Provider>
  );
}

export function useChallan() {
  const context = useContext(ChallanContext);
  if (!context) {
    throw new Error("useChallan must be used within a ChallanProvider");
  }
  return context;
}
