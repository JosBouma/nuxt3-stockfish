<script lang="ts" setup>
import { type Square } from 'chess.js';
import Game, { type Cell } from './lib/game';

const game = new Game();
const moveFrom = ref<Cell | null>(null);
const highlight = ref<Square[]>([]);
const ascii = ref<string>(game.getAscii());
const fen = ref<string>(game.getFen());
const flipBoard = ref(true);

const board = computed(() => {
    return game.getBoard(highlight.value, flipBoard.value);
});

const { data: bestmove } = useFetch('/api/stockfish', {
    query: {
        fen
    },
    transform(res: string[]): string {
        let bestmove = res.pop() || '';
        highlight.value = [
            bestmove.substring(9, 11) as Square,
            bestmove.substring(11, 13) as Square,
        ];
        return bestmove;
    }
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

    if (!from || !game.canMove(from.name, cell.name)) {
        return;
    }

    // Do a move
    game.setMove(from.name, cell.name);
    moveFrom.value = null;
    highlight.value = [];
    ascii.value = game.getAscii();
    fen.value = game.getFen();
}

function handleResetClikc() {
    game.reset();
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
    grid-template-columns: 1fr 2fr;
    gap: 2rem;
    padding: 2rem;
}

.sidepanel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 12rem;
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

.sidepanel button {
    background: #279e1c;
    width: fit-content;
    margin: 0 auto auto auto;
    color: #fff;
    padding: 0.5rem 1rem;
    font-size: 2rem;
}

#board {
    --cell-size: 80px;
    display: grid;
    grid-template-columns: repeat(8, var(--cell-size));
    grid-template-rows: repeat(8, var(--cell-size));
    width: calc(var(--cell-size) * 8);
    height: calc(var(--cell-size) * 8);
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
                <h2>ASCII</h2>
                <pre>{{ ascii }}</pre>
                <h2>FEN</h2>
                <p class="fen">{{ fen }}</p>
                <h2>Stockfish</h2>
                <p>{{ bestmove }}</p>
                <h2>Highlight</h2>
                <p>{{ highlight }}</p>
                <h2>Perspective</h2>
                <label>
                    <input type="checkbox" v-model="flipBoard">
                    <span>Toggle {{ flipBoard ? 'white' : 'black' }}</span>
                </label>
                <button @click="handleResetClikc">New game</button>
            </div>
            <div id="board">
                <p v-for="cell in board" :class="getCellClass(cell)" @click="handleCellClick(cell)">
                    <span :class="getPieceClass(cell)">{{ cell.name }}</span>
                </p>
            </div>
        </client-only>
    </div>
</template>
