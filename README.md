# Tableau

A personal blog hosted on GitHub Pages. The journal, archive, and about page share the styles in `css/style.css`.

## Publish a post

1. Copy `posts/2026-11-05-first-post.md` to a new file named `YYYY-MM-DD-short-title.md`.
2. Fill in the metadata and write the body in Markdown. Use a single line for each metadata field. The journal uses the title from the metadata and omits a matching first Markdown heading.
3. Add the filename to `postFiles` at the top of `js/blog.js`. The journal and archive both sort by date, newest first.
4. Commit and push to `main`.

The two later posts are draft placeholders. Unlisted files stay out of the journal and archive, but the repository is public, so keep private drafts off GitHub.

## Preview locally

Run `python3 -m http.server 8000` from the repository root and open `http://localhost:8000/`. The journal fetches Markdown over HTTP and uses a pinned Markdown renderer. The pages load Roboto from Google Fonts.
