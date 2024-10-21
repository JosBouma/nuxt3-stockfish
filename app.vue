<script lang="ts" setup>
import { Chess, SQUARES, validateFen } from 'chess.js';
import type { Piece, Square } from 'chess.js';

interface Cell {
  className: string;
  name: Square;
  piece: Piece | false;
}

const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const fen = ref(startFen);
const uiFlipped = ref(false);
const moveFrom = ref<Cell | null>(null);
const highlight = ref<Square[]>([]);
const hoverMoves = ref<Square[]>([]);
const gameHistory = ref<string[]>([startFen]);

const { data: bestmove, status } = await useFetch<Square[]>('/api/stockfish', {
  server: false,
  query: {
    fen
  },
  transform(res: string[]): Square[] {
    console.log('Stockfish response', res);
    let move = res.pop() || '';
    return [
      move.substring(9, 11) as Square,
      move.substring(11, 13) as Square,
    ];
  }
});

const statusColor = computed(() => ({
  'text-red-600': 'error' === status.value,
  'text-green-600': 'success' == status.value
}));

const currentPlayerColor = computed(() => {
  // Maybe add some cache for the game instance (?)
  return new Chess(fen.value).turn() === 'w' ? 'White' : 'Black';
});

const boardData = computed(() => {
  const curFen = String(fen.value);
  validateFen
  const game = new Chess(unref(fen));
  const data: Cell[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      data.push({
        className: (row + col) % 2 === 0 ? 'bg-gray-100 text-black' : 'bg-blue-300 text-white',
        name: SQUARES[data.length],
        piece: game.get(SQUARES[data.length]) as Piece | false
      });
    }
  }
  return unref(uiFlipped) ? data : data.reverse();
});

function handleCellClick(cell: Cell) {
  const game = new Chess(unref(fen));
  const { piece } = cell;
  const from: Cell | null = unref(moveFrom);
  const moves = game.moves({ square: cell.name, verbose: true }).map(s => s.to);

  // Select a piece
  if (piece && piece.color === game.turn()) {
    moveFrom.value = cell;
    highlight.value = moves;
    return;
  }

  // If nothing to do
  if (!from) {
    return;
  }

  // Do a move
  console.log('Trying move');
  try {
    game.move({ from: from.name, to: cell.name });
    moveFrom.value = null;
    highlight.value = [];
    fen.value = game.fen();
    gameHistory.value.push(fen.value);
  } catch (e) {
    moveFrom.value = null;
    console.log('Illegal move', { from: from.name, to: cell.name });
  }
}

function handleHistoryLoadClick(localFen: string) {
  // Maybe do some confirmation here?
  const historyFens = unref(gameHistory);
  gameHistory.value = historyFens.slice(0, historyFens.indexOf(localFen));
  fen.value = localFen;
}

function handleHover(cell: Cell) {
  const game = new Chess(unref(fen));
  hoverMoves.value = game.moves({ square: cell.name, verbose: true }).map(s => s.to);
}
</script>

<style>
.board {
  max-width: 1600px;
  min-width: 300px;
  grid-template-columns: repeat(8, 1fr);
  grid-template-rows: repeat(8, 1fr);
  aspect-ratio: 1 / 1;
}

.interface {
  grid-template-columns: auto 1fr;
  max-width: 90rem;
}

.cell>* {
  grid-row: 1;
  grid-column: 1;
}
</style>

<template>
  <div class="interface md:grid min-h-svh m-auto bg-slate-100">
    <div class="board overflow-hidden grid">
      <div v-for="(cell, idx) in boardData" class="cell grid relative"
        :class="[cell.className, { '': cell.name === moveFrom?.name }]" :key="idx + 'board-cell'"
        @mouseover="handleHover(cell)" @mouseout="hoverMoves = []" @click="handleCellClick(cell)">
        <chess-piece v-if="cell.piece" :piece="cell.piece" />
        <p class="text-xs font-semibold mt-auto ml-auto mb-1 mr-1 shadow-sm">{{ cell.name }}</p>
        <p class="bg-blue-800 w-4 h-4 m-auto z-20 opacity-0"
          :class="{ 'opacity-70 transition-all animate-pulse': bestmove?.includes(cell.name) }"></p>
        <p class="bg-green-100 w-4 h-4 m-auto z-10 opacity-0" :class="{ 'opacity-50': highlight.includes(cell.name) }">
        </p>
        <p class="bg-yellow-400 w-4 h-4 m-auto z-10 opacity-0"
          :class="{ 'opacity-90': hoverMoves.includes(cell.name) }"></p>
      </div>
    </div>
    <div class="info-panel grid gap-2 mb-auto p-8">
      <h1 class="text-3xl">Stockfish interface</h1>
      <button @click="fen = startFen" class="bg-blue-800 text-white px-2 py-1">New game</button>
      <label class="flex gap-3 text-2xl items-center leading-tight bg-slate-300 p-3">
        <input type="checkbox" class="w-4 h-4" v-model="uiFlipped">
        <span>Flip UI</span>
      </label>
      <p><span>FEN: </span><span class="text-xs">{{ fen }}</span></p>
      <p>Current move: {{ currentPlayerColor }}</p>
      <p>Highlight: {{ highlight }}</p>
      <p>Best move: [{{ bestmove }}] -&gt; <span class="font-semibold" :class="statusColor">Stockfish status: {{ status
          }}</span></p>
      <p>Highlight move: {{ hoverMoves }}</p>
      <h2 class="text-xl font-semibold">Game history</h2>
      <div class="flex flex-wrap">
        <p v-for="(moveFen, idx) in gameHistory" class="p-1 rounded-lg flex gap-2 items-center border border-blue-800">
          <span class="block bg-blue-800 text-white w-8 text-center rounded-r-md">{{ idx + 1 }} &gt;</span>
          <button class="p-2 bg-blue-700 text-white rounded-r-md" @click="handleHistoryLoadClick(moveFen)">Load</button>
          <button class="p-2 bg-blue-700 text-white rounded-r-md" @mouseover="">Preview</button>
        </p>
      </div>
    </div>
  </div>
</template>