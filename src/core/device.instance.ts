const getDevice = () => {
  const userAgentData = (navigator as any).userAgentData
  const device = {
    platform: 'unknown',
    browser: 'unknown',
    mobile:
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(
        navigator.userAgent
      )
        ? 1
        : 0,
  }
  if (userAgentData) {
    const brands = userAgentData.brands
    device.platform = userAgentData.platform
    device.browser = brands[brands.length - 1].brand
  } else {
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const macosPlatforms = ['macOS', 'Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']
    const iosPlatforms = ['iPhone', 'iPad', 'iPod']

    if (macosPlatforms.indexOf(platform) !== -1) {
      device.platform = 'Mac OS'
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      device.platform = 'iOS'
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      device.platform = 'Windows'
    } else if (/Android/.test(userAgent)) {
      device.platform = 'Android'
    } else if (/Linux/.test(platform)) {
      device.platform = 'Linux'
    }

    if (/Chrome/.test(userAgent) && !/Chromium/.test(userAgent)) {
      device.browser = 'Google Chrome'
    } else if (/Edg/.test(userAgent)) {
      device.browser = 'Microsoft Edge'
    } else if (/Firefox/.test(userAgent)) {
      device.browser = 'Mozilla Firefox'
    } else if (/Safari/.test(userAgent)) {
      device.browser = 'Apple Safari'
    } else if (/Trident/.test(userAgent)) {
      device.browser = 'Internet Explorer'
    }
  }
  return device
}

export const DeviceInstance = getDevice()
