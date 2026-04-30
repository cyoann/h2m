export function createLegalPanel(): HTMLDialogElement {
  const dialog = document.createElement('dialog');

  dialog.className = 'settings-dialog legal-dialog';
  dialog.setAttribute('aria-labelledby', 'legal-title');

  dialog.innerHTML = `
    <article class="settings-card legal-card">
      <header class="settings-card__header">
        <div>
          <p class="eyebrow">Legal</p>
          <h2 id="legal-title">License and notices</h2>
        </div>

        <button class="icon-button" type="button" data-action="close-legal" aria-label="Close legal notices">
          ×
        </button>
      </header>

      <div class="settings-card__body legal-card__body">
        <section class="legal-section">
          <h3>h2m</h3>
          <p>Copyright © 2026 cyoann.</p>
          <p>Released under the MIT License by cyoann.</p>
        </section>

        <section class="legal-section">
          <h3>Third-party tools</h3>
          <p>h2m is built with open-source tools and libraries.</p>

          <dl class="notice-list">
            <div>
              <dt>DOMPurify</dt>
              <dd>HTML sanitization · Apache-2.0 OR MPL-2.0</dd>
            </div>
            <div>
              <dt>Turndown</dt>
              <dd>HTML-to-Markdown conversion · MIT</dd>
            </div>
            <div>
              <dt>Vite</dt>
              <dd>Development server and static build · MIT</dd>
            </div>
            <div>
              <dt>vite-plugin-pwa</dt>
              <dd>Offline PWA support · MIT</dd>
            </div>
            <div>
              <dt>TypeScript</dt>
              <dd>Static type checking · Apache-2.0</dd>
            </div>
            <div>
              <dt>Sass</dt>
              <dd>SCSS compilation · MIT</dd>
            </div>
            <div>
              <dt>Sharp</dt>
              <dd>PWA image generation · Apache-2.0</dd>
            </div>
            <div>
              <dt>Vitest and jsdom</dt>
              <dd>Test runner and DOM test environment · MIT</dd>
            </div>
          </dl>
        </section>

        <section class="legal-section">
          <h3>Privacy</h3>
          <p>h2m does not include analytics, telemetry, remote fonts, CDN assets, or backend services.</p>
        </section>
      </div>

      <footer class="settings-card__footer">
        <p class="legal-card__note">Full license texts are available in the repository.</p>
        <button class="primary-button" type="button" data-action="close-legal-footer">Done</button>
      </footer>
    </article>
  `;

  const closeButtons = dialog.querySelectorAll<HTMLButtonElement>('[data-action="close-legal"], [data-action="close-legal-footer"]');

  closeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      dialog.close();
    });
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  return dialog;
}
