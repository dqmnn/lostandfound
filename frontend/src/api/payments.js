import api from './axios';

// Called by the Owner — simulates STK Push, generates OTP, locks items for handoff
export const mockPay = (claimId) => {
  return api.post('api/payments/mock-pay', { claimId });
};

// Called by the Finder — submits the spoken OTP to release funds and resolve items
export const verifyOtp = (claimId, otpCode) => {
  return api.post('api/payments/verify-otp', { claimId, otpCode });
};

// Called by the Owner (has claimId) — returns OTP + Finder's phone
export const getTransaction = (claimId) => {
  return api.get(`api/payments/transaction/${claimId}`);
};

// Called by the Finder (only has foundItemId) — returns Owner's phone, NO OTP
export const getTransactionByItem = (foundItemId) => {
  return api.get(`api/payments/transaction/by-item/${foundItemId}`);
};