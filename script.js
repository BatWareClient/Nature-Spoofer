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
    
    // Mesaj alanını temizle
    document.getElementById('loginMessage').textContent = '';
    document.getElementById('loginMessage').className = 'message';
    
    // Sayfa kapanırken lisans kullanımını serbest bırak
    window.addEventListener('beforeunload', () => {
        if (currentLicenseInfo && !currentLicenseInfo.isAdmin) {
            sessionStorage.removeItem(`license_inuse_${currentLicenseInfo.key}`);
        }
    });
    
    // Dil değiştirme butonları
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchLanguage(this.getAttribute('data-lang'));
        });
    });
    
    // Giriş formu - cgauth API entegrasyonu
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const licenseKey = document.getElementById('licenseKey').value.trim();
        const message = document.getElementById('loginMessage');
        
        if (!licenseKey) {
            message.textContent = window.messages.fillFields;
            message.className = 'message error';
            return;
        }
        
        // API ile lisans doğrulama
        message.textContent = currentLang === 'tr' ? 'Doğrulanıyor...' : 'Validating...';
        message.className = 'message';
        
        console.log('Validating license:', licenseKey);
        
        try {
            // Get browser fingerprint (HWID)
            const hwid = await CGAuth.getHWID();
            console.log('HWID:', hwid);
            
            // Authenticate via Vercel serverless function
            const response = await fetch('/api/auth-license', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ licenseKey, hwid })
            });
            
            const result = await response.json();
            
            console.log('Validation response:', result);
            
            if (result.success) {
                const data = result.data;
                
                // Debug: cgauth response'u tamamen göster
                console.log('=== CGAUTH FULL RESPONSE ===');
                console.log('Full data object:', JSON.stringify(data, null, 2));
                console.log('expiry_date:', data.expiry_date);
                console.log('expires_at:', data.expires_at);
                console.log('duration:', data.duration);
                console.log('created_at:', data.created_at);
                console.log('activated_at:', data.activated_at);
                console.log('===========================');
                
                // expiry_date'den kalan süreyi hesapla
                let expirationTime;
                let daysRemaining = 0;
                
                // Önce duration varsa onu kullan (saniye cinsinden süre)
                if (data.duration && !isNaN(data.duration) && data.duration > 0) {
                    console.log('Using duration field:', data.duration, 'seconds');
                    
                    // Aktivasyon zamanını bul
                    const activationTimestamp = data.activated_at || data.created_at || Math.floor(Date.now() / 1000);
                    const activationTime = new Date(activationTimestamp * 1000);
                    
                    // Bitiş zamanını hesapla: aktivasyon + duration
                    expirationTime = new Date(activationTime.getTime() + (data.duration * 1000));
                    
                    console.log('Activation time:', activationTime.toISOString());
                    console.log('Expiration time:', expirationTime.toISOString());
                    
                    const now = new Date();
                    const remainingMs = expirationTime - now;
                    daysRemaining = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24)));
                    
                    console.log('Remaining ms:', remainingMs);
                    console.log('Days remaining:', daysRemaining);
                }
                // Yoksa expiry_date kullan
                else {
                    const expiryTimestamp = data.expiry_date || data.expires_at || data.expiration_date;
                    
                    if (expiryTimestamp) {
                        const timestamp = typeof expiryTimestamp === 'string' ? parseInt(expiryTimestamp) : expiryTimestamp;
                        
                        console.log('Using expiry timestamp:', timestamp);
                        
                        if (!isNaN(timestamp) && timestamp > 0) {
                            // Timestamp çok küçükse (< 10000000000) saniye, büyükse milisaniye
                            const multiplier = timestamp < 10000000000 ? 1000 : 1;
                            expirationTime = new Date(timestamp * multiplier);
                            
                            console.log('Expiration date:', expirationTime.toISOString());
                            
                            if (!isNaN(expirationTime.getTime())) {
                                const now = new Date();
                                const remainingMs = expirationTime - now;
                                daysRemaining = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24)));
                                
                                console.log('Remaining ms:', remainingMs);
                                console.log('Days remaining:', daysRemaining);
                            } else {
                                console.error('Invalid date created');
                                expirationTime = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                                daysRemaining = 365;
                            }
                        } else {
                            console.error('Invalid timestamp');
                            expirationTime = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                            daysRemaining = 365;
                        }
                    } else {
                        console.warn('No expiry field found - using 365 days default');
                        expirationTime = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                        daysRemaining = 365;
                    }
                }
                
                // Lisans geçerli
                currentLicenseInfo = {
                    key: licenseKey,
                    activationTime: new Date(),
                    daysRemaining: daysRemaining,
                    expirationTime: expirationTime,
                    isAdmin: data.is_admin || false,
                    appName: data.app_name,
                    status: data.status
                };
                
                console.log('Final currentLicenseInfo:', currentLicenseInfo);
                
                if (currentLicenseInfo.isAdmin) {
                    isAdmin = true;
                }
                
                // cgauth lisansını localStorage'a kaydet (hem admin hem user için - tracking için gerekli)
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
                    // Her durumda time update başlat (admin için sadece display, user için countdown)
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
    
    // Çıkış yap
    document.getElementById('logoutBtn').addEventListener('click', function() {
        // Lisans kullanımını serbest bırak (sessionStorage temizliği - eski sistem için)
        if (currentLicenseInfo && !currentLicenseInfo.isAdmin) {
            sessionStorage.removeItem(`license_inuse_${currentLicenseInfo.key}`);
        }
        
        // NOT: localStorage'dan SİLMİYORUZ - sadece admin "İptal Et" butonu ile silinmeli
        // Aksi halde her çıkışta lisans iptal edilmiş gibi görünür
        
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
            document.getElementById('timeRemaining').innerHTML = '<span style="color: #6ee7b7;">∞ Sınırsız</span>';
        } else {
            document.getElementById('timeRemaining').innerHTML = '<span style="color: #6ee7b7;">∞ Unlimited</span>';
        }
        return;
    }
    
    // expirationTime geçerli mi kontrol et
    if (!currentLicenseInfo.expirationTime || isNaN(currentLicenseInfo.expirationTime.getTime())) {
        document.getElementById('timeRemaining').textContent = currentLang === 'tr' ? 'Hesaplanıyor...' : 'Calculating...';
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
        
        // Otomatik çıkış yap (devre dışı - debug için)
        // setTimeout(() => {
        //     document.getElementById('logoutBtn').click();
        //     alert(currentLang === 'tr' ? 'Lisans süreniz doldu!' : 'Your license has expired!');
        // }, 2000);
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
            timeText = `${days} gün ${hours} saat`;
        } else if (hours > 0) {
            timeText = `${hours} saat ${minutes} dakika`;
        } else if (minutes > 0) {
            timeText = `${minutes} dakika ${seconds} saniye`;
        } else {
            timeText = `${seconds} saniye`;
        }
    } else {
        if (days > 0) {
            timeText = `${days} days ${hours} hours`;
        } else if (hours > 0) {
            timeText = `${hours} hours ${minutes} minutes`;
        } else if (minutes > 0) {
            timeText = `${minutes} minutes ${seconds} seconds`;
        } else {
            timeText = `${seconds} seconds`;
        }
    }
    
    document.getElementById('timeRemaining').textContent = timeText;
}

