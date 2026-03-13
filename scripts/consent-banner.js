(function() {
  const CONSENT_KEY = 'androjack_consent_v1';

  function updateGtagConsent(granted) {
    const status = granted ? 'granted' : 'denied';
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'ad_storage': status,
        'analytics_storage': status,
        'ad_user_data': status,
        'ad_personalization': status
      });
    }
  }

  function showBanner() {
    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.className = 'consent-banner';
    banner.innerHTML = `
      <div class="consent-content">
        <div class="consent-text">
          <h3>Privacy Preference</h3>
          <p>We use optional cookies to improve your experience and analyze site traffic. Your choice matters to us.</p>
        </div>
        <div class="consent-buttons">
          <button id="btn-consent-reject" class="btn-consent btn-outline">Decline</button>
          <button id="btn-consent-accept" class="btn-consent btn-filled">Accept All</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    // Trigger animation
    setTimeout(() => banner.classList.add('visible'), 100);

    document.getElementById('btn-consent-accept').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'granted');
      updateGtagConsent(true);
      hideBanner();
    });

    document.getElementById('btn-consent-reject').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'denied');
      updateGtagConsent(false);
      hideBanner();
    });
  }

  function hideBanner() {
    const banner = document.getElementById('consent-banner');
    if (banner) {
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 400);
    }
  }

  // Check for existing consent
  const savedConsent = localStorage.getItem(CONSENT_KEY);
  if (savedConsent) {
    updateGtagConsent(savedConsent === 'granted');
  } else {
    // Show banner if no consent history
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();
