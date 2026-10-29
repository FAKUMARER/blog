'use strict';

/**
 * 把 sitemap 里的全部 URL 推送给 IndexNow（Bing / Yandex / Seznam / Naver 共享）。
 *
 * 由 .github/workflows/deploy.yml 在 Pages 部署完成之后调用，
 * 所以每次发文章、每次部署都会自动通知 Bing「这些页面变了」，
 * 不必再手动去 Bing 站长后台点提交。
 *
 * 关键点：IndexNow 收到 202 后是「校验中」，它会真的去抓 key 文件确认站点归属。
 * 站点还没更新到线上就提交，抓到的 404 会让这个 key 直接失效（403）。
 * 所以这里先反复探测 key 文件，确认可访问且内容一致后才提交。
 *
 * Google 不支持 IndexNow，百度也不支持，两家需要各自的站长平台。
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RETRY = 15;        // key 文件最多探测次数
const INTERVAL = 8000;   // 每次间隔（毫秒）

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 从 _config.yml 读 url 与 root（避免与站点配置不一致） */
function readConfig() {
  const yml = fs.readFileSync(path.join(ROOT, '_config.yml'), 'utf8');
  const pick = (re) => {
    const m = yml.match(re);
    if (!m) return '';
    return m[1].trim().replace(/^['"]|['"]$/g, '').replace(/\s+#.*$/, '');
  };
  const url = pick(/^url:[ \t]*(.+)$/m);
  let root = pick(/^root:[ \t]*(.+)$/m) || '/';
  if (root.charAt(0) !== '/') root = '/' + root;
  if (root.charAt(root.length - 1) !== '/') root += '/';
  if (!url) throw new Error('_config.yml 里没有配置 url');
  return { url: url.replace(/\/+$/, ''), root };
}

/** 从 source/ 下找 IndexNow 校验文件 */
function readKey() {
  const dir = path.join(ROOT, 'source');
  const file = fs.readdirSync(dir).find((n) => /^[a-f0-9]{8,128}\.txt$/.test(n));
  if (!file) throw new Error('source/ 下没有找到 IndexNow key 文件（应形如 <hex>.txt）');
  return { key: fs.readFileSync(path.join(dir, file), 'utf8').trim(), file };
}

function extractUrls(xml) {
  const urls = [];
  const re = /<loc>([\s\S]*?)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.push(m[1].trim().replace(/&amp;/g, '&'));
  }
  return urls;
}

function localUrls() {
  const file = path.join(ROOT, 'public', 'sitemap.xml');
  if (!fs.existsSync(file)) return [];
  return extractUrls(fs.readFileSync(file, 'utf8'));
}

/** 优先用线上 sitemap，保证提交的是已经部署出去的 URL */
async function remoteUrls(sitemapUrl) {
  for (let i = 0; i < 6; i++) {
    try {
      const res = await fetch(sitemapUrl, { cache: 'no-store' });
      if (res.ok) {
        const urls = extractUrls(await res.text());
        if (urls.length) return urls;
      }
      console.log(`拉取线上 sitemap ${i + 1}/6：HTTP ${res.status}`);
    } catch (err) {
      console.log(`拉取线上 sitemap ${i + 1}/6 失败：${err.message}`);
    }
    await sleep(INTERVAL);
  }
  return [];
}

/** IndexNow 会去抓 key 文件校验所有权，站点没更新前必须先等它上线 */
async function waitForKey(keyLocation, key) {
  for (let i = 0; i < RETRY; i++) {
    try {
      const res = await fetch(keyLocation, { cache: 'no-store' });
      const body = (await res.text()).trim();
      if (res.ok && body === key) {
        console.log(`key 文件已就绪（第 ${i + 1} 次探测）`);
        return true;
      }
      console.log(`key 文件未就绪 ${i + 1}/${RETRY}：HTTP ${res.status}，内容长度 ${body.length}`);
    } catch (err) {
      console.log(`key 文件探测 ${i + 1}/${RETRY} 出错：${err.message}`);
    }
    await sleep(INTERVAL);
  }
  return false;
}

(async function main() {
  const { url, root } = readConfig();
  const { key, file } = readKey();
  const host = new URL(url).host;
  // key 文件在 /blog/ 下，按 IndexNow 的 keyLocation 规则只能提交 /blog/ 下的 URL，
  // 本站所有页面都在 /blog/ 下，正好吻合。
  const keyLocation = `${url}${root}${file}`;

  console.log(`站点：${url}${root}`);
  console.log(`key：${key}`);
  console.log(`keyLocation：${keyLocation}`);

  if (!(await waitForKey(keyLocation, key))) {
    console.error('key 文件始终不可访问，放弃本次提交（不影响部署）。');
    return;
  }

  const sitemapUrl = `${url}${root}sitemap.xml`;
  let urls = await remoteUrls(sitemapUrl);
  if (!urls.length) {
    urls = localUrls();
    console.log(`线上 sitemap 不可用，回退本地 public/sitemap.xml：${urls.length} 条`);
  }
  if (!urls.length) {
    console.error('没有任何 URL 可提交，放弃（不影响部署）。');
    return;
  }

  const payload = { host, key, keyLocation, urlList: urls };
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  });
  const text = await res.text().catch(() => '');

  console.log(`提交 ${urls.length} 条 URL → HTTP ${res.status} ${res.statusText}`);
  if (text) console.log('响应正文：' + text.slice(0, 400));

  // 200 = 已接受；202 = 已收到、key 校验中；其它状态码说明失败
  if (res.status !== 200 && res.status !== 202) {
    console.error('IndexNow 拒绝了本次提交（不阻塞部署）。');
  }
})().catch((err) => {
  // 推送失败绝不能让站点部署失败
  console.error('IndexNow 提交失败（已忽略，不影响部署）：' + err.message);
});