// Zaman güncellemesini başlat
function startTimeUpdate() {
    updateTimeRemaining();
    
    // Her 1 saniyede kalan süreyi güncelle (admin için "∞ Sınırsız", user için countdown)
    timeUpdateInterval = setInterval(updateTimeRemaining, 1000);
    
    // Sadece normal kullanıcılar için lisans iptal kontrolü yap
    if (!isAdmin && currentLicenseInfo && !currentLicenseInfo.isAdmin) {
        setInterval(() => {
            const activationTime = localStorage.getItem(`license_${currentLicenseInfo.key}`);
            
            // Lisans iptal edilmiş mi kontrol et (sadece admin tarafından manuel iptal için)
            if (!activationTime) {
                alert(currentLang === 'tr' ? 'Lisansınız iptal edildi!' : 'Your license has been revoked!');
                document.getElementById('logoutBtn').click();
            }
        }, 30000); // 30 saniye
    }
}

// Admin panelini göster
function showAdminPanel() {
    document.querySelector('.admin-only').style.display = 'flex';
    loadActiveUsers();
    
    // Her 1 saniyede bir tabloyu güncelle (saniye göstermek için)
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
    
    // LocalStorage'daki tüm lisans kayıtlarını kontrol et
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('license_')) {
            const licenseKey = key.replace('license_', '');
            const activationTime = localStorage.getItem(key);
            
            // cgauth lisansları için - süre bilgisi currentLicenseInfo'dan gelir
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
                    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                    
                    if (currentLang === 'tr') {
                        if (days > 0) {
                            timeText = `${days} gün ${hours} saat ${minutes} dakika ${seconds} saniye`;
                        } else if (hours > 0) {
                            timeText = `${hours} saat ${minutes} dakika ${seconds} saniye`;
                        } else if (minutes > 0) {
                            timeText = `${minutes} dakika ${seconds} saniye`;
                        } else {
                            timeText = `${seconds} saniye`;
                        }
                    } else {
                        if (days > 0) {
                            timeText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                        } else if (hours > 0) {
                            timeText = `${hours}h ${minutes}m ${seconds}s`;
                        } else if (minutes > 0) {
                            timeText = `${minutes}m ${seconds}s`;
                        } else {
                            timeText = `${seconds}s`;
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
                continue;
            }
            
            // Eski sistem lisansları için (validLicenseKeys array)
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
                    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
                    
                    if (currentLang === 'tr') {
                        if (days > 0) {
                            timeText = `${days} gün ${hours} saat ${minutes} dakika ${seconds} saniye`;
                        } else if (hours > 0) {
                            timeText = `${hours} saat ${minutes} dakika ${seconds} saniye`;
                        } else if (minutes > 0) {
                            timeText = `${minutes} dakika ${seconds} saniye`;
                        } else {
                            timeText = `${seconds} saniye`;
                        }
                    } else {
                        if (days > 0) {
                            timeText = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                        } else if (hours > 0) {
                            timeText = `${hours}h ${minutes}m ${seconds}s`;
                        } else if (minutes > 0) {
                            timeText = `${minutes}m ${seconds}s`;
                        } else {
                            timeText = `${seconds}s`;
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
