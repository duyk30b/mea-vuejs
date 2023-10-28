export const CONFIG = {
  API_URL:
    import.meta.env.MODE === 'production'
      ? 'https://api.mea.vn'
      : `http://${location.hostname}:20000`,
}
