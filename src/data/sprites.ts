/**
 * 1-bit pixel art used around the site, drawn as text grids.
 * Colour keys (see `tones`):
 *   k = ink   d = dark grey   g = mid grey   l = light grey   w = paper   c = currentColor   . = transparent
 * Rows can differ in length; PixelArt pads them on the right.
 */

export const tones: Record<string, string> = {
  k: 'var(--ink)',
  d: 'var(--tone-dark)',
  g: 'var(--tone-mid)',
  l: 'var(--tone-light)',
  w: 'var(--paper)',
  c: 'currentColor',
};

export const cloud = [
  '........kkkkk...........',
  '.....kkkwwwwwkk..kkkk...',
  '...kkwwwwwwwwwwkkwwwwk..',
  '..kwwwwwwwwwwwwwwwwwwwk.',
  '.kwwwwwwwwwwwwwwwwwwwwwk',
  '.kwwwwwwwwwwwwwwwwwllllk',
  '..kkllllllllllllllllkk..',
  '....kkkkkkkkkkkkkkkk....',
];

export const mailbox = [
  '..kkkkkkkk....',
  '.kwwwwwwwwk.kk',
  'kwwwwwwwwwwkck',
  'kwkkkkkkkkwkck',
  'kwwwwwwwwwwkk.',
  'kwkkkkkkkkwk..',
  'kwwwwwwwwwwk..',
  'kkkkkkkkkkkk..',
  '.....kk.......',
  '.....kk.......',
  '.....kk.......',
  '.....kk.......',
  '.....kk.......',
  '....kkkk......',
];

export const fence = [
  '.k.....k.....k.....k.',
  'kwk...kwk...kwk...kwk',
  'kkkkkkkkkkkkkkkkkkkkk',
  'kwk...kwk...kwk...kwk',
  'kkkkkkkkkkkkkkkkkkkkk',
  'kwk...kwk...kwk...kwk',
  'kkk...kkk...kkk...kkk',
];

/** 8×8 icons drawn in currentColor so they follow the text colour. */
export const icons = {
  home: [
    '...cc...',
    '..cccc..',
    '.cccccc.',
    'cccccccc',
    '.c....c.',
    '.c.cc.c.',
    '.c.cc.c.',
    '.cccccc.',
  ],
  projects: [
    '........',
    'ccc.....',
    'c..ccccc',
    'c......c',
    'c......c',
    'c......c',
    'cccccccc',
    '........',
  ],
  about: [
    '..cccc..',
    '..cccc..',
    '..cccc..',
    '...cc...',
    '.cccccc.',
    'cccccccc',
    'cccccccc',
    'cc....cc',
  ],
  skills: [
    '...cc...',
    '.c.cc.c.',
    '..cccc..',
    'ccc..ccc',
    'ccc..ccc',
    '..cccc..',
    '.c.cc.c.',
    '...cc...',
  ],
  contact: [
    '........',
    'cccccccc',
    'cc....cc',
    'c.c..c.c',
    'c..cc..c',
    'c......c',
    'cccccccc',
    '........',
  ],
  download: [
    '...cc...',
    '...cc...',
    '...cc...',
    '.cccccc.',
    '..cccc..',
    '...cc...',
    'c......c',
    'cccccccc',
  ],
  book: [
    '........',
    'ccc..ccc',
    'c..cc..c',
    'c..cc..c',
    'c..cc..c',
    'c..cc..c',
    'cccccccc',
    '........',
  ],
  monitor: [
    'cccccccc',
    'c......c',
    'c.cc...c',
    'c......c',
    'c.ccc..c',
    'cccccccc',
    '...cc...',
    '.cccccc.',
  ],
} as const;

export type IconName = keyof typeof icons;
