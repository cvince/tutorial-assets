const { mkdir, readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const { chromium } = require('playwright');

const output = __dirname;
const duration = 6;
const fps = 30;
const logoFrameCount = 45;
const logoCanvasSize = 512;

const designs = [
  {
    file: 'capy-transport-technical-deep-dive-landscape-4k.mp4',
    width: 3840, height: 2160, logoSize: 370, logoY: 680,
    titleWidth: 3250, titleHeight: 320, titleY: 1075,
    fontSize: 104,
    lines: ['Capy Transport', 'Technical Deep Dive'],
  },
  {
    file: 'capy-user-management-technical-deep-dive-landscape-4k.mp4',
    width: 3840, height: 2160, logoSize: 370, logoY: 680,
    titleWidth: 3250, titleHeight: 320, titleY: 1075,
    fontSize: 104,
    lines: ['Capy User Management', 'Technical Deep Dive'],
  },
  {
    file: 'what-makes-capy-unhackable-landscape-4k.mp4',
    width: 3840, height: 2160, logoSize: 370, logoY: 680,
    titleWidth: 3250, titleHeight: 320, titleY: 1075,
    fontSize: 104,
    lines: ['What Makes Capy "Unhackable"', 'Technical Deep Dive'],
  },
  {
    file: 'eli5-what-is-encryption-portrait-4k.mp4',
    width: 2160, height: 3840, logoSize: 410, logoY: 1450,
    titleWidth: 1980, titleHeight: 200, titleY: 1970,
    fontSize: 124,
    title: 'ELI5, What Is Encryption?',
  },
  {
    file: 'capy-v1-coming-november-2026-portrait-4k.mp4',
    width: 2160, height: 3840, logoSize: 410, logoY: 1390,
    titleWidth: 1980, titleHeight: 550, titleY: 1930,
    fontSize: 68,
    lines: ['COMING NOVEMBER 2026', 'GET AN INVITE AT CAPY.SC'],
    sequential: true,
    invitationGap: true,
    titleFont: 'Michroma,Arial,sans-serif',
    titleTracking: '.18em',
  },
];

const escaped = (value) => value
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const face = (name, inner, viewBox = '0 0 100 100') => `<svg class="${name}" viewBox="${viewBox}">${inner}</svg>`;
const grayFace = '<rect width="100" height="100" fill="#DDDDDD"/>';
const logoHtml = `<html><style>
html,body{margin:0;background:transparent}
#asset{width:${logoCanvasSize}px;height:${logoCanvasSize}px;position:relative}
.logo{position:absolute;inset:0;display:block;font-size:${logoCanvasSize}px;overflow:visible}
.intro,.cube{position:absolute;inset:0;display:block;transform-style:preserve-3d;transform:none}
.intro{animation:faceForward 1000ms ease both}
.cube svg{position:absolute;inset:0;display:block;width:100%;height:100%;backface-visibility:hidden}
.front{transform:translateZ(.5em)}.back{transform:rotateY(180deg) translateZ(.5em)}
.left{transform:rotateY(-90deg) translateZ(.5em)}.right{transform:rotateY(90deg) translateZ(.5em)}
.top{transform:rotateX(90deg) translateZ(.5em)}.bottom{transform:rotateX(-90deg) translateZ(.5em)}
@keyframes faceForward{0%,15%{transform:scale(.6123724357) rotateX(-35.2643897deg) rotateY(45deg)}100%{transform:none}}
</style><div id="asset"><span class="logo"><span class="intro"><span class="cube">
${face('front', '<rect width="64" height="64" fill="black"/><path d="M34.5 18.25V33.7061L45.4277 44.8496L42.5723 47.6504L32.5 37.3789L22.4277 47.6504L19.5723 44.8496L30.5 33.7061V18.25H34.5Z" fill="white"/>', '0 0 64 64')}
${face('left', `${grayFace}<g transform="matrix(2.3094 -1.1547 0 2 -22.397 -38.802)"><path d="M32.375 53.5L13.875 33.4862L13.875 48.5L32.375 59L32.375 53.5Z" fill="black"/></g>`)}
${['top', 'right', 'bottom', 'back'].map((name) => face(name, grayFace)).join('')}
</span></span></span></div></html>`;

const png = async (browser, html, width, height, path) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.locator('#asset').screenshot({ path, omitBackground: true });
  await page.close();
};

