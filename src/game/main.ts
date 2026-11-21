/**
 * DAT.EXE glue: boot screen, keyboard/touch input, dialogue box, puzzles, panels,
 * settings and save data. The canvas world lives in engine.ts; the markup and the
 * portfolio content are rendered by src/components/DatExe.astro from src/data/portfolio.ts.
 */
import { createEngine, type Target } from './engine';
import { SPAWN, type Obj } from './map';
import {
  initialQuest, parseQuest, recover, collect, discover, restore, allFragments, hasFragment, hint,
  FRAGMENTS, type QuestState, type FragmentId, type DiscoveryId,
} from './quest';
import { openDialogue, advance, typeChars, closeDialogue, currentLine, lineComplete, type DialogueState, type Line, closedDialogue } from './dialogue';
import { safeStore, readJSON, writeJSON, SAVE_KEY, SETTINGS_KEY, parseSettings, type Settings } from './storage';
import {
  newCircuit, pickLeft, pickRight, circuitSolved, type CircuitState,
  newDungeon, activateRoom, type Dungeon,
  newTuner, turnDial, tunerSolved, DIAL_STEPS, type TunerState,
} from './puzzles';
import { sfx, setMuted } from './audio';

const NAMES = { robot: 'BYTE', system: 'SYSTEM', dat: 'DAT' } as const;
const FRAGMENT_TITLES: Record<FragmentId, string> = { api: 'Book Marketplace API', dungeon: 'Dungeon Crawler', notes: 'NoteWave' };

