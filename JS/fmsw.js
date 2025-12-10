// 📁 ملف: fmsw.js (Firebase Messaging Service Worker)
// ====================================================
// 📍 يجب رفعه على استضافة HTTPS (مثل GitHub Pages)
// 🔗 ثم الإشارة إليه في كود بلوجر

importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging.js');

// 🔥 إعدادات Firebase (نفس إعدادات بلوجر)
firebase.initializeApp({
  apiKey: "AIzaSyDjtocK9vJsjCbHt8e-v7GielFSvTsRZlI",
  authDomain: "si1xyz.firebaseapp.com",
  projectId: "si1xyz",
  storageBucket: "si1xyz.firebasestorage.app",
  messagingSenderId: "1007794756447",
  appId: "1:1007794756447:web:735f1f3968bbeb2ed7b4ea",
  measurementId: "G-RNBFQ1SX9J"
});

const messaging = firebase.messaging();

// 📨 معالجة الإشعارات في الخلفية
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] 📩 استقبال إشعار:', payload);
  
  const notificationOptions = {
    body: payload.notification?.body || 'مقال جديد على مدونة سيو ويب',
    icon: payload.notification?.image || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEijy6aG0a5IBr39ytM5bhYWHEPOCvu5Yf44_Ny1ScyfPb2mObhO64LeWk3QHGbmV4uZc0l5VC5xRrQzAQfOEozsrDZTF2nGiuZSwx1gxhQQvfTKu4ulfFCH2tlhE5vAIZiXlh6IaNfxXgU9rdlC8KkF2MWgwkPS6PRMkoIwh2iHcQPSl0TSIf9X2x_w_oc/s150/siwanelogo.webp',
    badge: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEijy6aG0a5IBr39ytM5bhYWHEPOCvu5Yf44_Ny1ScyfPb2mObhO64LeWk3QHGbmV4uZc0l5VC5xRrQzAQfOEozsrDZTF2nGiuZSwx1gxhQQvfTKu4ulfFCH2tlhE5vAIZiXlh6IaNfxXgU9rdlC8KkF2MWgwkPS6PRMkoIwh2iHcQPSl0TSIf9X2x_w_oc/s150/siwanelogo.webp',
    dir: 'rtl',
    lang: 'ar',
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: '📖 قراءة المقال'
      }
    ],
    tag: 'blog-notification',
    renotify: true,
    requireInteraction: true
  };
  
  self.registration.showNotification(
    payload.notification?.title || 'إشعار من مدونة سيو ويب',
    notificationOptions
  );
});

// 👆 معالجة النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('🎯 تم النقر على الإشعار');
  
  event.notification.close();
  
  const رابط = event.notification.data?.post_url || 
                event.notification.data?.رابط || 
                'https://www.siwane.xyz';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === رابط && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(رابط);
        }
      })
  );
});
