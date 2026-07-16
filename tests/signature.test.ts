import { expect, test } from "bun:test";
import {
  ABSOLUTE_AGENT_SCHEMA,
  signAgentDocument,
  verifyAgentDocument
} from "@absolutejs/agent-discovery";
import { createRegistryDiscoveryVerifier } from "../scripts/verification";

test("registry verifier accepts a valid Ed25519 discovery signature", async () => {
  const keys = await crypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify"
  ]);
  const publicJwk = await crypto.subtle.exportKey("jwk", keys.publicKey);
  publicJwk.kid = "registry-test";
  const signed = await signAgentDocument(
    {
      $schema: ABSOLUTE_AGENT_SCHEMA,
      capabilities: [
        {
          approval: "never",
          description: "Reads a test value.",
          effects: ["read"],
          id: "test.read",
          title: "Read"
        }
      ],
      createdAt: new Date().toISOString(),
      description: "A cryptographic registry test agent.",
      id: "https://agent.example/.well-known/absolute-agent.json",
      interfaces: [{ type: "mcp", url: "https://agent.example/mcp" }],
      name: "Registry Test",
      publisher: {
        id: "https://example.com/",
        jwksUri: "https://example.com/.well-known/jwks.json",
        name: "Example"
      },
      updatedAt: new Date().toISOString(),
      url: "https://agent.example/",
      version: "1.0.0"
    },
    {
      algorithm: "Ed25519",
      keyId: "https://example.com/.well-known/jwks.json#registry-test",
      sign: async (payload) =>
        new Uint8Array(
          await crypto.subtle.sign("Ed25519", keys.privateKey, payload)
        )
    }
  );
  const verification = await verifyAgentDocument(
    signed,
    createRegistryDiscoveryVerifier(publicJwk)
  );
  expect(verification.ok).toBe(true);
});
