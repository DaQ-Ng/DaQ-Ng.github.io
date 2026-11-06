// Lists any "[placeholder]" text or example links still left in your content,
// so you don't deploy a portfolio that says "[Your Name]".
// Runs automatically before `npm run build`. It warns but does not fail the build;
// run `npm run check:content -- --strict` to make it fail (useful in CI once content is final).
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const strict = process.argv.includes('--strict');
const verbose = process.argv.includes('--verbose');
const files = ['src/data/site.ts'];
const projectDir = 'src/content/projects';
for (const f of readdirSync(projectDir)) {
  if (f.endsWith('.md') && !f.startsWith('_')) files.push(join(projectDir, f));
}

const patterns = [
  { re: /\[[A-Z][^\]\n]{2,}\]/g, label: 'placeholder' },
  { re: /your-username|you@example\.com|your-repo/g, label: 'example link' },
];

let count = 0;
for (const file of files) {
  let inFile = 0;
  let firstLine = 0;
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return; // skip code comments
    for (const { re, label } of patterns) {
      for (const m of line.matchAll(re)) {
        inFile++;
        firstLine ||= i + 1;
        if (verbose) console.warn(`  ${file}:${i + 1}  ${label}: ${m[0].slice(0, 60)}`);
      }
    }
  });
  if (inFile && !verbose) console.warn(`  ${file}:${firstLine}  ${inFile} placeholder(s)`);
  count += inFile;
}

const resume = 'public/resume.pdf';
if (existsSync(resume) && statSync(resume).size < 2000) {
  count++;
  console.warn(`  ${resume}  looks like the placeholder resume — replace it with your real PDF`);
}

if (count) {
  console.warn(`\n⚠  ${count} placeholder(s) left. Replace them before you deploy.`);
  console.warn('   Run `npm run check:content -- --verbose` to list every one.\n');
  if (strict) process.exit(1);
} else {
  console.log('✓ No placeholders found.');
}
