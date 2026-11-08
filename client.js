/**
 * 多品牌美化主题：强调色 + 侧栏品牌 + 新对话问候，三合一。
 *
 * 由 theme-palette / sidebar-logo / hero-greeting 合并而来，三段各自用 IIFE 隔离作用域：
 *   1. 强调色：只覆盖装饰性令牌（品牌色、链接、主按钮、选中高亮），背景/文字/边框不动；
 *   2. 侧栏品牌：sidebar.brand.mark / sidebar.brand.name 两个插槽，priority -1 压过官方锁排；
 *   3. 新对话问候：占住 conversation.hero.brand.mark，用 :has() 隐掉原生标题组。
 *
 * 设置页只有一个：设置 → 外观，按「强调色 / 侧栏品牌 / 新对话问候」三段排布。
 * 三段沿用各自原来的 localStorage 键，升级不丢选择。
 */
window.__ModuleLoader__.load({
  id: '@local/multi-brand-theme',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'multi-brand-theme';

    // ══════════════════════════════════════════════════════════
    // 1) 强调色
    // ══════════════════════════════════════════════════════════
    const accentApi = (function () {
      const STYLE_ID = 'dsh-theme-palette';
      const STORAGE_KEY = 'dsh.theme-palette.v3';

      /** 20 个强调色：按色相从暖到冷排列，末尾两个中性色。 */
      const COLORS = [
        { id: 'red', hex: '#e5484d' },
        { id: 'vermilion', hex: '#e5683d' },
        { id: 'orange', hex: '#e8871e' },
        { id: 'amber', hex: '#d9a02a' },
        { id: 'olive', hex: '#c6b320' },
        { id: 'lime', hex: '#8fae1b' },
        { id: 'green', hex: '#4f9d3a' },
        { id: 'emerald', hex: '#0f9d68' },
        { id: 'teal', hex: '#12968f' },
        { id: 'cyan', hex: '#1a9aa8' },
        { id: 'sky', hex: '#2b8fc9' },
        { id: 'blue', hex: '#2f6bff' },
        { id: 'indigo', hex: '#4b5bd6' },
        { id: 'violet', hex: '#6b47d6' },
        { id: 'purple', hex: '#8b3fd1' },
        { id: 'magenta', hex: '#b03bc0' },
        { id: 'pink', hex: '#d13a92' },
        { id: 'rose', hex: '#c2455f' },
        { id: 'brown', hex: '#8a6a52' },
        { id: 'graphite', hex: '#5b6472' },
      ];

      const ZH = {
        'accent.heading': '强调色',
        'accent.intro': '选一个强调色：只影响品牌色、链接、主按钮和选中高亮。背景、文字、边框保持主题原样。只保存在本机浏览器。',
        'accent.reset': '恢复默认强调色',
        'accent.current': '当前',
        'accent.themeDefault': '主题自带',
      };
      const EN = {
        'accent.heading': 'Accent color',
        'accent.intro': 'Pick an accent. Only the brand color, links, primary buttons and selection highlights change; backgrounds, text and borders stay as the theme defines them.',
        'accent.reset': 'Reset to theme accent',
        'accent.current': 'Current',
        'accent.themeDefault': 'theme default',
      };

      const isHex = (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

      // ── 颜色工具 ──────────────────────────────────────────
      function toHex(value, fallback) {
        const text = String(value || '').trim();
        const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(text);
        if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
        if (/^#[0-9a-f]{6}$/i.test(text)) return text.toLowerCase();
        const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(text);
        if (rgb) {
          const part = (n) => Math.max(0, Math.min(255, Math.round(Number(n)))).toString(16).padStart(2, '0');
          return `#${part(rgb[1])}${part(rgb[2])}${part(rgb[3])}`;
        }
        return fallback;
      }

      function hexToHsl(hex) {
        const value = toHex(hex, '#808080').slice(1);
        const r = parseInt(value.slice(0, 2), 16) / 255;
        const g = parseInt(value.slice(2, 4), 16) / 255;
        const b = parseInt(value.slice(4, 6), 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        const d = max - min;
        let hue = 0;
        let sat = 0;
        if (d > 0) {
          sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
          else if (max === g) hue = ((b - r) / d + 2) * 60;
          else hue = ((r - g) / d + 4) * 60;
        }
        return { h: hue, s: sat * 100, l: l * 100 };
      }

      function hslToHex(hueValue, satValue, lightValue) {
        const hh = ((hueValue % 360) + 360) % 360;
        const s = Math.max(0, Math.min(100, satValue)) / 100;
        const l = Math.max(0, Math.min(100, lightValue)) / 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
        const m = l - c / 2;
        let rgb;
        if (hh < 60) rgb = [c, x, 0];
        else if (hh < 120) rgb = [x, c, 0];
        else if (hh < 180) rgb = [0, c, x];
        else if (hh < 240) rgb = [0, x, c];
        else if (hh < 300) rgb = [x, 0, c];
        else rgb = [c, 0, x];
        return `#${rgb.map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('')}`;
      }

      /** 明度/饱和度微调，用于悬停态。 */
      function shift(hex, deltaLight, deltaSat) {
        const hsl = hexToHsl(hex);
        return hslToHex(hsl.h, hsl.s + (deltaSat || 0), hsl.l + deltaLight);
      }

      // ── 生成强调色样式 ────────────────────────────────────
      function buildStyleText(accent) {
        const hsl = hexToHsl(accent);
        // 暗色下主色要够亮才看得清；亮色下保持原色。
        const brandDark = hsl.l >= 62 ? accent : hslToHex(hsl.h, Math.max(hsl.s, 55), 62);
        const lightHover = shift(accent, -8);
        const darkHover = shift(brandDark, 8);
        const lightTint = hslToHex(hsl.h, Math.min(80, Math.max(hsl.s, 45)), 93);
        const darkTint = hslToHex(hsl.h, Math.min(60, Math.max(hsl.s, 35)), 24);

        const declare = (brand, hover, tint) => [
          `--dsw-alias-brand-primary: ${brand} !important;`,
          `--dsw-alias-link: ${brand} !important;`,
          `--dsw-alias-button-primary-fill: ${brand} !important;`,
          `--dsw-alias-button-primary-hover: ${hover} !important;`,
          // 圆形发送按钮用的是 info 系列，不是 primary，漏掉它按钮就不变色。
          `--dsw-alias-button-info-fill: ${brand} !important;`,
          `--dsw-alias-button-info-hover: ${hover} !important;`,
          `--dsw-alias-interactive-bg-hover-accent: ${tint} !important;`,
          `--dsw-alias-state-business-primary: ${brand} !important;`,
          `--dsw-alias-onboarding-accent: ${brand} !important;`,
        ].join(' ');

        return [
          `:root, body { ${declare(accent, lightHover, lightTint)} }`,
          `body[data-ds-dark-theme], :root[data-ds-dark-theme] { ${declare(brandDark, darkHover, darkTint)} }`,
        ].join('\n');
      }

      // ── 存储 ──────────────────────────────────────────────
      function readAccent() {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return parsed && isHex(parsed.accent) ? parsed.accent.toLowerCase() : null;
        } catch (error) {
          return null;
        }
      }

      function writeAccent(accent) {
        try {
          if (!accent) window.localStorage.removeItem(STORAGE_KEY);
          else window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ accent }));
        } catch (error) {
          // 配额或隐私模式：静默。
        }
      }

      // ── 状态 ──────────────────────────────────────────────
      let accent = readAccent();
      let styleNode = null;
      const listeners = new Set();

      function applyAccent(next) {
        accent = next;
        writeAccent(next);
        if (styleNode) styleNode.textContent = next ? buildStyleText(next) : '';
        for (const listener of Array.from(listeners)) listener();
      }

      function subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }

      function mountStyle() {
        const existing = document.getElementById(STYLE_ID);
        if (existing) existing.remove();
        const node = document.createElement('style');
        node.id = STYLE_ID;
        document.head.appendChild(node);
        styleNode = node;
        return () => {
          node.remove();
          if (styleNode === node) styleNode = null;
        };
      }

      // ── 设置页（全内联样式） ──────────────────────────────
      const S = {
        root: { display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0 28px' },
        intro: { margin: 0, fontSize: 13, lineHeight: 1.7, color: 'var(--dsw-alias-label-secondary)', maxWidth: '64ch' },
        grid: { display: 'flex', flexWrap: 'wrap', gap: 10, maxWidth: 520 },
        swatch: {
          width: 34, height: 34, borderRadius: 10, padding: 0, cursor: 'pointer',
          border: '1px solid rgba(0,0,0,.12)', boxShadow: '0 1px 2px rgba(0,0,0,.12)',
        },
        swatchOn: {
          border: '2px solid var(--dsw-alias-label-primary)',
          boxShadow: '0 0 0 2px var(--dsw-alias-bg-layer-1), 0 0 0 3px var(--dsw-alias-label-primary)',
        },
        foot: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
        reset: {
          font: 'inherit', fontSize: 13, lineHeight: 1, padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
          color: 'var(--dsw-alias-label-primary)', background: 'transparent',
          border: '0.5px solid var(--dsw-alias-border-l1)',
        },
        note: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' },
        hex: { fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12, color: 'var(--dsw-alias-label-secondary)' },
      };

      function ThemePalettePage(props) {
        const t = typeof props.t === 'function' ? props.t : (key) => String(key);
        const [current, setCurrent] = React.useState(accent);
        React.useEffect(() => subscribe(() => setCurrent(accent)), []);

        return h('div', { style: S.root }, [
          h('p', { key: 'intro', style: S.intro }, t('accent.intro')),
          h('div', { key: 'grid', style: S.grid },
            COLORS.map((color) => h('button', {
              key: color.id,
              type: 'button',
              title: color.id,
              'aria-label': color.id,
              style: current === color.hex ? { ...S.swatch, ...S.swatchOn, background: color.hex } : { ...S.swatch, background: color.hex },
              onClick: () => applyAccent(color.hex),
            }))),
          h('div', { key: 'foot', style: S.foot }, [
            h('button', {
              key: 'reset',
              type: 'button',
              style: { ...S.reset, opacity: current ? 1 : 0.5 },
              disabled: !current,
              onClick: () => applyAccent(null),
            }, t('accent.reset')),
            h('span', { key: 'note', style: S.note }, `${t('accent.current')} `),
            h('span', { key: 'hex', style: S.hex }, current || t('accent.themeDefault')),
          ]),
        ]);
      }

      /** 兜底：渲染出错时显示原因与堆栈，而不是留一片空白。 */
      class PaletteBoundary extends React.Component {
        constructor(props) {
          super(props);
          this.state = { error: null, info: null };
        }

        static getDerivedStateFromError(error) {
          return { error };
        }

        componentDidCatch(error, info) {
          this.setState({ info: (info && info.componentStack) || null });
          try { console.error('[multi-brand-theme] accent render failed', error); } catch (ignored) { /* 忽略 */ }
        }

        render() {
          const state = this.state || {};
          if (state.error) {
            const detail = [
              (state.error && state.error.message) || String(state.error),
              state.error && state.error.stack ? `\n${state.error.stack}` : '',
              state.info ? `\n\ncomponent stack:${state.info}` : '',
            ].join('');
            return h('div', { style: S.root }, [
              h('p', { key: 'head', style: S.intro }, '强调色设置加载失败（把下面整段贴给我）'),
              h('pre', {
                key: 'detail',
                style: { margin: 0, padding: 12, borderRadius: 8, fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)' },
              }, detail),
            ]);
          }
          return this.props.children;
        }
      }

      function AccentPage(props) {
        return h(PaletteBoundary, null, h(ThemePalettePage, props));
      }

      return {
        zh: ZH,
        en: EN,
        Page: AccentPage,
        start() {
          const dispose = mountStyle();
          applyAccent(accent);
          return () => {
            dispose();
            accent = readAccent();
          };
        },
      };
    })();

    // ══════════════════════════════════════════════════════════
    // 2) 侧栏品牌
    // ══════════════════════════════════════════════════════════
    // DeepSeek 鲸鱼标志（simple-icons CC0，24×24），主题模式自绘染色用。
      const DEEPSEEK_MARK_PATH = 'M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45';

    const brandApi = (function () {
      /** 8 家厂商字标；body 是内联 SVG 内容。 */
      const BRANDS = [{"id":"mimo","label":"MiMo","light":"data:image/png;base64,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","dark":"data:image/png;base64,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","w":720,"h":61},{"id":"kimi","label":"Kimi","mark":"M11.065 11.199l7.257-7.2c.137-.136.06-.41-.116-.41H14.3a.164.164 0 00-.117.051l-7.82 7.756c-.122.12-.302.013-.302-.179V3.82c0-.127-.083-.23-.185-.23H3.186c-.103 0-.186.103-.186.23V19.77c0 .128.083.23.186.23h2.69c.103 0 .186-.102.186-.23v-3.25c0-.069.025-.135.069-.178l2.424-2.406a.158.158 0 01.205-.023l6.484 4.772a7.677 7.677 0 003.453 1.283c.108.012.2-.095.2-.23v-3.06c0-.117-.07-.212-.164-.227a5.028 5.028 0 01-2.027-.807l-5.613-4.064c-.117-.078-.132-.279-.028-.381z","markDot":{"d":"M21.846 0a1.923 1.923 0 110 3.846H20.15a.226.226 0 01-.227-.226V1.923C19.923.861 20.784 0 21.846 0z","color":"#1783FF"},"iconSize":20,"wordSize":18,"text":"Kimi","textWeight":300},{"id":"qwen","label":"Qwen","vb":"0 0 85 24","w":85,"h":24,"body":"<path d=\"M49.123 5.939h-3.046a.58.58 0 0 0-.555.412l-3.194 10.701L38.934 6.33a.57.57 0 0 0-.55-.4h-2.55a.57.57 0 0 0-.548.4l-3.422 10.734L28.666 6.34a.58.58 0 0 0-.554-.412h-3.047a.41.41 0 0 0-.39.533l5.174 16.742a.57.57 0 0 0 .549.406h2.544a.57.57 0 0 0 .55-.406l3.61-11.536 3.564 11.536a.57.57 0 0 0 .55.406h2.57a.57.57 0 0 0 .55-.406l5.173-16.731a.41.41 0 0 0-.39-.533zm28.378-.422a7 7 0 0 0-4.793 1.885v-.988a.493.493 0 0 0-.491-.49h-2.64a.493.493 0 0 0-.491.49v16.7c0 .268.222.49.49.49h2.64c.27 0 .492-.222.492-.49v-9.858c0-2.613 1.79-4.16 4.091-4.16s4.092 1.489 4.092 4.16v9.857c0 .27.221.491.49.491h2.64c.27 0 .491-.222.491-.49v-10.48c0-4.303-2.877-7.123-7.01-7.123zM24.777 22.844l-3.39-3.39a11.96 11.96 0 0 0 2.587-8.082C23.663 5.279 18.711.327 12.618.016 5.502-.344-.348 5.5.016 12.618.328 18.71 5.28 23.662 11.372 23.974a11.95 11.95 0 0 0 7.106-1.885l1.225 1.225a.98.98 0 0 0 .692.285h4.07c.396 0 .597-.48.317-.76zm-12.782-2.777A8.066 8.066 0 0 1 3.928 12a8.066 8.066 0 0 1 8.067-8.067 8.066 8.066 0 0 1 6.589 12.718l-3.432-3.431a.98.98 0 0 0-.691-.285h-4.07a.446.446 0 0 0-.318.76l5.523 5.522a8 8 0 0 1-3.606.85zm46.526-14.54c-4.968-.063-9.133 3.86-9.35 8.822a9.239 9.239 0 0 0 17.496 4.535.446.446 0 0 0-.4-.644H63.31a.98.98 0 0 0-.729.328c-1.035 1.145-2.524 1.906-4.181 1.906-2.635 0-4.905-1.838-5.549-4.288h14.043c.248 0 .46-.19.486-.438.037-.322.058-.654.058-.987 0-5.063-3.87-9.17-8.912-9.239zm-.792 3.57c2.798-.323 5.079 1.404 5.845 3.848H52.967a5.75 5.75 0 0 1 4.768-3.849z\"></path>","mark":"M19.713 2.825h-5.907c0-.251-.066-.503-.196-.728L12.819.728A1.46 1.46 0 0 0 11.559 0h-1.58c-.52 0-1 .275-1.26.728l-2.42 4.19a1.45 1.45 0 0 0 0 1.453l.791 1.37c.26.448.74.727 1.26.727h11.36c.52 0 1-.275 1.26-.728l.79-1.37a1.45 1.45 0 0 0 0-1.451l-.79-1.37a1.46 1.46 0 0 0-1.26-.728zM.195 9.905l2.951 5.115a1.46 1.46 0 0 0-.531.531l-.791 1.37a1.45 1.45 0 0 0 0 1.452l.79 1.37c.26.448.74.727 1.26.727h4.84c.52 0 1-.275 1.26-.728l.79-1.37a1.45 1.45 0 0 0 0-1.451L5.086 7.083a1.46 1.46 0 0 0-1.26-.728h-1.58c-.52 0-1 .276-1.26.728l-.79 1.37a1.45 1.45 0 0 0 0 1.452m15.888 13.367 2.951-5.115c.217.125.469.196.728.196h1.582c.52 0 1-.275 1.26-.728l.79-1.37a1.45 1.45 0 0 0 0-1.451l-2.42-4.191a1.46 1.46 0 0 0-1.259-.728h-1.582c-.52 0-1 .276-1.259.728l-5.678 9.838a1.45 1.45 0 0 0 0 1.452l.79 1.37c.26.448.74.727 1.26.727h1.582c.52 0 1-.275 1.26-.728z","markColor":"#082DFF","wordSize":17,"iconSize":18},{"id":"gemini","label":"Gemini","vb":"0 0 98 24","w":98,"h":24,"body":"<path d=\"M21.186 12.67c0 2.649-.786 4.759-2.359 6.33-1.766 1.87-4.09 2.806-6.969 2.806-2.756 0-5.088-.953-6.996-2.86C2.954 17.04 2 14.693 2 11.904c0-2.789.954-5.137 2.862-7.043C6.77 2.953 9.102 2 11.858 2c1.396 0 2.712.247 3.949.741 1.236.495 2.252 1.192 3.047 2.092l-1.749 1.748c-.583-.706-1.338-1.258-2.266-1.655a7.49 7.49 0 00-2.981-.596c-2.067 0-3.816.715-5.247 2.145-1.413 1.448-2.12 3.257-2.12 5.428s.707 3.98 2.12 5.428c1.431 1.43 3.18 2.145 5.247 2.145 1.89 0 3.463-.53 4.717-1.588 1.254-1.06 1.979-2.516 2.173-4.37h-6.89v-2.277h9.196c.088.495.132.971.132 1.43m7.652-4.633c1.946 0 3.494.629 4.645 1.886 1.15 1.257 1.726 3.018 1.726 5.282l-.027.268H24.877c.036 1.284.464 2.318 1.285 3.102.82.785 1.802 1.177 2.944 1.177 1.57 0 2.802-.784 3.694-2.354l2.195 1.07a6.54 6.54 0 01-2.45 2.595C31.503 21.688 30.32 22 29 22c-1.927 0-3.516-.66-4.765-1.98-1.249-1.319-1.873-2.986-1.873-5.001 0-1.997.606-3.66 1.82-4.988 1.213-1.329 2.766-1.993 4.657-1.993m-.053 2.247c-.928 0-1.727.285-2.396.856-.67.57-1.11 1.337-1.325 2.3h7.522c-.071-.91-.442-1.663-1.111-2.26-.67-.598-1.566-.896-2.69-.896M39.247 21.53h-2.455V8.465h2.348v1.813h.107c.374-.64.947-1.173 1.721-1.6.774-.427 1.544-.64 2.309-.64.96 0 1.806.222 2.535.667a3.931 3.931 0 011.601 1.84c1.085-1.671 2.589-2.507 4.51-2.507 1.513 0 2.678.462 3.496 1.387.819.924 1.228 2.24 1.228 3.946v8.16h-2.455v-7.786c0-1.227-.223-2.112-.668-2.654-.444-.542-1.192-.813-2.241-.813-.943 0-1.735.4-2.375 1.2-.64.8-.961 1.742-.961 2.826v7.227h-2.455v-7.786c0-1.227-.223-2.112-.668-2.654-.444-.542-1.191-.813-2.241-.813-.943 0-1.735.4-2.375 1.2-.64.8-.961 1.742-.961 2.826v7.227zM61.911 3.93c0 .48-.17.89-.508 1.228a1.675 1.675 0 01-1.23.508c-.48 0-.89-.17-1.229-.508a1.673 1.673 0 01-.508-1.228c0-.481.17-.89.508-1.229a1.675 1.675 0 011.23-.508c.48 0 .89.17 1.23.508.338.338.507.748.507 1.228m-.11 4.514v13.088h-2.857V8.443h2.857zM80 3.93c0 .48-.17.89-.508 1.228a1.675 1.675 0 01-1.23.508c-.48 0-.89-.17-1.229-.508a1.673 1.673 0 01-.508-1.228c0-.481.17-.89.508-1.229a1.675 1.675 0 011.23-.508c.48 0 .89.17 1.23.508.338.338.507.748.507 1.228m-.11 4.514v13.088h-2.857V8.443h2.857zm-16.343.022h2.349v1.813h.107c.373-.64.947-1.173 1.721-1.6a4.935 4.935 0 012.415-.64c1.601 0 2.833.458 3.696 1.373.863.916 1.294 2.218 1.294 3.907v8.213h-2.455v-8.053c-.053-2.133-1.13-3.2-3.229-3.2-.978 0-1.797.395-2.455 1.187-.658.79-.987 1.737-.987 2.84v7.226h-2.456V8.465z\"></path>","mark":"M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81","markGradient":["#4285F4","#9B72CB","#D96570"],"wordSize":17,"iconSize":18},{"id":"gpt","label":"GPT","vb":"0 0 86 24","w":86,"h":24,"body":"<path d=\"M10.703 2C5.916 2 2 5.916 2 10.703c0 4.787 3.916 8.704 8.703 8.704 4.787 0 8.704-3.893 8.704-8.704A8.698 8.698 0 0010.703 2zm0 14.288c-2.973 0-5.367-2.442-5.367-5.585S7.73 5.12 10.703 5.12c2.974 0 5.367 2.441 5.367 5.584s-2.393 5.585-5.367 5.585zM28.206 6.835c-1.57 0-3.094.629-3.892 1.693v-1.45h-3.143V24h3.143v-6.116c.798.99 2.273 1.523 3.892 1.523 3.385 0 6.045-2.66 6.045-6.286 0-3.626-2.66-6.286-6.044-6.286zm-.531 9.84c-1.79 0-3.385-1.402-3.385-3.554s1.596-3.554 3.385-3.554c1.789 0 3.384 1.402 3.384 3.554s-1.595 3.554-3.384 3.554zM41.649 6.835c-3.433 0-6.141 2.684-6.141 6.286 0 3.602 2.37 6.286 6.237 6.286 3.167 0 5.198-1.91 5.827-4.062h-3.07c-.388.895-1.475 1.523-2.78 1.523-1.62 0-2.854-1.136-3.144-2.756h9.139V12.88c0-3.288-2.297-6.044-6.068-6.044zm-3.047 5.053c.339-1.523 1.596-2.514 3.12-2.514 1.619 0 2.852 1.064 2.997 2.514h-6.117zM56.081 6.835c-1.402 0-2.877.629-3.553 1.669V7.077h-3.143v12.088h3.143v-6.503c0-1.886 1.015-3.119 2.659-3.119 1.523 0 2.345 1.16 2.345 2.78v6.842h3.143v-7.35c0-2.997-1.838-4.98-4.594-4.98zM68.724 2.242l-6.841 16.923h3.36l1.45-3.699h7.785l1.45 3.7h3.41L72.543 2.241h-3.82zm-.943 10.42l2.805-7.084 2.78 7.084H67.78zM83.81 2.242h-3.191v16.923h3.19V2.242z\"></path>","mark":"M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z","markColor":"#10A37F","wordSize":17,"iconSize":18},{"id":"claude","label":"Claude","vb":"0 0 97 24","w":97,"h":24,"body":"<path d=\"M13.623 20.222c-3.417 0-5.753-1.901-6.855-4.827a12.992 12.992 0 01-.838-4.772c0-4.907 2.206-8.315 7.08-8.315 3.275 0 5.297 1.425 6.448 4.826h1.402l-.19-4.69C18.709 1.18 16.258.543 13.276.543c-4.2 0-7.775 1.874-9.763 5.254a11.357 11.357 0 00-1.511 5.872c0 3.753 1.777 7.08 5.113 8.926a11.95 11.95 0 005.943 1.398c3.254 0 5.835-.617 8.122-1.697l.593-5.172h-1.43c-.858 2.362-1.88 3.78-3.574 4.534-.831.373-1.88.564-3.146.564zm14.74-17.914L28.499 0h-.967L23.23 1.29v.699l1.907.882v16.142c0 1.1-.565 1.344-2.043 1.528v1.18h7.319v-1.18c-1.484-.184-2.042-.428-2.042-1.528V2.315l-.007-.007zm29.104 19.685h.565l4.95-.937v-1.208l-.695-.054c-1.157-.109-1.457-.346-1.457-1.29V9.897l.137-2.763h-.783l-4.678.672v1.181l.457.082c1.266.183 1.64.536 1.64 1.419v7.67c-1.212.937-2.369 1.527-3.744 1.527-1.525 0-2.471-.774-2.471-2.58V9.905l.136-2.763h-.804l-4.684.672v1.181l.484.082c1.266.183 1.64.536 1.64 1.418v7.08c0 3 1.703 4.426 4.412 4.426 2.07 0 3.765-1.1 5.038-2.627L57.474 22l-.007-.007zm-13.602-9.55c0-3.836-2.043-5.309-5.733-5.309-3.254 0-5.616 1.344-5.616 3.57 0 .666.238 1.175.721 1.528l2.478-.326c-.109-.746-.163-1.201-.163-1.391 0-1.263.674-1.901 2.042-1.901 2.022 0 3.044 1.419 3.044 3.7v.746l-5.106 1.527c-1.702.462-2.67.863-3.316 1.8a3.386 3.386 0 00-.476 1.9c0 2.172 1.497 3.706 4.057 3.706 1.852 0 3.493-.835 4.922-2.416.51 1.581 1.294 2.416 2.69 2.416 1.13 0 2.15-.455 3.063-1.344l-.272-.937a4.363 4.363 0 01-1.178.163c-.783 0-1.157-.617-1.157-1.826v-5.607zm-6.536 7.378c-1.396 0-2.26-.808-2.26-2.226 0-.964.456-1.528 1.43-1.854l4.139-1.31v3.965c-1.321.997-2.097 1.425-3.31 1.425zm43.095 1.235v-1.208l-.701-.054c-1.158-.109-1.45-.346-1.45-1.29V2.308L78.409 0h-.974l-4.302 1.29v.699l1.906.882V8.18a6.024 6.024 0 00-3.656-1.046c-4.276 0-7.612 3.245-7.612 8.098 0 3.998 2.397 6.761 6.346 6.761 2.042 0 3.819-.99 4.922-2.525l-.136 2.525h.571l4.95-.937zm-8.96-12.313c2.043 0 3.575 1.181 3.575 3.353v6.11a4.91 4.91 0 01-3.547 1.425c-2.928 0-4.412-2.308-4.412-5.39 0-3.462 1.695-5.498 4.385-5.498zm19.424 3.055c-.381-1.792-1.484-2.81-3.016-2.81-2.288 0-3.874 1.717-3.874 4.18 0 3.646 1.934 6.008 5.059 6.008a5.858 5.858 0 005.03-2.953l.913.245c-.408 3.163-3.281 5.525-6.808 5.525-4.14 0-6.992-3.054-6.992-7.399 0-4.378 3.098-7.46 7.237-7.46 3.09 0 5.27 1.853 5.97 5.07l-10.783 3.3V14.05l7.264-2.247v-.006z\"></path>","mark":"m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z","markColor":"#D97757","wordSize":17,"iconSize":18},{"id":"grok","label":"Grok","vb":"0 0 63 24","w":63,"h":24,"body":"<path d=\"M47.419 21.645V2.457h3.033V15.12l6.415-7.369h3.678l-5.772 6.316 5.825 7.578h-3.624l-4.717-6.512-1.805-.012v6.524h-3.033zM38.22 21.968c-4.51 0-6.952-3.198-6.952-7.283 0-4.112 2.443-7.283 6.952-7.283 4.537 0 6.952 3.17 6.952 7.283 0 4.085-2.415 7.283-6.952 7.283zm-3.785-7.283c0 3.17 1.718 4.756 3.785 4.756 2.094 0 3.785-1.585 3.785-4.756 0-3.172-1.691-4.784-3.785-4.784-2.067 0-3.785 1.612-3.785 4.784zM22.826 21.645V9.955l2.55-2.204h5.422v2.58H25.86v11.314h-3.033zM11.228 22C5.447 22 2 17.802 2 12.078 2 6.3 5.57 2 11.341 2c4.51 0 7.811 2.311 8.59 6.611h-3.463c-.51-2.445-2.55-3.816-5.127-3.816-4.16 0-5.986 3.601-5.986 7.283 0 3.682 1.826 7.256 5.986 7.256 3.973 0 5.717-2.876 5.852-5.267h-5.986v-2.783h9.046l-.015 1.455c0 5.406-2.203 9.261-9.01 9.261z\"></path>","mark":"M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815","wordSize":17,"iconSize":18}];

      const DEFAULT_ID = 'default';
      const STORAGE_KEY = 'dsh.sidebar-logo.v1';
      const STYLE_ID = 'dsh-sidebar-logo';
      /** 侧栏里字标的显示高度（px），各家按自身宽高比横向伸缩。 */
      const SIZE = 15;

      /** DeepSeek 选项用宿主官方锁排（鲸鱼 + 字标）；primitives 拿不到就退回 MiMo 双图。 */
      let primitives = null;
      try {
        primitives = require('@deepseek-ai/dsh-client-ui-primitives');
      } catch (error) {
        primitives = null;
      }

      const BRAND_BY_ID = {};
      for (const brand of BRANDS) BRAND_BY_ID[brand.id] = brand;
      // GPT 这一项按 ChatGPT 呈现：绿底白色结形的图标 + ChatGPT 文字标。
      if (BRAND_BY_ID.gpt) {
        BRAND_BY_ID.gpt.label = 'ChatGPT';
        BRAND_BY_ID.gpt.badgeBg = '#10A37F';
        BRAND_BY_ID.gpt.text = 'ChatGPT';
        BRAND_BY_ID.gpt.textWeight = 600;
        BRAND_BY_ID.gpt.wordSize = 18;
        BRAND_BY_ID.gpt.iconSize = 24;
      }

      const ZH = {
        'brand.heading': '侧栏品牌',
        'brand.intro': '左上角显示哪家厂商的字标。选择即时生效，只保存在本机浏览器。',
        'brand.official': 'DeepSeek',
        'brand.note': '单色字标跟随主题文字颜色；DeepSeek 为官方「鲸鱼 + 字标」原样，MiMo 用官方亮/暗双图；Kimi / Qwen / Gemini / GPT / Grok / Claude 带品牌色图标。',
      'brand.paintLabel': '使用品牌色',
      'brand.paintHint': '开启后每个标志用各家自己的颜色；关闭则跟随主题强调色。',
      };
      const EN = {
        'brand.heading': 'Sidebar brand',
        'brand.intro': 'Which wordmark appears in the top-left corner. Applies instantly and stays in this browser.',
        'brand.official': 'DeepSeek',
        'brand.note': 'Mono wordmarks follow the theme text color; DeepSeek is the official whale lockup, MiMo uses its official pair, and Kimi / Qwen / Gemini / GPT / Grok / Claude carry brand-colored marks.',
        'brand.paintLabel': 'Use brand colors',
        'brand.paintHint': 'Turn on to paint each mark in its own brand color; turn off to follow the theme accent color.',
      };

      // ── 选中状态 ──────────────────────────────────────────
      function readBrand() {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          return raw && (raw === 'default' || BRAND_BY_ID[raw]) ? raw : DEFAULT_ID;
        } catch (error) {
          return DEFAULT_ID;
        }
      }

      let currentId = readBrand();
      const listeners = new Set();

      function setBrand(id) {
        if (id !== 'default' && !BRAND_BY_ID[id]) return;
        currentId = id;
        try {
          window.localStorage.setItem(STORAGE_KEY, id);
        } catch (error) {
          // 配额或隐私模式：静默。
        }
        for (const listener of Array.from(listeners)) listener();
      }

      function subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }

      function useBrandId() {
        const [id, setId] = React.useState(currentId);
        React.useEffect(() => subscribe(() => setId(currentId)), []);
        return id;
      }

      const PAINT_KEY = 'dsh.sidebar-logo.paint.v1';
      function readPaint() {
        try {
          return window.localStorage.getItem(PAINT_KEY) === 'theme' ? 'theme' : 'brand';
        } catch (error) {
          return 'brand';
        }
      }
      let currentPaint = readPaint();

      function setPaint(next) {
        currentPaint = next === 'theme' ? 'theme' : 'brand';
        try {
          window.localStorage.setItem(PAINT_KEY, currentPaint);
        } catch (error) {
          // 配额或隐私模式：静默。
        }
        try {
          document.documentElement.setAttribute('data-dsh-brand-paint', currentPaint);
        } catch (error) {
          // 非浏览器环境：忽略。
        }
        for (const listener of Array.from(listeners)) listener();
      }

      function usePaint() {
        const [paint, setLocal] = React.useState(currentPaint);
        React.useEffect(() => subscribe(() => setLocal(currentPaint)), []);
        return paint;
      }

      // ── 渲染 ──────────────────────────────────────────────
      function BrandSvg({ brand, height }) {
        return h('svg', {
          viewBox: brand.vb,
          width: Math.round((height * brand.w / brand.h) * 100) / 100,
          height,
          fill: 'currentColor',
          role: 'img',
          'aria-label': brand.label,
          dangerouslySetInnerHTML: { __html: brand.body },
        });
      }

      function BrandImages({ brand }) {
        return h(
          'span',
          { className: 'dsh-sidebar-logo' },
          h('img', {
            key: 'light',
            className: 'dsh-sidebar-logo__light',
            src: brand.light,
            alt: '',
            draggable: false,
          }),
          h('img', {
            key: 'dark',
            className: 'dsh-sidebar-logo__dark',
            src: brand.dark,
            alt: '',
            draggable: false,
          }),
        );
      }

      function Wordmark({ brand, height }) {
        // MiMo 是官方位图字标，无法在不破坏字形的前提下精确染色，保持黑白。
        if (brand.light) return h(BrandImages, { brand });
        return h(BrandSvg, { brand, height });
      }

      /** DeepSeek 官方组件不吃 currentColor 时，用同形自绘鲸鱼跟随强调色。 */
      function DeepSeekMark({ size, accent }) {
        return h('svg', {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          style: accent ? { color: 'var(--dsw-alias-brand-primary)' } : undefined,
          'aria-hidden': 'true',
          focusable: 'false',
        }, h('path', { d: DEEPSEEK_MARK_PATH, fill: 'currentColor' }));
      }

      /** 品牌图标（24×24）：Gemini 渐变、Kimi 实心徽标、GPT/Claude/Qwen 品牌色，其余跟随文字色。 */
      function BrandIcon({ brand, size, paint, accent }) {
        if (paint === 'theme') {
          // 同步主题色：丢掉品牌色、底色与圆点，整枚只吃 currentColor。
          return h('svg', {
            viewBox: '0 0 24 24',
            width: size,
            height: size,
            style: accent ? { color: 'var(--dsw-alias-brand-primary)' } : undefined,
            'aria-hidden': 'true',
            focusable: 'false',
          }, h('path', { d: brand.mark, fill: 'currentColor' }));
        }
        if (brand.badgeBg) {
          // ChatGPT 样式：品牌绿圆角方块 + 白色结形，24px 下比裸线稿更清楚。
          const scale = 0.68;
          const offset = (24 - 24 * scale) / 2;
          return h('svg', {
            viewBox: '0 0 24 24',
            width: size,
            height: size,
            className: 'dsh-sidebar-badge',
            'aria-hidden': 'true',
            focusable: 'false',
          }, [
            h('rect', { key: 'bg', x: 0.35, y: 0.35, width: 23.3, height: 23.3, rx: 5.4, fill: brand.badgeBg }),
            h('g', { key: 'mark', transform: 'translate(' + offset + ' ' + offset + ') scale(' + scale + ')' }, [
              h('path', { key: 'shape', d: brand.mark, fill: '#FFFFFF' }),
            ]),
          ]);
        }
        if (brand.markBadge) {
          // Kimi 官方 App 图标：实心圆角方块 + 白 K + 蓝点。
          const scale = 0.8;
          const offset = (24 - 24 * scale) / 2;
          return h('svg', {
            viewBox: '0 0 24 24',
            width: size,
            height: size,
            className: 'dsh-sidebar-badge',
            'aria-hidden': 'true',
            focusable: 'false',
          }, [
            h('rect', { key: 'bg', x: 0.35, y: 0.35, width: 23.3, height: 23.3, rx: 5, fill: '#0B0B0C' }),
            h('g', { key: 'mark', transform: 'translate(' + offset + ' ' + offset + ') scale(' + scale + ')' }, [
              h('path', { key: 'dot', d: brand.markDot.d, fill: brand.markDot.color }),
              h('path', { key: 'k', d: brand.mark, fill: '#FFFFFF' }),
            ]),
          ]);
        }
        const gradientId = brand.markGradient ? 'dsh-sidebar-mark-' + brand.id : null;
        const body = brand.markGradient
          ? [
            h('defs', { key: 'defs' }, h('linearGradient', {
              id: gradientId,
              gradientUnits: 'userSpaceOnUse',
              x1: 0,
              y1: 0,
              x2: 24,
              y2: 24,
            }, [
              h('stop', { key: 'a', offset: '0%', stopColor: brand.markGradient[0] }),
              h('stop', { key: 'b', offset: '50%', stopColor: brand.markGradient[1] }),
              h('stop', { key: 'c', offset: '100%', stopColor: brand.markGradient[2] }),
            ])),
            h('path', { key: 'shape', d: brand.mark, fill: 'url(#' + gradientId + ')' }),
          ]
          : brand.markDot
            ? [
              h('path', { key: 'dot', d: brand.markDot.d, fill: brand.markDot.color }),
              h('path', { key: 'shape', d: brand.mark, fill: 'currentColor' }),
            ]
            : h('path', { key: 'shape', d: brand.mark, fill: 'currentColor' });

        return h('svg', {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          style: brand.markColor ? { color: brand.markColor } : undefined,
          'aria-hidden': 'true',
          focusable: 'false',
        }, body);
      }

      /** 有的品牌（Kimi）用细体文字字标，不套 SVG。 */
      function BrandWord({ brand, height, paint }) {
        if (brand.text) {
          return h('span', {
            className: 'dsh-sidebar-word-text',
            style: { fontSize: height + 'px', fontWeight: brand.textWeight || 300 },
          }, brand.text);
        }
        return h(Wordmark, { brand, height, paint });
      }

      /** 有 mark 的品牌渲染成「图标 + 字标」，没有 mark 的只渲染字标。 */
      function BrandDisplay({ brand, height, iconSize, paint }) {
        const wordmark = h(BrandWord, { brand, height, paint });
        if (!brand.mark) return wordmark;
        return h('span', { className: 'dsh-sidebar-brand' }, [
          h(BrandIcon, { key: 'icon', brand, size: iconSize, paint, accent: paint === 'theme' }),
          h('span', { key: 'word', className: 'dsh-sidebar-brand__word' }, wordmark),
        ]);
      }

      /** 侧栏 mark 位：只有选 DeepSeek（官方锁排）时才渲染鲸鱼图标。 */
      function BrandMark() {
        const id = useBrandId();
        const paint = usePaint();
        if (id === 'default') {
          if (paint === 'theme') return h(DeepSeekMark, { size: 24, accent: true });
          if (primitives && primitives.FishLogo) return h(primitives.FishLogo, { size: 24 });
        }
        return null;
      }

      function BrandLogo() {
        const id = useBrandId();
        const paint = usePaint();
        if (id === 'default' && primitives && primitives.BrandWordmark) {
          return h(primitives.BrandWordmark, { includeMark: false });
        }
        const brand = BRAND_BY_ID[id] || BRAND_BY_ID[DEFAULT_ID] || BRANDS[0];
        if (!brand) return null;
        return h(BrandDisplay, {
          brand,
          height: brand.wordSize || SIZE,
          iconSize: brand.iconSize || 16,
          paint,
        });
      }

      function mountStyle() {
        const existing = document.getElementById(STYLE_ID);
        if (existing) existing.remove();
        const node = document.createElement('style');
        node.id = STYLE_ID;
        node.textContent = [
          '.dsh-sidebar-logo{display:flex;align-items:center;min-width:0;max-width:100%;}',
          '.dsh-sidebar-logo>img{display:block;height:15px;width:auto;max-width:100%;}',
          '.dsh-sidebar-logo>.dsh-sidebar-logo__dark{display:none;}',
          'body[data-ds-dark-theme] .dsh-sidebar-logo>.dsh-sidebar-logo__light{display:none;}',
          'body[data-ds-dark-theme] .dsh-sidebar-logo>.dsh-sidebar-logo__dark{display:block;}',
          '.dsh-sidebar-brand{display:inline-flex;align-items:center;gap:7px;min-width:0;max-width:100%;}',
          '.dsh-sidebar-brand>svg{flex:none;}',
          '.dsh-sidebar-brand__word{display:inline-flex;align-items:center;min-width:0;}',
          '.dsh-sidebar-word-text{font-family:"Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;line-height:1;letter-spacing:.1px;white-space:nowrap;}',
          '.dsh-sidebar-badge rect{stroke:transparent;}',
          'body[data-ds-dark-theme] .dsh-sidebar-badge rect{stroke:rgba(255,255,255,.16);stroke-width:.6;}',
          // 同步主题色：不依赖 React 重渲染，直接由根节点属性接管颜色。
          'html[data-dsh-brand-paint="theme"] .dsh-sidebar-brand>svg{color:var(--dsw-alias-brand-primary) !important;}',
          'html[data-dsh-brand-paint="theme"] .dsh-sidebar-brand>svg rect{display:none;}',
          'html[data-dsh-brand-paint="theme"] .dsh-sidebar-brand>svg linearGradient{display:none;}',
          'html[data-dsh-brand-paint="theme"] .dsh-sidebar-brand>svg path{fill:currentColor !important;}',
          'html[data-dsh-brand-paint="theme"] .dsh-sidebar-logo img{filter:grayscale(1) contrast(1.08);opacity:.9;}',
        ].join('\n');
        document.head.appendChild(node);
        return () => node.remove();
      }

      // ── 设置页 ────────────────────────────────────────────
      const S = {
        root: { display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0 28px' },
        intro: { margin: 0, fontSize: 13, lineHeight: 1.7, color: 'var(--dsw-alias-label-secondary)', maxWidth: '64ch' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10, maxWidth: 640 },
        tile: {
          display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8,
          padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
          background: 'var(--dsw-alias-bg-layer-2)',
          color: 'var(--dsw-alias-label-primary)',
          border: '1px solid var(--dsw-alias-border-l1)',
          borderRadius: 12, font: 'inherit',
        },
        tileOn: {
          border: '1.5px solid var(--dsw-alias-label-primary)',
          boxShadow: '0 0 0 1px var(--dsw-alias-label-primary) inset',
        },
        preview: { display: 'flex', alignItems: 'center', height: 28, overflow: 'hidden' },
        label: { fontSize: 12, lineHeight: 1.2, color: 'var(--dsw-alias-label-secondary)' },
        note: { margin: 0, fontSize: 12, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' },
        paintRow: {
          display: 'flex', alignItems: 'flex-start', gap: 10,
          maxWidth: 420, cursor: 'pointer', padding: '2px 0',
        },
        switchCopy: { display: 'flex', flexDirection: 'column', gap: 2 },
        switchInput: {
          margin: '2px 0 0', width: 16, height: 16, cursor: 'pointer',
          accentColor: 'var(--dsw-alias-brand-primary)',
        },
        switchLabel: { fontSize: 13, lineHeight: '18px', color: 'var(--dsw-alias-label-primary)' },
        switchHint: { fontSize: 12, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' },
      };

      function TilePreview({ id }) {
        const paint = usePaint();
        if (id === 'default' && primitives) {
          return h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 6 } }, [
            paint === 'theme'
              ? h(DeepSeekMark, { key: 'mark', size: 20, accent: true })
              : (primitives.FishLogo ? h(primitives.FishLogo, { key: 'mark', size: 20 }) : null),
            primitives.BrandWordmark ? h(primitives.BrandWordmark, { key: 'word', includeMark: false, size: 20 }) : null,
          ]);
        }
        const brand = BRAND_BY_ID[id];
        if (!brand) return null;
        // MiMo 按格宽收；其余按侧栏实际字号预览，方便直观比较。
        if (brand.light) {
          const height = Math.min(20, (170 * brand.h) / brand.w);
          return h(Wordmark, { brand, height: Math.round(height * 100) / 100, paint });
        }
        return h(BrandDisplay, {
          brand,
          height: brand.wordSize || SIZE,
          iconSize: brand.iconSize || 16,
          paint,
        });
      }

      function Tile({ id, label, active, onPick }) {
        return h('button', {
          type: 'button',
          onClick: () => onPick(id),
          'aria-pressed': active,
          style: active ? { ...S.tile, ...S.tileOn } : S.tile,
        }, [
          h('span', { key: 'preview', style: S.preview }, h(TilePreview, { id })),
          h('span', { key: 'label', style: S.label }, label),
        ]);
      }

      function BrandPicker(props) {
        const t = typeof props.t === 'function' ? props.t : (key) => String(key);
        const id = useBrandId();
        const paint = usePaint();
        const options = [{ id: 'default', label: t('brand.official') }].concat(
          BRANDS.map((brand) => ({ id: brand.id, label: brand.label })),
        );
        return h('div', { style: S.root }, [
          h('p', { key: 'intro', style: S.intro }, t('brand.intro')),
          h('label', { key: 'paint', style: S.paintRow }, [
            h('input', {
              key: 'input',
              type: 'checkbox',
              checked: paint === 'brand',
              onChange: (event) => setPaint(event.target.checked ? 'brand' : 'theme'),
              style: S.switchInput,
            }),
            h('span', { key: 'copy', style: S.switchCopy }, [
              h('span', { key: 'label', style: S.switchLabel }, t('brand.paintLabel')),
              h('span', { key: 'hint', style: S.switchHint }, t('brand.paintHint')),
            ]),
          ]),
          h('div', { key: 'grid', style: S.grid }, options.map((option) => h(Tile, {
            key: option.id,
            id: option.id,
            label: option.label,
            active: id === option.id,
            onPick: setBrand,
          }))),
          h('p', { key: 'note', style: S.note }, t('brand.note')),
        ]);
      }

      return {
        zh: ZH,
        en: EN,
        Page: BrandPicker,
        Mark: BrandMark,
        Name: BrandLogo,
        start() {
          try {
            document.documentElement.setAttribute('data-dsh-brand-paint', currentPaint);
          } catch (error) {
            // 非浏览器环境：忽略。
          }
          return mountStyle();
        },
      };
    })();

    // ══════════════════════════════════════════════════════════
    // 3) 新对话问候
    // ══════════════════════════════════════════════════════════
    const greetApi = (function () {
      const STYLE_ID = 'dsh-hero-greeting';
      const ROTATE_MS = 6500;
      const COUNT = 11;
      /** 是否连同「预览版」徽章一起隐藏；置 false 只替换标题文字。 */
      const HIDE_PREVIEW_BADGE = true;

      const ZH = {
        'greet.heading': '新对话问候',
        'greet.g1.title': '{time}，老板',
        'greet.g1.sub': '今天想让我帮你做点什么？',
        'greet.g2.title': '{time}，打工人',
        'greet.g2.sub': '先说说卡在哪儿，我们一起拆',
        'greet.g3.title': '{time}，卷王',
        'greet.g3.sub': '这轮想推进哪块？我随时开工',
        'greet.g4.title': '又见面了，老板',
        'greet.g4.sub': '这次想折腾点什么？',
        'greet.g5.title': '工位已就绪',
        'greet.g5.sub': '一行需求，还是一个项目？都行',
        'greet.g6.title': '进度条 0%',
        'greet.g6.sub': '发一条消息，它就动起来了',
        'greet.g7.title': '灵感来了吗',
        'greet.g7.sub': '没来也行，先聊聊你想做什么',
        'greet.g8.title': '想干点什么大事',
        'greet.g8.sub': '从最小的一步开始就好',
        'greet.g9.title': '都这个点了',
        'greet.g9.sub': '别熬太狠，活我帮你干',
        'greet.g10.title': '别急，慢慢说',
        'greet.g10.sub': '需求、报错，或者一句「随便聊聊」',
        'greet.g11.title': '上午的脑子最好使',
        'greet.g11.sub': '适合啃最硬的那块',
        'greet.time.late': '凌晨好',
        'greet.time.morning': '早上好',
        'greet.time.noon': '中午好',
        'greet.time.afternoon': '下午好',
        'greet.time.evening': '晚上好',
        'greet.intro': '选一个新对话页左上角的标志。点一下立刻生效，不用刷新。',
        'greet.brandLabel': '使用品牌色',
        'greet.brandHint': '开启后每个标志用各家自己的颜色；关闭则跟随主题强调色。DeepSeek、Grok 是单色标，Kimi 是黑色 K 加蓝色圆点。',
        'greet.previewText': '中午好，老板',
        'greet.note': '选择存在本机浏览器，不写进会话；卸载插件不会清掉这条记录。',
        'greet.mark.mimo': '小米 MiMo',
        'greet.mark.deepseek': 'DeepSeek',
        'greet.mark.qwen': '千问',
        'greet.mark.gpt': 'GPT',
        'greet.mark.gemini': 'Gemini',
        'greet.mark.claude': 'Claude',
        'greet.mark.grok': 'Grok',
        'greet.mark.kimi': 'Kimi',
      };

      const EN = {
        'greet.heading': 'New-session greeting',
        'greet.g1.title': '{time}, boss',
        'greet.g1.sub': 'What can I do for you today?',
        'greet.g2.title': '{time}, night owl',
        'greet.g2.sub': "Tell me where you're stuck and we'll untangle it",
        'greet.g3.title': '{time}, go-getter',
        'greet.g3.sub': 'Which part shall we push forward?',
        'greet.g4.title': 'Back again, boss',
        'greet.g4.sub': 'What shall we build this time?',
        'greet.g5.title': 'The desk is ready',
        'greet.g5.sub': 'One line of request, or a whole project?',
        'greet.g6.title': 'Progress: 0%',
        'greet.g6.sub': 'Send a message and it starts moving',
        'greet.g7.title': 'Any inspiration?',
        'greet.g7.sub': "None is fine — let's just talk it through",
        'greet.g8.title': 'Feeling ambitious?',
        'greet.g8.sub': 'Start with the smallest step',
        'greet.g9.title': 'Still up?',
        'greet.g9.sub': "Don't burn yourself out — I'll take this one",
        'greet.g10.title': 'Take your time',
        'greet.g10.sub': 'A requirement, an error, or just a chat',
        'greet.g11.title': 'Morning brain, best brain',
        'greet.g11.sub': 'Good time for the hardest piece',
        'greet.time.late': 'Late night',
        'greet.time.morning': 'Good morning',
        'greet.time.noon': 'Good afternoon',
        'greet.time.afternoon': 'Good afternoon',
        'greet.time.evening': 'Good evening',
        'greet.intro': 'Pick the mark shown beside the new-session greeting. Changes apply immediately.',
        'greet.brandLabel': 'Use brand colors',
        'greet.brandHint': 'Each mark uses its own brand color; turn off to follow the theme accent. DeepSeek and Grok are monochrome; Kimi is a black K with a blue dot.',
        'greet.previewText': 'Good afternoon, boss',
        'greet.note': 'Stored in this browser only; uninstalling the plugin keeps this key.',
        'greet.mark.mimo': 'Xiaomi MiMo',
        'greet.mark.deepseek': 'DeepSeek',
        'greet.mark.qwen': 'Qwen',
        'greet.mark.gpt': 'GPT',
        'greet.mark.gemini': 'Gemini',
        'greet.mark.claude': 'Claude',
        'greet.mark.grok': 'Grok',
        'greet.mark.kimi': 'Kimi',
      };

      /** apply 时绑定的翻译器；插槽没传 t 时兜底，避免退化成键名。 */
      let boundTranslate = (key) => key;

      /** 时段问候：[小时内上限（不含）, 文案键] */
      const TIME_BUCKETS = [
        [5, 'greet.time.late'],
        [11, 'greet.time.morning'],
        [13, 'greet.time.noon'],
        [18, 'greet.time.afternoon'],
        [24, 'greet.time.evening'],
      ];

      function greetingFor(date, t) {
        const hour = date.getHours();
        for (let i = 0; i < TIME_BUCKETS.length; i += 1) {
          const [limit, key] = TIME_BUCKETS[i];
          if (hour < limit) return t(key);
        }
        return t('greet.time.evening');
      }

      /*
       * 有的文案自带时段色彩，白天出现就违和（例如 11:49 冒出「都这个点了 / 别熬太狠」）。
       * 这里按「文案序号 → 允许出现的时段」做门槛；不在表里的文案全天可用。
       */
      const NIGHT = (hour) => hour >= 21 || hour < 5;
      const MORNING = (hour) => hour >= 5 && hour < 12;

      const GATES = {
        9: NIGHT, // 都这个点了 / 别熬太狠
        11: MORNING, // 上午的脑子最好使
      };

      /**
       * 当前小时可用的文案序号（1 起）。
       * @param hour 0–23 的本地小时。
       * @returns 可轮换的序号数组，至少一项。
       */
      function eligibleEntries(hour) {
        const list = [];
        for (let n = 1; n <= COUNT; n += 1) {
          const gate = GATES[n];
          if (!gate || gate(hour)) list.push(n);
        }
        return list.length > 0 ? list : [1];
      }

      /**
       * 取下一条可用文案；当前这条被时段排除时直接跳到第一条可用的。
       * @param current 当前文案序号。
       * @param hour 0–23 的本地小时。
       * @returns 下一条文案序号。
       */
      function nextEntry(current, hour) {
        const list = eligibleEntries(hour);
        const pos = list.indexOf(current);
        if (pos < 0) return list[0];
        return list[(pos + 1) % list.length];
      }

      /** OpenAI 结形标志（simple-icons CC0 图形，viewBox 24×24）。 */
      const MARK_PATH = 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z';

      /*
       * 各家标志，统一 24×24 视框、单路径、fill=currentColor。
       * 图形取自 simple-icons（CC0）；小米 MiMo 没有独立公开图形，沿用小米 mi 方标。
       * 要换成自家素材，只替换对应条目的 d 即可。
       */
      const MARK_PATHS = {
      mimo: 'M12 0C8.016 0 4.756.255 2.493 2.516.23 4.776 0 8.033 0 12.012c0 3.98.23 7.235 2.494 9.497C4.757 23.77 8.017 24 12 24c3.983 0 7.243-.23 9.506-2.491C23.77 19.247 24 15.99 24 12.012c0-3.984-.233-7.243-2.502-9.504C19.234.252 15.978 0 12 0zM4.906 7.405h5.624c1.47 0 3.007.068 3.764.827.746.746.827 2.233.83 3.676v4.54a.15.15 0 0 1-.152.147h-1.947a.15.15 0 0 1-.152-.148V11.83c-.002-.806-.048-1.634-.464-2.051-.358-.36-1.026-.441-1.72-.458H7.158a.15.15 0 0 0-.151.147v6.98a.15.15 0 0 1-.152.148H4.906a.15.15 0 0 1-.15-.148V7.554a.15.15 0 0 1 .15-.149zm12.131 0h1.949a.15.15 0 0 1 .15.15v8.892a.15.15 0 0 1-.15.148h-1.949a.15.15 0 0 1-.151-.148V7.554a.15.15 0 0 1 .151-.149zM8.92 10.948h2.046c.083 0 .15.066.15.147v5.352a.15.15 0 0 1-.15.148H8.92a.15.15 0 0 1-.152-.148v-5.352a.15.15 0 0 1 .152-.147Z',
      deepseek: 'M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45',
      qwen: 'M19.713 2.825h-5.907c0-.251-.066-.503-.196-.728L12.819.728A1.46 1.46 0 0 0 11.559 0h-1.58c-.52 0-1 .275-1.26.728l-2.42 4.19a1.45 1.45 0 0 0 0 1.453l.791 1.37c.26.448.74.727 1.26.727h11.36c.52 0 1-.275 1.26-.728l.79-1.37a1.45 1.45 0 0 0 0-1.451l-.79-1.37a1.46 1.46 0 0 0-1.26-.728zM.195 9.905l2.951 5.115a1.46 1.46 0 0 0-.531.531l-.791 1.37a1.45 1.45 0 0 0 0 1.452l.79 1.37c.26.448.74.727 1.26.727h4.84c.52 0 1-.275 1.26-.728l.79-1.37a1.45 1.45 0 0 0 0-1.451L5.086 7.083a1.46 1.46 0 0 0-1.26-.728h-1.58c-.52 0-1 .276-1.26.728l-.79 1.37a1.45 1.45 0 0 0 0 1.452m15.888 13.367 2.951-5.115c.217.125.469.196.728.196h1.582c.52 0 1-.275 1.26-.728l.79-1.37a1.45 1.45 0 0 0 0-1.451l-2.42-4.191a1.46 1.46 0 0 0-1.259-.728h-1.582c-.52 0-1 .276-1.259.728l-5.678 9.838a1.45 1.45 0 0 0 0 1.452l.79 1.37c.26.448.74.727 1.26.727h1.582c.52 0 1-.275 1.26-.728z',
      gemini: 'M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81',
      grok: 'M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815',
      gpt: MARK_PATH,
      claude: 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z',
      kimi: 'M11.065 11.199l7.257-7.2c.137-.136.06-.41-.116-.41H14.3a.164.164 0 00-.117.051l-7.82 7.756c-.122.12-.302.013-.302-.179V3.82c0-.127-.083-.23-.185-.23H3.186c-.103 0-.186.103-.186.23V19.77c0 .128.083.23.186.23h2.69c.103 0 .186-.102.186-.23v-3.25c0-.069.025-.135.069-.178l2.424-2.406a.158.158 0 01.205-.023l6.484 4.772a7.677 7.677 0 003.453 1.283c.108.012.2-.095.2-.23v-3.06c0-.117-.07-.212-.164-.227a5.028 5.028 0 01-2.027-.807l-5.613-4.064c-.117-.078-.132-.279-.028-.381z',
    };

      const MARK_IDS = ['mimo', 'deepseek', 'qwen', 'gpt', 'gemini', 'claude', 'grok', 'kimi'];
      const DEFAULT_MARK = 'gpt';
      const STORAGE_KEY = 'dsh.hero-greeting.v1';

      /*
       * 各家品牌色。GPT 用 ChatGPT 的绿；
       * DeepSeek / Grok / Kimi 的品牌标本身是单色的，留 null，
       * 品牌色模式下按文字色渲染（浅色主题近黑、深色主题近白），视同它们的规范。
       * 值是字符串时两套主题同色；是 { light, dark } 时按主题取（官方色在暗底偏暗的才需要）。
       */
      const MARK_BRAND = {
        mimo: '#FF6900',
        deepseek: null,
        // 千问官方蓝 #082DFF 在深色底上只有约 2.5:1，暗色下换同色相亮一档的 #4C6BFF。
        qwen: { light: '#082DFF', dark: '#4C6BFF' },
        gpt: '#10A37F',
        gemini: null,
        claude: '#D97757',
        grok: null,
        kimi: null,
      };

      /*
       * 渐变品牌：Gemini 的四角星芒用的是蓝→紫→珊瑚的对角渐变，
       * 单色填充会失真，所以品牌色模式下改用 linearGradient。
       */
      const MARK_GRADIENTS = {
        gemini: ['#4285F4', '#9B72CB', '#D96570'],
      };

      /*
       * 双色标志：Kimi 的标是「黑色 K + 右上角蓝色圆点」，
       * 主路径之外单独给圆点上品牌蓝；主题色模式下整枚仍是单色。
       */
      const MARK_DOTS = {
        kimi: {
          d: 'M21.846 0a1.923 1.923 0 110 3.846H20.15a.226.226 0 01-.227-.226V1.923C19.923.861 20.784 0 21.846 0z',
          color: '#1783FF',
        },
      };

      const THEME_TINT = 'var(--dhg-mark-color, var(--dsw-alias-brand-primary, currentColor))';

      // ── 选择状态（localStorage + 订阅，选完立刻生效，不用刷新） ──
      function readMarkState() {
        const fallback = { mark: DEFAULT_MARK, brand: false };
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (!raw) return fallback;
          const parsed = JSON.parse(raw);
          return {
            mark: MARK_IDS.includes(parsed && parsed.mark) ? parsed.mark : DEFAULT_MARK,
            brand: Boolean(parsed && parsed.brand),
          };
        } catch (error) {
          return fallback;
        }
      }

      let markState = readMarkState();
      const markListeners = new Set();

      function writeMarkState(next) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mark: next.mark, brand: next.brand }));
        } catch (error) {
          // 隐私模式或配额：本次会话内仍然生效。
        }
      }

      function updateMarkState(patch) {
        const next = { mark: markState.mark, brand: markState.brand, ...patch };
        if (next.mark === markState.mark && next.brand === markState.brand) return;
        markState = next;
        writeMarkState(next);
        for (const listener of Array.from(markListeners)) listener();
      }

      function subscribeMarkState(listener) {
        markListeners.add(listener);
        return () => markListeners.delete(listener);
      }

      function getMarkState() {
        return markState;
      }

      /**
       * 标志该用哪个颜色。
       * @param id 标志 id。
       * @param brand 是否使用品牌色。
       * @returns 可直接放进 inline style 的 CSS 颜色。
       */
      function markColor(id, brand) {
        if (!brand) return THEME_TINT;
        const entry = MARK_BRAND[id];
        if (!entry) return 'var(--dsw-alias-label-primary)';
        if (typeof entry === 'string') return entry;
        return 'var(--dhg-brand-' + id + ', ' + entry.light + ')';
      }

      function Mark(props) {
        const path = MARK_PATHS[props.id] || MARK_PATHS[DEFAULT_MARK];
        const stops = props.brand ? MARK_GRADIENTS[props.id] : null;
        const dot = props.brand ? MARK_DOTS[props.id] : null;

        // 渐变按标志 id 命名；同一标志的多个实例渐变完全一致，共用 id 不影响观感。
        const gradientId = stops ? 'dhg-grad-' + props.id : null;
        const body = stops
          ? [
            h('defs', { key: 'defs' },
              h('linearGradient', {
                id: gradientId,
                gradientUnits: 'userSpaceOnUse',
                x1: 0,
                y1: 0,
                x2: 24,
                y2: 24,
              }, [
                h('stop', { key: 'a', offset: '0%', stopColor: stops[0] }),
                h('stop', { key: 'b', offset: '50%', stopColor: stops[1] }),
                h('stop', { key: 'c', offset: '100%', stopColor: stops[2] }),
              ])),
            h('path', { key: 'path', d: path, fill: 'url(#' + gradientId + ')' }),
          ]
          : (dot
            ? [
              h('path', { key: 'dot', d: dot.d, fill: dot.color }),
              h('path', { key: 'path', d: path, fill: 'currentColor' }),
            ]
            : h('path', { key: 'path', d: path, fill: 'currentColor' }));

        return h(
          'svg',
          {
            className: 'dhg-mark',
            viewBox: '0 0 24 24',
            width: 28,
            height: 28,
            style: { color: markColor(props.id, props.brand) },
            'aria-hidden': 'true',
            focusable: 'false',
          },
          body,
        );
      }

      /**
       * 从问候根节点向上找到「标题行」：一路穿过只有唯一子元素的包裹层，
       * 停在第一个含多个子元素的祖先之下。宿主结构下即 div.headline。
       * @param anchor 问候根节点。
       * @returns 标题行元素，找不到时为 null。
       */
      function heroRowOf(anchor) {
        let node = anchor.parentElement;
        while (node && node.parentElement && node.parentElement.children.length === 1) {
          node = node.parentElement;
        }
        return node ? node.parentElement : null;
      }

      /**
       * 隐藏标题行里不属于我们的 span 兄弟（原生「探索未至之境」与预览版徽章）。
       * 只在 span 上动手，避免误伤输入框等 div 结构；可重复调用。
       * @param anchor 问候根节点。
       */
      function hideNativeTitle(anchor) {
        const row = heroRowOf(anchor);
        if (!row) return;
        const siblings = Array.from(row.children);
        for (let i = 0; i < siblings.length; i += 1) {
          const sibling = siblings[i];
          if (sibling === anchor || sibling.contains(anchor)) continue;
          if (sibling.tagName !== 'SPAN') continue;
          if (HIDE_PREVIEW_BADGE) {
            sibling.style.display = 'none';
          } else {
            const text = sibling.querySelector('span');
            if (text) text.style.display = 'none';
          }
        }
      }

      function HeroGreeting(props) {
        const t = typeof props.t === 'function' ? props.t : boundTranslate;
        const rootRef = React.useRef(null);
        const markStateNow = React.useSyncExternalStore(subscribeMarkState, getMarkState, getMarkState);
        const [index, setIndex] = React.useState(() => {
          const list = eligibleEntries(new Date().getHours());
          return list[Math.floor(Math.random() * list.length)];
        });
        const [now, setNow] = React.useState(() => new Date());

        React.useEffect(() => {
          const timer = window.setInterval(() => {
            const stamp = new Date();
            setIndex((current) => nextEntry(current, stamp.getHours()));
            setNow(stamp);
          }, ROTATE_MS);
          return () => window.clearInterval(timer);
        }, []);

        React.useLayoutEffect(() => {
          const anchor = rootRef.current;
          if (!anchor) return undefined;
          hideNativeTitle(anchor);
          const row = heroRowOf(anchor);
          if (!row) return undefined;
          const observer = new MutationObserver(() => hideNativeTitle(anchor));
          observer.observe(row, { childList: true });
          return () => observer.disconnect();
        }, []);

        const title = String(t('greet.g' + index + '.title')).split('{time}').join(greetingFor(now, t));
        const subtitle = t('greet.g' + index + '.sub');

        return h(
          'span',
          { className: 'dhg', 'data-dsh-hero-greeting': '', ref: rootRef },
          h(
            'span',
            { className: 'dhg-line', key: 'title-' + index },
            h(Mark, { id: markStateNow.mark, brand: markStateNow.brand, key: 'mark' }),
            h('span', { className: 'dhg-title' }, title),
          ),
          h('span', { className: 'dhg-sub', key: 'sub-' + index }, subtitle),
        );
      }

      // ── 设置页：八选一 + 品牌色开关 ────────────────────────
      const S = {
        root: { display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 0 28px' },
        intro: {
          margin: 0, fontSize: 13, lineHeight: 1.7,
          color: 'var(--dsw-alias-label-secondary)', maxWidth: '58ch',
        },
        preview: {
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '18px 16px', borderRadius: 14, maxWidth: 420,
          background: 'var(--dsw-alias-bg-layer-2)',
          border: '0.5px solid var(--dsw-alias-border-l1)',
        },
        previewText: { fontSize: 22, lineHeight: '30px', color: 'var(--dsw-alias-label-primary)' },
        grid: { display: 'flex', flexWrap: 'wrap', gap: 10, maxWidth: 440 },
        tile: {
          width: 100, padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          background: 'transparent', border: '0.5px solid var(--dsw-alias-border-l1)',
          color: 'var(--dsw-alias-label-secondary)', font: 'inherit',
        },
        tileOn: {
          border: '1.5px solid var(--dsw-alias-brand-primary)',
          background: 'var(--dsw-alias-bg-layer-2)',
          color: 'var(--dsw-alias-label-primary)',
        },
        switchRow: {
          display: 'flex', alignItems: 'flex-start', gap: 10,
          maxWidth: 420, cursor: 'pointer',
        },
        switchInput: {
          margin: '2px 0 0', width: 16, height: 16, cursor: 'pointer',
          accentColor: 'var(--dsw-alias-brand-primary)',
        },
        switchCopy: { display: 'flex', flexDirection: 'column', gap: 2 },
        switchLabel: { fontSize: 13, lineHeight: '18px', color: 'var(--dsw-alias-label-primary)' },
        switchHint: { fontSize: 12, lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' },
        tileLabel: { fontSize: 12, lineHeight: '16px', textAlign: 'center' },
        note: {
          margin: 0, fontSize: 12, lineHeight: 1.6,
          color: 'var(--dsw-alias-label-secondary)',
        },
      };

      function HeroGreetingSettings(props) {
        const t = typeof props.t === 'function' ? props.t : boundTranslate;
        const state = React.useSyncExternalStore(subscribeMarkState, getMarkState, getMarkState);

        return h('div', { style: S.root }, [
          h('p', { key: 'intro', style: S.intro }, t('greet.intro')),
          h('div', { key: 'preview', style: S.preview }, [
            h(Mark, { key: 'mark', id: state.mark, brand: state.brand }),
            h('span', { key: 'text', style: S.previewText }, t('greet.previewText')),
          ]),
          h('label', { key: 'brand', style: S.switchRow }, [
            h('input', {
              key: 'input',
              type: 'checkbox',
              checked: state.brand,
              onChange: (event) => updateMarkState({ brand: event.target.checked }),
              style: S.switchInput,
            }),
            h('span', { key: 'copy', style: S.switchCopy }, [
              h('span', { key: 'label', style: S.switchLabel }, t('greet.brandLabel')),
              h('span', { key: 'hint', style: S.switchHint }, t('greet.brandHint')),
            ]),
          ]),
          h('div', { key: 'grid', style: S.grid },
            MARK_IDS.map((id) => h('button', {
              key: id,
              type: 'button',
              onClick: () => updateMarkState({ mark: id }),
              'aria-pressed': state.mark === id,
              'aria-label': t('greet.mark.' + id),
              style: state.mark === id ? { ...S.tile, ...S.tileOn } : S.tile,
            }, [
              h(Mark, { key: 'mark', id, brand: state.brand }),
              h('span', { key: 'label', style: S.tileLabel }, t('greet.mark.' + id)),
            ]))),
          h('p', { key: 'note', style: S.note }, t('greet.note')),
        ]);
      }

      /*
       * CSS 快路径：结构简单且宿主支持 :has() 时，首帧就藏掉原生标题，避免闪一下。
       * 插槽一旦多包一层这组选择器就会失配，权威路径始终是 hideNativeTitle()。
       */
      const HIDE_ALL = String.raw`
/* 紧邻鲸鱼座位的原生标题组（探索未至之境 + 预览版）整体隐藏 */
span:has(> [data-dsh-hero-greeting]) + span { display: none !important; }
/* 兜底：万一插槽外面还包了一层，就按「包含问候的 div」隐藏直接子 span 兄弟 */
div:has(> span > [data-dsh-hero-greeting]) > span:not(:has([data-dsh-hero-greeting])) { display: none !important; }
`;

      const HIDE_TITLE_ONLY = String.raw`
/* 只隐藏标题文字，保留预览版徽章 */
span:has(> [data-dsh-hero-greeting]) + span > span:first-child { display: none !important; }
/* 兜底：同上，标题组里第一个 span 才是文字 */
div:has(> span > [data-dsh-hero-greeting]) > span:not(:has([data-dsh-hero-greeting])) > span:first-child { display: none !important; }
`;

      /*
       * 需要区分主题的品牌色：亮色一套、暗色一套。
       * 宿主把暗色标打在 body 的 data-ds-dark-theme 上，所以用 body 作用域覆盖。
       */
      const BRAND_THEME_CSS = Object.keys(MARK_BRAND)
        .filter((id) => MARK_BRAND[id] && typeof MARK_BRAND[id] === 'object')
        .map((id) => {
          const entry = MARK_BRAND[id];
          return 'body { --dhg-brand-' + id + ': ' + entry.light + '; }\n'
            + 'body[data-ds-dark-theme] { --dhg-brand-' + id + ': ' + entry.dark + '; }';
        })
        .join('\n');

      const CSS = String.raw`
/* ── 问候本体 ─────────────────────────────────────────── */
[data-dsh-hero-greeting] {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  text-align: center;
}

.dhg-line {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.dhg-mark {
  width: 28px;
  height: 28px;
  flex: none;
  /* 跟随主题强调色（本插件「强调色」段改的就是它）；主题没给值时退回文字色。
     --dhg-mark-color 可做单点覆盖，例如写成 #d97757 固定珊瑚橙。 */
  color: var(--dhg-mark-color, var(--dsw-alias-brand-primary, currentColor));
  transform: translateY(1px);
}

.dhg-title {
  color: var(--dsw-alias-label-primary);
  font-size: 30px;
  font-weight: 400;
  line-height: 38px;
  letter-spacing: 0.06em;
  padding-left: 0.06em;
  white-space: nowrap;
}

.dhg-sub {
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0.04em;
  opacity: 0.92;
}

/* ── 轮换时的淡入上浮 ──────────────────────────────────── */
@keyframes dhg-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
.dhg-line,
.dhg-sub {
  animation: dhg-in 460ms cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  .dhg-line,
  .dhg-sub { animation: none; }
}

` + (HIDE_PREVIEW_BADGE ? HIDE_ALL : HIDE_TITLE_ONLY) + '\n' + BRAND_THEME_CSS;

      function mountStyle() {
        const previous = document.getElementById(STYLE_ID);
        if (previous) previous.remove();
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
        return () => {
          style.remove();
        };
      }

      return {
        zh: ZH,
        en: EN,
        Hero: HeroGreeting,
        Page: HeroGreetingSettings,
        setTranslate(fn) {
          boundTranslate = typeof fn === 'function' ? fn : (key) => key;
        },
        start() {
          return mountStyle();
        },
      };
    })();

    // ══════════════════════════════════════════════════════════
    // 合并字典与设置页
    // ══════════════════════════════════════════════════════════
    const ZH = Object.assign({}, accentApi.zh, brandApi.zh, greetApi.zh, {
      'settings.title': '外观',
    });
    const EN = Object.assign({}, accentApi.en, brandApi.en, greetApi.en, {
      'settings.title': 'Appearance',
    });

    const PAGE = {
      root: { display: 'flex', flexDirection: 'column', gap: 30, padding: '4px 0 32px' },
      section: { display: 'flex', flexDirection: 'column', gap: 2 },
      heading: {
        margin: 0, fontSize: 14, lineHeight: '20px', fontWeight: 600,
        color: 'var(--dsw-alias-label-primary)',
      },
    };

    function AppearancePage(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => String(key);
      const section = (key, title, Page) => h('section', { key, style: PAGE.section }, [
        h('h3', { key: 'heading', style: PAGE.heading }, title),
        h('div', { key: 'body' }, h(Page, { t })),
      ]);
      return h('div', { style: PAGE.root }, [
        section('accent', t('accent.heading'), accentApi.Page),
        section('brand', t('brand.heading'), brandApi.Page),
        section('greet', t('greet.heading'), greetApi.Page),
      ]);
    }

    // 设置导航图标：调色板
    function AppearanceIcon(props) {
      const size = props && props.size ? props.size : 16;
      return h('svg', {
        viewBox: '0 0 16 16',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.3,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
      }, [
        h('path', {
          key: 'body',
          d: 'M8 2.4a5.6 5.6 0 1 0 0 11.2c.76 0 1.12-.56.96-1.3-.2-.97.46-1.75 1.43-1.75h.76c1.07 0 1.93-.86 1.93-1.93A5.6 5.6 0 0 0 8 2.4Z',
        }),
        h('circle', { key: 'd1', cx: 5.4, cy: 6.3, r: 0.72, fill: 'currentColor', stroke: 'none' }),
        h('circle', { key: 'd2', cx: 8.3, cy: 5.0, r: 0.72, fill: 'currentColor', stroke: 'none' }),
        h('circle', { key: 'd3', cx: 10.7, cy: 7.0, r: 0.72, fill: 'currentColor', stroke: 'none' }),
        h('circle', { key: 'd4', cx: 4.9, cy: 9.4, r: 0.72, fill: 'currentColor', stroke: 'none' }),
      ]);
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'multi-brand-theme: dictionaries');

        ctx.effect(() => accentApi.start(), 'multi-brand-theme: accent layer');
        ctx.effect(() => brandApi.start(), 'multi-brand-theme: sidebar styles');
        ctx.effect(() => greetApi.start(), 'multi-brand-theme: greeting styles');

        ctx.effect(() => {
          greetApi.setTranslate(ctx.locale.bind(NS));
          return () => greetApi.setTranslate((key) => key);
        }, 'multi-brand-theme: translator');

        ctx.effect(() => ctx.slots.inject('conversation.hero.brand.mark', () => ctx.slots.register({
          name: 'conversation.hero.brand.mark',
          locale: NS,
        }, greetApi.Hero)), 'multi-brand-theme: hero slot');

        ctx.effect(() => ctx.slots.inject('sidebar.brand.mark', () => ctx.slots.register({
          name: 'sidebar.brand.mark',
          priority: -1,
        }, brandApi.Mark)), 'multi-brand-theme: sidebar mark');

        ctx.effect(() => ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({
          name: 'sidebar.brand.name',
          priority: -1,
        }, brandApi.Name)), 'multi-brand-theme: sidebar name');

        const settingsT = ctx.locale.bind(NS);
        ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'appearance',
          order: 30,
          label: () => settingsT('settings.title'),
          locale: NS,
        }, AppearancePage)), 'multi-brand-theme: settings section');

        ctx.effect(() => ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon',
          id: 'appearance',
        }, AppearanceIcon)), 'multi-brand-theme: settings nav icon');
      },
    };
  },
});
