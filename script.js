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
        
        const db = window.electronAPI.loadDatabase();
        const validKey = db.licenseKeys.find(k => k.key === licenseKey);
        
        if (!validKey) {
            message.textContent = window.messages.invalidKey;
            message.className = 'message error';
            return;
        }
        
        message.textContent = window.messages.loginSuccess;
        message.className = 'message success';
        
        setTimeout(() => {
            showMainScreen(licenseKey);
        }, 800);
    });
    
    // Çıkış yap
    document.getElementById('logoutBtn').addEventListener('click', function() {
        document.getElementById('mainScreen').classList.remove('active');
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('licenseKey').value = '';
        document.getElementById('loginMessage').textContent = '';
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
    
    // Pencere kontrolleri
    document.getElementById('minimizeBtn').addEventListener('click', () => {
        window.electronAPI.minimizeWindow();
    });
    
    document.getElementById('maximizeBtn').addEventListener('click', () => {
        window.electronAPI.maximizeWindow();
    });
    
    document.getElementById('closeBtn').addEventListener('click', () => {
        window.electronAPI.closeWindow();
    });
    
    // Karanlık mod
    document.getElementById('darkMode').addEventListener('change', function() {
        if (this.checked) {
            document.body.style.filter = 'invert(1) hue-rotate(180deg)';
        } else {
            document.body.style.filter = 'none';
        }
    });
});

// Ana ekranı göster
function showMainScreen(licenseKey) {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('mainScreen').classList.add('active');
    
    document.getElementById('displayName').textContent = 'User';
    document.getElementById('userInitial').textContent = 'U';
    
    const db = window.electronAPI.loadDatabase();
    document.getElementById('userCount').textContent = db.licenseKeys.length;
}
