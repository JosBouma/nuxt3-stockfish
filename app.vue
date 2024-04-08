<script lang="ts" setup>
import { type Square } from 'chess.js';
import Game, { type Cell } from './lib/game';

interface History {
    from: Cell;
    to: Square;
    fen: string;
    index: number;
}

const game = new Game();
const moveFrom = ref<Cell | null>(null);
const ascii = ref<string>(game.getAscii());
const fen = ref<string>(game.getFen());
const flipBoard = ref(true);
const history = ref<History[]>([]);

const { data: bestmove, status } = await useFetch('/api/stockfish', {
    query: {
        fen
    },
    transform(res: string[]): Square[] {
        let bestmove = res.pop() || '';
        return [
            bestmove.substring(9, 11) as Square,
            bestmove.substring(11, 13) as Square,
        ];
    }
});

const highlight = ref<Square[]>([]);

const board = computed(() => {
    const moves = unref(bestmove) || [];
    return game.getBoard(
        [
            ...moves,
            ...highlight.value
        ],
        flipBoard.value
    );
});


function handleCellClick(cell: Cell) {
    const { piece } = cell;
    const from: Cell | null = unref(moveFrom);

    // Select a piece
    if (piece && piece.color === game.getTurn()) {
        moveFrom.value = cell;
        highlight.value = game.getMoves(cell.name);
        return;
    }

    // If piece has nothing to do
    if (!from || !game.canMove(from.name, cell.name)) {
        return;
    }

    // Do a move
    game.setMove(from.name, cell.name);
    moveFrom.value = null;
    highlight.value = [];
    ascii.value = game.getAscii();
    fen.value = game.getFen();
    history.value.push({
        from,
        to: cell.name,
        fen: game.getFen(),
        index: history.value.length
    });
}

function handleResetClick() {
    game.reset();
    highlight.value = [];
    ascii.value = game.getAscii();
    fen.value = game.getFen();
}

function handleHistoryClick(move: History) {
    game.setFen(move.fen);
    history.value = history.value.slice(0, move.index + 1);
    moveFrom.value = null;
    highlight.value = [];
    ascii.value = game.getAscii();
    fen.value = game.getFen();
}

function getCellClass(cell: Cell) {
    return ['cell', 'name-' + cell.name, 'color-' + cell.color, (cell.highlight ? 'highlight' : '')];
}

function getPieceClass(cell: Cell) {
    return ['piece', cell.piece ? 'color-' + cell.piece.color : '', 'type-' + (cell.piece?.type || 'none')];
}
</script>

<style>
* {
    margin: 0;
    padding: 0;
}

html,
body {
    height: 100%;
    margin: 0;
    padding: 0;
}

body {
    min-height: 100%;
}

#__nuxt {
    height: 100%;
    display: grid;
}

#interface {
    display: grid;
    grid-template-columns: 1fr 6fr;
}

.sidepanel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: #eee;
    padding: 1rem;
    min-width: 12rem;
}

.sidepanel .fen {
    padding: 1rem;
    word-wrap: break-word;
    font-size: 0.8rem;
}

.sidepanel .state p {
    font-size: 2rem;
    text-transform: capitalize;
}

.sidepanel button,
.sidepanel .button {
    background: #279e1c;
    width: fit-content;
    color: #fff;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border: 1px solid #000;
}

.sidepanel .toggle-perspective {
    user-select: none;
}

.sidepanel .toggle-perspective input {
    display: none;
}

.sidepanel .moves {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    flex-wrap: wrap;
    gap: 1rem;
}

.sidepanel .moves button {
    font-size: 0.8rem;
}

#board {
    --cell-size: 80px;
    display: grid;
    grid-template-columns: repeat(8, var(--cell-size));
    grid-template-rows: repeat(8, var(--cell-size));
    width: calc(var(--cell-size) * 8);
    height: calc(var(--cell-size) * 8);
    user-select: none;
}

#board .cell {
    display: grid;
    margin: 0;
    width: var(--cell-size);
    height: var(--cell-size);
    color: #fff;
    font-size: 1.25rem;
    text-shadow: 1px 1px 3px #000;
}

#board .cell::after {
    content: '';
    height: 35%;
    width: 35%;
    background: #461f9a72;
    grid-row: 1;
    grid-column: 1;
    opacity: 0;
    margin: auto;
    border-radius: 50%;
    user-select: none;
}

#board .cell.highlight::after {
    opacity: 1;
}

#board .cell.color-w {
    background: #e9e9e9;
    color: #000;
    text-shadow: none;
}

#board .cell.color-b {
    background: #279e1c;
}

#board .cell .piece {
    /* King standard pos */
    --pos-x: 0;
    --pos-y: 0;
    grid-row: 1;
    grid-column: 1;
    width: calc(var(--cell-size) / 1.25);
    height: calc(var(--cell-size) / 1.25);
    margin: auto;
    background: url('~/assets/svg/pieces.svg');
    background-size: 605%;
    background-position: calc(var(--pos-y) * 100%) calc(var(--pos-x) * 100%);
}

#board .cell .piece.type-none {
    background: none;
}

#board .cell .piece.color-b {
    --pos-x: 1;
}

#board .cell .piece.type-p {
    --pos-y: 1;
}

#board .cell .piece.type-r {
    --pos-y: 2;
}

#board .cell .piece.type-n {
    --pos-y: 3;
}

#board .cell .piece.type-b {
    --pos-y: 4;
}

#board .cell .piece.type-q {
    --pos-y: 5;
}
</style>

<template>
    <div id="interface">
        <client-only>
            <div class="sidepanel">
                <h1>Simple chess</h1>
                <h2>Stockfish</h2>
                <p>Status: {{ status }}</p>
                <p>{{ bestmove }}</p>
                <h2>Highlight</h2>
                <p>{{ highlight }}</p>
                <h2>Perspective</h2>
                <label class="toggle-perspective button">
                    <input type="checkbox" v-model="flipBoard">
                    <span>Toggle {{ flipBoard ? 'white' : 'black' }}</span>
                </label>
                <h2>Reset game</h2>
                <button @click="handleResetClick">New game</button>
                <h2>History</h2>
                <div class="moves">
                    <p v-for="point in (history.slice().reverse())" :key="point.index">
                        <button @click="handleHistoryClick(point)">
                            <span :class="point.from.piece?.color">({{ point.index + 1 }}) {{ point.from.name }} {{ point.to }}</span>
                        </button>
                    </p>
                </div>
            </div>
            <div id="board">
                <p v-for="cell in board" :class="getCellClass(cell)" @click="handleCellClick(cell)" :key="cell.name">
                    <span :class="getPieceClass(cell)">{{ cell.name }}</span>
                </p>
            </div>
        </client-only>
    </div>
</template>
