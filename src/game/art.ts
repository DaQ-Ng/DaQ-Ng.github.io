/**
 * Hand-made 1-bit pixel art for DAT.EXE, drawn as text grids (one character = one pixel).
 * Modelled on the reference sheets in design/reference/, redrawn clean at 16 px per tile.
 *
 *   k = black   d = dark grey   l = light grey   w = white   . = transparent
 *
 * Tiles are generated in tiles.ts; this file holds the characters and objects.
 */

export const PALETTE: Record<string, string> = {
  k: '#171614',
  d: '#4a4740',
  l: '#a9a392',
  w: '#efe8d8',
};

/* ───────────── Player (12×16): black messy hair, hoodie, backpack ───────────── */

const headDown = [
  '..kk.kkk.k..',
  '.kkkkkkkkkk.',
  'kkkkkkkkkkkk',
  'kkkkkkkkkkkk',
  'kkkwwkkwwkkk',
  '.kwkwwwwkwk.',
  '.kwkwwwwkwk.',
  '..kwwwwwwk..',
];
const headUp = [
  '..kk.kkk.k..',
  '.kkkkkkkkkk.',
  'kkkkkkkkkkkk',
  'kkkkkkkkkkkk',
  'kkkkkkkkkkkk',
  '.kkkkkkkkkk.',
  '.kkkkkkkkkk.',
  '..kwwwwwwk..',
];
const headSide = [
  '..kkk.kkk...',
  '.kkkkkkkkkk.',
  'kkkkkkkkkkk.',
  'kkkkkkkkkkkk',
  'kkkkkkkwwwk.',
  '.kkkkkwwkwk.',
  '.kkkkwwwkwk.',
  '..kkkwwwwk..',
];
const bodyDown = ['.kkdllllldk.', 'kwkdllllldkw', 'kkkdllllldkk', '.kkllllllkk.'];
const bodyUp = ['.kdddddddddk', 'kwdddkkddddw', 'kkdddddddddk', '.kkllllllkk.'];
const bodySide = ['.kddlllllk..', 'kdddllllwk..', 'kdddlllllk..', '.kkdllllkk..'];
const legs = {
  stand: ['..kkkkkkkk..', '..kkk..kkk..', '..kww..wwk..'],
  stepA: ['..kkkkkkkk..', '..kkk...kk..', '..kww.......'],
  stepB: ['..kkkkkkkk..', '..kk...kkk..', '.......wwk..'],
  sideStand: ['..kkkkkkk...', '...kkkkk....', '...kwwwk....'],
  sideA: ['..kkkkkkk...', '.kkk...kkk..', '.kww....wwk.'],
  sideB: ['..kkkkkkk...', '...kkkkk....', '...kwwwk....'],
};

export const player = {
  down: [
    [...headDown, ...bodyDown, ...legs.stand],
    [...headDown, ...bodyDown, ...legs.stepA],
    [...headDown, ...bodyDown, ...legs.stand],
    [...headDown, ...bodyDown, ...legs.stepB],
  ],
  up: [
    [...headUp, ...bodyUp, ...legs.stand],
    [...headUp, ...bodyUp, ...legs.stepA],
    [...headUp, ...bodyUp, ...legs.stand],
    [...headUp, ...bodyUp, ...legs.stepB],
  ],
  /** Facing right; left is drawn mirrored. */
  side: [
    [...headSide, ...bodySide, ...legs.sideStand],
    [...headSide, ...bodySide, ...legs.sideA],
    [...headSide, ...bodySide, ...legs.sideB],
    [...headSide, ...bodySide, ...legs.sideA],
  ],
};

/* ───────────── Robot guide (12×12), two bob frames + blink ───────────── */

export const robot = [
  [
    '.....k......',
    '....kwk.....',
    '.....k......',
    '..kkkkkkkk..',
    '.kwwwwwwwwk.',
    '.kwkkkkkkwk.',
    '.kwkwkkwkwk.',
    '.kwkkkkkkwk.',
    '.kwwwwwwwwk.',
    '..kkkkkkkk..',
    '...kllllk...',
    '....kkkk....',
  ],
  [
    '.....k......',
    '....kwk.....',
    '.....k......',
    '..kkkkkkkk..',
    '.kwwwwwwwwk.',
    '.kwkkkkkkwk.',
    '.kwkkkkkkwk.',
    '.kwkkkkkkwk.',
    '.kwwwwwwwwk.',
    '..kkkkkkkk..',
    '...kllllk...',
    '....kkkk....',
  ],
];

