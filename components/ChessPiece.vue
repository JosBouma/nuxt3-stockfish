<script lang="ts" setup>
import type { Piece } from 'chess.js';

const props = defineProps({
  piece: {
    type: Object as PropType<Piece>,
    required: true
  }
});

const pieceClass = computed(() => {
  if(!props.piece) {
    return ['type-none'];
  }
  return [
    `color-${props.piece.color}`,
    `type-${props.piece.type}`,
  ];
})
</script>

<style>
.chess-piece {
  --pos-x: 0;
  --pos-y: 0;
  width: calc(var(--cell-size) / 1.1);
  height: calc(var(--cell-size) / 1.1);
  background: url('~/assets/svg/pieces.svg');
  background-size: 600%;
  background-position: calc(var(--pos-y) * 100%) calc(var(--pos-x) * 100%);
  transform: translateX(1%) translateY(-1%);
  transition: all 0.2s ease-in-out;
  position: relative;
}

.chess-piece:hover {
  transform: scale(1.1);
  transform-origin: center;
}

.chess-piece.type-none {
  background: none;
}

.chess-piece.color-b {
    --pos-x: 1;
    filter: drop-shadow(1px 2px 1px #d88c8c);
    opacity: 0.7;
}

.chess-piece.type-p {
    --pos-y: 1;
}

.chess-piece.type-r {
    --pos-y: 2;
}

.chess-piece.type-n {
    --pos-y: 3;
}

.chess-piece.type-b {
    --pos-y: 4;
}

.chess-piece.type-q {
    --pos-y: 5;
}
</style>

<template>
  <div class="chess-piece" :class="pieceClass"></div>
</template>