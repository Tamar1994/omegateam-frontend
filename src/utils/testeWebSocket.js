/**
 * Teste de WebSocket simples
 * Para verificar se a conexão básica funciona
 */

export const testarWebSocketSimples = () => {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 TESTE DE WEBSOCKET SIMPLES");
  console.log("=".repeat(60));
  
  const baseUrl = import.meta.env.VITE_BACKEND_URL || "https://localhost:8000";
  const protocol = baseUrl.startsWith("https") ? "wss:" : "ws:";
  const hostBackend = baseUrl.split("//")[1] || "localhost:8000";
  const wsUrl = `${protocol}//${hostBackend}/api/debug/ws/test`;
  
  console.log(`URL: ${wsUrl}\n`);
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log("✅ CONECTADO!");
    console.log("📤 Enviando teste...");
    ws.send(JSON.stringify({ teste: "oi", timestamp: Date.now() }));
  };
  
  ws.onmessage = (event) => {
    console.log("📥 Recebido:", event.data);
    
    const data = JSON.parse(event.data);
    console.log("✅ Resposta:", data);
    
    // Desconectar após receber resposta
    setTimeout(() => {
      console.log("👋 Desconectando...");
      ws.close();
    }, 1000);
  };
  
  ws.onerror = (error) => {
    console.error("❌ ERRO:", error);
    console.log("ReadyState:", ws.readyState);
  };
  
  ws.onclose = (event) => {
    console.log(`\n❌ WEBSOCKET FECHADO`);
    console.log(`Code: ${event.code}`);
    console.log(`Reason: ${event.reason}`);
    console.log(`wasClean: ${event.wasClean}`);
    
    if (event.code === 1006) {
      console.log("\n⚠️  Code 1006 = Abnormal Closure");
      console.log("Possíveis causas:");
      console.log("  1. Backend não respondendo");
      console.log("  2. Proxy bloqueando WebSocket");
      console.log("  3. Render não suporta WebSocket no plano free");
      console.log("  4. Timeout na conexão");
    }
  };
  
  // Return para limpeza
  return ws;
};

// Uso no console:
// import { testarWebSocketSimples } from "@/utils/testeWebSocket.js"
// testarWebSocketSimples()