export function mountDatExe(root: HTMLElement) {
  const $ = <E extends Element = HTMLElement>(s: string) => root.querySelector<E>(s)!;
  const $$ = <E extends Element = HTMLElement>(s: string) => [...root.querySelectorAll<E>(s)];
  const dlg = (id: string) => document.getElementById(id) as HTMLDialogElement;

  const screen = $('.dx-screen');
  const canvas = $<HTMLCanvasElement>('[data-dx-canvas]');
  const boot = $('[data-dx-boot]');
  const bootLog = $('[data-dx-bootlog]');
  const bootActions = $('[data-dx-bootactions]');
  const dBox = $('[data-dx-dialogue]');
  const dWho = $('[data-dx-who]');
  const dText = $('[data-dx-text]');
  const live = $('[data-dx-live]');
  const toast = $('[data-dx-toast]');
  const areaEl = $('[data-dx-area]');

  /* ───────────── Save data & settings ───────────── */
  const kv = safeStore();
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let quest: QuestState = readJSON(kv, SAVE_KEY, parseQuest);
  let settings: Settings = readJSON(kv, SETTINGS_KEY, (r) => parseSettings(r, prefersReduced));
  const save = () => writeJSON(kv, SAVE_KEY, quest);
  const saveSettings = () => writeJSON(kv, SETTINGS_KEY, settings);

  /* ───────────── Engine ───────────── */
  let booting = true;
  let dialogue: DialogueState = closedDialogue();
  let typer = 0;
  let afterDialogue: (() => void) | null = null;

  const engine = createEngine(
    canvas,
    {
      interact: onInteract,
      nearby(t) {
        live.textContent = t ? `Press E to ${t.kind === 'robot' ? 'talk to BYTE' : (t.obj.label ?? 'interact').toLowerCase()}` : '';
      },
      area(name) {
        areaEl.textContent = name;
      },
    },
    () => quest,
  );

  const anyDialogOpen = () => !!document.querySelector('dialog.dx-dialog[open]');
  const syncPause = () => engine.setPaused(booting || dialogue.open || anyDialogOpen());

  /* ───────────── Settings UI ───────────── */
  function applySettings() {
    setMuted(settings.muted);
    engine.setReduced(settings.reducedMotion);
    root.classList.toggle('dx-reduced', settings.reducedMotion);
    $$('[data-dx-mute]').forEach((b) => {
      b.setAttribute('aria-pressed', String(settings.muted));
      b.querySelector('[data-label]')!.textContent = settings.muted ? 'Sound off' : 'Sound on';
    });
    $$('[data-dx-motion]').forEach((b) => {
      b.setAttribute('aria-pressed', String(settings.reducedMotion));
      b.querySelector('[data-label]')!.textContent = settings.reducedMotion ? 'Reduced motion: on' : 'Reduced motion: off';
    });
    $$('[data-dx-storage-note]').forEach((n) => (n.hidden = kv.persistent));
  }
  $$('[data-dx-mute]').forEach((b) => b.addEventListener('click', () => {
    settings = { ...settings, muted: !settings.muted };
    saveSettings();
    applySettings();
    sfx.blip();
  }));
  $$('[data-dx-motion]').forEach((b) => b.addEventListener('click', () => {
    settings = { ...settings, reducedMotion: !settings.reducedMotion };
    saveSettings();
    applySettings();
  }));
  applySettings();

  /* ───────────── HUD ───────────── */
  function renderHud() {
    $$('[data-frag]').forEach((el) => {
      const got = hasFragment(quest, el.dataset.frag as FragmentId);
      el.classList.toggle('got', got);
    });
    $('[data-dx-fragcount]').textContent = String(quest.fragments.length);
    $$('[data-dx-badge]').forEach((el) => (el.hidden = !hasFragment(quest, el.dataset.dxBadge as FragmentId)));
    $$('[data-dx-progress]').forEach((el) => {
      el.textContent = quest.restored
        ? 'Save restored. Every memory recovered.'
        : `${quest.fragments.length} of 3 memory fragments recovered in the adventure. Everything is listed here either way.`;
    });
  }

  let toastTimer = 0;
  function showToast(text: string) {
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toast.hidden = true), 2600);
  }

  /* ───────────── Dialogue box ───────────── */
  function say(lines: Line[], then?: () => void) {
    clearInterval(typer);
    dialogue = openDialogue(lines, settings.reducedMotion);
    afterDialogue = then ?? null;
    renderDialogue();
    syncPause();
    typer = window.setInterval(() => {
      if (!dialogue.open || lineComplete(dialogue)) return;
      dialogue = typeChars(dialogue, 2);
      renderDialogue();
    }, 24);
  }
  function renderDialogue() {
    const line = currentLine(dialogue);
    dBox.hidden = !line;
    if (!line) return;
    dBox.dataset.who = line.who;
    dWho.textContent = NAMES[line.who];
    dText.textContent = line.text.slice(0, dialogue.shown);
    dBox.classList.toggle('done', lineComplete(dialogue));
  }
  function nextLine(close = false) {
    const wasOpen = dialogue.open;
    dialogue = close ? closeDialogue() : advance(dialogue, settings.reducedMotion);
    if (wasOpen) sfx.blip();
    renderDialogue();
    if (!dialogue.open) {
      clearInterval(typer);
      syncPause();
      screen.focus({ preventScroll: true });
      const then = afterDialogue;
      afterDialogue = null;
      then?.();
    }
  }
  dBox.addEventListener('click', () => nextLine());

  /* ───────────── Dialogs (panels, memories, puzzles) ───────────── */
  function openDialog(id: string) {
    const d = dlg(id);
    if (!d || d.open) return;
    // Only one game dialog at a time.
    document.querySelectorAll<HTMLDialogElement>('dialog.dx-dialog[open]').forEach((o) => o.close());
    d.showModal();
    syncPause();
  }
  document.querySelectorAll<HTMLDialogElement>('dialog.dx-dialog').forEach((d) => {
    d.addEventListener('close', () => {
      syncPause();
      if (!booting) screen.focus({ preventScroll: true });
      const cb = closeHooks.get(d.id);
      if (cb) {
        closeHooks.delete(d.id);
        cb();
      }
    });
    // Click on the backdrop closes.
    d.addEventListener('click', (e) => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
  });
  const closeHooks = new Map<string, () => void>();
  $$('[data-dx-open]').forEach((b) => b.addEventListener('click', () => openDialog(`dx-${b.dataset.dxOpen}`)));
  document.querySelectorAll<HTMLElement>('[data-dx-goto]').forEach((b) =>
    b.addEventListener('click', () => openDialog(`dx-${b.dataset.dxGoto}`)),
  );

  /* ───────────── Interactions ───────────── */
  function onInteract(t: Target) {
    sfx.select();
    if (t.kind === 'robot') {
      return say([{ who: 'robot', text: hint(quest) }]);
    }
    const a = t.obj.action;
    if (!a) return;
    switch (a.type) {
      case 'talk':
        return say(a.lines.map((text) => ({ who: 'system' as const, text })));
      case 'panel':
        return openPanel(a.panel);
      case 'puzzle':
        if (hasFragment(quest, a.fragment)) return openDialog(`dx-memory-${a.fragment}`);
        return openPuzzle(a.puzzle, a.fragment, t.obj);
      case 'restore':
        return tryRestore();
    }
  }

  function openPanel(p: DiscoveryId) {
    const first = !quest.found.includes(p);
    quest = discover(quest, p);
    save();
    openDialog(`dx-${p}`);
    if (first) {
      const lines: Record<DiscoveryId, string> = {
        skills: 'The workbench remembers every tool you ever picked up.',
        education: 'The archive kept your school records safe. Nice.',
        about: 'This room feels... personal. Like a save point.',
        contact: 'The beacon still transmits! Anyone can reach you through it.',
      };
      closeHooks.set(`dx-${p}`, () => say([{ who: 'robot', text: lines[p] }]));
    }
  }

  function gainFragment(f: FragmentId) {
    const before = allFragments(quest);
    quest = collect(quest, f);
    save();
    renderHud();
    sfx.fragment();
    showToast(`MEMORY FRAGMENT ${quest.fragments.length}/3 RESTORED · ${FRAGMENT_TITLES[f]}`);
    openDialog(`dx-memory-${f}`);
    closeHooks.set(`dx-memory-${f}`, () => {
      if (!before && allFragments(quest)) {
        sfx.door();
        say([
          { who: 'robot', text: 'That’s all three fragments!' },
          { who: 'robot', text: 'I heard a door unlock: the restore chamber, north-east. Let’s finish this.' },
        ]);
      } else say([{ who: 'robot', text: hint(quest) }]);
    });
  }

  function tryRestore() {
    if (!allFragments(quest)) {
      sfx.error();
      return say([{ who: 'robot', text: 'The core needs all three memory fragments first.' }]);
    }
    quest = restore(quest);
    save();
    renderHud();
    sfx.restored();
    openDialog('dx-restored');
  }

  /* ───────────── Puzzles ───────────── */
  const pBody = $('[data-dx-puzzle-body]');
  const pTitle = $('[data-dx-puzzle-title]');
  const pHelp = $('[data-dx-puzzle-help]');
  const pStatus = $('[data-dx-puzzle-status]');
  let solvedFragment: FragmentId | null = null;

  function openPuzzle(kind: 'circuit' | 'dungeon' | 'tuner', fragment: FragmentId, _obj: Obj) {
    solvedFragment = null;
    pStatus.textContent = '';
    const seed = Math.floor(Math.random() * 1e9);
    if (kind === 'circuit') circuitUI(newCircuit(seed), fragment);
    if (kind === 'dungeon') dungeonUI(newDungeon(seed), fragment);
    if (kind === 'tuner') tunerUI(newTuner(seed), fragment);
    openDialog('dx-puzzle');
    closeHooks.set('dx-puzzle', () => {
      if (solvedFragment) gainFragment(solvedFragment);
      else say([{ who: 'robot', text: 'No rush. The fragment will wait here.' }]);
    });
  }
  function solved(fragment: FragmentId, msg: string) {
    solvedFragment = fragment;
    pStatus.textContent = msg;
    sfx.select();
    $$('[data-dx-puzzle-body] button').forEach((b) => ((b as HTMLButtonElement).disabled = true));
    window.setTimeout(() => dlg('dx-puzzle').open && dlg('dx-puzzle').close(), settings.reducedMotion ? 300 : 900);
  }

  function circuitUI(s: CircuitState, fragment: FragmentId) {
    pTitle.textContent = 'Repair the terminal';
    pHelp.textContent = 'Pick a node on the left, then the matching node on the right. Connect all three.';
    const draw = () => {
      const rows = s.left.length;
      const lines = Object.entries(s.links)
        .map(([i, j]) => `<line x1="0" y1="${Number(i) * 20 + 10}" x2="100" y2="${j * 20 + 10}" />`)
        .join('');
      pBody.innerHTML = `
        <div class="dx-circuit">
          <div class="col">${s.left.map((sym, i) => `<button type="button" data-l="${i}" aria-pressed="${s.selected === i}" ${i in s.links ? 'data-linked' : ''} aria-label="Left node ${sym}${i in s.links ? ', connected' : ''}">${sym}</button>`).join('')}</div>
          <svg viewBox="0 0 100 ${rows * 20}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
          <div class="col">${s.right.map((sym, j) => `<button type="button" data-r="${j}" ${Object.values(s.links).includes(j) ? 'data-linked' : ''} aria-label="Right node ${sym}">${sym}</button>`).join('')}</div>
        </div>`;
      pBody.querySelectorAll<HTMLButtonElement>('[data-l]').forEach((b) => b.addEventListener('click', () => {
        s = pickLeft(s, Number(b.dataset.l));
        sfx.blip();
        draw();
        pBody.querySelector<HTMLButtonElement>(`[data-l="${b.dataset.l}"]`)?.focus();
      }));
      pBody.querySelectorAll<HTMLButtonElement>('[data-r]').forEach((b) => b.addEventListener('click', () => {
        s = pickRight(s, Number(b.dataset.r));
        if (s.miss) {
          sfx.error();
          pStatus.textContent = 'Bzzt. Those nodes don’t match.';
        } else pStatus.textContent = '';
        draw();
        if (circuitSolved(s)) solved(fragment, 'Circuit restored! A memory is loading…');
        else pBody.querySelector<HTMLButtonElement>('[data-l]:not([data-linked])')?.focus();
      }));
    };
    draw();
  }

  function dungeonUI(d: Dungeon, fragment: FragmentId) {
    pTitle.textContent = 'Map terminal';
    pHelp.textContent = 'A dungeon floor, generated fresh each time. Find the flickering exit room and activate it.';
    const draw = () => {
      let html = `<div class="dx-dungeon" style="--w:${d.w}">`;
      for (let i = 0; i < d.open.length; i++) {
        if (!d.open[i]) html += '<span class="wall"></span>';
        else if (i === d.exit) html += `<button type="button" class="exit" data-cell="${i}" aria-label="Exit room">▣</button>`;
        else if (i === d.start) html += `<button type="button" class="start" data-cell="${i}" aria-label="Entrance (you are here)">@</button>`;
        else html += `<button type="button" data-cell="${i}" aria-label="Empty room"></button>`;
      }
      pBody.innerHTML = html + '</div>';
      pBody.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach((b) => b.addEventListener('click', () => {
        const next = activateRoom(d, Number(b.dataset.cell));
        if (next === d) {
          sfx.blip();
          pStatus.textContent = 'Empty room. The exit flickers somewhere else.';
          return;
        }
        d = next;
        solved(fragment, 'Exit activated! A memory is loading…');
      }));
    };
    draw();
  }

  function tunerUI(s: TunerState, fragment: FragmentId) {
    const waves = ['∿ sine', '⊓ square', '⋀ saw', '░ noise'];
    const freqs = [262, 330, 392, 523];
    pTitle.textContent = 'Repair the notes machine';
    pHelp.textContent = 'Turn each dial until the signal matches the target pattern.';
    const draw = () => {
      pBody.innerHTML = `
        <p class="dx-target">Target: ${s.target.map((t) => `<b>${waves[t].split(' ')[0]}</b>`).join(' ')}</p>
        <div class="dx-tuner">${s.dials.map((v, i) => `
          <button type="button" data-d="${i}" ${v === s.target[i] ? 'data-ok' : ''} aria-label="Dial ${i + 1}: ${waves[v]}${v === s.target[i] ? ', matches' : ''}">
            <span class="glyph">${waves[v].split(' ')[0]}</span><span class="name">${waves[v].split(' ')[1]}</span>
          </button>`).join('')}</div>`;
      pBody.querySelectorAll<HTMLButtonElement>('[data-d]').forEach((b) => b.addEventListener('click', () => {
        const i = Number(b.dataset.d);
        s = turnDial(s, i);
        sfx.note(freqs[s.dials[i] % DIAL_STEPS]);
        draw();
        pBody.querySelector<HTMLButtonElement>(`[data-d="${i}"]`)?.focus();
        if (tunerSolved(s)) solved(fragment, 'Signal locked! A memory is loading…');
      }));
    };
    draw();
  }

  /* ───────────── Input ───────────── */
  const KEYS: Record<string, 'up' | 'down' | 'left' | 'right'> = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  };
  screen.addEventListener('keydown', (e) => {
    if (booting || e.target !== screen) return;
    const d = KEYS[e.code];
    if (d) {
      e.preventDefault();
      if (!dialogue.open) engine.press(d, true);
      return;
    }
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (e.repeat) return;
      if (dialogue.open) nextLine();
      else engine.interact();
    } else if (e.code === 'Escape' && dialogue.open) {
      e.preventDefault();
      nextLine(true);
    }
  });
  screen.addEventListener('keyup', (e) => {
    const d = KEYS[e.code];
    if (d) engine.press(d, false);
  });
  screen.addEventListener('blur', () => engine.releaseAll());
  canvas.addEventListener('pointerdown', (e) => {
    if (booting) return;
    screen.focus({ preventScroll: true });
    if (dialogue.open) return nextLine();
    engine.tap(e.clientX, e.clientY);
  });

  // Touch pad.
  $$<HTMLButtonElement>('[data-dx-dir]').forEach((b) => {
    const d = b.dataset.dxDir as 'up' | 'down' | 'left' | 'right';
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      b.classList.add('on');
      if (!dialogue.open) engine.press(d, true);
    });
    const off = () => (b.classList.remove('on'), engine.press(d, false));
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('lostpointercapture', off);
  });
  $<HTMLButtonElement>('[data-dx-a]').addEventListener('click', () => {
    if (booting) return;
    if (dialogue.open) nextLine();
    else engine.interact();
  });

  /* ───────────── Scaling: whole-pixel scale when there's room, letterboxed ───────────── */
  function fit() {
    const frame = $('.dx-frame');
    const availW = frame.clientWidth;
    const availH = Math.min(window.innerHeight * 0.72, 640);
    let s = Math.min(availW / 320, availH / 180);
    if (s >= 2) s = Math.floor(s);
    screen.style.width = `${Math.floor(320 * s)}px`;
    // Narrow screens: give the boot screen room for its text and buttons; the game itself stays 16:9.
    const tall = booting && availW < 600;
    screen.style.height = tall ? 'auto' : `${Math.floor(180 * s)}px`;
    screen.classList.toggle('dx-tall', tall);
    root.style.setProperty('--s', String(s));
  }
  new ResizeObserver(fit).observe($('.dx-frame'));
  fit();

  /* ───────────── Boot screen ───────────── */
  const bootTimers: number[] = [];
  function runBoot() {
    booting = true;
    boot.hidden = false;
    fit();
    root.classList.remove('dx-playing');
    syncPause();
    bootTimers.forEach(clearTimeout);
    bootTimers.length = 0;
    bootLog.innerHTML = '';
    bootActions.hidden = true;
    const hasSave = quest.recovered && (quest.fragments.length > 0 || quest.found.length > 0);
    const lines: [string, string?][] = [
      ['DAT.EXE v1.0'],
      ['> LOAD SAVE'],
      hasSave ? [`SAVE FOUND · ${quest.fragments.length}/3 MEMORY FRAGMENTS`, 'ok'] : ['ERROR: SAVE FILE CORRUPTED', 'err'],
      [hasSave ? 'CONTINUE?' : 'RECOVER?', 'ask'],
    ];
    $<HTMLButtonElement>('[data-dx-recover]').hidden = hasSave;
    $<HTMLButtonElement>('[data-dx-continue]').hidden = !hasSave;
    $<HTMLButtonElement>('[data-dx-newgame]').hidden = !hasSave;
    const show = (i: number) => {
      const [text, cls] = lines[i];
      const p = document.createElement('p');
      p.textContent = text;
      if (cls) p.className = cls;
      bootLog.appendChild(p);
      if (i === lines.length - 1) {
        bootActions.hidden = false;
        sfx.boot();
      }
    };
    if (settings.reducedMotion) lines.forEach((_, i) => show(i));
    else lines.forEach((_, i) => bootTimers.push(window.setTimeout(() => show(i), 350 + i * 650)));
  }
  // Click or key on the boot screen skips the animation.
  boot.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('button, a')) return;
    finishBootAnimation();
  });
  function finishBootAnimation() {
    if (!bootActions.hidden) return;
    bootTimers.forEach(clearTimeout);
    bootLog.innerHTML = '';
    runBootInstant();
  }
  function runBootInstant() {
    const prev = settings.reducedMotion;
    settings = { ...settings, reducedMotion: true };
    runBoot();
    settings = { ...settings, reducedMotion: prev };
  }

  function startGame(fresh: boolean) {
    if (fresh) {
      quest = recover(initialQuest());
      engine.debugTeleport(SPAWN.x, SPAWN.y);
    } else quest = recover(quest);
    save();
    renderHud();
    booting = false;
    boot.hidden = true;
    fit();
    root.classList.add('dx-playing');
    syncPause();
    engine.start();
    screen.focus({ preventScroll: true });
    if (fresh || quest.fragments.length === 0) {
      say([
        { who: 'robot', text: 'Oh! You’re awake. This save file got badly corrupted.' },
        { who: 'robot', text: 'I’m BYTE, your recovery assistant. Three memory fragments are scattered around here.' },
        { who: 'robot', text: 'Recover them and we can restore the save. That sparking terminal looks like a good start. (E or Space to interact.)' },
      ]);
    } else say([{ who: 'robot', text: `Welcome back! ${hint(quest)}` }]);
  }
  $('[data-dx-recover]').addEventListener('click', () => startGame(true));
  $('[data-dx-continue]').addEventListener('click', () => startGame(false));
  $('[data-dx-newgame]').addEventListener('click', () => startGame(true));

  // Links that leave the game (e.g. to the page sections below) close any open window first.
  document.querySelectorAll<HTMLElement>('[data-dx-closeall]').forEach((a) =>
    a.addEventListener('click', () => document.querySelectorAll<HTMLDialogElement>('dialog.dx-dialog[open]').forEach((d) => d.close())),
  );

  // Restored ending → index.
  $('[data-dx-to-index]').addEventListener('click', () => openDialog('dx-index'));

  // Reset progress (two-step confirm).
  const resetBtn = $<HTMLButtonElement>('[data-dx-reset]');
  let armed = false;
  resetBtn.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      resetBtn.textContent = 'Click again to erase progress';
      window.setTimeout(() => {
        armed = false;
        resetBtn.textContent = 'Reset progress';
      }, 4000);
      return;
    }
    armed = false;
    resetBtn.textContent = 'Reset progress';
    kv.remove(SAVE_KEY);
    quest = initialQuest();
    renderHud();
    engine.debugTeleport(SPAWN.x, SPAWN.y);
    dlg('dx-controls').close();
    if (dialogue.open) nextLine(true);
    runBoot();
    showToast('Progress reset.');
  });

  renderHud();
  root.classList.add('dx-js');
  runBoot();

  // Optional test hook: ?dx-debug exposes internals for automated checks.
  if (new URLSearchParams(location.search).has('dx-debug')) {
    (window as unknown as Record<string, unknown>).__dx = {
      engine,
      get quest() {
        return quest;
      },
      get dialogue() {
        return dialogue;
      },
      FRAGMENTS,
    };
  }
}
