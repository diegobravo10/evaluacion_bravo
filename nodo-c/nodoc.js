const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Create an HTTP + WebSocket server that listens on port 3000 inside the container
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

server.listen(3001, () => {
  console.log('Nodo C - WebSocket server listening on port 3001');
});


wss.on('connection', (ws) => {
  const clientId = uuidv4();
  clients.set(clientId, ws);

  console.log(`🔌 Cliente conectado: ${clientId} (Total: ${clients.size})`);

  ws.send(JSON.stringify({
    type: 'connected',
    clientId: clientId,
    message: 'Conectado al Nodo B (procesador)'
  }));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Nodo C recibido:', data);

      const num = parseInt(data.power_level, 10) || 0;

      // Ensure audit trail is an array, then push the B marker
      const trail = Array.isArray(data.audit_trail) ? [...data.audit_trail] : [];
      trail.push('C_verified');

      const isEven = (num % 2) === 0;
      const processed1 = isEven ? num * 2 : num * 1;

      const processed = processed1 - 5;
      ws.send(JSON.stringify({
        _id: data._id || null,
        power_level: processed,
        audit_trail: trail
      }));

    } catch (error) {
      console.error('Nodo B - Error procesando mensaje:', error);
      ws.send(JSON.stringify({ type: 'error', message: String(error) }));
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`🔌 Cliente desconectado: ${clientId} (Total: ${clients.size})`);
  });

  ws.on('error', (error) => {
    console.error('Nodo B - Error en WebSocket:', error);
  });
});