'use strict';

/**
 * 只在真正包含公式的页面注入 KaTeX 样式。
 * Hexo 自带的 inject 依赖主题模板结构，这里是更直接的 after_render 过滤器。
 */
const KATEX_CSS = '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11/katex.min.css">';

hexo.extend.filter.register('after_render:html', function (str) {
  if (!str.includes('class="katex"')) return str;
  if (str.includes('katex.min.css')) return str;
  if (!str.includes('</head>')) return str;
  return str.replace('</head>', `  ${KATEX_CSS}\n</head>`);
});
