console.log("peruanos");

// === GLOBALS AND DOM ===
const body = document.body;
const cubes = document.querySelectorAll('.dou-cube-container');
const esenciaOverlay = document.getElementById('esencia-overlay');
const abbeyOverlay = document.getElementById('abbey-overlay');
const abbeyImg = document.getElementById('abbey-img');
const lobotomyAudio = document.getElementById('lobotomy-audio');
const bartOverlay = document.getElementById('bart-overlay');
const kneeAudio = document.getElementById('knee-audio');
let typed = '';
let lastTypedTime = Date.now();
let douMode = document.body.classList.contains('dou-mode'); // SYNC WITH CLASS ON LOAD
let originalTexts = [];
let bartTyped = "";

// === DOU MODE ===
function swapDouModeImages() {
  // Swap class images
  document.querySelectorAll('img.class-img').forEach(img => {
    img.src = douMode ? img.getAttribute('data-dou') : img.getAttribute('data-default');
  });
  // Swap header background image at the top (the big one)
  const headerBg = document.querySelector('.header-bg');
  if (headerBg) {
    headerBg.src = douMode ? headerBg.getAttribute('data-dou') : headerBg.getAttribute('data-default');
  }
}

function toggleDouMode() {
  document.body.classList.toggle('dou-mode');
  douMode = document.body.classList.contains('dou-mode');

  // Show/hide cube and solo-dou elements
  document.querySelectorAll('.dou-cube-container').forEach(cube => {
    cube.style.display = douMode ? 'block' : 'none';
  });
  document.querySelectorAll('.solo-dou').forEach(el => {
    el.style.display = douMode ? 'block' : 'none';
  });

  // Text swap
  if (douMode) {
    // Save and replace all visible text except dropdown class links/buttons
    originalTexts = [];
    document.querySelectorAll('h1, h2, h3, p, span, li, button, td, th').forEach(el => {
      if (
        el.closest('.dropdown-content') ||
        (el.classList.contains('btn') && el.innerText.includes('Clases'))
      ) return;
      if (!el.querySelector('img')) {
        originalTexts.push({ element: el, text: el.innerText });
        el.innerText = 'dou';
      }
    });
  } else {
    // Restore all original text
    originalTexts.forEach(item => {
      item.element.innerText = item.text;
    });
  }

  // Swap images for dou mode
  swapDouModeImages();
}

// === ESENCIA MODE ===
function showEsencia() {
  esenciaOverlay.classList.add('active');
  esenciaOverlay.setAttribute('aria-hidden', 'false');
  body.classList.add('esencia-active');
}
function hideEsencia() {
  esenciaOverlay.classList.remove('active');
  esenciaOverlay.setAttribute('aria-hidden', 'true');
  body.classList.remove('esencia-active');
}
esenciaOverlay.addEventListener('click', hideEsencia);

// === BART OVERLAY ===
function showBartOverlayWithLock() {
  bartOverlay.style.display = "flex";
  document.body.classList.add('bart-active');
  kneeAudio.currentTime = 0;
  kneeAudio.loop = true;
  kneeAudio.play();
}
function hideBartOverlayAndUnlock() {
  bartOverlay.style.display = "none";
  document.body.classList.remove('bart-active');
  kneeAudio.pause();
  kneeAudio.currentTime = 0;
}

// Swipe-to-dismiss with 4 directions + prevent scroll
let bartStartX = null, bartStartY = null;
let bartSwiped = false;
bartOverlay.addEventListener('touchstart', function(e) {
  if (e.touches.length === 1) {
    bartStartX = e.touches[0].clientX;
    bartStartY = e.touches[0].clientY;
    bartSwiped = false;
  }
}, {passive: false});
bartOverlay.addEventListener('touchmove', function(e) {
  e.preventDefault();
}, {passive: false});
bartOverlay.addEventListener('touchend', function(e) {
  if (bartStartX !== null && bartStartY !== null && e.changedTouches.length === 1 && !bartSwiped) {
    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;
    let deltaX = endX - bartStartX;
    let deltaY = endY - bartStartY;
    const threshold = 60;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      bartSwiped = true;
      if (deltaX > 0) {
        bartOverlay.classList.add('swipe-out-right');
      } else {
        bartOverlay.classList.add('swipe-out-left');
      }
    } else if (Math.abs(deltaY) > threshold) {
      bartSwiped = true;
      if (deltaY < 0) {
        bartOverlay.classList.add('swipe-out-up');
      } else {
        bartOverlay.classList.add('swipe-out-down');
      }
    }
    if (bartSwiped) {
      setTimeout(function() {
        bartOverlay.classList.remove('swipe-out-up','swipe-out-down','swipe-out-left','swipe-out-right');
        hideBartOverlayAndUnlock();
      }, 500);
    }
  }
  bartStartX = null;
  bartStartY = null;
}, {passive: false});

