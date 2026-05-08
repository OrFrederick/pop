import './styles.css';
import { Game } from './game/Game';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const game = new Game(canvas);

function loop(): void {
  game.tick();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
