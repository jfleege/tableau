// Add finished post filenames here. Unlisted files do not appear on the blog.
const postFiles = [
  '2026-11-10-graph-theory.md',
  '2026-11-04-french-fries.md',
];

const dateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

async function loadPost(filename) {
  const response = await fetch(new URL('../posts/' + filename, import.meta.url));
  if (!response.ok) throw new Error('Could not load ' + filename);

  const source = (await response.text()).replace(/\r\n/g, '\n');
  const frontMatter = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontMatter) throw new Error('Missing front matter in ' + filename);

  const metadata = {};
  for (const line of frontMatter[1].split('\n')) {
    const field = line.match(/^(title|date|category|description):\s*(.*)$/);
    if (field) metadata[field[1]] = field[2].trim().replace(/^(["'])(.*)\1$/, '$2');
  }

  if (!metadata.title || !/^\d{4}-\d{2}-\d{2}$/.test(metadata.date ?? '')) {
    throw new Error('A title and YYYY-MM-DD date are required in ' + filename);
  }
  const date = new Date(metadata.date + 'T00:00:00Z');
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== metadata.date) {
    throw new Error('Invalid date in ' + filename);
  }

  const [firstLine, ...remainingLines] = source.slice(frontMatter[0].length).trim().split('\n');
  const body = firstLine.trim() === '# ' + metadata.title
    ? remainingLines.join('\n')
    : [firstLine, ...remainingLines].join('\n');

  return { ...metadata, body, id: filename.slice(0, -3) };
}

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content !== undefined) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function postLink(post, href) {
  const link = element('a', post.title);
  link.href = href;
  return link;
}

function postMeta(post) {
  const meta = element('p', undefined, 'post-meta');
  const date = element('time', dateFormat.format(new Date(post.date)));
  date.dateTime = post.date;
  meta.append(date);
  if (post.category) meta.append(' · ' + post.category);
  return meta;
}

function renderJournal(post) {
  const markdown = window.markdownit({ html: false });
  markdown.core.ruler.push('post_heading_levels', state => {
    for (const token of state.tokens) {
      if (token.type === 'heading_open' || token.type === 'heading_close') {
        const level = Math.max(3, Math.min(6, Number(token.tag.slice(1)) + 1));
        token.tag = 'h' + level;
      }
    }
  });

  const article = element('article');
  article.id = post.id;
  const heading = element('h2');
  heading.append(postLink(post, '#' + post.id));
  const body = element('div', undefined, 'post-body');
  body.innerHTML = markdown.render(post.body);
  article.append(heading, postMeta(post), body);
  return article;
}

function renderArchive(posts, recentOnly) {
  const list = element('ul', undefined, recentOnly ? undefined : 'archive-list');
  for (const post of recentOnly ? posts.slice(0, 5) : posts) {
    const item = element('li');
    item.append(postLink(post, './#' + post.id));
    if (!recentOnly) {
      item.append(postMeta(post));
      if (post.description) item.append(element('p', post.description));
    }
    list.append(item);
  }
  return list;
}

async function renderPosts() {
  const results = await Promise.allSettled(postFiles.map(loadPost));
  const posts = results.filter(result => result.status === 'fulfilled').map(result => result.value);
  posts.sort((a, b) => b.date.localeCompare(a.date));
  const failures = results.filter(result => result.status === 'rejected');
  for (const failure of failures) console.error(failure.reason);

  for (const target of document.querySelectorAll('[data-posts]')) {
    const view = target.dataset.posts;
    if (view === 'journal' && posts.length && !window.markdownit) {
      const message = element('p', 'The Markdown renderer could not load. ');
      const archive = element('a', 'Browse the archive');
      archive.href = 'archive.html';
      message.append(archive, '.');
      target.replaceChildren(message);
    } else if (posts.length && view === 'journal') {
      const showPost = () => {
        const requestedId = location.hash.slice(1);
        const post = posts.find(post => post.id === requestedId) ?? posts[0];
        if (target.firstElementChild?.id !== post.id) {
          target.replaceChildren(renderJournal(post));
          if (failures.length) target.append(element('p', 'Some posts could not be loaded.'));
        }
        if (requestedId === post.id) document.getElementById(post.id)?.scrollIntoView();
      };

      showPost();
      window.addEventListener('hashchange', showPost);
    } else if (posts.length) {
      target.replaceChildren(renderArchive(posts, view === 'recent'));
    } else {
      target.textContent = failures.length ? 'Posts could not be loaded.' : 'No posts yet.';
    }
    if (failures.length && posts.length && view === 'archive') {
      target.append(element('p', 'Some posts could not be loaded.'));
    }
    target.removeAttribute('aria-busy');
  }
}

renderPosts();