// === Key Typing Detector for DOU/ESENCIA ===
document.addEventListener('keydown', function(e) {
  // Don't trigger if typing in an input/textarea/contentEditable
  if (
    document.activeElement.tagName === 'INPUT' ||
    document.activeElement.tagName === 'TEXTAREA' ||
    document.activeElement.isContentEditable
  ) return;

  // Reset buffer if >2s since last key
  if (Date.now() - lastTypedTime > 2000) typed = '';
  lastTypedTime = Date.now();

  if (esenciaOverlay.classList.contains('active')) {
    if (e.key === 'Escape') {
      hideEsencia();
      typed = '';
      return;
    }
  }

  if (e.key.length === 1) {
    typed += e.key.toLowerCase();
    if (typed.length > 10) typed = typed.slice(-10);
  } else if (e.key === 'Backspace') {
    typed = typed.slice(0, -1);
  } else if (e.key === 'Enter') {
    const buffer = typed.trim().toLowerCase();
    if (buffer.endsWith('dou')) {
      e.preventDefault();
      toggleDouMode();
      typed = '';
      return;
    } else if (buffer.endsWith('esencia')) {
      e.preventDefault();
      showEsencia();
      typed = '';
      return;
    }
    typed = '';
  }
});

// === Abbey Road & Cube Easter Egg ===
function playLobotomy() {
  lobotomyAudio.pause();
  lobotomyAudio.currentTime = 0;
  const randomPitch = Math.random() * (4.0 - 0.5) + 0.5;
  lobotomyAudio.playbackRate = randomPitch;
  if ('preservesPitch' in lobotomyAudio) lobotomyAudio.preservesPitch = false;
  if ('mozPreservesPitch' in lobotomyAudio) lobotomyAudio.mozPreservesPitch = false;
  if ('webkitPreservesPitch' in lobotomyAudio) lobotomyAudio.webkitPreservesPitch = false;
  lobotomyAudio.play();
}
document.querySelector('.dou-cube-container').addEventListener('click', () => {
  abbeyOverlay.style.display = "flex";
  abbeyOverlay.style.opacity = "1";
  playLobotomy();
  setTimeout(() => {
    abbeyOverlay.classList.add('fading');
    setTimeout(() => {
      abbeyOverlay.style.display = "none";
      abbeyOverlay.classList.remove('fading');
      lobotomyAudio.pause();
      lobotomyAudio.currentTime = 0;
      showBartOverlayWithLock();
    }, 1200);
  }, 2500);
});

// === BART OVERLAY Keyboard Dismiss ===
document.addEventListener('keydown', function(e) {
  if (bartOverlay.style.display === "flex") {
    if (e.key.length === 1) {
      bartTyped += e.key.toLowerCase();
      if (bartTyped.endsWith("bart")) {
        bartOverlay.style.display = "none";
        bartTyped = "";
        kneeAudio.pause();
        kneeAudio.currentTime = 0;
      }
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      bartTyped = bartTyped.slice(0, -1);
      e.preventDefault();
    }
  }
});

// === Long-press/Double-tap on Header for Mobile ===
let douTimeout;
document.querySelector('header').addEventListener('touchstart', function() {
  douTimeout = setTimeout(toggleDouMode, 1000); // 1 second press
});
document.querySelector('header').addEventListener('touchend', function() {
  clearTimeout(douTimeout);
});
let lastTap = 0;
document.querySelector('header').addEventListener('touchend', function(e) {
  const now = new Date().getTime();
  if (now - lastTap < 400) { showEsencia(); }
  lastTap = now;
});

// === Query param activation (?dou ?esencia) ===
const params = new URLSearchParams(window.location.search);
if (params.has('dou')) toggleDouMode();
if (params.has('esencia')) showEsencia();

// === Initial image swap on load for dou mode ===
swapDouModeImages();

// === Observe dou-mode class changes for external toggles ===
const douModeObserver = new MutationObserver(() => {
  douMode = document.body.classList.contains('dou-mode');
  swapDouModeImages();
});
douModeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });