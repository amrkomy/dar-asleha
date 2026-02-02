// service-worker.js

const CACHE_NAME = 'complaints-dashboard-v2';
const STATIC_CACHE_NAME = 'complaints-static-v2';
const urlsToCache = [
  '/',
  '/index.html'
];

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker: جاري التثبيت');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: تم تثبيت الكاش للعناصر الثابتة');
        return cache.addAll(urlsToCache);
      })
  );
  
  // تأكد من تفعيل Service Worker فوراً
  self.skipWaiting();
});

// ✅✅✅ **هذا هو التصحيح الرئيسي - لا تخزن طلبات API أبداً**
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // ❌ **لا تخزن أي طلبات لـ Supabase أو API أو OneSignal**
  if (
    url.href.includes('supabase.co') || // Supabase API
    url.href.includes('xqccuvhtrxhsrzqgktdj.supabase.co') || // Supabase URL
    url.href.includes('/api/') || // أي API
    url.href.includes('onesignal.com') || // OneSignal
    url.href.includes('.netlify/functions') // Netlify Functions
  ) {
    // ✅ استخدم fetch مباشرة بدون أي cache في Service Worker
    event.respondWith(
      fetch(event.request.clone())
        .then(response => {
          // ⚠️ مهم: لا تخزن استجابة API في cache
          return response;
        })
        .catch(error => {
          console.error('❌ فشل fetch للـ API:', error);
          return new Response(JSON.stringify({ 
            error: 'Network error',
            offline: true 
          }), {
            status: 408,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // ✅ فقط للملفات الثابتة (HTML, CSS, JS, الصور)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // استراتيجية "Cache First, Network Fallback" للملفات الثابتة فقط
        if (cachedResponse) {
          // تأكد من صلاحية الكاش
          const cacheAge = Date.now() - new Date(cachedResponse.headers.get('date')).getTime();
          const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 ساعة
          
          if (cacheAge < MAX_CACHE_AGE) {
            console.log('📦 استخدام الكاش للملف:', event.request.url);
            return cachedResponse;
          }
        }
        
        return fetch(event.request)
          .then(networkResponse => {
            // ✅ فقط للملفات الثابتة: تخزين في الكاش
            if (event.request.method === 'GET' && 
                networkResponse.status === 200 &&
                networkResponse.type === 'basic' &&
                !event.request.url.includes('chrome-extension') &&
                !event.request.url.includes('sockjs-node')) {
              
              const responseToCache = networkResponse.clone();
              caches.open(STATIC_CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                  console.log('💾 تم تخزين في الكاش:', event.request.url);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // عرض صفحة بديلة عند عدم الاتصال بالإنترنت
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // للملفات الأخرى، استخدم الكاش الموجود
            return cachedResponse || new Response('Offline', { status: 503 });
          });
      })
  );
});

// تنظيف الكاش القديم
self.addEventListener('activate', (event) => {
  console.log('♻️ Service Worker: جاري التنشيط');
  
  const cacheWhitelist = [CACHE_NAME, STATIC_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('🗑️ حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // تأكد من أن Service Worker يتحكم في جميع الصفحات فوراً
      return self.clients.claim();
    })
  );
});

// استقبال الرسائل من الصفحة الرئيسية
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Background Sync (اختياري)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-complaints') {
    console.log('🔄 Background Sync للمزامنة');
    event.waitUntil(syncComplaints());
  }
});

async function syncComplaints() {
  // يمكنك إضافة منطق للمزامنة في الخلفية هنا
  console.log('مزامنة البيانات في الخلفية');
}
