import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';

export interface TrafficRule {
  id: number;
  section: string;
  title: string;
  category: string;
  description: string;
  base_fine: number;
  demerit_points: number;
  legal_act: string;
}

export interface ChallanItem {
  id: number;
  challan_no: string;
  vehicle_no: string;
  vehicle_type: string;
  amount: number;
  late_fee: number;
  status: 'PENDING' | 'PAID' | 'DISPUTED' | 'CANCELLED' | 'OVERDUE';
  location: string;
  city: string;
  issued_at: string;
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  payment_transaction_id?: string;
  evidence_image_url?: string;
  rule?: TrafficRule;
  violation_title?: string;
  section?: string;
}

export interface QRValidationResult {
  status: 'valid' | 'invalid' | 'expired' | 'revoked';
  qr_token: string;
  scan_count: number;
  challan?: ChallanItem;
  message: string;
}

export interface CitizenDashboardStats {
  total_challans: number;
  pending_challans: number;
  paid_challans: number;
  pending_amount: number;
  total_paid_amount: number;
  registered_vehicles: string[];
}

export const challanService = {
  search: async (query: string): Promise<ChallanItem[]> => {
    const res = await apiClient.get<ChallanItem[]>(`${API_ENDPOINTS.CHALLANS.SEARCH}?q=${encodeURIComponent(query)}`);
    return res.data || [];
  },

  getMyChallans: async (): Promise<ChallanItem[]> => {
    const res = await apiClient.get<ChallanItem[]>(API_ENDPOINTS.CHALLANS.MY_CHALLANS);
    return res.data || [];
  },

  getStatus: async (challanNo: string): Promise<ChallanItem | null> => {
    const res = await apiClient.get<ChallanItem>(API_ENDPOINTS.CHALLANS.STATUS(challanNo));
    return res.data;
  },

  getDetail: async (challanNo: string): Promise<ChallanItem | null> => {
    const res = await apiClient.get<ChallanItem>(API_ENDPOINTS.CHALLANS.DETAIL(challanNo));
    return res.data;
  },

  validateQR: async (qrToken: string): Promise<QRValidationResult> => {
    const res = await apiClient.post<QRValidationResult>(API_ENDPOINTS.CHALLANS.QR_VALIDATE, {
      qr_token: qrToken.trim(),
    });
    if (res.error || !res.data) {
      return {
        status: 'invalid',
        qr_token: qrToken,
        scan_count: 0,
        message: res.error || 'Invalid or unverified QR code',
      };
    }
    return res.data;
  },

  payChallan: async (challanId: number, method: string = '1Link'): Promise<{ success: boolean; transactionId?: string; message: string }> => {
    const res = await apiClient.post(API_ENDPOINTS.CHALLANS.PAY(challanId), {
      payment_method: method,
    });
    if (res.error) {
      return { success: false, message: res.error };
    }
    return {
      success: true,
      transactionId: res.data?.transaction_id || `TXN-1LINK-${Date.now()}`,
      message: res.data?.message || 'Payment completed successfully',
    };
  },

  getTrafficRules: async (): Promise<TrafficRule[]> => {
    const res = await apiClient.get<TrafficRule[]>(API_ENDPOINTS.TRAFFIC_RULES.LIST);
    return res.data || [];
  },

  getDashboardStats: async (): Promise<CitizenDashboardStats | null> => {
    const res = await apiClient.get<CitizenDashboardStats>(API_ENDPOINTS.CITIZEN.DASHBOARD);
    return res.data;
  },
};
