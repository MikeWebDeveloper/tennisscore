#!/usr/bin/env node

/**
 * Clear Service Worker Cache Script
 * 
 * This script clears all Service Worker caches and forces a fresh registration
 * to fix offline mode issues in Vercel production deployments.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Clearing Service Worker caches...');

// Function to clear caches in browser context
const clearCacheScript = `
// Clear all caches
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) {
      if (name.includes('tennisscore')) {
        console.log('🗑️ Deleting cache:', name);
        caches.delete(name);
      }
    }
  });
}

// Unregister all service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('🚫 Unregistering service worker:', registration.scope);
      registration.unregister();
    }
  });
}

// Force reload to clear everything
setTimeout(() => {
  console.log('🔄 Reloading page...');
  window.location.reload(true);
}, 1000);
`;

// Create a temporary HTML file that can be opened to clear caches
const tempHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Clear Service Worker Cache</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        button { 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 15px 30px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 16px; 
            margin: 10px 5px; 
        }
        button:hover { background: #0056b3; }
        .log { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 20px 0; 
            font-family: monospace; 
            white-space: pre-wrap; 
            max-height: 300px; 
            overflow-y: auto; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧹 Service Worker Cache Clearer</h1>
        <p>This tool will clear all TennisScore Service Worker caches and force a fresh registration.</p>
        
        <button onclick="clearAllCaches()">Clear All Caches</button>
        <button onclick="unregisterServiceWorkers()">Unregister Service Workers</button>
        <button onclick="reloadPage()">Reload Page</button>
        
        <div id="log" class="log">Ready to clear caches...</div>
    </div>

    <script>
        function log(message) {
            const logDiv = document.getElementById('log');
            logDiv.textContent += new Date().toLocaleTimeString() + ': ' + message + '\\n';
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        async function clearAllCaches() {
            log('🗑️ Clearing all caches...');
            
            if ('caches' in window) {
                try {
                    const cacheNames = await caches.keys();
                    log('Found ' + cacheNames.length + ' caches');
                    
                    for (let name of cacheNames) {
                        if (name.includes('tennisscore')) {
                            await caches.delete(name);
                            log('✅ Deleted cache: ' + name);
                        } else {
                            log('⏭️ Skipped cache: ' + name);
                        }
                    }
                    
                    log('🎉 Cache clearing complete!');
                } catch (error) {
                    log('❌ Error clearing caches: ' + error.message);
                }
            } else {
                log('❌ Caches API not supported');
            }
        }

        async function unregisterServiceWorkers() {
            log('🚫 Unregistering service workers...');
            
            if ('serviceWorker' in navigator) {
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    log('Found ' + registrations.length + ' service worker registrations');
                    
                    for (let registration of registrations) {
                        await registration.unregister();
                        log('✅ Unregistered service worker: ' + registration.scope);
                    }
                    
                    log('🎉 Service worker unregistration complete!');
                } catch (error) {
                    log('❌ Error unregistering service workers: ' + error.message);
                }
            } else {
                log('❌ Service Workers not supported');
            }
        }

        function reloadPage() {
            log('🔄 Reloading page...');
            window.location.reload(true);
        }

        // Auto-clear on page load
        window.addEventListener('load', () => {
            log('📱 Page loaded - ready to clear caches');
        });
    </script>
</body>
</html>
`;

// Write the temporary HTML file
const tempPath = path.join(__dirname, '..', 'public', 'clear-cache.html');
fs.writeFileSync(tempPath, tempHtml);

console.log('✅ Created cache clearing tool at: public/clear-cache.html');
console.log('');
console.log('📋 Instructions:');
console.log('1. Deploy this to Vercel');
console.log('2. Visit: https://test.tenis.click/clear-cache.html');
console.log('3. Click "Clear All Caches" and "Unregister Service Workers"');
console.log('4. Click "Reload Page"');
console.log('5. The Service Worker should now work properly');
console.log('');
console.log('🔧 Alternative: Open browser dev tools and run:');
console.log('navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))');
console.log('caches.keys().then(names => names.forEach(name => caches.delete(name)))'); 