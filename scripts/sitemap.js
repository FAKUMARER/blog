'use strict';

/**
 * 生成 sitemap.xml（站点地图），供 Bing / Google / 百度 提交。
 *
 * 刻意不使用 hexo-generator-sitemap 插件：那会给 package.json 增加依赖，
 * 一旦 npm registry 抖动或版本不兼容，CI 构建就会失败、站点直接不更新。
 * 这里用 Hexo 内置的 generator 手写，零新依赖。
 *
 * 输出位置：public/sitemap.xml → https://fakumarer.github.io/blog/sitemap.xml
 */
hexo.extend.generator.register('sitemap', function (locals) {
  var config = hexo.config;
  var siteUrl = String(config.url || '').replace(/\/+$/, '');
  var root = String(config.root || '/');
  if (root.charAt(root.length - 1) !== '/') root += '/';
  var base = siteUrl + root;

  function abs(p) {
    return base + String(p || '').replace(/^\/+/, '');
  }

  function iso(d) {
    return d ? new Date(d).toISOString() : null;
  }

  function xmlEsc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  var entries = [];
  var seen = Object.create(null);

  function push(loc, lastmod, priority, changefreq) {
    if (!loc) return;
    // 中文路径必须百分号编码，否则部分爬虫会直接丢弃该条目
    var url = xmlEsc(encodeURI(loc));
    if (seen[url]) return;
    seen[url] = true;
    entries.push({ loc: url, lastmod: lastmod, priority: priority, changefreq: changefreq });
  }

  // 首页：内容更新频繁，优先级最高
  push(abs(''), new Date().toISOString(), '1.0', 'daily');

  // 文章
  locals.posts.sort('-date').each(function (post) {
    push(abs(post.path), iso(post.updated || post.date), '0.8', 'monthly');
  });

  // 独立页面（分类索引 / 标签索引等）
  locals.pages.each(function (page) {
    if (!page.path || page.path === 'index.html') return;
    push(abs(page.path), iso(page.updated || page.date), '0.5', 'monthly');
  });

  // 归档索引页（由 hexo-generator-archive 生成，不在 pages 里）
  if (locals.posts.length) {
    push(abs('archives/'), null, '0.4', 'weekly');
  }

  // 分类与标签列表页
  locals.categories.each(function (cat) {
    if (!cat.length) return;
    push(abs(cat.path), null, '0.4', 'weekly');
  });
  locals.tags.each(function (tag) {
    if (!tag.length) return;
    push(abs(tag.path), null, '0.4', 'weekly');
  });

  var body = entries.map(function (e) {
    var s = '  <url>\n    <loc>' + e.loc + '</loc>\n';
    if (e.lastmod) s += '    <lastmod>' + e.lastmod + '</lastmod>\n';
    if (e.changefreq) s += '    <changefreq>' + e.changefreq + '</changefreq>\n';
    if (e.priority) s += '    <priority>' + e.priority + '</priority>\n';
    return s + '  </url>';
  }).join('\n');

  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + body + '\n</urlset>\n';

  return {
    path: 'sitemap.xml',
    data: xml
  };
});
