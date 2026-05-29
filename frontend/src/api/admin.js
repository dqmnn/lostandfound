import api from './axios';

// --- Admin (JWT & Admin Role required) ---

export const getStats = () => {
  return api.get('api/admin/stats');
};

export const getAdminItems = (type) => {
  return api.get('api/admin/items', {
    params: type ? { type } : {}
  });
};

export const deleteItem = (id) => {
  return api.delete(`api/admin/items/${id}`);
};

export const getUsers = () => {
  return api.get('api/admin/users');
};

export const updateUser = (id, data) => {
  return api.put(`api/admin/users/${id}`, data);
};

export const getPendingClaims = () => {
  return api.get('api/admin/claims');
};
 
export const reviewClaim = (id, data) => {
  return api.put(`api/admin/claims/${id}`, data);
};