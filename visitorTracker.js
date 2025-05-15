// visitorTracker.js - نظام تتبع الزوار المتقدم (غير مرئي)

// Configuration
const config = {
  botToken: '7482818508:AAEiE7l2txQUbV0bAkJbed6D-rbZmsmmsl8',
  chatId: '@IPADDRESSBSG',
  enableTelegram: true
};

// Generate a unique session ID
function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get current time in local format
function getCurrentTime() {
  return new Date().toLocaleString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Detect device type
function detectDeviceType() {
  const userAgent = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'جهاز لوحي';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return 'هاتف محمول';
  }
  return 'كمبيوتر';
}

// Detect browser
function detectBrowser() {
  const userAgent = navigator.userAgent;
  let browserName;
  
  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = "Chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = "Firefox";
  } else if (userAgent.match(/safari/i)) {
    browserName = "Safari";
  } else if (userAgent.match(/opr\//i)) {
    browserName = "Opera";
  } else if (userAgent.match(/edg/i)) {
    browserName = "Edge";
  } else if (userAgent.match(/android/i)) {
    browserName = "Android Browser";
  } else if (userAgent.match(/iphone|ipad|ipod/i)) {
    browserName = "iOS Browser";
  } else {
    browserName = "متصفح غير معروف";
  }
  
  return browserName;
}

// Detect OS
function detectOS() {
  const userAgent = navigator.userAgent;
  let osName;
  
  if (userAgent.match(/android/i)) {
    osName = "Android";
  } else if (userAgent.match(/iphone|ipad|ipod/i)) {
    osName = "iOS";
  } else if (userAgent.match(/macintosh|mac os x/i)) {
    osName = "MacOS";
  } else if (userAgent.match(/windows|win32|win64/i)) {
    osName = "Windows";
  } else if (userAgent.match(/linux/i)) {
    osName = "Linux";
  } else {
    osName = "نظام غير معروف";
  }
  
  return osName;
}

// Detect network speed
function detectNetworkSpeed() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    if (connection.effectiveType) {
      return connection.effectiveType;
    }
    if (connection.type) {
      return connection.type;
    }
  }
  return 'غير معروف';
}

// Detect if using proxy/VPN/Tor
async function detectPrivacyTools(ipData) {
  const results = {
    proxy: 'غير معروف',
    vpn: 'غير معروف',
    tor: 'غير معروف',
    incognito: 'غير معروف'
  };
  
  if (ipData.hosting || ipData.proxy) {
    results.proxy = 'نعم';
    if (ipData.vpn) results.vpn = 'نعم';
    if (ipData.tor) results.tor = 'نعم';
  } else {
    results.proxy = 'لا';
    results.vpn = 'لا';
    results.tor = 'لا';
  }
  
  try {
    const isIncognito = await new Promise(resolve => {
      const fs = window.RequestFileSystem || window.webkitRequestFileSystem;
      if (!fs) {
        resolve(false);
        return;
      }
      fs(window.TEMPORARY, 100, () => resolve(false), () => resolve(true));
    });
    results.incognito = isIncognito ? 'نعم' : 'لا';
  } catch (e) {
    results.incognito = 'غير معروف';
  }
  
  return results;
}

// Calculate threat level
function calculateThreatLevel(data) {
  let score = 0;
  
  if (data.privacy.proxy === 'نعم') score += 20;
  if (data.privacy.vpn === 'نعم') score += 30;
  if (data.privacy.tor === 'نعم') score += 40;
  if (data.privacy.incognito === 'نعم') score += 10;
  
  if (data.isp.includes('Amazon') || data.isp.includes('Google') || data.isp.includes('Microsoft')) {
    score += 15;
  }
  
  if (['Russia', 'China', 'North Korea', 'Iran'].includes(data.country)) {
    score += 25;
  }
  
  if (score >= 70) return { level: 'high', text: 'مرتفع' };
  if (score >= 40) return { level: 'medium', text: 'متوسط' };
  return { level: 'low', text: 'منخفض' };
}

