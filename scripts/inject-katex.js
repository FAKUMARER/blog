'use strict';

/**
 * 1) 给真正包含公式的页面注入 KaTeX 样式。
 * 2) 关掉 Nunjucks 对文章内容的解析。
 *
 * 第 2 点很关键：Hexo 的 Swig 标签转义只处理「完整」的 {{ }} / {% %} / {# #}，
 * 像 LaTeX 颜色写法 \color {#C0C0C0} 里的 {# 没有配对的 #}，
 * 会被 Nunjucks 当成未闭合注释，构建直接报 expected end of comment。
 * 这个博客不使用 Hexo 的 {% %} 标签语法，关掉没有副作用。
 */
const KATEX_CSS = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.css">';

hexo.extend.filter.register('after_init', function () {
  const renderer = hexo.render.renderer.get('md');
  if (renderer) renderer.disableNunjucks = true;
});

hexo.extend.filter.register('after_render:html', function (str) {
  if (!str.includes('class="katex"')) return str;
  if (str.includes('katex.min.css')) return str;
  if (!str.includes('</head>')) return str;
  return str.replace('</head>', `  ${KATEX_CSS}\n</head>`);
});
