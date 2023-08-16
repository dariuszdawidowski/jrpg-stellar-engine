import Sprite from './sprite.js';
import Player from './player.js';
import Engine from './engine.js';

// Globals
const canvas = document.getElementById('main');

// Window
function fitCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}            

// Init
window.addEventListener('load', () => {

    // Canvas init
    fitCanvas();
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;

    // Engine start
    const engine = new Engine();

    // Ground
    const ground = new Sprite({
        canvas,
        context,
        resource: '#env1',
        width: 320,
        height: 48,
        cell: 16,
        scale: 4,
    });

    engine.env.ground.push(ground);

    const tiles = [
        [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36,  0,  1,  1,  1,  2, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36, 20, 21, 21, 21, 22, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36, 20, 21, 21, 21, 22, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36, 20, 21, 21, 21, 22, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36, 40, 41, 41, 41, 42, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36],
        [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36],
    ];
    ground.renderArea(-10, -8, tiles);

    // Player
    const player = new Player({
        canvas,
        context,
        resource: '#char1',
        width: 48,
        height: 80,
        cols: 3,
        rows: 4,
        scale: 4,
    });
    player.render();

});

// Resize
window.addEventListener('resize', () => {
    fitCanvas();
});

