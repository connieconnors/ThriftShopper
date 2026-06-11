/**
 * Global document shell — linen only, forever.
 *
 * ONLY `applyLinenShell()` may set html, body, #app-root, and theme-color.
 * Dashboard routes use navy inside page components (headers/footers), never here.
 */

export const SHELL_LINEN = "#ede9e1";

function setThemeColorMeta(color: string) {
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      meta.content = color;
    });

  if (!document.querySelector('meta[name="theme-color"]')) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
  }
}

/** Apply linen to the full document shell (html, body, app root, theme-color). */
export function applyLinenShell() {
  if (typeof document === "undefined") return;

  document.documentElement.style.backgroundColor = SHELL_LINEN;
  document.documentElement.style.colorScheme = "light only";
  document.body.style.backgroundColor = SHELL_LINEN;
  document.body.style.minHeight = "100dvh";

  const appRoot = document.getElementById("app-root");
  if (appRoot) {
    appRoot.style.backgroundColor = SHELL_LINEN;
    appRoot.style.minHeight = "100dvh";
  }

  setThemeColorMeta(SHELL_LINEN);

  // iOS WebView can keep horizontal scroll after wide pages (e.g. Canvas); reset on every route.
  window.scrollTo(0, 0);
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
}
