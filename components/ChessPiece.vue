<script lang="ts" setup>
import type { PieceSymbol, Square, Color } from 'chess.js';

const props = defineProps({
  owner: {
    type: String as PropType<Color>,
    required: true
  },
  type: {
    type: String as PropType<PieceSymbol>,
    required: true
  },

});

const pieceClass = computed(() => {
  return [
    `color-${props.owner}`,
    `type-${props.type}`,
  ];
})
</script>

<style>
.chess-piece {
  --pos-x: 0;
  --pos-y: 0;
  width: calc(var(--cell-size) / 1.25);
  height: calc(var(--cell-size) / 1.25);
  grid-row: 1;
  grid-column: 1;
  margin: auto;
  background: url('~/assets/svg/pieces.svg');
  background-size: 600%;
  background-position: calc(var(--pos-y) * 100%) calc(var(--pos-x) * 100%);
  filter: drop-shadow(1px 2px 1px #000000);
}

.chess-piece.color-b {
    --pos-x: 1;
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