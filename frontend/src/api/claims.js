import api from './axios';

// --- User-facing claim routes ---

export const createClaim = (data) => {
  return api.post('api/claims', data);
};

export const getMyClaims = () => {
  return api.get('api/claims/mine');
};