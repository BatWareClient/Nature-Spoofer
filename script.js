// Geçerli lisans anahtarları (süre bilgisi ile)
const validLicenseKeys = [
    // Test lisansı - 1 dakika
    { key: 'NS-7K9M-2XPQ-4WVH-8JTL', duration: 1, unit: 'minutes' },
    
    // 24 saatlik lisanslar
    { key: 'NS-3RFG-9YBN-6DCP-1MZX', duration: 24, unit: 'hours' },
    { key: 'NS-5QWE-8HJK-2VNM-7PLR', duration: 24, unit: 'hours' },
    { key: 'NS-4TYU-6GHB-9XCZ-3KWQ', duration: 24, unit: 'hours' },
    { key: 'NS-8MNB-1VCX-5ZAQ-2WER', duration: 24, unit: 'hours' },
    { key: 'NS-2LKJ-7HGF-4DSA-9POI', duration: 24, unit: 'hours' },
    { key: 'NS-6UYT-3REW-8QAS-1ZXC', duration: 24, unit: 'hours' },
    { key: 'NS-9VBN-4MKL-7JHG-5FDS', duration: 24, unit: 'hours' },
    { key: 'NS-1QAZ-8WSX-3EDC-6RFV', duration: 24, unit: 'hours' },
    { key: 'NS-7TGB-2YHN-9UJM-4IKO', duration: 24, unit: 'hours' },
    
    // 7 günlük lisanslar
    { key: 'NS-WEEK-1A2B-3C4D-5E6F', duration: 7, unit: 'days' },
    { key: 'NS-WEEK-7G8H-9I0J-1K2L', duration: 7, unit: 'days' },
    { key: 'NS-WEEK-3M4N-5O6P-7Q8R', duration: 7, unit: 'days' },
    { key: 'NS-WEEK-9S0T-1U2V-3W4X', duration: 7, unit: 'days' },
    { key: 'NS-WEEK-5Y6Z-7A8B-9C0D', duration: 7, unit: 'days' },
    { key: 'NS-WEEK-1E2F-3G4H-5I6J', duration: 7, unit: 'days' },
    { key: 'NS-WEEK-7K8L-9M0N-1O2P', duration: 7, unit: 'days' },
    { key: 'NS-WEEK-3Q4R-5S6T-7U8V', duration: 7, unit: 'days' },
    { key: 'NS-WEEK-9W0X-1Y2Z-3A4B', duration: 7, unit: 'days' },
    { key: 'NS-WEEK-5C6D-7E8F-9G0H', duration: 7, unit: 'days' },
    
    // Admin lisansı - Sınırsız
    { key: 'NS-ADMIN-X9K7-M2P5-Q8W3-ULTRA', duration: 0, unit: 'unlimited' }
];

let currentLicenseInfo = null;
let timeUpdateInterval = null;
let isAdmin = false;

// Dil sistemi
let currentLang = 'tr';

function switchLanguage(lang) {
    currentLang = lang;
    
    document.querySelectorAll('[data-tr]').forEach(el => {
        if (el.tagName === 'INPUT') {
            el.placeholder = el.getAttribute(`data-placeholder-${lang}`);
        } else {
            el.textContent = el.getAttribute(`data-${lang}`);
        }
    });
    
    document.querySelectorAll('input[data-placeholder-tr]').forEach(input => {
        input.placeholder = input.getAttribute(`data-placeholder-${lang}`);
    });
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    
    if (lang === 'tr') {
        document.getElementById('langTR').checked = true;
    } else {
        document.getElementById('langEN').checked = true;
    }
    
    updateMessages(lang);
}

function updateMessages(lang) {
    const messages = {
        tr: {
            fillFields: 'Lütfen lisans anahtarı girin!',
            invalidKey: 'Geçersiz lisans anahtarı!',
            loginSuccess: 'Giriş başarılı!'
        },
        en: {
            fillFields: 'Please enter license key!',
            invalidKey: 'Invalid license key!',
            loginSuccess: 'Login successful!'
        }
    };
    window.messages = messages[lang];
}

// ============================================================
// DÜZELTME: expiry_date'den doğru UTC parse fonksiyonu
// ============================================================
function parseExpiryDate(expiryDateStr) {
    if (!expiryDateStr || typeof expiryDateStr !== 'string') return null;
    
    // cgauth expiry_date'i Türkiye saati (UTC+3) olarak döndürüyor.
    // 'Z' EKLEMIYORUZ - tarayıcı bunu local time olarak doğru parse eder.
    const normalized = expiryDateStr.trim().replace(' ', 'T');
    return new Date(normalized);
}

