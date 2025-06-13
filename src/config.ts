import { ref } from 'vue'

export const CONFIG = {
  CLIENT_ID: '',
  MODE: import.meta.env.MODE,
  API_URL:
    import.meta.env.MODE === 'production'
      ? 'https://api.medihome.vn'
      : `http://${location.hostname}:20000`,
  BUILD_TIME: '',
}
  ; (window as any)._MEA_CONFIG = CONFIG
// CONFIG.API_URL = 'https://api.medihome.vn'

const loadConfig = async () => {
  try {
    let CLIENT_ID = localStorage.getItem('CLIENT_ID')
    if (!CLIENT_ID) {
      CLIENT_ID = Math.random().toString(36).substring(2).toUpperCase()
      localStorage.setItem('CLIENT_ID', CLIENT_ID)
    }
    CONFIG.CLIENT_ID = CLIENT_ID

    const res = await fetch('/config.json')
    if (!res.ok) return
    const config: { buildTime: string } = await res.json()
    CONFIG.BUILD_TIME = config.buildTime
  } catch (error) {
    console.log('🚀 ~ config.ts:28 ~ loadConfig ~ error:', error)
  }
}

loadConfig()
