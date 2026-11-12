import { fetchApi } from "./api";

export const challanService = {
  // Search citations by vehicle plate or citation number
  search: (query) => fetchApi(`/challans/search?q=${encodeURIComponent(query)}`),

  // Retrieve authorized citation dossier
  getDetail: (challanNo) => fetchApi(`/challans/${encodeURIComponent(challanNo)}`),

  // Public/verified status check
  getStatus: (challanNo) => fetchApi(`/challans/${encodeURIComponent(challanNo)}/status`),

  // Citations belonging to the authenticated citizen
  getMyChallans: () => fetchApi("/challans/my-challans"),

  // Validate scanned QR token with expiration/revocation verification
  validateQr: (qrToken) =>
    fetchApi("/challans/qr/validate", {
      method: "POST",
      body: JSON.stringify({ qr_token: qrToken }),
    }),

  // Decode scanned QR text or barcode data
  decodeQr: (qrData) =>
    fetchApi("/challans/qr-decode", {
      method: "POST",
      body: JSON.stringify({ qr_data: qrData }),
    }),

  // Execute 1Link digital fine settlement
  pay: (challanId, paymentMethod = "1LINK_DIGITAL") =>
    fetchApi(`/challans/${challanId}/pay`, {
      method: "POST",
      body: JSON.stringify({ payment_method: paymentMethod }),
    }),

  // Upload photo/evidence for OCR scanning
  scanDocument: (formData) =>
    fetchApi("/challans/scan-ocr", {
      method: "POST",
      body: formData,
    }),

  // Retrieve statutory traffic rules with optional filters
  getTrafficRules: (category = "", search = "", language = "en") => {
    const params = new URLSearchParams();
    if (category && category !== "All") params.append("category", category);
    if (search) params.append("search", search);
    if (language) params.append("language", language);
    const qs = params.toString();
    return fetchApi(`/traffic-rules${qs ? `?${qs}` : ""}`);
  },

  // Classify query into VERIFIED, UNVERIFIED, or UNAVAILABLE
  classifyRuleQuery: (query = "", language = "en") =>
    fetchApi(
      `/traffic-rules/classify?q=${encodeURIComponent(query)}&language=${encodeURIComponent(language)}`
    ),
};
