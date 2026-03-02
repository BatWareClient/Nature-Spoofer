const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Güvenli API'leri renderer process'e expose et
contextBridge.exposeInMainWorld('electronAPI', {
    // IPC
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close'),
    
    // File System
    loadDatabase: () => {
        const dbPath = path.join(__dirname, 'users.json');
        if (!fs.existsSync(dbPath)) {
            // Varsayılan license key'ler
            const defaultDb = {
                licenseKeys: [
                    { key: 'DEMO-1234-5678-ABCD', createdAt: new Date().toISOString() },
                    { key: 'TEST-KEY-2024-XXXX', createdAt: new Date().toISOString() }
                ]
            };
            fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
        }
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    },
    
    saveDatabase: (db) => {
        const dbPath = path.join(__dirname, 'users.json');
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    },
    
    // Crypto
    hashPassword: (password) => {
        return crypto.createHash('sha256').update(password).digest('hex');
    }
});
