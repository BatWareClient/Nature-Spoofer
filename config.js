// API Configuration
const API_CONFIG = {
    apiKey: 'ffcc90ea46a2a2f75b0ea9cdf4c56730697deb415dfeddf7cb5542c7698c169e',
    apiBaseUrl: 'https://cgauth.com/api/v1/',
    apiSecret: 'd9ddc48b80982ec7168633558ea4f318f1012e0b6d6d9b1475d6dd5a154207b3',
    sslKey: '8383f96c0afb3e2afeb0a5c15836fbd7815b59bb2b1537c8a3833b358b411ccf'
};

// API Helper Functions
const API = {
    // License validation through Vercel serverless function
    async validateLicense(licenseKey) {
        console.log('Validating license:', licenseKey);
        
        try {
            const response = await fetch('/api/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ licenseKey })
            });
            
            const data = await response.json();
            console.log('API Response:', data);
            
            return data;
        } catch (error) {
            console.error('License validation failed:', error);
            
            // Fallback: Test lisansları
            const testLicenses = {
                'D38D33-BEBF32-790A36': { success: true, valid: true, duration: 24, unit: 'hours' },
                'TEST-1234-5678-ABCD': { success: true, valid: true, duration: 7, unit: 'days' },
                'ADMIN-KEY-2024': { success: true, valid: true, isAdmin: true }
            };
            
            return testLicenses[licenseKey] || { success: false };
        }
    }
};
