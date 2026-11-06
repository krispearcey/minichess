import "./style.css";

const GLYPHS = {
  K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
  k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟"
};
const FILES = "abcde";
const START = [
  "r", "n", "b", "q", "k",
  "p", "p", "p", "p", "p",
  ".", ".", ".", ".", ".",
  "P", "P", "P", "P", "P",
  "R", "N", "B", "Q", "K"
];
const PIECE_VALUE = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 100 };
const clone = (p) => p.slice();
const colorOf = p => p === "." ? 0 : p === p.toUpperCase() ? 1 : -1;
const rowOf = i => Math.floor(i / 5);
const colOf = i => i % 5;
const square = i => `${FILES[colOf(i)]}${5 - rowOf(i)}`;
const indexOf = s => (5 - Number(s[1])) * 5 + FILES.indexOf(s[0]);
const inside = (r, c) => r >= 0 && r < 5 && c >= 0 && c < 5;
const sameMove = (a, b) => a.from === b.from && a.to === b.to && (a.promotion || "") === (b.promotion || "");

function findKing(board, color) {
  return board.indexOf(color === 1 ? "K" : "k");
}
function isAttacked(board, target, byColor) {
  if (target < 0) return false;
  const tr = rowOf(target), tc = colOf(target);
  for (let from = 0; from < 25; from++) {
    const piece = board[from];
    if (colorOf(piece) !== byColor) continue;
    const r = rowOf(from), c = colOf(from), type = piece.toLowerCase();
    if (type === "p") {
      const dir = byColor === 1 ? -1 : 1;
      if (tr === r + dir && Math.abs(tc - c) === 1) return true;
      continue;
    }
    if (type === "n") {
      if ((Math.abs(tr-r) === 2 && Math.abs(tc-c) === 1) ||
          (Math.abs(tr-r) === 1 && Math.abs(tc-c) === 2)) return true;
      continue;
    }
    const dr = tr-r, dc = tc-c;
    if (type === "k") {
      if (Math.max(Math.abs(dr), Math.abs(dc)) === 1) return true;
      continue;
    }
    const diagonal = Math.abs(dr) === Math.abs(dc) && dr !== 0;
    const straight = (dr === 0) !== (dc === 0);
    if (!(type === "q" ? diagonal || straight : type === "b" ? diagonal : straight)) continue;
    const sr = Math.sign(dr), sc = Math.sign(dc);
    let rr = r + sr, cc = c + sc, blocked = false;
    while (rr !== tr || cc !== tc) {
      if (board[rr * 5 + cc] !== ".") { blocked = true; break; }
      rr += sr; cc += sc;
    }
    if (!blocked) return true;
  }
  return false;
}
function inCheck(board, color) {
  return isAttacked(board, findKing(board, color), -color);
}
function pseudoMoves(board, color) {
  const moves = [];
  const add = (from, to, promotion = "") => {
    if (colorOf(board[to]) === color || board[to].toLowerCase() === "k") return;
    moves.push({ from, to, promotion });
  };
  for (let from = 0; from < 25; from++) {
    const piece = board[from];
    if (colorOf(piece) !== color) continue;
    const r = rowOf(from), c = colOf(from), type = piece.toLowerCase();
    if (type === "p") {
      const dir = color === 1 ? -1 : 1;
      const nr = r + dir;
      if (inside(nr, c) && board[nr * 5 + c] === ".") {
        const to = nr * 5 + c;
        if (nr === 0 || nr === 4) ["q", "r", "b", "n"].forEach(p => add(from, to, p));
        else add(from, to);
      }
      for (const dc of [-1, 1]) {
        const nc = c + dc;
        if (!inside(nr, nc)) continue;
        const to = nr * 5 + nc;
        if (colorOf(board[to]) === -color) {
          if (nr === 0 || nr === 4) ["q", "r", "b", "n"].forEach(p => add(from, to, p));
          else add(from, to);
        }
      }
      continue;
    }
    if (type === "n") {
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
        const nr=r+dr, nc=c+dc;
        if (inside(nr,nc)) add(from,nr*5+nc);
      }
      continue;
    }
    if (type === "k") {
      for (let dr=-1; dr<=1; dr++) for (let dc=-1; dc<=1; dc++) {
        if (!dr && !dc) continue;
        const nr=r+dr, nc=c+dc;
        if (inside(nr,nc)) add(from,nr*5+nc);
      }
      continue;
    }
    const directions = type === "b" ? [[-1,-1],[-1,1],[1,-1],[1,1]]
      : type === "r" ? [[-1,0],[1,0],[0,-1],[0,1]]
      : [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr,dc] of directions) {
      let nr=r+dr, nc=c+dc;
      while (inside(nr,nc)) {
        const to=nr*5+nc;
        if (colorOf(board[to]) === color) break;
        add(from,to);
        if (board[to] !== ".") break;
        nr+=dr; nc+=dc;
      }
    }
  }
  return moves;
}
function applyMove(board, move, color) {
  const next = clone(board);
  const piece = next[move.from];
  next[move.from] = ".";
  next[move.to] = move.promotion ? (color === 1 ? move.promotion.toUpperCase() : move.promotion) : piece;
  return next;
}
function legalMoves(board, color) {
  return pseudoMoves(board, color).filter(m => !inCheck(applyMove(board, m, color), color));
}
function toFen(board, turn) {
  const ranks = [];
  for (let r=0; r<5; r++) {
    let row="", empty=0;
    for (let c=0; c<5; c++) {
      const p=board[r*5+c];
      if (p === ".") empty++;
      else { if (empty) row += empty; empty=0; row += p; }
    }
    if (empty) row += empty;
    ranks.push(row);
  }
  return `${ranks.join("/")} ${turn === 1 ? "w" : "b"} - - 0 1`;
}
function moveToUci(move) {
  return square(move.from) + square(move.to) + (move.promotion || "");
}
function moveNotation(board, move, color) {
  const piece=board[move.from], capture=board[move.to] !== ".";
  if (piece.toLowerCase() === "p") return `${capture ? FILES[colOf(move.from)] + "x" : ""}${square(move.to)}${move.promotion ? "=" + move.promotion.toUpperCase() : ""}`;
  return `${piece.toUpperCase()}${capture ? "x" : ""}${square(move.to)}`;
}
function gameResult(board, turn) {
  const moves=legalMoves(board,turn);
  if (moves.length) return { over:false, check:inCheck(board,turn), moves };
  if (inCheck(board,turn)) return { over:true, text:`Checkmate — ${turn === 1 ? "Black" : "White"} wins.` };
  return { over:true, text:"Draw — stalemate." };
}
function renderPiece(piece) {
  if (!piece || piece === ".") return "";
  return `<span class="piece ${colorOf(piece) === 1 ? "white-piece" : "black-piece"}">${GLYPHS[piece]}</span>`;
}

