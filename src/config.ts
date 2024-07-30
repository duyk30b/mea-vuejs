let CLIENT_ID = localStorage.getItem('CLIENT_ID')
if (!CLIENT_ID) {
  CLIENT_ID = Math.random().toString(36).substring(2).toUpperCase()
  localStorage.setItem('CLIENT_ID', CLIENT_ID)
}

export const CONFIG = {
  CLIENT_ID: CLIENT_ID,
  API_URL:
    import.meta.env.MODE === 'production'
      ? 'https://api.mea.vn'
      : `http://${location.hostname}:20000`,
}

// CONFIG.API_URL = 'https://api.mea.vn'
