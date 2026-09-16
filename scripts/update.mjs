/**
 * 翻墙科普攻略 README 生成器
 * - 内容来源:机场中文网「翻墙科普」栏目 https://jichangcnweb.com/learn/(抓取栏目页上的文章链接,按栏目分组)
 * - GitHub Actions 每日运行(.github/workflows/daily-update.yml),有变化才提交
 * 用法:node scripts/update.mjs
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://jichangcnweb.com';
const LEARN = `${SITE}/learn/`;
const today = new Date().toISOString().slice(0, 10);

const GROUPS = [
  { prefix: '/knowledge/', emoji: '📖', title: '基础知识', intro: '机场、节点、订阅、倍率这些词到底什么意思,IPLC / IEPL / 中转 / 直连差在哪。' },
  { prefix: '/questions/', emoji: '❓', title: '常见问题', intro: '机场和 VPN 怎么选、免费机场能不能用,先把最常被问的答清楚。' },
  { prefix: '/guides/', emoji: '🧭', title: '选购指南', intro: '怎么判断一家机场靠不靠谱、第一次为什么先月付、客户端怎么选。' },
  { prefix: '/troubleshooting/', emoji: '🛠️', title: '故障排查', intro: '装好之后的事:晚上为什么卡、DNS 泄漏怎么办、问题出在本地还是机场。' },
  { prefix: '/warnings/', emoji: '⚠️', title: '避坑指南', intro: '跑路前的信号、优惠码背后的套路,买之前先看一眼。' },
  { prefix: '/ai/', emoji: '🤖', title: 'AI 工具攻略', intro: '翻出去之后那些海外 AI 工具怎么注册、怎么算钱、怎么避开中转站的坑。' },
];

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

async function fetchLearn() {
  const res = await fetch(LEARN, { headers: { 'user-agent': 'jichangx-fanqiang-kepu' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`fetch ${LEARN} -> ${res.status}`);
  const html = await res.text();
  const seen = new Set();
  const links = [];
  for (const m of html.matchAll(/<a[^>]+href="(\/[^"#?]+\/)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const path = m[1];
    const title = decode(m[2].replace(/<[^>]+>/g, ''));
    if (title.length < 8 || seen.has(path)) continue;
    if (!GROUPS.some((g) => path.startsWith(g.prefix))) continue;
    seen.add(path);
    links.push({ path, title });
  }
  return links;
}

let links = [];
try {
  links = await fetchLearn();
} catch (e) {
  console.log('抓取失败:', e.message);
}
// 抓取失败或结果异常时保留上一版 README,不用空内容覆盖
if (links.length < 6) {
  if (existsSync(join(ROOT, 'README.md'))) {
    console.log('结果不足,保留现有 README');
    process.exit(0);
  }
  throw new Error('首次生成失败');
}

const sections = GROUPS.map((g) => {
  const list = links.filter((l) => l.path.startsWith(g.prefix));
  if (!list.length) return '';
  return `## ${g.emoji} ${g.title}

${g.intro}

${list.map((l) => `- [${l.title}](${SITE}${l.path})`).join('\n')}
`;
})
  .filter(Boolean)
  .join('\n');

const readme = `# 翻墙科普攻略:原理、线路、故障排查、避坑与 AI 工具(每日同步)

![更新](https://img.shields.io/badge/更新-${today.replace(/-/g, '--')}-00e676) ![收录](https://img.shields.io/badge/收录文章-${links.length}%20篇-00b0ff) [![来源](https://img.shields.io/badge/内容来源-机场中文网-fbbf24)](${LEARN}) [![Telegram](https://img.shields.io/badge/Telegram-%40jichangcha-26A5E4?logo=telegram&logoColor=white)](https://t.me/jichangcha)

这里是 [机场中文网「翻墙科普」栏目](${LEARN}) 的 GitHub 镜像:客户端怎么安装放在客户端教程,这里回答**装好之后的事**,为什么晚上会卡、怎么判断问题出在本地还是机场、DNS 泄漏是怎么回事,以及翻墙之后那些海外 AI 工具怎么注册和用好。文章列表每天从栏目页自动同步。

> 🔗 相关仓库:[2026 机场推荐清单](https://github.com/jichangx/2026-jichangcha-tuijian) · [每日免费节点](https://github.com/jichangx/free-nodes) · [跑路机场预警](https://github.com/jichangx/airport-status) · [机场科普与快讯](https://github.com/jichangx/jichang-kepu-kuaixun) · [三站精品聚合](https://github.com/jichangx)

${sections}
## 📌 声明

- 文章版权归机场中文网,本仓库只做目录镜像与导航,每天自动同步栏目页;内容仅供学习交流,请遵守当地法律法规
- 机场中文网区分「亲自测试」「官方资料」「公开用户反馈」与「尚未验证」,推广链接会明示,见 [编辑原则](${SITE}/editorial-policy/)
- 反馈:[Issues](../../issues) · Telegram [@jichangcha_chat](https://t.me/jichangcha_chat)

⭐ 觉得有用请点个 Star,栏目新文章会自动出现在这里。
`;

writeFileSync(join(ROOT, 'README.md'), readme);
console.log(`README 已生成:${today} · ${links.length} 篇`);
