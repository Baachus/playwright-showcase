import { startLocalEchoServer } from './src/utils/websocket.utils.ts';
import WS from 'ws';

const server = await startLocalEchoServer();
console.log('server URL:', server.url);

const client = new WS(server.url);
const received = [];
// Attach message listener BEFORE waiting for open so welcome is captured
client.on('message', (data) => {
  received.push(data.toString());
});

await new Promise((res, rej) => {
  client.on('open', res);
  client.on('error', rej);
  setTimeout(() => rej(new Error('timeout')), 3000);
});

client.send('hello');
client.send('world');
await new Promise(r => setTimeout(r, 300));
console.log('received:', received);

client.close();
await server.close();

// Assertions
const okWelcome = received.some(m => m.includes('echo.websocket.events'));
const okHello = received.includes('hello');
const okWorld = received.includes('world');
console.log('welcome ok:', okWelcome, '| hello echo:', okHello, '| world echo:', okWorld);
process.exit(okWelcome && okHello && okWorld ? 0 : 1);
