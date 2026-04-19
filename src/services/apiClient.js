/**
 * API Client - Tratamento centralizado de requisições
 * 
 * Features:
 * ✅ Tratamento de erros robusto
 * ✅ Validação de resposta
 * ✅ Retry automático
 * ✅ Timeout configurável
 * ✅ Logging estruturado
 * ✅ Autenticação automática
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Faz uma requisição com tratamento automático de erros
 */
export const apiClient = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = 10000,
    retries = 1,
    retry_delay = 1000,
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Adiciona token de autenticação se disponível
      const token = localStorage.getItem('auth_token');
      const finalHeaders = {
        'Content-Type': 'application/json',
        ...headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      // Configura timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Faz a requisição
      const response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: body ? JSON.stringify(body) : null,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Valida a resposta
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: `HTTP ${response.status}` };
        }

        const errorMessage = errorData.detail || errorData.message || `Erro ${response.status}`;
        
        // Se é erro 401, limpa o token
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }

        throw new ApiError(errorMessage, response.status, errorData);
      }

      // Parse da resposta
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      logAPI(method, endpoint, 'success', response.status);
      return data;

    } catch (error) {
      // Retry automático para erros de rede
      if (attempt < retries && (error.name === 'AbortError' || !error.status)) {
        logAPI(method, endpoint, 'retry', `Tentativa ${attempt + 1}/${retries}`);
        await new Promise(resolve => setTimeout(resolve, retry_delay));
        continue;
      }

      logAPI(method, endpoint, 'error', error);
      throw error;
    }
  }
};

/**
 * Helpers para requisições comuns
 */
export const apiGet = (endpoint, options = {}) =>
  apiClient(endpoint, { method: 'GET', ...options });

export const apiPost = (endpoint, body, options = {}) =>
  apiClient(endpoint, { method: 'POST', body, ...options });

export const apiPatch = (endpoint, body, options = {}) =>
  apiClient(endpoint, { method: 'PATCH', body, ...options });

export const apiPut = (endpoint, body, options = {}) =>
  apiClient(endpoint, { method: 'PUT', body, ...options });

export const apiDelete = (endpoint, options = {}) =>
  apiClient(endpoint, { method: 'DELETE', ...options });

/**
 * Logging estruturado de requisições
 */
const logAPI = (method, endpoint, status, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    method,
    endpoint,
    status,
    details,
  };

  // Em produção, enviar para serviço de logging
  if (process.env.NODE_ENV === 'production') {
    // Implementar logging remoto aqui
  }

  // Em desenvolvimento, mostrar no console
  if (process.env.NODE_ENV === 'development') {
    const color = status === 'success' ? '\x1b[32m' : status === 'error' ? '\x1b[31m' : '\x1b[33m';
    const reset = '\x1b[0m';
    console.log(`${color}[API] ${method} ${endpoint} - ${status}${reset}`, details);
  }
};

export { ApiError };
