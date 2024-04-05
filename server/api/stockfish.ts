// import { EventEmitter } from 'events';
import { EOL } from 'os';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { Chess } from 'chess.js';

const { log } = console;

function write(proc: ChildProcessWithoutNullStreams, command: string) {
    proc.stdin.write(`${command}${EOL}`);
}

async function readBuffer(proc: ChildProcessWithoutNullStreams, condition: { (data: string): boolean }) {
    const lines: string[] = [];
    let listener: {(buffer: string): void} = () => {};
    let reject_ref = () => {};
    const p = new Promise<void>((resolve, reject) => {
        reject_ref = reject;
        let backlog = '';
        //listener gets new lines until condition is true
        listener = (buffer: string) => {
            backlog += buffer;

            let n = backlog.indexOf('\n');
            while (n > -1) {
                lines.push(backlog.substring(0, n).trim());
                backlog = backlog.substring(n + 1);
                n = backlog.indexOf('\n');
            }

            if (condition(lines[lines.length - 1])) return resolve();
            if (condition(backlog)) {
                lines.push(backlog);
                return resolve();
            }
        }
        proc.stdout.on('data', listener);
        //reject if something goes wrong during buffering
        proc.once('error', reject);
        proc.once('close', reject);
    })
    await p;
    //cleanup
    proc.stdout.removeListener('data', listener);
    proc.removeListener('error', reject_ref);
    proc.removeListener('close', reject_ref);
    return lines;
}

export default defineEventHandler<{ query: { fen?: string } }>(async (evt): Promise<string[]> => {
    let result: string[] = [];
    const query = getQuery(evt);
    if(!query.fen) {
        return result;
    }

    log('Validating FEN');
    try {
        const game = new Chess(query.fen);
    } catch(e) {
        log('Invalid FEN');
        return result;
    }
    
    log('Starting stockfish');
    const proc = spawn('./stockfish');
    proc.stdout.setEncoding('utf-8');
    write(proc, 'uci');
    result = await readBuffer(
        proc,
        line => 'uciok' === line
    );
    write(proc, 'isready');
    result = await readBuffer(
        proc,
        line => 'readyok' === line
    );
    write(proc, 'ucinewgame');
    write(proc, `position fen ` + query.fen);
    write(proc, 'go movetime 2000');
    result = await readBuffer(
        proc,
        line => 0 === line.indexOf('bestmove')
    );
    log('Shutting down stockfish');
    write(proc, 'quit');
    return result;
});