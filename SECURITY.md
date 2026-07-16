# Security policy

Report vulnerabilities privately through
[GitHub Security Advisories](https://github.com/absolutejs/agents/security/advisories/new).
Do not include exploit details, signing keys, credentials, or personal data in a
public issue.

The registry treats every submitted descriptor as untrusted input. CI applies
bounded parsing, HTTPS-only URL validation, canonical signature verification,
expiry and duplicate checks, and exact publisher-key binding before an entry can
be deployed. Maintainer review still checks publisher/domain control and whether
advertised capabilities are misleading. A listing is discovery evidence, not
authorization or an endorsement.

## Signing-key incidents

If a publisher key is compromised, privately report the descriptor ID and key
ID. Maintainers will remove affected listings first; the publisher can then
rotate its JWKS key, re-sign the descriptor, and submit the replacement through
normal review. Registry history remains public for incident analysis.

## Supported versions

The deployed registry and current `@absolutejs/agent-discovery` release receive
security fixes. Legacy schema identifiers are accepted only as a migration
input; newly signed documents should use the live schema hosted by this site.
