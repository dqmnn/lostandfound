import api from './axios';

// --- Public (no auth needed) ---

export const fetchFoundItems = (filters = {}) => {
  return api.get('api/items/found', { params: filters });
};

export const fetchLostItems = (filters = {}) => {
  return api.get('api/items/lost', { params: filters });
};

// --- Private (JWT required) ---

export const reportLostItem = (data) => {
  return api.post('api/items/lost', data);
};

export const reportFoundItem = (data) => {
  return api.post('api/items/found', data);
};


export const getMyItems = (type) => {
  return api.get('api/items/mine', { 
    params: type ? { type } : {} 
  });
};