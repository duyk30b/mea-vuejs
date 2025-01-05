let CLIENT_ID = localStorage.getItem('CLIENT_ID')
if (!CLIENT_ID) {
  CLIENT_ID = Math.random().toString(36).substring(2).toUpperCase()
  localStorage.setItem('CLIENT_ID', CLIENT_ID)
}

export const CONFIG = {
  CLIENT_ID: CLIENT_ID,
  MODE: import.meta.env.MODE,
  API_URL:
    import.meta.env.MODE === 'production'
      ? 'https://api.medihome.vn'
      : `http://${location.hostname}:20000`,
}

// CONFIG.API_URL = 'https://api.medihome.vn'
