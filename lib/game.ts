import { Chess, SQUARES } from 'chess.js';
import type { Square, Color, Piece } from 'chess.js';

export type Cell = {
    name: Square,
    color: Color,
    highlight: boolean,
    piece?: Piece | null
}

export type State = 'idle' | 'gameover';

export default class Game {
    protected game: Chess = new Chess();

    public reset() {
        this.game = new Chess();
    }

    public getBoard(highlight: Square[] = [], mirror = false): Cell[] {
        let flip = true;
        let i = 1;
        const board = SQUARES.map(name => {
            const cell: Cell = {
                name,
                color: flip ? 'w' : 'b',
                highlight: highlight.includes(name),
                piece: this.game.get(name) || null
            };
            if (i % 8) {
                flip = !flip;
            }
            i++;
            return cell;
        });
        return mirror ? board : board.reverse();
    }

    public getAscii() {
        return this.game.ascii();
    }

    public getFen() {
        return this.game.fen();
    }

    public setFen(fen: string) {
        this.game.load(fen);
    }

    public getMoves(square: Square) {
        return this.game.moves({ square, verbose: true }).map(s => s.to);
    }

    public canMove(from: Square, to: Square) {
        return this.getMoves(from).includes(to);
    }

    public setMove(from: Square, to: Square): Cell[] | null {
        try {
            this.game.move({ from, to });
            return this.getBoard();
        } catch (e) {
            return null;
        }
    }

    public getTurn() {
        return this.game.turn();
    }

    public isGameOver() {
        return this.game.isGameOver();
    }

    public state(): State {
        return this.game.isGameOver() ? 'gameover' : 'idle';
    }

    public gethistory() {
        return this.game.history();
    }
}