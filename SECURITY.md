# Security notes

- Do not commit real API keys, tokens, or `.env` files.
- Treat localStorage and imported JSON as untrusted; the app validates saved state before using it.
- Keep dependencies updated and review `npm audit` findings before deployment.
- This client-side demo is not an authenticated banking application and should not store bank credentials or highly sensitive personal data.
- Report suspected security issues privately to the repository owner rather than posting exploit details publicly.
