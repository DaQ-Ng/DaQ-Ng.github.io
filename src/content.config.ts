import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Every Markdown file in src/content/projects/ becomes one project.
// The schema below is checked at build time: a missing or mistyped field fails the build
// with a clear error instead of silently rendering a broken page.
const projects = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(200, 'Keep the card summary under 200 characters'),
    tech: z.array(z.string()).min(1),
    featured: z.boolean().default(false),
    // Lower numbers appear first.
    order: z.number().default(100),
    // Optional: leave it out if you'd rather not label the project.
    status: z.enum(['Completed', 'In progress', 'Archived']).optional(),
    // e.g. "Personal project", "Course project", "Team project (4 people)"
    context: z.string().optional(),
    date: z.string().optional(), // free text, e.g. "Spring 2026"
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    // Set to true to hide a project from the site without deleting it.
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
