// Centraliza a URL base da API
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Faz uma requisição à API do backend
 * @param {string} endpoint - O endpoint da API (ex: '/api/campeonatos')
 * @param {object} options - Opções do fetch
 * @returns {Promise}
 */
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, options);
};

/**
 * Get request helper
 */
export const apiGet = (endpoint) => {
  return apiCall(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Post request helper
 */
export const apiPost = (endpoint, data) => {
  return apiCall(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

/**
 * Patch request helper
 */
export const apiPatch = (endpoint, data) => {
  return apiCall(endpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};

/**
 * Delete request helper
 */
export const apiDelete = (endpoint) => {
  return apiCall(endpoint, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
