// guards/websocket-connection.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { WebSocketService } from '../../services/websocket.service';
import { AuthService } from '../../services/auth.service';

export const webSocketConnectionGuard: CanActivateFn = (route, state) => {
  const webSocketService = inject(WebSocketService);
  const authService = inject(AuthService);

  console.log('🛡️ Guard executado para rota:', route.routeConfig?.path);

  // ✅ Verificar se o usuário está logado
  const token = authService.getToken();
  const user = authService.getCurrentUser();

  if (!token || !user) {
    console.log('⚠️ Usuário não está logado');
    return true; // Deixa a rota prosseguir, mas não conecta WebSocket
  }

  // ✅ Verificar se WebSocket está conectado
  if (!webSocketService.isConnected()) {
    console.log('🔄 WebSocket desconectado, tentando reconectar...');

    // Tentar reconectar
    webSocketService.reconnect(token, user);

    // Aguardar um momento para a conexão
    setTimeout(() => {
      if (webSocketService.isConnected()) {
        console.log('✅ WebSocket reconectado com sucesso');
      } else {
        console.log('❌ Falha na reconexão do WebSocket');
      }
    }, 2000);
  } else {
    console.log('✅ WebSocket já está conectado');
  }

  return true; // Sempre permite a navegação
};