/* ───────────── Nature ───────────── */

export const tree = [
  '.....kkkkkk.....',
  '...kkwwwwlwkk...',
  '..kwwwlwwwwwlk..',
  '.kwwlwwwwwlwwlk.',
  '.kwwwwwlwwwwwlk.',
  'kwlwwwwwwwwlwwlk',
  'kwwwwlwwwwwwwllk',
  'kwwwwwwwlwwwwllk',
  'kllwwwwwwwwwlldk',
  '.kllwwlwwwwllldk',
  '.klllllwwllllldk',
  '..kllllllllldk..',
  '...kkddllddkk...',
  '.....kdllk......',
  '......kldk......',
  '......kldk......',
  '.....kdlldk.....',
  '....kkkkkkkk....',
];

export const pine = [
  '.......kk.......',
  '......kwlk......',
  '.....kwwllk.....',
  '....kwwwllk.....',
  '.....kwlldk.....',
  '....kwwwlllk....',
  '...kwwwwllldk...',
  '....kwwwlldk....',
  '...kwwwwllldk...',
  '..kwwwwwlllldk..',
  '...kwwwllllddk..',
  '..kwwwwwlllldk..',
  '.kwwwwwllllllddk',
  'kkkkkkkkkkkkkkkk',
  '......kldk......',
  '......kldk......',
  '.....kkkkkk.....',
];

export const bush = [
  '...kkk..kkkk....',
  '..kwwwkkwwwlk...',
  '.kwwlwwwwwwllk..',
  'kwwwwwwwlwwlllk.',
  'kwlwwwwwwwwlldk.',
  '.kkllllllllddk..',
  '..kkkkkkkkkkk...',
];

export const flower = ['.k.k.', 'kwkwk', '.kwk.', '..k..', '.kdk.'];

/* ───────────── Ruin & tech props ───────────── */

/** CRT terminal on a small desk. Screen area (x 3–12, y 2–8) is redrawn live. */
export const terminal = [
  '..kkkkkkkkkkkk..',
  '.kwwwwwwwwwwwwk.',
  '.kwkkkkkkkkkkwk.',
  '.kwk........kwk.',
  '.kwk........kwk.',
  '.kwk........kwk.',
  '.kwk........kwk.',
  '.kwkkkkkkkkkkwk.',
  '.kwwwwwwwwwwwwk.',
  '..kkkkkkkkkkkk..',
  'kkkkkkdddkkkkkkk',
  'kwwwwwwwwwwwwwwk',
  'kllllllllllllllk',
  'kdk..........kdk',
  'kdk..........kdk',
  'kkk..........kkk',
];
export const TERMINAL_SCREEN = { x: 4, y: 3, w: 8, h: 4 };

/** Server rack, 16×24. LED pixels (x 4/7/10 on rows 3,7,11,15) blink live. */
export const rack = [
  '.kkkkkkkkkkkkkk.',
  '.kwwwwwwwwwwwwk.',
  '.kwkkkkkkkkkkwk.',
  '.kwkdkdkdkddkwk.',
  '.kwkkkkkkkkkkwk.',
  '.kwwwwwwwwwwwwk.',
  '.kwkkkkkkkkkkwk.',
  '.kwkdkdkdkddkwk.',
  '.kwkkkkkkkkkkwk.',
  '.kwwwwwwwwwwwwk.',
  '.kwkkkkkkkkkkwk.',
  '.kwkdkdkdkddkwk.',
  '.kwkkkkkkkkkkwk.',
  '.kwwwwwwwwwwwwk.',
  '.kwkkkkkkkkkkwk.',
  '.kwkdkdkdkddkwk.',
  '.kwkkkkkkkkkkwk.',
  '.kwwwwwwwwwwwwk.',
  '.kwlllllllllllk.',
  '.kwlkklllkkllwk.',
  '.kwlllllllllllk.',
  '.kwwwwwwwwwwwwk.',
  '.kkkkkkkkkkkkkk.',
  '..kk........kk..',
];
export const RACK_LEDS = [3, 7, 11, 15].flatMap((y) => [4, 6, 8].map((x) => ({ x, y })));

