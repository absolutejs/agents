import {
  verifyAgentDocument,
  type SignedAgentDiscoveryDocument
} from "@absolutejs/agent-discovery";
import { createRegistryDiscoveryVerifier } from "./verification";

const SCHEMA = "https://absolutejs.com/schemas/agent-discovery/v1";
const BASE = "https://absolutejs.github.io/agents";
const ALLOWED_INTERFACES = new Set([
  "a2a",
  "http",
  "mcp",
  "openapi",
  "websocket"
]);

type JsonObject = Record<string, unknown>;

const object = (value: unknown): JsonObject => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected an object");
  }

  return Object.fromEntries(Object.entries(value));
};

const text = (value: unknown, field: string) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }

  return value;
};

const secureUrl = (value: unknown, field: string) => {
  const raw = text(value, field);
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:") throw new Error(`${field} must use HTTPS`);

  return parsed.toString();
};

const validate = (value: unknown, filename: string) => {
  const signed = object(value);
  const document = object(signed.document);
  if (document.$schema !== SCHEMA) throw new Error(`${filename}: unsupported schema`);
  const id = secureUrl(document.id, `${filename}: document.id`);
  secureUrl(document.url, `${filename}: document.url`);
  text(document.name, `${filename}: document.name`);
  text(document.description, `${filename}: document.description`);
  text(document.version, `${filename}: document.version`);
  const publisher = object(document.publisher);
  const jwksUri = secureUrl(
    publisher.jwksUri,
    `${filename}: document.publisher.jwksUri`
  );
  const capabilities = document.capabilities;
  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    throw new Error(`${filename}: at least one capability is required`);
  }
  const interfaces = document.interfaces;
  if (!Array.isArray(interfaces) || interfaces.length === 0) {
    throw new Error(`${filename}: at least one interface is required`);
  }
  for (const entry of interfaces) {
    const agentInterface = object(entry);
    if (!ALLOWED_INTERFACES.has(text(agentInterface.type, "interface.type"))) {
      throw new Error(`${filename}: unsupported interface type`);
    }
    secureUrl(agentInterface.url, `${filename}: interface.url`);
  }
  const signatures = signed.signatures;
  if (!Array.isArray(signatures) || signatures.length === 0) {
    throw new Error(`${filename}: at least one signature is required`);
  }
  for (const signature of signatures) {
    const entry = object(signature);
    text(entry.algorithm, `${filename}: signature.algorithm`);
    const keyId = secureUrl(entry.keyId, `${filename}: signature.keyId`);
    const keyUrl = new URL(keyId);
    keyUrl.hash = "";
    if (keyUrl.toString() !== jwksUri) {
      throw new Error(`${filename}: signature key is not published by publisher.jwksUri`);
    }
    text(entry.digest, `${filename}: signature.digest`);
    text(entry.value, `${filename}: signature.value`);
  }
  if (typeof document.expiresAt === "string") {
    const expiry = Date.parse(document.expiresAt);
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      throw new Error(`${filename}: descriptor is expired`);
    }
  }

  return {
    document,
    id,
    signatures,
    signed: signed as unknown as SignedAgentDiscoveryDocument
  };
};

const files = [...new Bun.Glob("*.json").scanSync("registry/agents")].sort();
const records = [];
const ids = new Set<string>();
for (const file of files) {
  const raw: unknown = await Bun.file(`registry/agents/${file}`).json();
  const record = validate(raw, file);
  const keyPath = `registry/keys/${file.replace(/\.json$/u, ".jwk.json")}`;
  if (!(await Bun.file(keyPath).exists())) {
    throw new Error(`${file}: missing public verification key at ${keyPath}`);
  }
  const jwk = (await Bun.file(keyPath).json()) as JsonWebKey;
  const verification = await verifyAgentDocument(
    record.signed,
    createRegistryDiscoveryVerifier(jwk)
  );
  if (!verification.ok) {
    throw new Error(`${file}: ${verification.errors.join(", ")}`);
  }
  if (ids.has(record.id)) throw new Error(`${file}: duplicate agent id`);
  ids.add(record.id);
  records.push({ agent: record.document, signatures: record.signatures, verified: true });
}

records.sort((left, right) =>
  String(left.agent.name).localeCompare(String(right.agent.name))
);
const generatedAt = new Date().toISOString();
const index = {
  schema: "https://absolutejs.com/schemas/agent-registry-index/v1",
  generatedAt,
  count: records.length,
  agents: records
};
const metadata = {
  schema: "https://absolutejs.com/schemas/agent-registry/v1",
  name: "AbsoluteJS Public Agent Registry",
  description: "A reviewable index of signed, open-protocol AI agents.",
  searchEndpoint: `${BASE}/v1/agents/index.json`,
  submissionEndpoint: "https://github.com/absolutejs/agents/pulls",
  supportedDiscoverySchemas: [SCHEMA],
  requiresVerifiedSignatures: true,
  federationFeeds: [`${BASE}/v1/agents/index.json`]
};
const agentsText = records.length
  ? records
      .map(({ agent }) => `- ${agent.name}: ${agent.description}\n  ${agent.id}`)
      .join("\n")
  : "# AbsoluteJS Agent Registry\n\nNo agents have been accepted yet. Submit a signed descriptor at https://github.com/absolutejs/agents.";
const sitemapEntries = records
  .map(({ agent }) => `  <url><loc>${agent.url}</loc></url>`)
  .join("\n");

await Promise.all([
  Bun.write("public/v1/agents/index.json", `${JSON.stringify(index, null, 2)}\n`),
  Bun.write(
    "public/.well-known/absolute-agent-registry.json",
    `${JSON.stringify(metadata, null, 2)}\n`
  ),
  Bun.write("public/agents.txt", `${agentsText}\n`),
  Bun.write(
    "public/agents-sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`
  )
]);

console.log(`Built registry with ${records.length} verified agent(s).`);
