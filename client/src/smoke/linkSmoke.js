// Built in only by scripts/smoke-desktop-links.sh (VITE_LINK_SMOKE=1), never in a
// release: it clicks an external link in the real desktop webview, with every plugin
// script loaded, so the smoke can check that the system browser was asked to open it.
setTimeout(() => {
  const link = document.createElement('a');
  link.href = 'https://github.com/henfrydls/Skima';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'link smoke';
  document.body.appendChild(link);
  link.click();
}, 3000);
