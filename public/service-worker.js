/**
 * NeuroKind Service Worker
 * Provides offline support, background sync, and push notifications
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `neurokind-static-${CACHE_VERSION}`;
const API_CACHE = `neurokind-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `neurokind-images-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/community',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Install failed:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('neurokind-') && 
                     !name.includes(CACHE_VERSION);
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except API)
  if (url.origin !== self.location.origin && 
      !url.href.includes('/api/')) {
    return;
  }
  
  // API requests - stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Image requests - cache first
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // Static assets - cache first
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with stale-while-revalidate
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);
  
  // Return cached version immediately if available
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {
      // Network failed - return cached or offline response
      return cached || createOfflineResponse();
    });
  
  return cached || fetchPromise;
}

// Handle image requests - cache first
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return placeholder for failed images
    return createPlaceholderResponse();
  }
}

// Handle static assets - cache first
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Update cache in background
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response);
        }
      })
      .catch(() => {});
    
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return cache.match('/offline');
    }
    throw error;
  }
}

// Create offline response
function createOfflineResponse() {
  return new Response(
    JSON.stringify({
      error: 'You are offline',
      message: 'This feature requires an internet connection',
      offline: true,
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    }
  );
}

// Create placeholder image response
function createPlaceholderResponse() {
  // Return a 1x1 transparent pixel
  const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  return fetch(transparentPixel);
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  } else if (event.tag === 'sync-daily-wins') {
    event.waitUntil(syncDailyWins());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Sync queued posts
async function syncPosts() {
  try {
    const db = await openDB();
    const posts = await db.getAll('queuedPosts');
    
    for (const post of posts) {
      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post.data),
        });
        
        if (response.ok) {
          await db.delete('queuedPosts', post.id);
          // Notify user of success
          showNotification('Post Published', 'Your post has been published');
        }
      } catch (error) {
        console.error('[SW] Failed to sync post:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync posts error:', error);
  }
}

// Sync daily wins
async function syncDailyWins() {
  // Similar implementation for daily wins
}

// Sync messages
async function syncMessages() {
  // Similar implementation for messages
}

// Push notification support
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const data = event.data?.json() || {};
  const title = data.title || 'NeuroKind';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    data: data.data || {},
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();
  
  const { notification } = event;
  const url = notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Focus existing window if open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Helper: Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NeuroKindOfflineDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores for offline queue
      if (!db.objectStoreNames.contains('queuedPosts')) {
        db.createObjectStore('queuedPosts', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('queuedDailyWins')) {
        db.createObjectStore('queuedDailyWins', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('queuedMessages')) {
        db.createObjectStore('queuedMessages', { keyPath: 'id' });
      }
    };
  });
}

// Helper: Show notification
function showNotification(title, body) {
  if (self.Notification?.permission === 'granted') {
    return self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
    });
  }
}

console.log('[SW] Service worker loaded');