const renderLogoFrames = async (browser) => {
  const framesDir = join(output, 'logo-frames');
  await mkdir(framesDir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: logoCanvasSize, height: logoCanvasSize }, deviceScaleFactor: 1 });
  await page.setContent(logoHtml);
  await page.evaluate(() => document.getAnimations().forEach((animation) => animation.pause()));
  for (const frame of Array.from({ length: logoFrameCount }, (_, index) => index)) {
    await page.evaluate((milliseconds) => document.getAnimations().forEach((animation) => { animation.currentTime = milliseconds; }), frame * 1000 / fps);
    await page.locator('#asset').screenshot({ path: join(framesDir, `logo-${String(frame).padStart(3, '0')}.png`), omitBackground: true });
  }
  await page.close();
  return framesDir;
};

const renderVideo = (design, framesDir, titlePaths) => {
  const titleFilters = titlePaths.map((_, index) => {
    const fadeStart = design.sequential ? 0.9 + 1.2 * index : 0.87;
    const fadeDuration = design.sequential ? 1.2 : 0.75;
    return `[${index + 2}:v]format=rgba,fade=t=in:st=${fadeStart}:d=${fadeDuration}:alpha=1,fade=t=out:st=5.25:d=0.6:alpha=1[title${index}]`;
  });
  const overlays = titlePaths.map((_, index) => {
    const input = index === 0 ? 'withLogo' : `withTitle${index - 1}`;
    const outputLabel = index === titlePaths.length - 1 ? ',format=yuv420p[out]' : `[withTitle${index}]`;
    return `[${input}][title${index}]overlay=x=(W-w)/2:y='${design.titleY}+24*exp(-1.5*t)':eval=frame:shortest=1${outputLabel}`;
  });
  const filters = [
    `[1:v]format=rgba,scale=${design.logoSize}:${design.logoSize},tpad=stop_mode=clone:stop_duration=4.5,fade=t=out:st=5.25:d=0.6:alpha=1[logo]`,
    ...titleFilters,
    `[0:v][logo]overlay=x=(W-w)/2:y=${design.logoY}:eval=frame:shortest=1[withLogo]`,
    ...overlays,
  ].join(';');
  const args = [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', `color=c=black:s=${design.width}x${design.height}:r=${fps}:d=${duration}`,
    '-framerate', String(fps), '-i', join(framesDir, 'logo-%03d.png'),
    ...titlePaths.flatMap((titlePath) => ['-loop', '1', '-framerate', String(fps), '-i', titlePath]),
    '-filter_complex', filters, '-map', '[out]', '-t', String(duration),
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-an', join(output, design.file),
  ];
  const result = spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`ffmpeg failed for ${design.file}: ${result.status}`);
};

const main = async () => {
  await mkdir(output, { recursive: true });
  const siteFont = (await readFile(join(output, 'Michroma-Regular.woff2'))).toString('base64');
  const browser = await chromium.launch({ headless: true });
  const framesDir = await renderLogoFrames(browser);
  for (const design of designs) {
    const titles = design.sequential
      ? design.lines.map((_, activeIndex) => design.lines.map((line, lineIndex) => `<span style="display:block;visibility:${lineIndex === activeIndex ? 'visible' : 'hidden'};${design.invitationGap && lineIndex === 1 ? 'margin-top:163px;' : ''}">${escaped(line)}</span>`).join(''))
      : [design.lines ? design.lines.map(escaped).join('<br>') : escaped(design.title)];
    for (const [index, title] of titles.entries()) {
      const suffix = design.sequential ? `-title-${index}.png` : '-title.png';
      const titlePath = join(output, design.file.replace('.mp4', suffix));
      const html = `<html><style>@font-face{font-family:Michroma;src:url(data:font/woff2;base64,${siteFont}) format('woff2');font-weight:400}html,body{margin:0;background:transparent}#asset{width:${design.titleWidth}px;height:${design.titleHeight}px;display:flex;align-items:center;justify-content:center;text-align:center;color:#f5f5f5;font-family:${design.titleFont ?? 'Arial,Helvetica,sans-serif'};font-size:${design.fontSize}px;font-weight:400;line-height:1.18;letter-spacing:${design.titleTracking ?? '-.027em'};white-space:nowrap;-webkit-font-smoothing:antialiased}</style><div id="asset"><span>${title}</span></div></html>`;
      await png(browser, html, design.titleWidth, design.titleHeight, titlePath);
    }
  }
  await browser.close();
  for (const design of designs) {
    const titlePaths = design.sequential
      ? design.lines.map((_, index) => join(output, design.file.replace('.mp4', `-title-${index}.png`)))
      : [join(output, design.file.replace('.mp4', '-title.png'))];
    renderVideo(design, framesDir, titlePaths);
  }
};

main().catch((error) => { process.stderr.write(`${error.stack ?? error}\n`); process.exitCode = 1; });