/** Bookshelf, 16×24. */
export const shelf = [
  'kkkkkkkkkkkkkkkk',
  'kwwwwwwwwwwwwwwk',
  'kwkkkkkkkkkkkkwk',
  'kwkwkdklkwkdklwk',
  'kwkwkdklkwkdklwk',
  'kwkwkdklkwkdklwk',
  'kwkkkkkkkkkkkkwk',
  'kwwwwwwwwwwwwwwk',
  'kwkkkkkkkkkkkkwk',
  'kwkdklkwkwkdklwk',
  'kwkdklkwkwkdklwk',
  'kwkdklkwkwkdklwk',
  'kwkkkkkkkkkkkkwk',
  'kwwwwwwwwwwwwwwk',
  'kwkkkkkkkkkkkkwk',
  'kwklkwkdklkwkdwk',
  'kwklkwkdklkwkdwk',
  'kwklkwkdklkwkdwk',
  'kwkkkkkkkkkkkkwk',
  'kwwwwwwwwwwwwwwk',
  'kllllllllllllllk',
  'kkkkkkkkkkkkkkkk',
  '.kk..........kk.',
  '.kk..........kk.',
];

/** Workbench with tools, 32×16. */
export const bench = [
  '..........kkk.........kk........',
  '.........kwlk........kwwk.......',
  '....kk...kwlk..kkk...kwk........',
  '...kwwk..kwlk.kwwwk..kwk..kkkk..',
  '...kwwk...kk..kdddk..kwk.kwwwwk.',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  'kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk',
  'kllllllllllllllllllllllllllllllk',
  'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
  'kdk.kwwwwwwwk..........kwwwwwkdk',
  'kdk.kwkkkkkwk..........kwkkkwkdk',
  'kdk.kwwwwwwwk..........kwwwwwkdk',
  'kdk.kwkkkkkwk..........kwkkkwkdk',
  'kdk.kwwwwwwwk..........kwwwwwkdk',
  'kdk.kkkkkkkkk..........kkkkkkkdk',
  'kkk............................kkk',
];

/** Tape-deck / notes machine, 16×16. Reels spin live once repaired. */
export const machine = [
  'kkkkkkkkkkkkkkkk',
  'kwwwwwwwwwwwwwwk',
  'kwkkkkkkkkkkkkwk',
  'kwk.kkk..kkk.kwk',
  'kwkkwlwk.kwlwkwk',
  'kwkklwlkkklwlkwk',
  'kwk.kkk..kkk.kwk',
  'kwkkkkkkkkkkkkwk',
  'kwwwwwwwwwwwwwwk',
  'kwkdkwkdkwkkkkwk',
  'kwkdkwkdkwkllkwk',
  'kwwwwwwwwwwwwwwk',
  'kllllllllllllllk',
  'kkkkkkkkkkkkkkkk',
  '.kdk........kdk.',
  '.kkk........kkk.',
];

/** Signal beacon / radio mast, 16×32. The top light blinks live. */
export const beacon = [
  '.......kk.......',
  '......kwwk......',
  '......kwwk......',
  '.......kk.......',
  '.......kk.......',
  '......kkkk......',
  '......kwlk......',
  '.....kkwlkk.....',
  '......kwlk......',
  '......kwlk......',
  '.....kkwlkk.....',
  '......kwlk......',
  '.....kkwlkk.....',
  '.....kwk.kwk....',
  '.....kwk.kwk....',
  '....kkwkkkwkk...',
  '....kwk...kwk...',
  '....kwk...kwk...',
  '...kkwkkkkkwkk..',
  '...kwk.....kwk..',
  '...kwk.....kwk..',
  '..kkwkkkkkkkwkk.',
  '..kwk.......kwk.',
  '..kwk.......kwk.',
  '.kkkkkkkkkkkkkkk',
  '.kwwwwwwwwwwwwwk',
  '.kwkkkkkkkkkkkwk',
  '.kwkwkdkwkdkwkwk',
  '.kwkkkkkkkkkkkwk',
  '.kwwwwwwwwwwwwwk',
  '.kllllllllllllk.',
  '.kkkkkkkkkkkkkk.',
];

