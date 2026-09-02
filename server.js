import { createReadStream, promises as fs } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT) || 3000;
const ROOT = path.dirname(fileURLToPath(import.meta.url));

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2"
};

const sendError = (response, statusCode, message) => {
  response.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(message);
};

const resolveFile = async (pathname) => {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(requestedPath);
  const candidate = path.resolve(ROOT, `.${decodedPath}`);

  if (candidate !== ROOT && !candidate.startsWith(`${ROOT}${path.sep}`)) return null;

  try {
    const stats = await fs.stat(candidate);
    if (stats.isFile()) return candidate;
  } catch {}

  if (!path.extname(candidate)) {
    const htmlCandidate = `${candidate}.html`;
    try {
      const stats = await fs.stat(htmlCandidate);
      if (stats.isFile()) return htmlCandidate;
    } catch {}
  }

  return null;
};

const serveFile = async (request, response, filePath) => {
  const stats = await fs.stat(filePath);
  const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=3600",
    "Content-Type": contentType
  };
  const range = request.headers.range;

  if (!range) {
    response.writeHead(200, { ...baseHeaders, "Content-Length": stats.size });
    createReadStream(filePath).pipe(response);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    response.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
    response.end();
    return;
  }

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : stats.size - 1;

  if (!Number.isInteger(start) || !Number.isInteger(end) || start > end || end >= stats.size) {
    response.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
    response.end();
    return;
  }

  response.writeHead(206, {
    ...baseHeaders,
    "Content-Length": end - start + 1,
    "Content-Range": `bytes ${start}-${end}/${stats.size}`
  });
  createReadStream(filePath, { start, end }).pipe(response);
};

const server = createServer(async (request, response) => {
  if (!request.url) return sendError(response, 400, "Bad request");

  const { pathname } = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (pathname === "/api/health") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") return sendError(response, 405, "Method not allowed");

  try {
    const filePath = await resolveFile(pathname);
    if (!filePath) return sendError(response, 404, "Page not found");
    if (request.method === "HEAD") {
      const stats = await fs.stat(filePath);
      response.writeHead(200, { "Content-Length": stats.size, "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream" });
      response.end();
      return;
    }
    await serveFile(request, response, filePath);
  } catch (error) {
    console.error(error);
    sendError(response, 500, "Internal server error");
  }
});

server.listen(PORT, () => {
  console.log(`Juliet Leo portfolio is running at http://localhost:${PORT}`);
});
