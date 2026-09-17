import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = resolve(source, '../hulan-github');
await mkdir(destination, { recursive: true });
// Publish application files only, without local hosting identity, logs or history.
for (const path of [
  'app',
  'components',
  'hooks',
  'lib',
  'public',
  'art',
  'github-pages',
  'scripts',
  '.github',
  'vite.github.config.ts',
  'tsconfig.json',
  'package-lock.json',
  '.oxlintrc.json',
  '.oxfmtrc.json',
  '攻略.md',
  '素材说明.md',
]) {
  await cp(resolve(source, path), resolve(destination, path), {
    recursive: true,
  });
}
const pkg = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8'));
pkg.scripts = {
  predev: 'node scripts/resource-manifest.mjs',
  dev: 'vite --config vite.github.config.ts',
  build: 'vite build --config vite.github.config.ts',
  'build:github': 'vite build --config vite.github.config.ts',
  preview: 'vite preview --config vite.github.config.ts',
  lint: 'oxlint',
  format: 'oxfmt',
};
await writeFile(
  resolve(destination, 'package.json'),
  JSON.stringify(pkg, null, 2) + '\n',
);
await writeFile(
  resolve(destination, '.gitignore'),
  'node_modules/\ndist/\n.env*\n*.tsbuildinfo\n.DS_Store\n',
);
await writeFile(
  resolve(destination, 'README.md'),
  `# 呼兰爱情故事

作者：**wangm**

[在线游玩](https://wangmeng-daw.github.io/hulan-love-story/)

![呼兰爱情故事封面](public/cover/hulan-love-story.png)

2025 年冬天，你回到呼兰的柳河屯，整理爷爷留下的旧电脑。微信停在最后一句“回来就行”，文件夹里有照片、扫描的手写信和没舍得删的旧东西。

你以为自己只是回来收拾一间屋子。

一部连续探索式中文网页叙事解谜游戏。通过旧文件、邮件、微信收藏和仅自己可见的朋友圈，串起始于八十年代东北村屯的一段爱情。剧情完成后，可观看由 24 张不同照片组成的回忆片尾，并展开对应线索解析。

## 游玩

免费，无需下载与注册。支持电脑和手机浏览器，推荐电脑横屏。进度自动保存在当前浏览器；清除浏览器数据会清除存档。游戏里的人物、聊天与账号均为虚构模拟，所有操作在浏览器本地完成。

## 本地运行

需要 Node.js 24。执行 npm ci、npm run dev，打开终端所示地址。

npm run build 生成 dist/github-pages。仓库通过 GitHub Actions 部署到 GitHub Pages，资源路径为 /hulan-love-story/。

## 素材与攻略

图像使用 AI 图像生成工具制作，人物与故事为虚构。封面见 public/cover，其余素材说明见《素材说明.md》。

《攻略.md》包含完整剧透，建议遇到困难时再阅读。
`,
);
console.log(`Prepared ${destination}`);
