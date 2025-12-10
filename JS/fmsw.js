// 📁 ملف: fmsw.js (Firebase Messaging Service Worker)
// ====================================================
// 📍 يجب رفعه على استضافة HTTPS (مثل GitHub Pages)
// 🔗 ثم الإشارة إليه في كود بلوجر

// استيراد مكتبات Firebase
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging.js');

// 🔥 إعدادات Firebase (استخدم نفس إعدادات بلوجر)
firebase.initializeApp({
  apiKey: "AIzaSyDjtocK9vJsjCbHt8e-v7GielFSvTsRZlI",
  authDomain: "si1xyz.firebaseapp.com",
  projectId: "si1xyz",
  storageBucket: "si1xyz.firebasestorage.app",
  messagingSenderId: "1007794756447",
  appId: "1:1007794756447:web:735f1f3968bbeb2ed7b4ea",
  measurementId: "G-RNBFQ1SX9J"
});

// الحصول على كائن المراسلة
const messaging = firebase.messaging();

// 📨 معالجة الرسائل في الخلفية
messaging.onBackgroundMessage((payload) => {
  console.log('📩 [Service Worker] استقبال إشعار:', payload);
  
  // إعداد خيارات الإشعار
  const notificationOptions = {
    body: payload.notification?.body || 'مقال جديد على المدونة',
    icon: payload.notification?.image || '/favicon.ico',
    badge: '/badge.png',
    dir: 'rtl', // للنصوص العربية
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
    requireInteraction: true // يبقى حتى ينقر عليه المستخدم
  };
  
  // عرض الإشعار
  self.registration.showNotification(
    payload.notification?.title || 'إشعار من المدونة',
    notificationOptions
  );
});

// 👆 معالجة النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('🎯 تم النقر على الإشعار');
  
  // إغلاق الإشعار
  event.notification.close();
  
  // فتح رابط المقال
  const رابط = event.notification.data?.رابط || 
                event.notification.data?.post_url || 
                'https://www.siwane.xyz';
  
  // فتح النافذة/التبويب
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // البحث عن تبويب مفتوح بالفعل
        for (const client of clientList) {
          if (client.url === رابط && 'focus' in client) {
            return client.focus();
          }
        }
        
        // إذا لم يوجد، فتح تبويب جديد
        if (clients.openWindow) {
          return clients.openWindow(رابط);
        }
      })
  );
});

// ℹ️ معالجة إغلاق الإشعار
self.addEventListener('notificationclose', (event) => {
  console.log('👋 تم إغلاق الإشعار:', event.notification.tag);
  // يمكنك إرسال إحصائية هنا إذا أردت
});

// 🔔 تسجيل Service Worker
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker مثبت');
  self.skipWaiting(); // التنشيط الفوري
});

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker نشط');
  return self.clients.claim();
});
