// Simple wrapper to ensure Next.js binds to 0.0.0.0
// Next.js 16's next start should work, but we'll use a custom server for hostname control
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '8950', 10);
const dev = false; // Always production mode

const startServer = async () => {
  try {
    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();

    await app.prepare();

    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    }).listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

