# Contributing

Thanks for your interest in openotes! Bug reports, ideas, and pull requests are all welcome.

## How to Contribute

1. **Open an issue first** for bugs or feature ideas, so we can agree on the approach before you write code. Small fixes (typos, docs) can go straight to a PR.
2. **Fork and branch**

   ```bash
   git clone https://github.com/<you>/openotes.git
   cd openotes
   npm install
   git checkout -b fix/short-description
   ```

3. **Set up your environment**

   ```bash
   cp .env.example .env   # point VAULT_PATH at a scratch folder, not your real vault
   npm run dev            # dev server with hot reload
   ```

4. **Make your change** and verify it builds and runs:

   ```bash
   npm run build
   npm start
   ```

5. **Open a pull request** against `main`. Describe what changed and why, and mention the issue it closes.

## Guidelines

- TypeScript only, matching the existing style in `src/`. Keep new code in the layer where it belongs — `core/` for file and search primitives, `tools/` for MCP tool definitions.
- Every path that touches the vault must go through the validation in `src/core/paths.ts`. Never let a tool escape `VAULT_PATH`.
- One logical change per PR. Keep commits focused and messages descriptive.
- Update `README.md` and `TOOLS.md` when you add or change a tool.

## Reporting Bugs

Include your Node version, OS, how you're connecting (Claude Code, Claude Desktop, Claude.ai), and the steps to reproduce. Server logs help a lot.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
