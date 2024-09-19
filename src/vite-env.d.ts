/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVIEW_URL: string
  readonly VITE_EXTENSION_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
