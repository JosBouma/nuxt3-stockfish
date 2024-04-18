<script lang="ts" setup>
import { Chess, SQUARES } from 'chess.js';
import type { Color, Square, Piece } from 'chess.js';

export type Cell = {
  name: Square,
  color: Color,
  piece?: Piece | null
}

interface History {
  from: Cell;
  to: Square;
  fen: string;
  index: number;
}

const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const fen = ref(startingFen);
const flipBoard = ref(false);
const moveFrom = ref<Cell | null>(null);
const highlight = ref<Square[]>([]);
const history = ref<History[]>([]);
const board = computed((): Cell[] => {
  const game = new Chess(unref(fen));
  let flip = true;
  let i = 1;
  const ret = SQUARES.map(name => {
    const cell: Cell = {
      name,
      color: flip ? 'w' : 'b',
      piece: game.get(name) || null
    };
    if (i % 8) {
      flip = !flip;
    }
    i++;
    return cell;
  });
  return flipBoard.value ? ret.reverse() : ret;
});

const { data: bestmove, status } = await useFetch('/api/stockfish', {
  server: false,
  query: {
    fen
  },
  transform(res: string[]): Square[] {
    console.log('Stockfish:', res);
    let move = res.pop() || '';
    return [
      move.substring(9, 11) as Square,
      move.substring(11, 13) as Square,
    ];
  }
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
    history.value.push({
      from,
      to: cell.name,
      fen: fen.value,
      index: history.value.length
    });
  } catch (e) {
    moveFrom.value = null;
    console.log('Illegal move', { from: from.name, to: cell.name });
  }
}

function handleNewGameClick() {
  fen.value = startingFen;
  moveFrom.value = null;
  highlight.value = [];
  history.value = [];
}

function handleHistoryClick(move: History) {
  history.value = history.value.slice(0, move.index + 1);
  moveFrom.value = null;
  highlight.value = [];
  fen.value = move.fen;
}
</script>

<template>
  <div id="interface">
    <div id="board">
      <div v-for="cell in board" class="cell" :class="`color-${cell.color}`" @click="handleCellClick(cell)"
        :key="cell.name">
        <chess-piece v-if="cell.piece" :owner="cell.piece.color" :type="cell.piece.type" />
        <p>{{ cell.name.toUpperCase() }}</p>
        <div class="highlight" :class="{ active: highlight.includes(cell.name) }"></div>
        <div class="bestmove" :class="{ active: bestmove?.includes(cell.name) }"></div>
      </div>
    </div>
    <div id="sidepanel">
      <h1>FEN</h1>
      <p class="fen">{{ fen }}</p>
      <h2>Controls</h2>
      <div class="buttons">
        <button @click="flipBoard = !flipBoard">Flip view</button>
        <button @click="handleNewGameClick">New game</button>
      </div>
      <h2>Promotion</h2>
      <div class="promotions">
        <chess-piece :owner="flipBoard ? 'b' : 'w'" type="q" />
        <chess-piece :owner="flipBoard ? 'b' : 'w'" type="r" />
        <chess-piece :owner="flipBoard ? 'b' : 'w'" type="b" />
        <chess-piece :owner="flipBoard ? 'b' : 'w'" type="n" />
      </div>
      <h2>Moves</h2>
      <div class="moves">
        <p v-for="point in (history.slice().reverse())" :key="point.index">
          <button @click="handleHistoryClick(point)">
            <span :class="point.from.piece?.color">({{ point.index + 1 }}) {{ point.from.name }} {{ point.to }}</span>
          </button>
        </p>
      </div>
    </div>
  </div>
</template>
