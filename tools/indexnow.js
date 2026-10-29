'use strict';

/**
 * 把 sitemap 里的全部 URL 推送给 IndexNow（Bing / Yandex / Seznam / Naver 共享）。
 *
 * 由 .github/workflows/deploy.yml 在 `hexo generate` 之后调用，
 * 所以每次发文章、每次部署都会自动通知 Bing「这些页面变了」，
 * 不必再手动去 Bing 站长后台点提交。
 *
 * Google 不支持 IndexNow，百度也不支持，两家需要各自的站长平台，见 README。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/** 从 source/ 下找 32 位十六进制的 IndexNow 校验文件 */
function readKey() {
  const dir = path.join(ROOT, 'source');
  const name = fs.readdirSync(dir).find((n) => /^[a-f0-9]{32}\.txt$/.test(n));
  if (!name) throw new Error('source/ 下没有找到 IndexNow key 文件（应形如 <32位hex>.txt）');
  return fs.readFileSync(path.join(dir, name), 'utf8').trim();
}

/** 从 _config.yml 读 root（避免与站点配置不一致） */
function readRoot() {
  const yml = fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8');
  const m = yml.match(/^root:[ \t]*(.+)$/m);
  if (!m) return '/';
  return m[1].trim().replace(/^['"]|['"]$/g, '') || '/';
}

function readUrls() {
  const file = path.join(ROOT, 'public', 'sitemap.xml');
  if (!fs.existsSync(file)) throw new Error('public/sitemap.xml 不存在，请先执行 hexo generate');
  const xml = fs.readFileSync(file, 'utf8');
  const urls = [];
  const re = /<loc>([\s\S]*?)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1].trim().replace(/&amp;/g, '&'));
  }
  return urls;
}

(async function main() {
  const key = readKey();
  const urls = readUrls();
  if (!urls.length) {
    console.log('sitemap 里没有 URL，跳过 IndexNow 提交。');
    return;
  }

  const host = new URL(urls[0]).host;
  const root = readRoot();
  const payload = {
    host: host,
    key: key,
    // 站点挂在 /blog/ 子路径下，key 文件只能放在这里，必须显式告知
    keyLocation: 'https://' + host + (root.charAt(0) === '/' ? '' : '/') + root + key + '.txt',
    urlList: urls
  };

  console.log('IndexNow: host=' + host + '，提交 ' + urls.length + ' 条');
  console.log('keyLocation: ' + payload.keyLocation);

  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  });

  // 200/202 = 接受；其它状态码不阻塞部署，只记录
  console.log('IndexNow 响应：HTTP ' + res.status + ' ' + res.statusText);
  const text = await res.text().catch(() => '');
  if (text) console.log('响应正文：' + text.slice(0, 500));
})().catch((err) => {
  // 推送失败绝不能让站点部署失败
  console.error('IndexNow 提交失败（已忽略，不影响部署）：' + err.message);
});
