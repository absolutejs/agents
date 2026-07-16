import type { DiscoveryVerifier } from "@absolutejs/agent-discovery";

export const createRegistryDiscoveryVerifier = (
  jwk: JsonWebKey
): DiscoveryVerifier => ({
  verify: async ({ algorithm, keyId, payload, signature }) => {
    const expectedKid = new URL(keyId).hash.slice(1);
    if (expectedKid.length === 0 || jwk.kid !== expectedKid) return false;
    if (
      algorithm === "Ed25519" &&
      jwk.kty === "OKP" &&
      jwk.crv === "Ed25519"
    ) {
      const key = await crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "Ed25519" },
        false,
        ["verify"]
      );

      return crypto.subtle.verify("Ed25519", key, signature, payload);
    }
    if (algorithm === "ES256" && jwk.kty === "EC" && jwk.crv === "P-256") {
      const key = await crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["verify"]
      );

      return crypto.subtle.verify(
        { hash: "SHA-256", name: "ECDSA" },
        key,
        signature,
        payload
      );
    }

    return false;
  }
});
