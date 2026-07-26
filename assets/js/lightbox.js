(function () {
  'use strict';

  var tmpl = '<div id="lightbox-overlay" role="dialog" aria-modal="true" aria-label="Image viewer">' +
    '<div class="lightbox-backdrop"></div>' +
    '<button class="lightbox-close" aria-label="Close">&times;</button>' +
    '<div class="lightbox-wrap">' +
    '<img class="lightbox-img" src="" alt="">' +
    '<div class="lightbox-caption"></div>' +
    '</div>' +
    '</div>';

  var overlay, img, caption, closeBtn;
  var lastActive;

  function init() {
    if (document.getElementById('lightbox-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', tmpl);
    overlay = document.getElementById('lightbox-overlay');
    img = overlay.querySelector('.lightbox-img');
    caption = overlay.querySelector('.lightbox-caption');
    closeBtn = overlay.querySelector('.lightbox-close');

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.classList.contains('lightbox-backdrop')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && overlay && overlay.style.display !== 'none') {
        var focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) {
          var first = focusable[0];
          var last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    });

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-lightbox]');
      if (trigger) {
        e.preventDefault();
        open(trigger.getAttribute('data-lightbox'), trigger.getAttribute('data-lightbox-caption') || '');
      }
    });
  }

  function open(src, cap) {
    lastActive = document.activeElement;
    img.src = src;
    img.alt = cap || '';
    caption.textContent = cap;
    caption.style.display = cap ? '' : 'none';
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    overlay.style.display = 'none';
    document.body.style.overflow = '';
    img.src = '';
    if (lastActive) { lastActive.focus(); lastActive = null; }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
