import axios from 'axios';

const API_URL = 'http://localhost:3000';

export const branchesApi = {
  getAll: async () => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/branches`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getOne: async (id: string) => {
    const token = localStorage.getItem('access_token');
    const response = await axios.get(`${API_URL}/branches/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