/** Wooden sign on a post, 16×16. */
export const sign = [
  '.kkkkkkkkkkkkkk.',
  'kwwwwwwwwwwwwwwk',
  'kwkkkwkkkkwkkwwk',
  'kwwwwwwwwwwwwwwk',
  'kwkkwkkkwkkkwwwk',
  'kwwwwwwwwwwwwwwk',
  'kllllllllllllllk',
  '.kkkkkkkkkkkkkk.',
  '.......kk.......',
  '.......kk.......',
  '.......kk.......',
  '.......kk.......',
  '.......kk.......',
  '......kkkk......',
  '.....kddddk.....',
  '.....kkkkkk.....',
];

/** Desk with a laptop, 16×16 (personal room). */
export const desk = [
  '................',
  '....kkkkkkkk....',
  '....kwwwwwwk....',
  '....kwkkkkwk....',
  '....kwkwwkwk....',
  '....kwwwwwwk....',
  '...kkkkkkkkkk...',
  'kkkkkkkkkkkkkkkk',
  'kwwwwwwwwwwwwwwk',
  'kllllllllllllllk',
  'kkkkkkkkkkkkkkkk',
  'kdkkwwwwwwk..kdk',
  'kdk.kwkkkwk..kdk',
  'kdk.kwwwwwk..kdk',
  'kdk.kkkkkkk..kdk',
  'kkk..........kkk',
];

export const plant = [
  '.....k..k.......',
  '....kwk.kwk.....',
  '..k.kwwkwwk.k...',
  '.kwkkwlkwlkkwk..',
  '.kwwkkwlwkkwwk..',
  '..kwwkwwwkwwk...',
  '...kkwwlwwkk....',
  '.....kkkkk......',
  '....kwwwwwk.....',
  '....kdddddk.....',
  '....kwwwwwk.....',
  '.....kkkkk......',
];

export const bed = [
  'kkkkkkkkkkkkkkkk',
  'kwwwwwkwwwwwwwwk',
  'kwkkwkkwwwwwwwwk',
  'kwwwwwkwwwwwwwwk',
  'kkkkkkkkkkkkkkkk',
  'kllllllllllllllk',
  'kllllllllllllllk',
  'kllllllllllllllk',
  'kllllllllllllllk',
  'kdddddddddddddddk',
  'kkkkkkkkkkkkkkkk',
  'kdk..........kdk',
];

export const crate = [
  'kkkkkkkkkkkkkk',
  'kwwwwwwwwwwwwk',
  'kwkkkkkkkkkkwk',
  'kwkwk....kwkwk',
  'kwk.kwk.kwk.wk',
  'kwk..kwkwk..wk',
  'kwk...kwk...wk',
  'kwk..kwkwk..wk',
  'kwk.kwk.kwk.wk',
  'kwkwk....kwkwk',
  'kwkkkkkkkkkkwk',
  'kwwwwwwwwwwwwk',
  'kllllllllllllk',
  'kkkkkkkkkkkkkk',
];

export const barrel = [
  '..kkkkkkkk..',
  '.kwwwwwwwwk.',
  'kwkkkkkkkkwk',
  'kwwwwwwwwwwk',
  'kllllllllllk',
  'kkkkkkkkkkkk',
  'kwwwwwwwwwwk',
  'kllllllllllk',
  'kkkkkkkkkkkk',
  'kwwwwwwwwwwk',
  'kllllllllllk',
  '.kkkkkkkkkk.',
];

/** Memory fragment crystal that floats above a solved machine, 8×10. */
export const crystal = [
  '...kk...',
  '..kwwk..',
  '.kwwlwk.',
  'kwwwllwk',
  'kwwwlldk',
  'kwwlllk.',
  '.kwlldk.',
  '..kwdk..',
  '...kk...',
  '........',
];

/** Prompt bubble "E" shown above interactables, 9×9. */
export const promptE = [
  'kkkkkkkkk',
  'kwwwwwwwk',
  'kwkkkkwwk',
  'kwkwwwwwk',
  'kwkkkwwwk',
  'kwkwwwwwk',
  'kwkkkkwwk',
  'kwwwwwwwk',
  'kkkk.kkkk',
];
