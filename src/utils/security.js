/**
 * Security & Device Enforcement
 * 1. Restrict to mobile users only - laptop/desktop redirected to google.com
 * 2. Block Inspect Element & Developer Tools
 * 3. Detect DevTools open and redirect to google.com
 */

export function initSecurity() {
  // --- 1. DEVICE CHECK: Mobile only ---
  function isMobile() {
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    
    // Check mobile user agents
    const isMobileUA = /Android.+Mobile|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile.*Firefox|webOS|Windows Phone/i.test(ua);
    if (isMobileUA) return true;

    // Additional mobile checks
    if (/Mobile|CriOS/i.test(ua) && !/iPad/i.test(ua)) {
      return true;
    }

    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    // If desktop resolution and no touch, strictly reject
    if (window.screen.width > 1024 && !hasTouch) {
      return false;
    }

    return isMobileUA;
  }

  function redirectToGoogle() {
    try {
      window.location.replace('https://www.google.com');
    } catch (e) {
      window.location.href = 'https://www.google.com';
    }
  }

  // Immediately redirect if not a mobile device
  if (!isMobile()) {
    redirectToGoogle();
    return;
  }

  // Watch for desktop window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && !('ontouchstart' in window)) {
      redirectToGoogle();
    }
  });

  // --- 2. DISABLE CONTEXT MENU (RIGHT CLICK) ---
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, { capture: true });

  // --- 3. DISABLE SHORTCUT KEYS (INSPECT / VIEW SOURCE / DEVTOOLS) ---
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.keyCode === 123 || e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      redirectToGoogle();
      return false;
    }

    // Ctrl+Shift+I / J / C / K / E (DevTools shortcuts)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      const k = (e.key || '').toLowerCase();
      if (['i', 'j', 'c', 'k', 'e', 'x'].includes(k)) {
        e.preventDefault();
        e.stopPropagation();
        redirectToGoogle();
        return false;
      }
    }

    // Ctrl+U (View Page Source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S (Save Page)
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });

  // --- 4. PREVENT SELECTION & DRAGGING OUTSIDE INPUTS ---
  document.addEventListener('selectstart', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      return true;
    }
    e.preventDefault();
    return false;
  });

  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });

  // --- 5. DEVTOOLS DETECTION & PREVENTION ---
  // A. Window dimension threshold detection (docked DevTools)
  function detectDevToolsByDimension() {
    const threshold = 160;
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    if (widthDiff || heightDiff) {
      redirectToGoogle();
    }
  }
  window.addEventListener('resize', detectDevToolsByDimension);
  setInterval(detectDevToolsByDimension, 1000);

  // B. Debugger timing detector (fires when DevTools is active)
  setInterval(() => {
    const start = performance.now();
    // Debugger statement causes delay only when DevTools is open
    // eslint-disable-next-line no-debugger
    debugger;
    const end = performance.now();
    if (end - start > 100) {
      redirectToGoogle();
    }
  }, 1000);

  // C. Console image getter trap (Chrome DevTools triggers getter when console opens)
  try {
    const detectorElement = new Image();
    Object.defineProperty(detectorElement, 'id', {
      get: function () {
        redirectToGoogle();
      },
    });
    setInterval(() => {
      console.log(detectorElement);
      console.clear();
    }, 2000);
  } catch (err) {}

  // D. Disable console logging methods to prevent script probing
  try {
    if (window.console) {
      window.console.log = () => {};
      window.console.warn = () => {};
      window.console.error = () => {};
      window.console.info = () => {};
      window.console.debug = () => {};
      window.console.dir = () => {};
      window.console.table = () => {};
    }
  } catch (err) {}
}