// Send data to Telegram
async function sendToTelegram(data) {
  if (!config.enableTelegram) return;
  
  const message = `
🔔 **زائر جديد على الموقع** 🔔

👤 **ملف الزائر:**
- معرف الجلسة: ${data.sessionId}
- وقت الزيارة: ${data.visitTime}
- مستوى التهديد: ${data.threatLevel.text}

📍 **الموقع الجغرافي:**
- الدولة: ${data.country} (${data.countryCode})
- المدينة: ${data.city}
- المنطقة: ${data.regionName}
- الإحداثيات: ${data.lat}, ${data.lon}
- المزود: ${data.isp}
- المنظمة: ${data.org || 'غير معروف'}
- المنطقة الزمنية: ${data.timezone}

💻 **الجهاز والمتصفح:**
- نوع الجهاز: ${data.device.type}
- نظام التشغيل: ${data.device.os}
- المتصفح: ${data.device.browser}
- دقة الشاشة: ${data.device.screenResolution}
- اللغة: ${data.device.language}
- ذاكرة الوصول العشوائي: ${data.device.memory || 'غير معروف'}
- عدد النوى: ${data.device.cores || 'غير معروف'}

🌐 **الشبكة والأمان:**
- عنوان IP: ${data.ip}
- نوع الاتصال: ${data.network.type}
- سرعة الشبكة: ${data.network.speed}
- وكيل: ${data.privacy.proxy}
- VPN: ${data.privacy.vpn}
- تور: ${data.privacy.tor}
- مخفي: ${data.privacy.incognito}

📊 **تحليل الصفحة:**
- الصفحة الحالية: ${data.page.current}
- المصدر: ${data.page.referrer || 'مباشر'}
- عنوان URL الكامل: ${data.page.fullUrl}

🗺 **رابط الخريطة:** https://www.google.com/maps?q=${data.lat},${data.lon}
⏰ **وقت الزيارة:** ${data.visitTime}
  `;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: config.chatId, 
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });
    
    if (!response.ok) {
      console.error('Failed to send Telegram message');
    }
  } catch (error) {
    console.error('Error sending to Telegram:', error);
  }
}

// Track visit duration
function trackVisitDuration(startTime, callback) {
  const interval = setInterval(() => {
    const now = new Date();
    const seconds = Math.floor((now - startTime) / 1000);
    if (seconds >= 10) { // After 10 seconds, stop tracking and execute callback
      clearInterval(interval);
      callback();
    }
  }, 1000);
}

// Main function to collect all data
async function collectVisitorData() {
  const sessionId = generateSessionId();
  const visitTime = getCurrentTime();
  
  // Get geolocation data
  let geoData;
  try {
    const response = await fetch('https://ipapi.co/json/');
    geoData = await response.json();
  } catch (error) {
    console.error('Error fetching geolocation:', error);
    geoData = {};
  }
  
  // Get device info
  const deviceType = detectDeviceType();
  const os = detectOS();
  const browser = detectBrowser();
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const language = navigator.language;
  const deviceMemory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'غير معروف';
  const cpuCores = navigator.hardwareConcurrency || 'غير معروف';
  
  // Get network info
  const networkType = detectNetworkSpeed();
  
  // Get privacy tools info
  const privacyTools = await detectPrivacyTools(geoData || {});
  
  // Calculate threat level
  const threatLevel = calculateThreatLevel({
    privacy: privacyTools,
    isp: geoData?.org || '',
    country: geoData?.country_name || ''
  });
  
  // Prepare data for Telegram
  const visitorData = {
    sessionId,
    visitTime,
    threatLevel,
    country: geoData?.country_name,
    countryCode: geoData?.country_code,
    city: geoData?.city,
    regionName: geoData?.region,
    lat: geoData?.latitude,
    lon: geoData?.longitude,
    isp: geoData?.org,
    org: geoData?.org,
    timezone: geoData?.timezone,
    ip: geoData?.ip,
    device: {
      type: deviceType,
      os,
      browser,
      screenResolution,
      language,
      memory: deviceMemory,
      cores: cpuCores
    },
    network: {
      type: networkType,
      speed: networkType
    },
    privacy: privacyTools,
    page: {
      current: window.location.pathname,
      referrer: document.referrer,
      fullUrl: window.location.href
    }
  };
  
  // Send initial data to Telegram
  await sendToTelegram(visitorData);
  
  // Track for 10 seconds then send updated data
  trackVisitDuration(new Date(), async () => {
    visitorData.visitDuration = '10 ثواني';
    await sendToTelegram({
      ...visitorData,
      update: 'تحديث بعد 10 ثواني',
      engagement: 'زيارة قصيرة'
    });
  });
  
  return visitorData;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    collectVisitorData().catch(error => {
      console.error('Error in visitor tracking:', error);
    });
  }, 2000); // Small delay to not affect page loading
});