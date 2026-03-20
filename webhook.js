const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');

const SECRET = process.env.WEBHOOK_SECRET || 'chichifolio-webhook-secret';
const PORT = 3101;

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/deploy') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const sig = req.headers['x-hub-signature-256'];
    const hmac = 'sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex');

    if (sig !== hmac) {
      res.writeHead(401);
      res.end('Unauthorized');
      return;
    }

    const payload = JSON.parse(body);
    if (payload.ref !== 'refs/heads/main') {
      res.writeHead(200);
      res.end('Skipped');
      return;
    }

    res.writeHead(200);
    res.end('Deploying...');

    try {
      console.log('Deploying...');
      execSync('cd /home/mapcube/chichifolio && git pull origin main && npm install && npm run build && pm2 restart chichifolio', {
        stdio: 'inherit'
      });
      console.log('Deploy complete!');
    } catch (e) {
      console.error('Deploy failed:', e.message);
    }
  });
});

server.listen(PORT, () => console.log(`Webhook server running on port ${PORT}`));
