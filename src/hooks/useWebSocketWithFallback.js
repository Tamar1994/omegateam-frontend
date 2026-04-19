/**
 * Fallback para HTTP Polling
 * Se WebSocket falhar após N tentativas, usar HTTP polling como alternativa
 */

export const useWebSocketWithFallback = (url, options = {}) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [usePolling, setUsePolling] = React.useState(false);
  const ws = React.useRef(null);
  const pollingInterval = React.useRef(null);
  const failureCount = React.useRef(0);
  const maxRetries = options.maxRetries || 5;
  
  const reconnectDelay = (attempt) => Math.min(1000 * Math.pow(2, attempt), 30000);
  
  React.useEffect(() => {
    const attemptWebSocket = () => {
      try {
        console.log(`🔌 Tentativa de WebSocket (${failureCount.current + 1}/${maxRetries})`);
        
        ws.current = new WebSocket(url);
        
        ws.current.onopen = () => {
          console.log('✅ WebSocket conectado!');
          setIsConnected(true);
          setUsePolling(false);
          failureCount.current = 0;
        };
        
        ws.current.onerror = (error) => {
          console.error('❌ Erro WebSocket:', error);
          failureCount.current++;
          
          if (failureCount.current >= maxRetries) {
            console.log(`⚠️  WebSocket falhou ${maxRetries}x, usando HTTP Polling como fallback`);
            setUsePolling(true);
            switchToPolling();
          } else {
            // Tentar reconectar
            const delay = reconnectDelay(failureCount.current);
            setTimeout(attemptWebSocket, delay);
          }
        };
        
        ws.current.onclose = (event) => {
          if (event.code === 1006 && !usePolling) {
            console.log('⚠️  Conexão anormal (1006), tentando de novo...');
            failureCount.current++;
            
            if (failureCount.current >= maxRetries) {
              console.log(`⚠️  WebSocket falhou ${maxRetries}x, usando HTTP Polling`);
              setUsePolling(true);
              switchToPolling();
            } else {
              const delay = reconnectDelay(failureCount.current);
              setTimeout(attemptWebSocket, delay);
            }
          }
        };
        
      } catch (e) {
        console.error('Erro ao criar WebSocket:', e);
        switchToPolling();
      }
    };
    
    const switchToPolling = () => {
      // Implementar HTTP polling aqui
      console.log('🔄 Iniciando HTTP Polling...');
      pollingInterval.current = setInterval(() => {
        fetch(`${url.replace('ws://', 'http://').replace('wss://', 'https://')}/status`)
          .then(r => r.json())
          .then(data => {
            options.onMessage?.(data);
          });
      }, 2000);
    };
    
    attemptWebSocket();
    
    return () => {
      if (ws.current) ws.current.close();
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [url]);
  
  return {
    isConnected,
    usePolling,
    ws: ws.current,
    send: (data) => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(data));
      }
    }
  };
};