window.addEventListener('DOMContentLoaded', () => {
    updateMessages('tr');
    
    document.getElementById('loginMessage').textContent = '';
    document.getElementById('loginMessage').className = 'message';
    
    window.addEventListener('beforeunload', () => {
        if (currentLicenseInfo && !currentLicenseInfo.isAdmin) {
            sessionStorage.removeItem(`license_inuse_${currentLicenseInfo.key}`);
        }
    });
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchLanguage(this.getAttribute('data-lang'));
        });
    });
    
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const licenseKey = document.getElementById('licenseKey').value.trim();
        const message = document.getElementById('loginMessage');
        
        if (!licenseKey) {
            message.textContent = window.messages.fillFields;
            message.className = 'message error';
            return;
        }
        
        message.textContent = currentLang === 'tr' ? 'Doğrulanıyor...' : 'Validating...';
        message.className = 'message';
        
        console.log('Validating license:', licenseKey);
        
        try {
            const hwid = await CGAuth.getHWID();
            console.log('HWID:', hwid);
            
            const response = await fetch('/api/auth-license', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licenseKey, hwid })
            });
            
            const result = await response.json();
            console.log('Validation response:', result);
            
            if (result.success) {
                const data = result.data;
                
                console.log('=== CGAUTH FULL RESPONSE ===');
                console.log('Full data object:', JSON.stringify(data, null, 2));
                console.log('expiry_date:', data.expiry_date);
                console.log('days_remaining:', data.days_remaining);
                console.log('hours_remaining:', data.hours_remaining);
                console.log('===========================');
                
                let expirationTime;
                let daysRemaining = 0;
                
                // ============================================================
                // DÜZELTME: Önce expiry_date kullan (en doğru yöntem).
                // expiry_date UTC formatında gelir; 'Z' ekleyerek UTC olarak parse ediyoruz.
                // hours_remaining/days_remaining cgauth'un timezone farkından
                // dolayı 3 saat fazla gösterebilir, bu yüzden fallback olarak kullanılıyor.
                // ============================================================
                if (data.expiry_date && typeof data.expiry_date === 'string') {
                    expirationTime = parseExpiryDate(data.expiry_date);
                    
                    console.log('Parsed expiration time (UTC):', expirationTime.toISOString());
                    console.log('Now (UTC):', new Date().toISOString());
                    
                    if (!isNaN(expirationTime.getTime())) {
                        const now = new Date();
                        const remainingMs = expirationTime - now;
                        daysRemaining = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24)));
                        console.log('Remaining ms:', remainingMs);
                        console.log('Days remaining:', daysRemaining);
                    } else {
                        console.error('Geçersiz tarih formatı, hours_remaining kullanılıyor...');
                        // Fallback: hours_remaining
                        const totalHours = (data.days_remaining || 0) * 24 + (data.hours_remaining || 0);
                        expirationTime = new Date(Date.now() + totalHours * 60 * 60 * 1000);
                        daysRemaining = data.days_remaining || 0;
                    }
                }
                // expiry_date yoksa hours_remaining/days_remaining kullan
                else if (data.hours_remaining !== undefined || data.days_remaining !== undefined) {
                    const totalHours = (data.days_remaining || 0) * 24 + (data.hours_remaining || 0);
                    expirationTime = new Date(Date.now() + totalHours * 60 * 60 * 1000);
                    daysRemaining = data.days_remaining || 0;
                    
                    console.log('Fallback - Using hours_remaining:', data.hours_remaining);
                    console.log('Fallback - Using days_remaining:', data.days_remaining);
                    console.log('Fallback - Total hours:', totalHours);
                    console.log('Fallback - Expiration time:', expirationTime.toISOString());
                }
                else {
                    console.warn('Süre bilgisi bulunamadı, varsayılan 365 gün kullanılıyor.');
                    expirationTime = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                    daysRemaining = 365;
                }
                
                currentLicenseInfo = {
                    key: licenseKey,
                    activationTime: new Date(),
                    daysRemaining: daysRemaining,
                    expirationTime: expirationTime,
                    isAdmin: data.is_admin || licenseKey === 'ADMIN-17D287-1BBD7B-51EA15' || licenseKey === 'ADMIN-594E38-626B67-58C944',
                    appName: data.app_name,
                    status: data.status
                };
                
                console.log('Final currentLicenseInfo:', currentLicenseInfo);
                
                if (currentLicenseInfo.isAdmin) {
                    isAdmin = true;
                }
                
                localStorage.setItem(`license_${licenseKey}`, new Date().toISOString());
                
                message.textContent = window.messages.loginSuccess;
                message.className = 'message success';
                
                setTimeout(() => {
                    document.getElementById('loginScreen').classList.remove('active');
                    document.getElementById('mainScreen').classList.add('active');
                    updateTimeRemaining();
                    if (isAdmin) {
                        showAdminPanel();
                        document.getElementById('displayName').textContent = 'Admin';
                        document.getElementById('userInitial').textContent = 'A';
                    }
                    startTimeUpdate();
                }, 800);
            } else {
                message.textContent = result.error || window.messages.invalidKey;
                message.className = 'message error';
            }
        } catch (error) {
            console.error('License validation error:', error);
            message.textContent = currentLang === 'tr' ? 'Bağlantı hatası!' : 'Connection error!';
            message.className = 'message error';
        }
    });
    
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (currentLicenseInfo && !currentLicenseInfo.isAdmin) {
            sessionStorage.removeItem(`license_inuse_${currentLicenseInfo.key}`);
        }
        
        document.getElementById('mainScreen').classList.remove('active');
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('licenseKey').value = '';
        document.getElementById('loginMessage').textContent = '';
        
        if (timeUpdateInterval) {
            clearInterval(timeUpdateInterval);
            timeUpdateInterval = null;
        }
        currentLicenseInfo = null;
        isAdmin = false;
        
        document.querySelector('.admin-only').style.display = 'none';
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            const page = this.getAttribute('data-page');
            document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
            document.getElementById(page).classList.add('active');
        });
    });
    
    document.getElementById('downloadWindows').addEventListener('click', function() {
        alert('Windows 10 sürümü indirilecek! (Dosya yolu eklenecek)');
    });
    
    document.getElementById('langTR').addEventListener('change', function() {
        if (this.checked) switchLanguage('tr');
    });
    
    document.getElementById('langEN').addEventListener('change', function() {
        if (this.checked) switchLanguage('en');
    });
    
    document.getElementById('resetLicenses').addEventListener('click', function() {
        if (confirm('Tüm lisans süreleri sıfırlanacak. Emin misiniz?')) {
            localStorage.clear();
            alert('Tüm lisans süreleri sıfırlandı!');
        }
    });
});

