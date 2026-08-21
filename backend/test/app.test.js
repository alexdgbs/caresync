import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { createApp } from "../src/app.js";

async function withServer(run) {
  const server = http.createServer(
    createApp({ frontendUrls: ["http://localhost:5173"], io: {} }),
  );
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

test("health endpoint exposes service state and request tracing", () =>
  withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("x-request-id"));
    assert.deepEqual(await response.json(), {
      status: "ok",
      service: "caresync-api",
    });
  }));
test("OpenAPI contract is available", () =>
  withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/openapi.json`);
    const body = await response.json();
    assert.equal(body.openapi, "3.1.0");
    assert.ok(body.paths["/medicos/{id}"]);
  }));
test("unknown routes return traceable structured errors", () =>
  withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/unknown`);
    const body = await response.json();
    assert.equal(response.status, 404);
    assert.equal(body.requestId, response.headers.get("x-request-id"));
  }));
test("CORS permits authenticated document uploads", () =>
  withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/medical-applications/me`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "PUT",
      },
    });
    assert.equal(response.status, 204);
    assert.match(response.headers.get("access-control-allow-methods"), /PUT/);
    assert.equal(
      response.headers.get("access-control-allow-credentials"),
      "true",
    );
  }));
test("CORS does not reflect unknown production origins", () =>
  withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: "https://unknown.example" },
    });
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  }));
test("Google login reports missing server configuration", () =>
  withServer(async (baseUrl) => {
    const previous = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;
    try {
      const response = await fetch(`${baseUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: "invalid" }),
      });
      assert.equal(response.status, 503);
    } finally {
      if (previous !== undefined) process.env.GOOGLE_CLIENT_ID = previous;
    }
  }));
