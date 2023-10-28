// / <reference types="vite/client" />
interface ImportMeta {
  env: {
    BASE_URL: string
    MODE: 'development' | 'production'
    DEV: boolean
    PROD: boolean
    SSR: boolean
  }
}
