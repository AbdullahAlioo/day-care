(function () {
  'use strict';

  var nav = document.querySelector('[data-nav]');
  var menuToggle = document.querySelector('[data-menu-toggle]');
  var header = document.querySelector('[data-header]');

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuToggle.classList.toggle('is-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        menuToggle.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation');
      });
    });
  }

  var revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var button = item.querySelector('button');
    button.addEventListener('click', function () {
      var wasOpen = item.classList.contains('is-open');
      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        other.querySelector('button').setAttribute('aria-expanded', 'false');
        other.querySelector('button b').textContent = '+';
      });
      if (!wasOpen) {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        button.querySelector('b').textContent = '−';
      }
    });
  });

  var modal = document.querySelector('[data-modal]');
  var modalForm = document.querySelector('#modal-form');
  var successMessage = document.querySelector('.success-message');
  var modalTriggers = document.querySelectorAll('a[href="#contact"], [data-open-modal]');
  var lastFocused = null;
  var inquiryServer = 'https://ticket-collection-system-ur3h.vercel.app/inquiry?';

  function sendInquiryToHuggingFace(payload) {
    var email = String(payload.email || '').trim();
    if (!email) return Promise.reject(new Error('Email required'));

    var query = new URLSearchParams();
    Object.keys(payload).forEach(function (key) {
      if (payload[key]) query.set(key, String(payload[key]));
    });

    return fetch(inquiryServer + query.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }).then(function (response) {
      if (!response.ok) throw new Error('Server error');
      return response.json();
    });
  }

  function openModal() {
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    var firstInput = modal.querySelector('input');
    if (firstInput) window.setTimeout(function () { firstInput.focus(); }, 100);
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (modalForm) {
      modalForm.hidden = false;
      modalForm.reset();
    }
    if (successMessage) successMessage.hidden = true;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  modalTriggers.forEach(function (trigger) {
    // Contact anchor remains a useful direct jump; the prominent inquiry form is the primary contact action.
    if (trigger.hasAttribute('data-open-modal')) trigger.addEventListener('click', function (event) { event.preventDefault(); openModal(); });
  });
  if (modal) {
    modal.querySelectorAll('[data-modal-close]').forEach(function (close) { close.addEventListener('click', closeModal); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });
  }
  if (modalForm) {
    modalForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var submit = modalForm.querySelector('button[type="submit"]');
      var original = submit.innerHTML;
      var data = new FormData(modalForm);
      submit.disabled = true;
      submit.textContent = 'Sending…';

      sendInquiryToHuggingFace({
        name: data.get('modal-name'),
        email: data.get('modal-email'),
        interest: data.get('modal-interest'),
        source: 'book-a-visit-form',
      }).then(function () {
        modalForm.hidden = true;
        successMessage.hidden = false;
      }).catch(function (error) {
        console.error('Inquiry submission failed:', error);
        alert('There was an error sending your request. Please try again or call us directly.');
      }).finally(function () {
        submit.disabled = false;
        submit.innerHTML = original;
      });
    });
  }

  var inquiryForm = document.querySelector('#inquiry-form');
  var toast = document.querySelector('[data-toast]');
  var toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('is-visible'); }, 5000);
  }
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var submit = inquiryForm.querySelector('button[type="submit"]');
      var original = submit.innerHTML;
      var data = new FormData(inquiryForm);
      submit.disabled = true;
      submit.textContent = 'Sending…';

      sendInquiryToHuggingFace({
        name: data.get('name'),
        email: data.get('email'),
        phone: data.get('phone'),
        interest: data.get('interest'),
        message: data.get('message'),
        source: 'contact-inquiry-form',
      }).then(function () {
        inquiryForm.reset();
        showToast('Thanks for reaching out. Your inquiry has been sent to our team.');
      }).catch(function (error) {
        console.error('Inquiry submission failed:', error);
        showToast('We could not send your inquiry. Please try again or call us directly.');
      }).finally(function () {
        submit.disabled = false;
        submit.innerHTML = original;
      });
    });
  }

  var lightbox = document.querySelector('[data-lightbox-modal]');
  var lightboxImage = document.querySelector('[data-lightbox-image]');
  var lightboxCaption = document.querySelector('[data-lightbox-caption]');
  var galleryButtons = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  var currentImage = 0;
  function showImage(index) {
    if (!galleryButtons.length || !lightboxImage) return;
    currentImage = (index + galleryButtons.length) % galleryButtons.length;
    var item = galleryButtons[currentImage];
    lightboxImage.src = item.getAttribute('data-lightbox');
    lightboxImage.alt = item.querySelector('img').alt;
    lightboxCaption.textContent = item.getAttribute('data-caption');
  }
  function openLightbox(index) {
    showImage(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
  }
  galleryButtons.forEach(function (button, index) { button.addEventListener('click', function () { openLightbox(index); }); });
  if (lightbox) {
    lightbox.querySelector('[data-lightbox-close]').addEventListener('click', closeLightbox);
    lightbox.querySelector('[data-lightbox-next]').addEventListener('click', function () { showImage(currentImage + 1); });
    lightbox.addEventListener('click', function (event) { if (event.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (event) {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowRight') showImage(currentImage + 1);
      if (event.key === 'ArrowLeft') showImage(currentImage - 1);
    });
  }

  if (header) {
    var onScroll = function () { header.classList.toggle('site-header--scrolled', window.scrollY > 20); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();