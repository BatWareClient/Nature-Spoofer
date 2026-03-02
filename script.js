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
    
    // Tüm çevrilebilir elementleri güncelle
    document.querySelectorAll('[data-tr]').forEach(el => {
        if (el.tagName === 'INPUT') {
            el.placeholder = el.getAttribute(`data-placeholder-${lang}`);
        } else {
            el.textContent = el.getAttribute(`data-${lang}`);
        }
    });
    
    // Input placeholder'ları ayrıca güncelle
    document.querySelectorAll('input[data-placeholder-tr]').forEach(input => {
        input.placeholder = input.getAttribute(`data-placeholder-${lang}`);
    });
    
    // Dil butonlarını güncelle
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });
    
    // Ayarlar sekmesindeki radio butonları güncelle
    if (lang === 'tr') {
        document.getElementById('langTR').checked = true;
    } else {
        document.getElementById('langEN').checked = true;
    }
    
    // Mesajları çevir
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

// Sayfa yüklendiğinde
window.addEventListener('DOMContentLoaded', () => {
    // Başlangıçta Türkçe mesajları yükle
    updateMessages('tr');
    
    // Dil değiştirme butonları
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchLanguage(this.getAttribute('data-lang'));
        });
    });
    
    // Giriş formu
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const licenseKey = document.getElementById('licenseKey').value.trim();
        const message = document.getElementById('loginMessage');
        
        if (!licenseKey) {
            message.textContent = window.messages.fillFields;
            message.className = 'message error';
            return;
        }
        
        // Lisans anahtarını kontrol et
        const licenseData = validLicenseKeys.find(l => l.key === licenseKey);
        
        if (!licenseData) {
            message.textContent = window.messages.invalidKey;
            message.className = 'message error';
            return;
        }
        
        // Lisans aktivasyon zamanını kontrol et veya oluştur
        let activationTime = localStorage.getItem(`license_${licenseKey}`);
        
        // Admin kontrolü
        if (licenseData.unit === 'unlimited') {
            isAdmin = true;
            
            // Admin için süre kontrolü yok
            currentLicenseInfo = {
                key: licenseKey,
                duration: 0,
                unit: 'unlimited',
                isAdmin: true
            };
            
            message.textContent = window.messages.loginSuccess;
            message.className = 'message success';
            
            setTimeout(() => {
                document.getElementById('loginScreen').classList.remove('active');
                document.getElementById('mainScreen').classList.add('active');
                updateTimeRemaining();
                showAdminPanel();
                
                // Admin ismini güncelle
                document.getElementById('displayName').textContent = 'Admin';
                document.getElementById('userInitial').textContent = 'A';
            }, 800);
            return;
        }
        
        if (!activationTime) {
            // İlk kez kullanılıyor, aktivasyon zamanını kaydet
            activationTime = new Date().toISOString();
            localStorage.setItem(`license_${licenseKey}`, activationTime);
        }
        
        // Süre kontrolü
        const activationDate = new Date(activationTime);
        const now = new Date();
        const diffMs = now - activationDate;
        
        let expirationMs;
        if (licenseData.unit === 'minutes') {
            expirationMs = licenseData.duration * 60 * 1000;
        } else if (licenseData.unit === 'hours') {
            expirationMs = licenseData.duration * 60 * 60 * 1000;
        } else {
            expirationMs = licenseData.duration * 24 * 60 * 60 * 1000;
        }
        
        if (diffMs >= expirationMs) {
            message.textContent = currentLang === 'tr' ? 'Lisans süresi dolmuş!' : 'License expired!';
            message.className = 'message error';
            return;
        }
        
        // Lisans bilgilerini sakla
        currentLicenseInfo = {
            key: licenseKey,
            activationTime: activationDate,
            duration: licenseData.duration,
            unit: licenseData.unit,
            expirationTime: new Date(activationDate.getTime() + expirationMs)
        };
        
        message.textContent = window.messages.loginSuccess;
        message.className = 'message success';
        
        // İndirme ekranına geç
        setTimeout(() => {
            document.getElementById('loginScreen').classList.remove('active');
            document.getElementById('mainScreen').classList.add('active');
            updateTimeRemaining();
            startTimeUpdate();
        }, 800);
    });
    
    // Çıkış yap
    document.getElementById('logoutBtn').addEventListener('click', function() {
        document.getElementById('mainScreen').classList.remove('active');
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('licenseKey').value = '';
        document.getElementById('loginMessage').textContent = '';
        
        // Zaman güncellemesini durdur
        if (timeUpdateInterval) {
            clearInterval(timeUpdateInterval);
            timeUpdateInterval = null;
        }
        currentLicenseInfo = null;
        isAdmin = false;
        
        // Admin panelini gizle
        document.querySelector('.admin-only').style.display = 'none';
    });
    
    // Menü navigasyonu
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
    
    // İndirme butonları
    document.getElementById('downloadWindows').addEventListener('click', function() {
        alert('Windows 10 sürümü indirilecek! (Dosya yolu eklenecek)');
        // window.location.href = 'downloads/NatureSoftware-Windows10.exe';
    });
    
    // Karanlık mod
    document.getElementById('darkMode').addEventListener('change', function() {
        if (this.checked) {
            document.body.style.filter = 'invert(1) hue-rotate(180deg)';
        } else {
            document.body.style.filter = 'none';
        }
    });
    
    // Dil ayarları (Ayarlar sekmesinden)
    document.getElementById('langTR').addEventListener('change', function() {
        if (this.checked) {
            switchLanguage('tr');
        }
    });
    
    document.getElementById('langEN').addEventListener('change', function() {
        if (this.checked) {
            switchLanguage('en');
        }
    });
    
    // Lisans sürelerini sıfırla
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
    
    // Admin kontrolü
    if (currentLicenseInfo.isAdmin) {
        if (currentLang === 'tr') {
            document.getElementById('timeRemaining').innerHTML = '<span style="color: #10b981;">∞ Sınırsız</span>';
        } else {
            document.getElementById('timeRemaining').innerHTML = '<span style="color: #10b981;">∞ Unlimited</span>';
        }
        return;
    }
    
    const now = new Date();
    const remaining = currentLicenseInfo.expirationTime - now;
    
    if (remaining <= 0) {
        // Süre dolmuş
        if (currentLang === 'tr') {
            document.getElementById('timeRemaining').innerHTML = '<span style="color: #ef4444;">Lisans süresi doldu!</span>';
        } else {
            document.getElementById('timeRemaining').innerHTML = '<span style="color: #ef4444;">License expired!</span>';
        }
        
        // Otomatik çıkış yap
        setTimeout(() => {
            document.getElementById('logoutBtn').click();
            alert(currentLang === 'tr' ? 'Lisans süreniz doldu!' : 'Your license has expired!');
        }, 2000);
        return;
    }
    
    // Kalan süreyi hesapla
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    let timeText = '';
    if (currentLang === 'tr') {
        if (days > 0) {
            timeText = `${days} gün ${hours} saat ${minutes} dakika`;
        } else if (hours > 0) {
            timeText = `${hours} saat ${minutes} dakika ${seconds} saniye`;
        } else {
            timeText = `${minutes} dakika ${seconds} saniye`;
        }
    } else {
        if (days > 0) {
            timeText = `${days} days ${hours} hours ${minutes} minutes`;
        } else if (hours > 0) {
            timeText = `${hours} hours ${minutes} minutes ${seconds} seconds`;
        } else {
            timeText = `${minutes} minutes ${seconds} seconds`;
        }
    }
    
    document.getElementById('timeRemaining').textContent = timeText;
}

