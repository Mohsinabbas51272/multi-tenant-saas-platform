import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.token) {
    sessionStorage.setItem('token', response.data.token);
    sessionStorage.setItem('user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const registerTenant = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const registerCustomer = async (userData) => {
  const response = await api.post('/auth/register-customer', userData);
  return response.data;
};

export const logout = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const user = sessionStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};
