# Mini Chess

A browser-playable 5×5 Gardner's Minichess game. You play White against Fairy-Stockfish, which runs locally in the browser using WebAssembly. No backend or account is needed.

## Play locally

Requirements: Node.js 20+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Upload the contents of this folder to the repository root.
3. In **Settings → Pages**, set the build and deployment source to **GitHub Actions**.
4. Push to the `main` branch. The included workflow installs the dependencies, copies the Fairy-Stockfish WASM assets into the site, builds the app, and deploys it.
5. The site URL will appear under **Actions** or **Settings → Pages**.

The workflow expects the default branch to be named `main`. If yours is different, edit `.github/workflows/deploy.yml`.

## Rules in this implementation

This is Gardner's Minichess on a 5×5 board:
- The back rank is R-N-B-Q-K for both sides.
- Pawns move one square forward and capture one square diagonally.
- There is no castling or en passant.
- Pawns promote on the last rank to queen, rook, bishop, or knight.
- Check, checkmate, and stalemate are enforced.

The board is shown from White's perspective, with White at the bottom. You move first.

## Engine

The computer opponent is **Fairy-Stockfish**, a Stockfish-derived engine with built-in support for Gardner's Minichess. The browser build is `fairy-stockfish-nnue.wasm` and is copied from npm during `npm run build` into `public/lib/`.

The app sends the `UCI_Variant = gardner` option and a 5×5 FEN to the engine. The engine runs client-side; no game positions are sent to a server.

Third-party project:
- Fairy-Stockfish: https://github.com/fairy-stockfish/Fairy-Stockfish
- WebAssembly port: https://github.com/fairy-stockfish/fairy-stockfish.wasm
- npm package: https://www.npmjs.com/package/fairy-stockfish-nnue.wasm

**License note:** Fairy-Stockfish is GPL-3.0. Its source and license are available from the repositories above. This project fetches the published engine package at build time rather than committing its compiled WASM binary into this repository. If you redistribute the built engine assets, preserve the GPL-3.0 notices and provide access to the corresponding source as required by that license.

## Project structure

```text
mini-chess/
├── .github/workflows/deploy.yml
├── index.html
├── package.json
├── README.md
├── scripts/copy-engine.mjs
├── src/
│   ├── main.js
│   └── style.css
└── public/
    └── lib/          # populated by npm run build
```

## Notes

- The first page load downloads the engine WASM file (about 1.5 MB, plus JavaScript).
- Use `npm run build` before deploying manually. This creates `dist/` and includes the engine assets.
- The computer strength selector changes how long the engine searches each move.
