// API Configuration
const API_CONFIG = {
    apiKey: 'ffcc90ea46a2a2f75b0ea9cdf4c56730697deb415dfeddf7cb5542c7698c169e',
    apiBaseUrl: 'https://cgauth.com/api/v1/',
    apiSecret: 'd9ddc48b80982ec7168633558ea4f318f1012e0b6d6d9b1475d6dd5a154207b3',
    sslKey: '8383f96c0afb3e2afeb0a5c15836fbd7815b59bb2b1537c8a3833b358b411ccf'
};

// API Helper Functions
const API = {
    // Generic API call function
    async call(endpoint, method = 'GET', data = null) {
        const headers = {
            'Content-Type': 'application/json',
            'X-API-Key': API_CONFIG.apiKey,
            'X-API-Secret': API_CONFIG.apiSecret
        };

        const options = {
            method: method,
            headers: headers
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_CONFIG.apiBaseUrl}${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Call Failed:', error);
            throw error;
        }
    },

    // License validation
    async validateLicense(licenseKey) {
        return await this.call('/validate-license', 'POST', { 
            license: licenseKey 
        });
    },

    // User authentication
    async authenticate(credentials) {
        return await this.call('/auth', 'POST', credentials);
    },

    // Get user data
    async getUserData(userId) {
        return await this.call(`/user/${userId}`, 'GET');
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, API };
}
