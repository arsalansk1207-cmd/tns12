// TNS Universal Nav/Footer Injector
// Include this on all pages EXCEPT community.HTML
// Usage: <script src="nav-component.js"></script> at end of body

(function () {
  const NAV_HTML = `
<nav class="nav" id="main-nav">
  <a href="index.html" class="nav-logo" style="text-decoration:none">
    <img src="TNS-Logo-6.png" alt="TNS">
    <div class="nav-name">TNS<span> AW</span></div>
  </a>
  <div class="nav-links" id="nav-links">
    <a href="index.html" class="nav-link">Home</a>
    <a href="training.html" class="nav-link">Training</a>
    <a href="events.html" class="nav-link">Events</a>
    <a href="community.HTML" class="nav-link">Community</a>
    <a href="tnarmy.html" class="nav-link">TNS Army</a>
  </div>
  <div id="nav-auth-area" style="display:flex;align-items:center;gap:8px;margin-left:8px"></div>
  <button class="hamburger" id="hamburger" onclick="toggleMobileNav()" aria-label="Menu">
    <span></span><span></span><span></span>
  </button>
</nav>
<div class="mobile-nav" id="mobile-nav">
  <a href="index.html" class="nav-link">Home</a>
  <a href="training.html" class="nav-link">Training</a>
  <a href="events.html" class="nav-link">Events</a>
  <a href="community.HTML" class="nav-link">Community</a>
  <a href="tnarmy.html" class="nav-link">TNS Army</a>
  <div id="mobile-auth-area" style="margin-top:8px"></div>
</div>`;

  const FOOTER_HTML = `
<footer class="tns-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <div class="footer-logo">
        <img src="TNS-Logo-6.png" alt="TNS" style="width:44px;height:44px;border-radius:50%;border:2px solid var(--red);object-fit:cover">
        <div>
          <div style="font-family:var(--display,Teko);font-size:26px;font-weight:700;letter-spacing:1px">TNS<span style="color:var(--red)"> AW</span></div>
          <div style="font-size:11px;color:var(--muted,#7a7a9a);letter-spacing:1.5px;text-transform:uppercase">Est. 2017 · Pune</div>
        </div>
      </div>
      <p class="footer-tagline">Pune's first and premier arm wrestling club. Train. Compete. Dominate.</p>
      <div class="footer-socials">
        <a href="https://instagram.com/tnsarmwrestling" target="_blank" class="fsoc"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://youtube.com/@tnsarmwrestling" target="_blank" class="fsoc"><i class="fa-brands fa-youtube"></i></a>
        <a href="https://facebook.com/tnsarmwrestling" target="_blank" class="fsoc"><i class="fa-brands fa-facebook-f"></i></a>
      </div>
    </div>
    <div class="footer-links-col">
      <div class="footer-col-title">Pages</div>
      <a href="index.html">Home</a>
      <a href="training.html">Training</a>
      <a href="events.html">Events</a>
      <a href="community.HTML">Community</a>
      <a href="tnarmy.html">TNS Army</a>
    </div>
    <div class="footer-links-col">
      <div class="footer-col-title">Account</div>
      <a href="auth.html">Sign In</a>
      <a href="auth.html?mode=register">Join TNS</a>
      <a href="profile.html">My Profile</a>
    </div>
    <div class="footer-links-col">
      <div class="footer-col-title">Legal</div>
      <a href="privacy.html">Privacy Policy</a>
      <a href="terms.html">Terms of Use</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2024 TNS Arm Wrestling. All rights reserved.</span>
    <span>Official Decathlon Partner</span>
  </div>
</footer>`;

  const FOOTER_CSS = `
<style>
.tns-footer{background:#08080f;border-top:1px solid rgba(255,255,255,.07);padding:56px 5vw 0;margin-top:80px}
.footer-inner{max-width:1140px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;padding-bottom:48px}
.footer-brand{display:flex;flex-direction:column;gap:14px}
.footer-logo{display:flex;align-items:center;gap:12px}
.footer-tagline{font-size:13px;color:var(--muted,#7a7a9a);line-height:1.7;max-width:260px}
.footer-socials{display:flex;gap:10px}
.fsoc{width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;color:var(--muted,#7a7a9a);font-size:15px;transition:all .2s;text-decoration:none}
.fsoc:hover{background:var(--red,#f5c518);border-color:var(--red,#f5c518);color:#000}
.footer-col-title{font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--muted,#7a7a9a);margin-bottom:16px}
.footer-links-col{display:flex;flex-direction:column;gap:10px}
.footer-links-col a{font-size:14px;color:rgba(240,240,248,.5);text-decoration:none;transition:color .2s}
.footer-links-col a:hover{color:var(--red,#f5c518)}
.footer-bottom{border-top:1px solid rgba(255,255,255,.07);padding:20px 0;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--muted,#7a7a9a);max-width:1140px;margin:0 auto}
@media(max-width:768px){.footer-inner{grid-template-columns:1fr 1fr;gap:32px}.footer-brand{grid-column:span 2}.footer-bottom{flex-direction:column;gap:8px;text-align:center}}
@media(max-width:480px){.footer-inner{grid-template-columns:1fr}}
</style>`;

  // Inject nav at top of body
  function injectNav() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = NAV_HTML;
    document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild);
    document.body.insertBefore(wrapper.firstElementChild, document.body.children[1]);

    // Mark active link
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(a => {
      if (a.getAttribute('href') === path) a.classList.add('active');
    });

    // Update auth area
    updateNavAuth();

    // Sticky nav
    window.addEventListener('scroll', () => {
      const nav = document.getElementById('main-nav');
      if (nav) nav.classList.toggle('stuck', window.scrollY > 20);
    });
  }

  function updateNavAuth() {
    const user = typeof TNS_DB !== 'undefined' ? TNS_DB.getCurrentUser() : null;
    const area = document.getElementById('nav-auth-area');
    const mArea = document.getElementById('mobile-auth-area');
    if (!area) return;

    if (user) {
      const initials = user.profilePic ? '' : (user.avatar || user.name.slice(0, 2).toUpperCase());
      const avatarHTML = user.profilePic
        ? `<img src="${user.profilePic}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
        : initials;
      area.innerHTML = `
        <a href="profile.html" style="display:flex;align-items:center;gap:8px;padding:4px 12px 4px 4px;background:var(--card,#111118);border:1px solid rgba(255,255,255,.08);border-radius:100px;text-decoration:none;transition:border-color .2s" onmouseover="this.style.borderColor='rgba(245,197,24,.4)'" onmouseout="this.style.borderColor='rgba(255,255,255,.08)'">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f5c518,#f97316);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#000;overflow:hidden;flex-shrink:0">${avatarHTML}</div>
          <span style="font-size:13px;font-weight:600;color:var(--text,#f0f0f8)">${user.username}</span>
        </a>`;
      if (mArea) mArea.innerHTML = `<a href="profile.html" style="display:block;padding:14px 16px;border-radius:12px;font-size:16px;font-weight:600;color:var(--red,#f5c518);border:1px solid rgba(245,197,24,.2);text-decoration:none">👤 My Profile (${user.username})</a><button onclick="TNS_DB.logout();window.location.reload()" style="width:100%;margin-top:8px;padding:14px;background:transparent;border:1px solid rgba(255,255,255,.1);border-radius:12px;font-size:14px;color:var(--muted,#7a7a9a);cursor:pointer;font-family:inherit">Sign Out</button>`;
    } else {
      area.innerHTML = `<a href="auth.html" class="nav-cta outline" style="text-decoration:none">Sign In</a><a href="auth.html?mode=register" class="nav-cta" style="text-decoration:none">Join TNS</a>`;
      if (mArea) mArea.innerHTML = `<a href="auth.html" class="m-cta" style="text-decoration:none;display:block;text-align:center;padding:16px;background:var(--red,#f5c518);border-radius:12px;font-weight:700;color:#000">Join TNS</a>`;
    }
  }

  // Listen for auth state changes
  document.addEventListener('tns-auth-ready', updateNavAuth, true);
  document.addEventListener('auth-state-changed', updateNavAuth, true);

  function injectFooter() {
    document.head.insertAdjacentHTML('beforeend', FOOTER_CSS);
    document.body.insertAdjacentHTML('beforeend', FOOTER_HTML);
  }

  window.toggleMobileNav = function () {
    const h = document.getElementById('hamburger');
    const m = document.getElementById('mobile-nav');
    if (h) h.classList.toggle('open');
    if (m) m.classList.toggle('open');
  };

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { injectNav(); injectFooter(); });
  } else {
    injectNav(); injectFooter();
  }
})();
