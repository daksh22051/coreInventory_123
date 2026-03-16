// Inline script that runs before React hydration to prevent FOUC and hydration mismatches.
// Reads theme + accent color from localStorage (Zustand persist format) and applies them
// to <html> immediately, so the first paint already has the correct theme.

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('theme-storage');
    if (stored) {
      var parsed = JSON.parse(stored);
      var state = parsed && parsed.state;
      if (state) {
        if (state.theme === 'dark' || state.theme === 'light') {
          document.documentElement.setAttribute('data-theme', state.theme);
          document.cookie = 'theme=' + state.theme + '; path=/; max-age=31536000; samesite=Lax';
        }
        if (state.accentColor) {
          document.documentElement.style.setProperty('--accent-color', state.accentColor);
        }
      }
    }
  } catch (e) {}
})();
`;

export default function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
