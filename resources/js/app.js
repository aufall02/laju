
import { createInertiaApp } from '@inertiajs/svelte'
import { mount } from 'svelte'

createInertiaApp({
  resolve: async name => {
    const pages = import.meta.glob('./Pages/**/*.svelte')
    const pagePath = `./Pages/${name}.svelte`

    // Check if page exists
    if (!pages[pagePath]) {
      console.error(`[Inertia] Page not found: ${name}`)
      console.error(`[Inertia] Looking for: ${pagePath}`)
      console.error(`[Inertia] Available pages:`, Object.keys(pages))

      // Show error in dev mode
      if (import.meta.env.DEV) {
        document.body.innerHTML = `
          <div style="padding: 2rem; font-family: system-ui, sans-serif; background: #1e1e2e; color: #cdd6f4; min-height: 100vh;">
            <h1 style="color: #f38ba8; margin-bottom: 1rem;">🚨 Inertia Page Not Found</h1>
            <p style="margin-bottom: 1rem;">Component <code style="background: #313244; padding: 0.25rem 0.5rem; border-radius: 4px; color: #fab387;">${name}</code> tidak ditemukan.</p>
            <p style="margin-bottom: 0.5rem;">Looking for: <code style="background: #313244; padding: 0.25rem 0.5rem; border-radius: 4px;">${pagePath}</code></p>
            <details style="margin-top: 1rem;">
              <summary style="cursor: pointer; color: #89b4fa;">Available Pages</summary>
              <pre style="background: #313244; padding: 1rem; border-radius: 8px; overflow: auto; margin-top: 0.5rem;">${Object.keys(pages).join('\n')}</pre>
            </details>
            <p style="margin-top: 1.5rem; color: #a6adc8;">Periksa nama component di controller kamu.</p>
          </div>
        `
      }
      throw new Error(`Page not found: ${name}`)
    }

    try {
      return await pages[pagePath]()
    } catch (error) {
      console.error(`[Inertia] Error loading page: ${name}`, error)

      // Show error in dev mode
      if (import.meta.env.DEV) {
        document.body.innerHTML = `
          <div style="padding: 2rem; font-family: system-ui, sans-serif; background: #1e1e2e; color: #cdd6f4; min-height: 100vh;">
            <h1 style="color: #f38ba8; margin-bottom: 1rem;">🚨 Inertia Page Load Error</h1>
            <p style="margin-bottom: 1rem;">Gagal load component <code style="background: #313244; padding: 0.25rem 0.5rem; border-radius: 4px; color: #fab387;">${name}</code></p>
            <details open style="margin-top: 1rem;">
              <summary style="cursor: pointer; color: #89b4fa;">Error Details</summary>
              <pre style="background: #313244; padding: 1rem; border-radius: 8px; overflow: auto; margin-top: 0.5rem; color: #f38ba8;">${error.message}\n\n${error.stack}</pre>
            </details>
            <p style="margin-top: 1.5rem; color: #a6adc8;">Kemungkinan ada typo import atau syntax error di component.</p>
          </div>
        `
      }
      throw error
    }
  },
  setup({ el, App, props }) {
    el.classList.add('dark:bg-gray-900', 'min-h-screen');
    mount(App, { target: el, props })
  },
})

const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
// Check localStorage or fallback to system preference
const savedMode = localStorage.getItem('darkMode');
let isDarkMode = savedMode === null ? systemPrefersDark : savedMode === 'true';


if (isDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}
