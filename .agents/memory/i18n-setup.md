---
name: i18n setup
description: Internationalization configuration for the Sasuty frontend
---

react-i18next with i18next-browser-languagedetector. Locales: ja (default), en.

**Files:**
- `artifacts/sasuty/src/i18n/index.ts` — init, exports `setLanguage(lang)`
- `artifacts/sasuty/src/i18n/locales/ja.json` and `en.json` — all translation keys

**Why:** Language preference stored in localStorage key `sasuty_lang` and in DB (users.language column). Settings page lets users switch language; `setLanguage()` updates i18next and localStorage.

**Gotcha:** `useToast` hook lives at `@/hooks/use-toast`, NOT `@/components/ui/use-toast`. The latter path does not exist.
