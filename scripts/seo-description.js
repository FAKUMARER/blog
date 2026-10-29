'use strict';

/**
 * 为每篇文章生成纯文本 description。
 *
 * 为什么需要：Hexo 默认没有「每页独立的摘要」，模板里只能拿 config.description，
 * 结果全站每篇文章的 <meta name="description"> 一模一样（甚至为空），搜索引擎
 * 会把它们当成低质量重复页面，严重影响收录。
 *
 * 在 before_post_render 阶段执行：此时 content 还是 Markdown 源码，
 * 去掉标记和公式最干净，不会把 KaTeX 生成的 MathML 文本重复两遍。
 */
function toPlainText(md) {
  return String(md || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')        // HTML 注释
    .replace(/```[\s\S]*?```/g, ' ')         // 围栏代码块
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')              // 行内代码
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')   // 图片
    .replace(/\[\[([^\]]+)\]\]\([^)]*\)/g, '$1') // 脚注式写法 [[0]](url)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 链接保留文字
    .replace(/<[^>]+>/g, ' ')                // 内嵌 HTML
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')       // 块级公式
    .replace(/\$[^$\n]*\$/g, ' ')            // 行内公式
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')      // 标题井号
    .replace(/^\s{0,3}>\s?/gm, '')           // 引用标记
    .replace(/^\s*[-*+]\s+/gm, '')           // 无序列表
    .replace(/^\s*\d+[.)]\s+/gm, '')         // 有序列表
    .replace(/\[toc\]/gi, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')       // 粗体
    .replace(/__([^_]+)__/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')           // 删除线
    .replace(/(^|[^*\\])\*([^*\n]+)\*/g, '$1$2') // 斜体
    .replace(/\\([\\`*_{}\[\]()#+\-.!|])/g, '$1') // 转义字符
    .replace(/\|/g, ' ')                     // 表格竖线
    .replace(/\s+/g, ' ')
    .trim();
}

hexo.extend.filter.register('before_post_render', function (data) {
  // 加密文章：正文在页面上是密文，抽摘要只会在搜索结果里露出生硬的题干，
  // 因此不生成，交给模板回落到站点描述。
  if (data.password) return data;

  if (!data.description) {
    var text = toPlainText(data.content);
    if (text) {
      data.description = text.length > 140 ? text.slice(0, 140) + '…' : text;
    }
  }
  return data;
});
