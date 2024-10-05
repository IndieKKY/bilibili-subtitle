/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EXTENSION_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
