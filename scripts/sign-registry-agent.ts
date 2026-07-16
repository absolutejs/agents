import {
  ABSOLUTE_AGENT_SCHEMA,
  signAgentDocument,
  type AgentDiscoveryDocument
} from "@absolutejs/agent-discovery";

const BASE = "https://absolutejs.github.io/agents";
const KEY_ID = `${BASE}/.well-known/jwks.json#absolutejs-registry-2026`;
const privatePath = process.argv[2];
let privateJwk: JsonWebKey;
let publicJwk: JsonWebKey;

if (privatePath) {
  const keys = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]);
  privateJwk = await crypto.subtle.exportKey("jwk", keys.privateKey);
  publicJwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
  await Bun.write(privatePath, `${JSON.stringify({ ...privateJwk, kid: "absolutejs-registry-2026" })}\n`);
} else {
  const encoded = process.env.REGISTRY_AGENT_SIGNING_JWK;
  if (!encoded) throw new Error("Set REGISTRY_AGENT_SIGNING_JWK or pass a private output path to generate a key");
  privateJwk = JSON.parse(encoded) as JsonWebKey;
  const { d: _private, key_ops: _privateOperations, ...publicFields } = privateJwk;
  publicJwk = { ...publicFields, key_ops: ["verify"] };
}
privateJwk.kid = "absolutejs-registry-2026";
publicJwk.kid = "absolutejs-registry-2026";

const now = new Date().toISOString();
const document: AgentDiscoveryDocument = {
  $schema: ABSOLUTE_AGENT_SCHEMA,
  id: `${BASE}/.well-known/absolute-agent.json`,
  name: "AbsoluteJS Registry Search Agent",
  description: "Finds verified agents and production AbsoluteJS packages through open, static machine-readable indexes.",
  version: "1.0.0",
  url: `${BASE}/`,
  publisher: {
    id: "https://github.com/absolutejs",
    name: "AbsoluteJS",
    url: "https://github.com/absolutejs",
    jwksUri: `${BASE}/.well-known/jwks.json`
  },
  capabilities: [
    {
      id: "registry.agents.search",
      title: "Search verified agents",
      description: "Reads the signed public agent index and filters its discovery metadata.",
      effects: ["read"],
      approval: "never",
      tags: ["discovery", "registry", "agents"]
    },
    {
      id: "registry.packages.search",
      title: "Search AbsoluteJS packages",
      description: "Reads the public package catalog for agent-first framework capabilities.",
      effects: ["read"],
      approval: "never",
      tags: ["absolutejs", "packages", "discovery"]
    }
  ],
  interfaces: [
    { type: "http", url: `${BASE}/v1/agents/index.json`, contentTypes: ["application/json"] },
    { type: "openapi", url: `${BASE}/openapi.json`, protocolVersion: "3.1.1" },
    { type: "arazzo", url: `${BASE}/arazzo.json`, protocolVersion: "1.1.0" }
  ],
  authentication: { schemes: ["none"] },
  categories: ["developer-tools", "agent-discovery"],
  tags: ["absolutejs", "signed", "open-protocol"],
  languages: ["en"],
  documentationUrl: "https://github.com/absolutejs/agents#readme",
  createdAt: "2026-07-16T00:00:00.000Z",
  updatedAt: now
};
const key = await crypto.subtle.importKey("jwk", privateJwk, "Ed25519", false, ["sign"]);
const signed = await signAgentDocument(document, {
  algorithm: "Ed25519",
  keyId: KEY_ID,
  sign: async (payload) => new Uint8Array(await crypto.subtle.sign("Ed25519", key, payload))
});
await Promise.all([
  Bun.write("registry/agents/absolutejs-registry.json", `${JSON.stringify(signed, null, 2)}\n`),
  Bun.write("registry/keys/absolutejs-registry.jwk.json", `${JSON.stringify(publicJwk, null, 2)}\n`)
]);
console.log("Signed the registry discovery document without exposing private key material.");