// Kalan süreyi hesapla ve göster
function updateTimeRemaining() {
    if (!currentLicenseInfo) return;
    
    if (currentLicenseInfo.isAdmin) {
        document.getElementById('timeRemaining').innerHTML = 
            `<span style="color: #6ee7b7;">${currentLang === 'tr' ? '∞ Sınırsız' : '∞ Unlimited'}</span>`;
        return;
    }
    
    if (!currentLicenseInfo.expirationTime || isNaN(currentLicenseInfo.expirationTime.getTime())) {
        document.getElementById('timeRemaining').textContent = 
            currentLang === 'tr' ? 'Hesaplanıyor...' : 'Calculating...';
        return;
    }
    
    const now = new Date();
    const remaining = currentLicenseInfo.expirationTime - now;
    
    if (remaining <= 0) {
        document.getElementById('timeRemaining').innerHTML = 
            `<span style="color: #ef4444;">${currentLang === 'tr' ? 'Lisans süresi doldu!' : 'License expired!'}</span>`;
        return;
    }
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    let timeText = '';
    if (currentLang === 'tr') {
        if (days > 0)         timeText = `${days} gün ${hours} saat`;
        else if (hours > 0)   timeText = `${hours} saat ${minutes} dakika`;
        else if (minutes > 0) timeText = `${minutes} dakika ${seconds} saniye`;
        else                  timeText = `${seconds} saniye`;
    } else {
        if (days > 0)         timeText = `${days} days ${hours} hours`;
        else if (hours > 0)   timeText = `${hours} hours ${minutes} minutes`;
        else if (minutes > 0) timeText = `${minutes} minutes ${seconds} seconds`;
        else                  timeText = `${seconds} seconds`;
    }
    
    document.getElementById('timeRemaining').textContent = timeText;
}

// Zaman güncellemesini başlat
function startTimeUpdate() {
    updateTimeRemaining();
    timeUpdateInterval = setInterval(updateTimeRemaining, 1000);
    
    if (!isAdmin && currentLicenseInfo && !currentLicenseInfo.isAdmin) {
        setInterval(() => {
            const activationTime = localStorage.getItem(`license_${currentLicenseInfo.key}`);
            if (!activationTime) {
                alert(currentLang === 'tr' ? 'Lisansınız iptal edildi!' : 'Your license has been revoked!');
                document.getElementById('logoutBtn').click();
            }
        }, 30000);
    }
}

