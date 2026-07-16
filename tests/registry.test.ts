import { describe, expect, test } from "bun:test";

describe("generated registry", () => {
  test("publishes metadata, agent/package indexes, signed discovery, crawler text, and sitemap", async () => {
    const metadata = await Bun.file(
      "public/.well-known/absolute-agent-registry.json"
    ).json();
    const index = await Bun.file("public/v1/agents/index.json").json();
    const packages = await Bun.file("public/v1/packages/index.json").json();
    expect(metadata.requiresVerifiedSignatures).toBe(true);
    expect(metadata.searchEndpoint).toEndWith("/v1/agents/index.json");
    expect(index.count).toBe(index.agents.length);
    expect(index.count).toBeGreaterThan(0);
    expect(packages.count).toBe(packages.packages.length);
    expect(packages.packages.some((entry: { name: string }) => entry.name === "@absolutejs/auth")).toBe(true);
    expect(await Bun.file("public/.well-known/absolute-agent.json").json()).toHaveProperty("signatures");
    expect(await Bun.file("public/.well-known/jwks.json").json()).toHaveProperty("keys");
    expect(await Bun.file("public/agents.txt").text()).toContain(
      "AbsoluteJS Agent Registry"
    );
    expect(await Bun.file("public/agents-sitemap.xml").text()).toContain(
      "urlset"
    );
  });
});
