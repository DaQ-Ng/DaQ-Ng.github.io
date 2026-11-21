/**
 * ─────────────────────────────────────────────────────────────
 *  ALL PORTFOLIO CONTENT LIVES HERE.
 *  The game (src/game/) and the normal site sections both read
 *  this file, so you can edit text and links without touching code.
 *
 *  Missing links: set them to `null` and leave a TODO comment.
 *  The UI then shows "Link coming soon" instead of a dead button.
 *  Never put a made-up URL here.
 * ─────────────────────────────────────────────────────────────
 */

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface Education {
  school: string;
  degree: string;
  dates: string;
  details?: string;
}

/** The three projects restored as "memory fragments" in the game. */
export interface GameProject {
  /** Fragment id used by the game. */
  fragment: 'api' | 'dungeon' | 'notes';
  title: string;
  summary: string;
  tech: string[];
  /** Slug of the case-study page in src/content/projects/, or null if there isn't one yet. */
  page: string | null;
  repo: string | null;
  demo: string | null;
  /** Short line the game shows when the memory comes back. */
  memory: string;
}

export const site = {
  name: 'Dat Nguyen',
  // The role(s) you are applying for — a target, not a claim of past titles.
  headline: 'Software Engineer · Backend Developer',
  /** Shown on the boot screen under the name. */
  role: 'Computer Science student · software developer',
  /** Small badge at the top of the homepage. Set to '' to hide it. */
  availability: 'Open to entry-level roles',
  // Leave empty to hide the "Based in …" line.
  location: '',

  /** 1–2 sentences shown in the intro. */
  intro:
    'Computer Science student at the University of Texas at Arlington (expected December 2026). I build backend services: REST APIs with Spring Boot and PostgreSQL, and asynchronous processing with FastAPI, Redis, and RQ.',

  /** Paragraphs for the About section. */
  about: [
    'I earned an Associate of Science at Tarrant County College in 2024 and am now finishing a Bachelor of Science in Computer Science at UT Arlington, with coursework in data structures and algorithms, databases, software engineering, machine learning, and object-oriented programming.',
    "Since September 2026 I've been a student software developer with ACM Create, working on the backend of NoteWave, a team-built audio-to-note transcription app. On my own, I built a book marketplace REST API in Spring Boot. I'm looking for entry-level software engineering and backend roles.",
  ],

  interests: ['Game development', 'Hardware tinkering', 'Embedded systems', 'Interactive software'],

  /** Leave the array empty ([]) to hide the education block. */
  education: [
    {
      school: 'University of Texas at Arlington',
      degree: 'B.S. in Computer Science',
      dates: 'Expected December 2026',
      details: 'GPA 3.6',
    },
    {
      school: 'Tarrant County College',
      degree: 'Associate of Science',
      dates: 'May 2024',
      details: 'GPA 3.9',
    },
  ] as Education[],

  /** Only list skills you can discuss confidently in an interview. */
  skills: [
    { category: 'Languages', items: ['Java', 'Python', 'SQL', 'C', 'C++', 'C#', 'JavaScript', 'HTML', 'CSS'] },
    { category: 'Frameworks & Engines', items: ['Spring Boot', 'Spring Data JPA', 'FastAPI', 'Flutter', 'Unity', 'Raylib'] },
    { category: 'Databases', items: ['PostgreSQL', 'MySQL'] },
    { category: 'Background Jobs & Caching', items: ['RQ', 'Redis'] },
    { category: 'Testing', items: ['JUnit 5', 'Mockito', 'MockMvc'] },
    { category: 'Tools & Platforms', items: ['Git', 'GitHub', 'Docker', 'Linux', 'Maven', 'VS Code', 'Visual Studio', 'curl'] },
  ] as SkillGroup[],

  /** Projects restored in the game, in the order the fragments are usually found. */
  gameProjects: [
    {
      fragment: 'api',
      title: 'Book Marketplace API',
      summary:
        'A used-book marketplace REST API with JWT login, purchase rules, and optimistic locking so two buyers can’t purchase the same book.',
      tech: ['Java', 'Spring Boot', 'PostgreSQL'],
      page: 'bookapi',
      repo: 'https://github.com/DaQ-Ng/Bookapi',
      demo: null, // TODO: add a live demo URL if you deploy one
      memory: 'Circuits reconnected. A memory of endpoints, tokens, and orders comes back.',
    },
    {
      fragment: 'dungeon',
      title: 'Dungeon Crawler',
      summary: 'A top-down dungeon crawler built in Unity with procedurally generated dungeon layouts.',
      tech: ['Unity', 'C#', 'Procedural generation'],
      page: null, // TODO: add src/content/projects/dungeon.md, then set this to 'dungeon'
      repo: null, // TODO: add the GitHub URL
      demo: null, // TODO: add a playable build URL if you publish one
      memory: 'The exit opens. A memory of rooms that rearrange themselves every run.',
    },
    {
      fragment: 'notes',
      title: 'NoteWave',
      summary:
        'A team-built web app that turns audio recordings into notes. I work on the FastAPI backend: validated uploads, background jobs with RQ, and Redis caching.',
      tech: ['Python', 'FastAPI', 'Redis', 'RQ'],
      page: 'notewave',
      // TODO: https://github.com/DaQ-Ng/notewave returns 404 to visitors (private or renamed).
      // Make it public (or put the team repo's URL here), then replace null with the URL.
      repo: null,
      demo: null, // TODO: add a live demo URL if the team deploys one
      memory: 'The machine hums back to life. A memory of sound turning into notes.',
    },
  ] as GameProject[],

  contact: {
    email: 'datnguyen1035@gmail.com',
    github: 'https://github.com/DaQ-Ng',
    linkedin: 'https://www.linkedin.com/in/dat-q-nguyen/',
    /** A short line shown above the contact links. */
    message:
      "I'm looking for entry-level software engineering and backend roles. The best way to reach me is by email.",
  },

  /** File path inside /public. */
  resume: 'resume.pdf',

  /** Used in <meta name="description"> and social previews. */
  description:
    'Dat Nguyen — Computer Science student at UT Arlington building backend services with Java, Spring Boot, Python, and FastAPI.',
};

/** True when a link is missing, so the UI can show "coming soon" instead of a dead button. */
export function isMissing(link: string | null | undefined): link is null | undefined | '' {
  if (!link) return true;
  const v = link.trim();
  return v === '' || /^todo\b/i.test(v) || v.includes('[') || v === '#';
}