const app = document.querySelector("#app");
app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand-mark">5×5</div>
      <div><p class="eyebrow">A smaller board. A full game.</p><h1>Mini Chess</h1></div>
      <div class="engine-pill"><span class="engine-dot"></span><span id="engine-label">Starting engine…</span></div>
    </header>
    <section class="game-layout">
      <div class="board-wrap">
        <div class="player-strip"><div class="avatar black-avatar">♟</div><div><strong>Computer</strong><small id="computer-state">Fairy-Stockfish</small></div><span class="turn-indicator" id="black-turn"></span></div>
        <div class="board-frame"><div class="rank-labels" id="rank-labels"></div><div class="board" id="board" role="grid" aria-label="5 by 5 chess board"></div><div class="file-labels"><span>a</span><span>b</span><span>c</span><span>d</span><span>e</span></div></div>
        <div class="player-strip bottom-player"><div class="avatar white-avatar">♙</div><div><strong>You</strong><small>White · to move first</small></div><span class="turn-indicator active" id="white-turn"></span></div>
      </div>
      <aside class="side-panel">
        <div class="status-card"><div class="status-kicker">GAME STATUS</div><h2 id="status">Your move</h2><p id="status-detail">Play as White against the computer.</p></div>
        <div class="controls">
          <label for="level">Computer thinking time</label>
          <select id="level"><option value="250">Quick · 0.25 sec</option><option value="700" selected>Normal · 0.7 sec</option><option value="1500">Strong · 1.5 sec</option><option value="3000">Deep · 3 sec</option></select>
          <div class="button-row"><button class="secondary" id="undo">↶ Undo</button><button class="secondary" id="new-game">＋ New game</button></div>
          <div class="move-box"><div class="move-heading"><span>MOVE HISTORY</span><span id="move-count">0 moves</span></div><ol id="moves" class="moves"><li class="empty-history">Your moves will appear here.</li></ol></div>
        </div>
        <p class="rules-note"><strong>Gardner’s Minichess</strong><br>5×5 board · no castling · pawns move one square · promotion on the far rank.</p>
      </aside>
    </section>
    <footer><span>Powered by Fairy-Stockfish (WASM)</span><span>Local play · no account required</span></footer>
  </main>
  <div class="promotion-backdrop hidden" id="promotion-dialog"><div class="promotion-card"><h3>Promote pawn</h3><p>Choose a piece for your pawn.</p><div id="promotion-options"></div></div></div>
