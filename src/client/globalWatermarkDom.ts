import { kkfileviewConfig, subscribeConfig } from './configCache';
import { resolveWatermarkTemplate } from './watermarkTemplate';

const WATERMARK_DOM_ID = 'nb-plugin-kkfileview-global-watermark';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function generateWatermarkSvg(text: string, options: { rotate?: number; color?: string; opacity?: number }): string {
  const rotate = typeof options.rotate === 'number' ? options.rotate : -24;
  const color = options.color || 'rgba(0, 0, 0, 0.18)';
  const opacity = typeof options.opacity === 'number' ? options.opacity : 0.18;
  const width = 360;
  const height = 220;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="central"
      transform="rotate(${rotate} ${width / 2} ${height / 2})"
      fill="${escapeXml(color)}"
      fill-opacity="${opacity}"
      font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      font-size="16px"
      font-weight="500"
    >${escapeXml(text)}</text>
  </svg>`;

  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

function resolveCurrentUser(app?: any): Record<string, unknown> | null {
  if (!app) return null;
  const user =
    app.auth?.user ||
    app.state?.currentUser ||
    app.currentUser ||
    (typeof window !== 'undefined' ? (window as any)?.__nocobase_current_user__ : null);
  if (user && typeof user === 'object') {
    return user;
  }
  return null;
}

export function updateGlobalWatermarkDom(app?: any): void {
  if (typeof document === 'undefined') return;

  const { watermarkType, watermark, watermarkOpacity, watermarkRotate, watermarkColor } = kkfileviewConfig;
  const isGlobal = watermarkType === 'global';

  if (!isGlobal || !watermark) {
    removeGlobalWatermarkDom();
    return;
  }

  const user = resolveCurrentUser(app);
  const text = resolveWatermarkTemplate(watermark, { user, requestedAt: new Date() }).trim();

  if (!text) {
    removeGlobalWatermarkDom();
    return;
  }

  let el = document.getElementById(WATERMARK_DOM_ID) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = WATERMARK_DOM_ID;
    el.setAttribute('aria-hidden', 'true');
    el.style.position = 'fixed';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100vw';
    el.style.height = '100vh';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '2147483647';
    el.style.backgroundRepeat = 'repeat';
    document.body.appendChild(el);
  }

  const bg = generateWatermarkSvg(text, {
    rotate: watermarkRotate,
    color: watermarkColor,
    opacity: watermarkOpacity,
  });

  el.style.backgroundImage = bg;
}

export function removeGlobalWatermarkDom(): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(WATERMARK_DOM_ID);
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

export function initGlobalWatermark(app?: any): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // 初始尝试渲染
  updateGlobalWatermarkDom(app);

  // 订阅配置变更
  const unsubscribe = subscribeConfig(() => {
    updateGlobalWatermarkDom(app);
  });

  return () => {
    unsubscribe();
    removeGlobalWatermarkDom();
  };
}
