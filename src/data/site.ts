/**
 * ─────────────────────────────────────────────────────────────
 *  YOUR CONTENT LIVES HERE.
 *  Facts below come from your resume (Dat_Nguyen_General.pdf).
 *  `intro` and `about` are a first draft written only from those
 *  facts — rewrite them in your own voice.
 *  Anything in [square brackets] is a placeholder; `npm run build`
 *  lists any that are left (scripts/check-placeholders.mjs).
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

export const site = {
  name: 'Dat Nguyen',
  // The role(s) you are applying for — a target, not a claim of past titles.
  headline: 'Software Engineer · Backend Developer',
  /** Small badge at the top of the homepage. Set to '' to hide it. */
  availability: 'Open to entry-level roles',
  // Leave empty to hide the "Based in …" line.
  location: '',

  /** 1–2 sentences shown on the homepage hero. */
  intro:
    'Computer Science student at the University of Texas at Arlington (expected December 2026). I build backend services: REST APIs with Spring Boot and PostgreSQL, and asynchronous processing with FastAPI, Redis, and RQ.',

  /** Paragraphs for the About section. */
  about: [
    'I earned an Associate of Science at Tarrant County College in 2024 and am now finishing a Bachelor of Science in Computer Science at UT Arlington, with coursework in data structures and algorithms, databases, software engineering, machine learning, and object-oriented programming.',
    "Since September 2026 I've been a student software developer with ACM Create, working on the backend of NoteWave, a team-built audio-to-note transcription app. On my own, I built a book marketplace REST API in Spring Boot. I'm looking for entry-level software engineering and backend roles.",
  ],

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
    { category: 'Developer Tools', items: ['Git/GitHub', 'Maven', 'VS Code', 'Visual Studio', 'curl'] },
  ] as SkillGroup[],

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
