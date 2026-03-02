export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
    
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers });
    }
    
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
            status: 405, 
            headers 
        });
    }
    
    const API_KEY = 'ffcc90ea46a2a2f75b0ea9cdf4c56730697deb415dfeddf7cb5542c7698c169e';
    const API_SECRET = 'd9ddc48b80982ec7168633558ea4f318f1012e0b6d6d9b1475d6dd5a154207b3';
    const API_BASE_URL = 'https://cgauth.com/api/v1';
    
    const body = await req.json();
    const { licenseKey } = body;
    
    if (!licenseKey) {
        return new Response(JSON.stringify({ success: false, error: 'License key required' }), {
            status: 400,
            headers
        });
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/licenses/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'X-API-Secret': API_SECRET
            },
            body: JSON.stringify({ license_key: licenseKey })
        });
        
        const data = await response.json();
        
        if (data.valid) {
            return new Response(JSON.stringify({
                success: true,
                valid: true,
                duration: data.expires_in || 24,
                unit: 'hours',
                isAdmin: data.is_admin || false
            }), { status: 200, headers });
        }
        
        return new Response(JSON.stringify({ success: false, error: 'Invalid license' }), {
            status: 200,
            headers
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers
        });
    }
}