`;

const boardEl = document.querySelector("#board");
const historyEl = document.querySelector("#moves");
const statusEl = document.querySelector("#status");
const detailEl = document.querySelector("#status-detail");
const engineLabel = document.querySelector("#engine-label");
const computerState = document.querySelector("#computer-state");
const undoButton = document.querySelector("#undo");
const rankLabels = document.querySelector("#rank-labels");

let board=clone(START), turn=1, selected=null, history=[], snapshots=[], thinking=false, gameOver=false;
let pendingPromotion=null, engineReady=false, engineError=false, engineWorker=null;
let engineInitResolve=null, bestMoveResolve=null;

function pushSnapshot() {
  snapshots.push({ board:clone(board), turn, history:history.slice(), gameOver });
}
function drawBoard() {
  boardEl.innerHTML="";
  rankLabels.innerHTML="<span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>";
  const moves=legalMoves(board,turn);
  for (let i=0;i<25;i++) {
    const cell=document.createElement("button");
    cell.type="button";
    cell.className=`square ${(Math.floor(i/5)+i%5)%2===0?"light":"dark"}`;
    cell.setAttribute("role","gridcell");
    cell.setAttribute("aria-label",`${square(i)} ${board[i]==="."?"empty":board[i]}`);
    if (selected===i) cell.classList.add("selected");
    if (selected!==null && moves.some(m=>m.from===selected&&m.to===i)) cell.classList.add(board[i]==="."?"legal-target":"capture-target");
    if (board[i]!==".") cell.innerHTML=renderPiece(board[i]);
    else if (selected!==null && moves.some(m=>m.from===selected&&m.to===i)) cell.innerHTML='<span class="target-dot"></span>';
    if (history.length && history.at(-1).to===i) cell.classList.add("last-move");
    cell.addEventListener("click",()=>onSquareClick(i));
    boardEl.appendChild(cell);
  }
  document.querySelector("#white-turn").classList.toggle("active",turn===1&&!thinking&&!gameOver);
  document.querySelector("#black-turn").classList.toggle("active",turn===-1&&!thinking&&!gameOver);
  undoButton.disabled=thinking||snapshots.length===0;
  document.querySelector("#move-count").textContent=`${history.length} ${history.length===1?"move":"moves"}`;
  historyEl.innerHTML=history.length ? "" : '<li class="empty-history">Your moves will appear here.</li>';
  history.forEach((m,i)=>{
    if (i%2===0) {
      const li=document.createElement("li");
      li.className="move-pair";
      li.innerHTML=`<span class="move-number">${Math.floor(i/2)+1}.</span><span class="white-move"></span><span class="black-move"></span>`;
      li.querySelector(".white-move").textContent=m;
      if (history[i+1]) li.querySelector(".black-move").textContent=history[i+1];
      historyEl.appendChild(li);
    } else {
      historyEl.lastElementChild?.querySelector(".black-move")?.replaceChildren(document.createTextNode(m));
    }
  });
}
function updateStatus(message, detail) {
  statusEl.textContent=message;
  detailEl.textContent=detail;
}
function refreshStatus() {
  const result=gameResult(board,turn);
  gameOver=result.over;
  if (result.over) updateStatus(result.text,"Start a new game to play again.");
  else if (thinking) updateStatus("Computer thinking…","Fairy-Stockfish is calculating its move.");
  else if (result.check) updateStatus(turn===1?"Your king is in check":"Computer is in check","You must get the king out of check.");
  else updateStatus(turn===1?"Your move":"Computer to move",turn===1?"Select a piece, then a highlighted square.":"Waiting for the computer.");
}
function onSquareClick(i) {
  if (thinking||gameOver||turn!==1||pendingPromotion) return;
  const piece=board[i];
  if (selected===null) {
    if (colorOf(piece)===1) { selected=i; drawBoard(); }
    return;
  }
  if (colorOf(piece)===1) { selected=i; drawBoard(); return; }
  const candidates=legalMoves(board,1).filter(m=>m.from===selected&&m.to===i);
  if (!candidates.length) { selected=null; drawBoard(); return; }
  if (candidates.length>1) { showPromotion(candidates); return; }
  commitMove(candidates[0],1);
}
function showPromotion(candidates) {
  pendingPromotion=candidates;
  const dialog=document.querySelector("#promotion-dialog");
  const options=document.querySelector("#promotion-options");
  options.innerHTML="";
  candidates.forEach(m=>{
    const btn=document.createElement("button");
    btn.className="promotion-piece";
    btn.innerHTML=renderPiece(m.promotion.toUpperCase());
    btn.title=m.promotion;
    btn.addEventListener("click",()=>{dialog.classList.add("hidden");pendingPromotion=null;commitMove(m,1);});
    options.appendChild(btn);
  });
  dialog.classList.remove("hidden");
}
function commitMove(move,color) {
  pushSnapshot();
  const notation=moveNotation(board,move,color);
  board=applyMove(board,move,color);
  history.push(notation);
  turn=-color; selected=null;
  drawBoard(); refreshStatus();
  if (turn===-1&&!gameOver) computerMove();
}
function initEngine() {
  try {
    engineWorker=new Worker(new URL(`${import.meta.env.BASE_URL}lib/stockfish.js`, window.location.href));
    engineWorker.onmessage=(event)=>{
      const line=typeof event.data==="string"?event.data:"";
      if (line==="uciok") {
        engineWorker.postMessage("setoption name UCI_Variant value gardner");
        engineWorker.postMessage("isready");
      } else if (line==="readyok") {
        engineReady=true;
        engineLabel.textContent="Engine ready";
        engineLabel.parentElement.classList.add("ready");
        engineInitResolve?.();
      } else if (line.startsWith("bestmove")) {
        const uci=line.split(/\s+/)[1];
        bestMoveResolve?.(uci);
        bestMoveResolve=null;
      } else if (line.startsWith("info depth")) {
        const depth=line.match(/\bdepth (\d+)/)?.[1];
        if (depth) computerState.textContent=`Thinking · depth ${depth}`;
      }
    };
    engineWorker.onerror=()=>{
      engineError=true; engineLabel.textContent="Engine unavailable";
      engineLabel.parentElement.classList.add("error");
      updateStatus("Engine could not load","Check that the site is hosted over HTTP and the /lib files exist.");
    };
    engineWorker.postMessage("uci");
    return new Promise(resolve=>{engineInitResolve=resolve;setTimeout(()=>{if(!engineReady){engineError=true;engineLabel.textContent="Engine load issue";resolve();}},12000);});
  } catch(e) {
    engineError=true; engineLabel.textContent="Engine unavailable";
    return Promise.resolve();
  }
}
function askEngine(fen) {
  return new Promise(resolve=>{
    bestMoveResolve=resolve;
    engineWorker.postMessage("position fen "+fen);
    engineWorker.postMessage(`go movetime ${Number(document.querySelector("#level").value)}`);
    setTimeout(()=>{if(bestMoveResolve===resolve){bestMoveResolve=null;resolve(null);}},15000);
  });
}
async function computerMove() {
  if (!engineReady||engineError) {
    updateStatus("Engine unavailable","The board works, but the computer engine did not initialize.");
    return;
  }
  thinking=true; selected=null; computerState.textContent="Thinking…"; drawBoard(); refreshStatus();
  const uci=await askEngine(toFen(board,turn));
  thinking=false;
  if (!uci||uci==="(none)") {
    refreshStatus(); computerState.textContent="Ready"; return;
  }
  const from=indexOf(uci.slice(0,2)), to=indexOf(uci.slice(2,4)), promotion=uci[4]||"";
  const move=legalMoves(board,-1).find(m=>m.from===from&&m.to===to&&(m.promotion||"")===promotion);
  if (!move) {
    updateStatus("Engine move mismatch","The engine returned a move the board did not recognize. Please start a new game.");
    computerState.textContent="Engine error"; gameOver=true; drawBoard(); return;
  }
  const notation=moveNotation(board,move,-1);
  pushSnapshot();
  board=applyMove(board,move,-1); history.push(notation); turn=1;
  computerState.textContent="Fairy-Stockfish";
  drawBoard(); refreshStatus();
}
document.querySelector("#undo").addEventListener("click",()=>{
  if (thinking||!snapshots.length) return;
  const snap=snapshots.pop();
  board=clone(snap.board); turn=snap.turn; history=snap.history.slice(); gameOver=snap.gameOver; selected=null;
  if (turn===-1 && snapshots.length) {
    const prior=snapshots.pop();
    board=clone(prior.board); turn=prior.turn; history=prior.history.slice(); gameOver=prior.gameOver;
  }
  drawBoard(); refreshStatus();
});
document.querySelector("#new-game").addEventListener("click",()=>{
  if (thinking) { engineWorker?.postMessage("stop"); thinking=false; bestMoveResolve?.("(none)"); }
  board=clone(START);turn=1;selected=null;history=[];snapshots=[];gameOver=false;pendingPromotion=null;
  document.querySelector("#promotion-dialog").classList.add("hidden");
  computerState.textContent="Fairy-Stockfish";
  drawBoard();refreshStatus();
});
drawBoard();refreshStatus();
initEngine().then(()=>{if(!engineReady&&!engineError)return;refreshStatus();});

