export const config = {
  runtime: 'edge',
};

const API_URL = "https://cgauth.com/api/v1/";
const YOUR_APP_NAME = "NatureSoftware";
const API_KEY = "ffcc90ea46a2a2f75b0ea9cdf4c56730697deb415dfeddf7cb5542c7698c169e";
const API_SECRET = "d9ddc48b80982ec7168633558ea4f318f1012e0b6d6d9b1475d6dd5a154207b3";

async function generateRequestId() {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const combined = timestamp + randomHex;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
}

async function encryptPayload(params) {
    const json = JSON.stringify(params);
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(API_SECRET);
    const keyHash = await crypto.subtle.digest('SHA-256', keyMaterial);
    
    const key = await crypto.subtle.importKey('raw', keyHash, { name: 'AES-CBC' }, false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const jsonData = encoder.encode(json);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: iv }, key, jsonData);
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
}

async function decryptPayload(encrypted) {
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const iv = combined.slice(0, 16);
    const ciphertext = combined.slice(16);
    
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(API_SECRET);
    const keyHash = await crypto.subtle.digest('SHA-256', keyMaterial);
    
    const key = await crypto.subtle.importKey('raw', keyHash, { name: 'AES-CBC' }, false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: iv }, key, ciphertext);
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

async function verifyHMAC(data, receivedHmac, requestId) {
    const combined = data + requestId;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(API_SECRET);
    
    const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const messageData = encoder.encode(combined);
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    
    const hashArray = Array.from(new Uint8Array(signature));
    const computed = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return computed.toLowerCase() === receivedHmac.toLowerCase();
}

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
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }
    
    try {
        const body = await req.json();
        const { licenseKey, hwid } = body;
        
        if (!licenseKey || !hwid) {
            return new Response(JSON.stringify({ success: false, error: 'License key and HWID required' }), {
                status: 400,
                headers
            });
        }
        
        const requestId = await generateRequestId();
        
        const params = {
            api_secret: API_SECRET,
            type: 'license',
            key: licenseKey,
            hwid: hwid,
            request_id: requestId,
            timestamp: Math.floor(Date.now() / 1000).toString()
        };
        
        const encrypted = await encryptPayload(params);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                api_key: API_KEY,
                payload: encrypted
            })
        });
        
        const jsonResponse = await response.json();
        
        if (!jsonResponse.data || !jsonResponse.hmac || !jsonResponse.timestamp) {
            throw new Error('Invalid response structure');
        }
        
        const encData = jsonResponse.data;
        const receivedHmac = jsonResponse.hmac;
        const timestamp = jsonResponse.timestamp;
        
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestamp) > 120) {
            throw new Error('Response expired');
        }
        
        if (!await verifyHMAC(encData, receivedHmac, requestId)) {
            throw new Error('HMAC verification failed');
        }
        
        const decrypted = await decryptPayload(encData);
        const result = JSON.parse(decrypted);
        
        if (result.request_id && result.request_id !== requestId) {
            throw new Error('Request ID mismatch');
        }
        
        return new Response(JSON.stringify(result), { status: 200, headers });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers
        });
    }
}
