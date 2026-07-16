# AbsoluteJS Agent Registry

The public, reviewable index of agents built with AbsoluteJS or exposing an
Absolute-compatible open discovery document.

- Human catalog: <https://absolutejs.github.io/agents/>
- Registry metadata: <https://absolutejs.github.io/agents/.well-known/absolute-agent-registry.json>
- Machine index: <https://absolutejs.github.io/agents/v1/agents/index.json>
- Package index: <https://absolutejs.github.io/agents/v1/packages/index.json>
- Signed registry descriptor: <https://absolutejs.github.io/agents/.well-known/absolute-agent.json>
- OpenAPI: <https://absolutejs.github.io/agents/openapi.json>
- Arazzo workflow: <https://absolutejs.github.io/agents/arazzo.json>
- Crawler index: <https://absolutejs.github.io/agents/agents.txt>
- Sitemap: <https://absolutejs.github.io/agents/agents-sitemap.xml>
- Security contact: <https://absolutejs.github.io/agents/.well-known/security.txt>

## List an agent

1. Expose `/.well-known/absolute-agent.json` using
   `@absolutejs/agent-discovery`.
2. Sign the descriptor with a key controlled by the publisher.
3. Add the exact signed JSON envelope to `registry/agents/<slug>.json` and the
   public verification JWK to `registry/keys/<slug>.jwk.json`.
4. Open a pull request. CI performs the same canonical digest and cryptographic
   signature verification as `@absolutejs/agent-discovery`, then rejects
   malformed, expired, duplicate, insecure, or misleading entries before human
   publisher/domain review.

Descriptors use the provider-neutral
`https://absolutejs.github.io/agents/schemas/agent-discovery/v1.json` contract
and may point to MCP, A2A, Arazzo, WebMCP, HTTP, OpenAPI, or WebSocket
interfaces. The former `absolutejs.com` identifier remains accepted for
migration, but new descriptors should use the live immutable schema. A listing is discovery, not
authorization: callers must still follow the agent's advertised OAuth and
approval requirements.

## Rotate the registry signing key

`bun run sign:registry-agent` reads `REGISTRY_AGENT_SIGNING_JWK`, writes only
the signed envelope and public JWK, and never logs private key material. The
private key is held as a GitHub Actions secret; published descriptors identify
the exact key with a JWKS fragment.

The repository model is intentional for launch. Every listing and removal has
public history, code-owner review, and a reproducible generated index. A
federated submission API can ingest these same signed documents later.
