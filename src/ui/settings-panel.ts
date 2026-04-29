export function createSettingsPanel(): HTMLDialogElement {
  const dialog = document.createElement('dialog');

  dialog.className = 'settings-dialog';
  dialog.setAttribute('aria-labelledby', 'settings-title');

  dialog.innerHTML = `
    <form class="settings-card" method="dialog">
      <header class="settings-card__header">
        <div>
          <p class="eyebrow">Preferences</p>
          <h2 id="settings-title">Settings</h2>
        </div>

        <button class="icon-button" type="submit" aria-label="Close settings">
          ×
        </button>
      </header>

      <div class="settings-card__body">
        <fieldset class="setting-group">
          <legend>Conversion</legend>

          <label class="check-row">
            <input type="checkbox" name="headingStyle" value="atx" checked />
            <span>
              <strong>ATX headings</strong>
              <small>Use # headings instead of underlined headings.</small>
            </span>
          </label>

          <label class="check-row">
            <input type="checkbox" name="codeBlockStyle" value="fenced" checked />
            <span>
              <strong>Fenced code blocks</strong>
              <small>Prefer triple backticks for code output.</small>
            </span>
          </label>

          <label class="check-row">
            <input type="checkbox" name="removeComments" checked />
            <span>
              <strong>Remove comments</strong>
              <small>Keep the Markdown focused on visible content.</small>
            </span>
          </label>
        </fieldset>

        <fieldset class="setting-group">
          <legend>Interface</legend>

          <label class="check-row">
            <input type="checkbox" name="respectSystemTheme" checked />
            <span>
              <strong>Respect system theme</strong>
              <small>Use light or dark mode from the operating system.</small>
            </span>
          </label>

          <label class="check-row">
            <input type="checkbox" name="zenDensity" checked />
            <span>
              <strong>Zen spacing</strong>
              <small>Prefer generous whitespace over dense controls.</small>
            </span>
          </label>
        </fieldset>
      </div>

      <footer class="settings-card__footer">
        <button class="primary-button" type="submit">Done</button>
      </footer>
    </form>
  `;

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  return dialog;
}
