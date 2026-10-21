'use strict';
const http = require('node:http');
const environment = process.env.APP_ENV || 'development';
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
  } else if (req.method === 'GET' && req.url === '/config') {
    res.writeHead(200);
    res.end(JSON.stringify({ environment }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not found' }));
  }
});
server.listen(8080, '0.0.0.0', () => {
  console.log(`LaunchPad listening on 0.0.0.0:8080; environment=${environment}`);
});
process.on('SIGTERM', () => server.close(() => process.exit(0)));
