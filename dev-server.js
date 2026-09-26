/**
 * Static server for the portfolio. Every response is uncached, and a save
 * reloads the open tab, so edits to led-wall.config.js show up immediately.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = 8765;
const clients = new Set();
let reloadTimer = 0;

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
};

const reloadSnippet =
  "<script>new EventSource('/__reload').onmessage=function(){location.reload()}</script>";

function notify() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const res of clients) res.write("data: reload\n\n");
  }, 120);
}

fs.watch(root, { recursive: true }, (_event, filename) => {
  if (!filename) return;
  const name = String(filename);
  if (name.includes("node_modules") || name.endsWith("dev-server.js")) return;
  notify();
});

function send(res, status, body, type) {
  res.writeHead(status, {
    "Content-Type": type || "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (url.pathname === "/__reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    });
    res.write("retry: 1000\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) {
    send(res, 403, "Forbidden");
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      send(res, 404, "Not found");
      return;
    }
    const ext = path.extname(file).toLowerCase();
    let body = data;
    if (ext === ".html") {
      const v = Date.now();
      let html = data.toString("utf8").replace(
        /(src|href)="(?!https?:|\/\/|#|mailto:)([^"]+)"/g,
        (_, attr, url) => {
          const join = url.includes("?") ? "&" : "?";
          return `${attr}="${url}${join}v=${v}"`;
        }
      );
      if (!html.includes("/__reload")) {
        html = html.replace("</body>", reloadSnippet + "\n</body>");
      }
      body = html;
    }
    send(res, 200, body, types[ext] || "application/octet-stream");
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log("Serving " + root + " at http://127.0.0.1:" + port);
  console.log("Cache disabled. Saving a file reloads the tab.");
});