// Admin panelini göster
function showAdminPanel() {
    document.querySelector('.admin-only').style.display = 'flex';
    loadActiveUsers();
    
    setInterval(() => {
        if (isAdmin && document.getElementById('admin').classList.contains('active')) {
            loadActiveUsers();
        }
    }, 1000);
}

// Aktif kullanıcıları yükle
function loadActiveUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    let hasUsers = false;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('license_')) {
            const licenseKey = key.replace('license_', '');
            const activationTime = localStorage.getItem(key);
            
            if (currentLicenseInfo && currentLicenseInfo.key === licenseKey) {
                hasUsers = true;
                
                const activationDate = new Date(activationTime);
                const now = new Date();
                const expirationDate = currentLicenseInfo.expirationTime;
                const remaining = expirationDate - now;
                
                let timeText = '';
                let statusClass = '';
                
                if (remaining <= 0) {
                    timeText = currentLang === 'tr' ? 'Süresi dolmuş' : 'Expired';
                    statusClass = 'expired';
                } else {
                    timeText = formatRemaining(remaining);
                    statusClass = 'active';
                }
                
                tbody.appendChild(buildRow(licenseKey, activationDate, timeText, statusClass));
                continue;
            }
            
            const licenseData = validLicenseKeys.find(l => l.key === licenseKey);
            
            if (licenseData && licenseData.unit !== 'unlimited') {
                hasUsers = true;
                
                const activationDate = new Date(activationTime);
                const now = new Date();
                
                let expirationMs;
                if (licenseData.unit === 'minutes')     expirationMs = licenseData.duration * 60 * 1000;
                else if (licenseData.unit === 'hours')  expirationMs = licenseData.duration * 60 * 60 * 1000;
                else                                    expirationMs = licenseData.duration * 24 * 60 * 60 * 1000;
                
                const expirationDate = new Date(activationDate.getTime() + expirationMs);
                const remaining = expirationDate - now;
                
                let timeText = '';
                let statusClass = '';
                
                if (remaining <= 0) {
                    timeText = currentLang === 'tr' ? 'Süresi dolmuş' : 'Expired';
                    statusClass = 'expired';
                } else {
                    timeText = formatRemaining(remaining);
                    statusClass = 'active';
                }
                
                tbody.appendChild(buildRow(licenseKey, activationDate, timeText, statusClass));
            }
        }
    }
    
    if (!hasUsers) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: #9ca3af;">
                    ${currentLang === 'tr' ? 'Aktif kullanıcı yok' : 'No active users'}
                </td>
            </tr>
        `;
    }
}

// Kalan süreyi formatlı string olarak döndür
function formatRemaining(remaining) {
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    if (currentLang === 'tr') {
        if (days > 0)         return `${days} gün ${hours} saat ${minutes} dakika ${seconds} saniye`;
        else if (hours > 0)   return `${hours} saat ${minutes} dakika ${seconds} saniye`;
        else if (minutes > 0) return `${minutes} dakika ${seconds} saniye`;
        else                  return `${seconds} saniye`;
    } else {
        if (days > 0)         return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        else if (hours > 0)   return `${hours}h ${minutes}m ${seconds}s`;
        else if (minutes > 0) return `${minutes}m ${seconds}s`;
        else                  return `${seconds}s`;
    }
}

// Tablo satırı oluştur
function buildRow(licenseKey, activationDate, timeText, statusClass) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><code>${licenseKey}</code></td>
        <td>${activationDate.toLocaleString()}</td>
        <td class="${statusClass}">${timeText}</td>
        <td>
            <button class="revoke-btn" onclick="revokeLicense('${licenseKey}')">
                ${currentLang === 'tr' ? 'İptal Et' : 'Revoke'}
            </button>
        </td>
    `;
    return row;
}

// Lisansı iptal et
function revokeLicense(licenseKey) {
    const confirmText = currentLang === 'tr'
        ? `${licenseKey} lisansını iptal etmek istediğinize emin misiniz?`
        : `Are you sure you want to revoke license ${licenseKey}?`;
    
    if (confirm(confirmText)) {
        localStorage.removeItem(`license_${licenseKey}`);
        alert(currentLang === 'tr' ? 'Lisans iptal edildi!' : 'License revoked!');
        loadActiveUsers();
    }
}