// Zaman güncellemesini başlat
function startTimeUpdate() {
    updateTimeRemaining();
    if (!isAdmin) {
        timeUpdateInterval = setInterval(updateTimeRemaining, 1000);
    }
}

// Admin panelini göster
function showAdminPanel() {
    document.querySelector('.admin-only').style.display = 'flex';
    loadActiveUsers();
}

// Aktif kullanıcıları yükle
function loadActiveUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    let hasUsers = false;
    
    // LocalStorage'daki tüm lisans kayıtlarını kontrol et
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('license_')) {
            const licenseKey = key.replace('license_', '');
            const activationTime = localStorage.getItem(key);
            
            // Lisans bilgilerini bul
            const licenseData = validLicenseKeys.find(l => l.key === licenseKey);
            
            if (licenseData && licenseData.unit !== 'unlimited') {
                hasUsers = true;
                
                const activationDate = new Date(activationTime);
                const now = new Date();
                
                let expirationMs;
                if (licenseData.unit === 'minutes') {
                    expirationMs = licenseData.duration * 60 * 1000;
                } else if (licenseData.unit === 'hours') {
                    expirationMs = licenseData.duration * 60 * 60 * 1000;
                } else {
                    expirationMs = licenseData.duration * 24 * 60 * 60 * 1000;
                }
                
                const expirationDate = new Date(activationDate.getTime() + expirationMs);
                const remaining = expirationDate - now;
                
                let timeText = '';
                let statusClass = '';
                
                if (remaining <= 0) {
                    timeText = currentLang === 'tr' ? 'Süresi dolmuş' : 'Expired';
                    statusClass = 'expired';
                } else {
                    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                    
                    if (currentLang === 'tr') {
                        if (days > 0) {
                            timeText = `${days} gün ${hours} saat`;
                        } else if (hours > 0) {
                            timeText = `${hours} saat ${minutes} dakika`;
                        } else {
                            timeText = `${minutes} dakika`;
                        }
                    } else {
                        if (days > 0) {
                            timeText = `${days} days ${hours} hours`;
                        } else if (hours > 0) {
                            timeText = `${hours} hours ${minutes} minutes`;
                        } else {
                            timeText = `${minutes} minutes`;
                        }
                    }
                    statusClass = 'active';
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><code>${licenseKey}</code></td>
                    <td>${activationDate.toLocaleString()}</td>
                    <td class="${statusClass}">${timeText}</td>
                    <td>
                        <button class="revoke-btn" onclick="revokeLicense('${licenseKey}')">
                            <span data-tr="İptal Et" data-en="Revoke">${currentLang === 'tr' ? 'İptal Et' : 'Revoke'}</span>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            }
        }
    }
    
    if (!hasUsers) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: #9ca3af;">
                    <span data-tr="Aktif kullanıcı yok" data-en="No active users">${currentLang === 'tr' ? 'Aktif kullanıcı yok' : 'No active users'}</span>
                </td>
            </tr>
        `;
    }
}

// Lisansı iptal et
function revokeLicense(licenseKey) {
    const confirmText = currentLang === 'tr' 
        ? `${licenseKey} lisansını iptal etmek istediğinize emin misiniz?`
        : `Are you sure you want to revoke license ${licenseKey}?`;
    
    if (confirm(confirmText)) {
        localStorage.removeItem(`license_${licenseKey}`);
        
        const successText = currentLang === 'tr' 
            ? 'Lisans iptal edildi!'
            : 'License revoked!';
        
        alert(successText);
        loadActiveUsers();
    }
}
