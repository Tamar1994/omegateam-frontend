/**
 * Toast Notifications - Substitui alerts() genéricos
 * 
 * Uso:
 * import { toast } from '@/services/toast';
 * 
 * toast.success('Sucesso!');
 * toast.error('Erro!');
 * toast.warning('Cuidado!');
 * toast.info('Informação');
 * toast.loading('Processando...');
 */

let toastContainer = null;

const getContainer = () => {
  if (toastContainer) return toastContainer;

  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
  `;

  document.body.appendChild(container);
  toastContainer = container;
  return container;
};

const createToast = (message, type = 'info', duration = 4000) => {
  const container = getContainer();

  const toastEl = document.createElement('div');
  const colors = {
    success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724', icon: '✓' },
    error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', icon: '✕' },
    warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404', icon: '⚠' },
    info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', icon: 'ℹ' },
  };

  const { bg, border, text, icon } = colors[type] || colors.info;

  toastEl.style.cssText = `
    background-color: ${bg};
    border: 1px solid ${border};
    border-radius: 8px;
    padding: 12px 16px;
    color: ${text};
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    animation: slideIn 0.3s ease-out;
    pointer-events: auto;
  `;

  toastEl.innerHTML = `
    <span style="font-weight: bold; font-size: 18px;">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toastEl);

  if (duration > 0) {
    setTimeout(() => {
      toastEl.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toastEl.remove(), 300);
    }, duration);
  }

  return toastEl;
};

// Injetar animações CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

export const toast = {
  success: (message, duration = 3000) => createToast(message, 'success', duration),
  error: (message, duration = 4000) => createToast(message, 'error', duration),
  warning: (message, duration = 3500) => createToast(message, 'warning', duration),
  info: (message, duration = 3000) => createToast(message, 'info', duration),
  loading: (message) => createToast(message, 'info', 0), // Sem auto-dismiss
};
