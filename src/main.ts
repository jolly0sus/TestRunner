import { Game } from './Game';

const mount = document.getElementById('app');
if (!mount) throw new Error('#app mount element not found');

const game = new Game();
game.start(mount).catch((err) => {
  console.error('Failed to start game:', err);
  mount.innerHTML =
    '<p style="color:#fff;font-family:sans-serif;padding:24px">Failed to load the game. Check the console.</p>';
});
