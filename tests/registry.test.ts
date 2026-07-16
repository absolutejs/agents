import { describe, expect, test } from "bun:test";

describe("generated registry", () => {
  test("publishes metadata, machine index, crawler text, and sitemap", async () => {
    const metadata = await Bun.file(
      "public/.well-known/absolute-agent-registry.json"
    ).json();
    const index = await Bun.file("public/v1/agents/index.json").json();
    expect(metadata.requiresVerifiedSignatures).toBe(true);
    expect(metadata.searchEndpoint).toEndWith("/v1/agents/index.json");
    expect(index.count).toBe(index.agents.length);
    expect(await Bun.file("public/agents.txt").text()).toContain(
      "AbsoluteJS Agent Registry"
    );
    expect(await Bun.file("public/agents-sitemap.xml").text()).toContain(
      "urlset"
    );
  });
});
