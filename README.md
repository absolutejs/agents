# AbsoluteJS Agent Registry

The public, reviewable index of agents built with AbsoluteJS or exposing an
Absolute-compatible open discovery document.

- Human catalog: <https://absolutejs.github.io/agents/>
- Registry metadata: <https://absolutejs.github.io/agents/.well-known/absolute-agent-registry.json>
- Machine index: <https://absolutejs.github.io/agents/v1/agents/index.json>
- Crawler index: <https://absolutejs.github.io/agents/agents.txt>
- Sitemap: <https://absolutejs.github.io/agents/agents-sitemap.xml>

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
`https://absolutejs.com/schemas/agent-discovery/v1` contract and may point to
MCP, A2A, HTTP, OpenAPI, or WebSocket interfaces. A listing is discovery, not
authorization: callers must still follow the agent's advertised OAuth and
approval requirements.

The repository model is intentional for launch. Every listing and removal has
public history, code-owner review, and a reproducible generated index. A
federated submission API can ingest these same signed documents later.
