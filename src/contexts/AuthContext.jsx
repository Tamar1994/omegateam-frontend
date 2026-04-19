/**
 * AuthContext - Centraliza toda a lógica de autenticação
 * 
 * Elimina duplicação de código em 10 componentes
 * Fornece métodos: login, logout, verificaEmail, validaToken, etc
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { apiPost, apiGet } from '../services/apiClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Restaura sessão ao carregar
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('auth_token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Erro ao restaurar sessão:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  /**
   * Verifica se um email já existe
   */
  const verificaEmail = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGet(`/verificar-email/${email}`);
      return response.existe || false;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Envia token de validação
   */
  const enviaToken = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      await apiPost('/enviar-token', { email });
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Valida token e cadastra usuário
   */
  const validaToken = useCallback(async (email, token, dados) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/validar-token', {
        email,
        token,
        ...dados,
      });
      
      // Salva usuario e token
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.usuario));
      
      setUser(response.usuario);
      setIsAuthenticated(true);
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Faz login
   */
  const login = useCallback(async (email, senha) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost('/login', { email, senha });
      
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.usuario));
      
      setUser(response.usuario);
      setIsAuthenticated(true);
      
      return response.usuario;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Faz logout
   */
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  /**
   * Atualiza perfil do usuário
   */
  const atualizaPerfil = useCallback(async (dados) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPatch('/atualizar-perfil', dados);
      
      const usuarioAtualizado = { ...user, ...response };
      localStorage.setItem('user', JSON.stringify(usuarioAtualizado));
      setUser(usuarioAtualizado);
      
      return usuarioAtualizado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Altera senha
   */
  const alteraSenha = useCallback(async (senhaAtual, novaSenha) => {
    setLoading(true);
    setError(null);
    try {
      await apiPatch('/alterar-senha', {
        senha_atual: senhaAtual,
        nova_senha: novaSenha,
      });
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Deleta conta
   */
  const deletaConta = useCallback(async (senha) => {
    setLoading(true);
    setError(null);
    try {
      await apiDelete('/excluir-conta', { senha });
      logout();
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const value = {
    // Estado
    user,
    loading,
    error,
    isAuthenticated,
    
    // Métodos
    verificaEmail,
    enviaToken,
    validaToken,
    login,
    logout,
    atualizaPerfil,
    alteraSenha,
    deletaConta,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook customizado para usar AuthContext
 */
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  
  return context;
};
