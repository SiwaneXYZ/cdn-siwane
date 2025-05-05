// هذا السكريبت يستخدم Firebase Authentication (Modular API v11+)
// للتحكم في واجهة المستخدم الخاصة بتسجيل الدخول.
// يجب تضمين هذا السكريبت في ملف HTML باستخدام <script type="module" src="...">

// استيراد الدوال المطلوبة من وحدات Firebase النمطية عبر CDN
// تأكد من استبدال '11.x.x' بإصدار Firebase الذي تستخدمه فعليًا
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

(function() {
    // === إعدادات Firebase الخاصة بك ===
    // استبدل هذه الإعدادات بمعلومات مشروع Firebase الفعلي الخاص بك
    const firebaseConfig = {
        apiKey: "AIzaSyAOFOmlFrEtkTHSGL1co2mpcmbmQWCc5sA",
    authDomain: "login-project-e5756.firebaseapp.com",
    projectId: "login-project-e5756",
    storageBucket: "login-project-e5756.appspot.com",
    messagingSenderId: "352188346930",
    appId: "1:352188346930:web:a4fec2fec28e844081c22b"
  };

    // === تهيئة Firebase ===
    // initializeApp يعود بكائن التطبيق، نحتاج التقاطه لاستخدامه مع الخدمات الأخرى
    let app;
    // تحقق مما إذا كان هناك أي تطبيقات Firebase مُهيأة بالفعل لتجنب الأخطاء
    // في النمط المعياري، نستخدم firebase.apps للتحقق
    if (!firebase.apps || firebase.apps.length === 0) {
         try {
            app = initializeApp(firebaseConfig);
            console.log('Firebase app initialized.');
        } catch (error) {
            console.error('Error initializing Firebase app:', error);
            return; // إيقاف السكريبت إذا فشلت التهيئة
        }
    } else {
         app = firebase.apps[0]; // الحصول على التطبيق الافتراضي إذا كان مُهيأ بالفعل
         console.log('Firebase app already initialized.');
    }

    // الحصول على مُستمع المصادقة من كائن التطبيق
    const auth = getAuth(app);


    // الانتظار حتى يتم تحميل هيكل DOM بالكامل قبل محاولة الوصول إلى العناصر
    document.addEventListener('DOMContentLoaded', () => {
        const isUserLi = document.querySelector('.isUser');
        if (!isUserLi) {
            console.error('Error: Element with class "isUser" not found.');
            return; // توقف إذا لم يتم العثور على العنصر الأساسي
        }

        const userIconLabel = isUserLi.querySelector('label.logReg');
        // احفظ مرجعًا لأيقونة SVG الأصلية إذا وجدت
        const initialUserIconSvg = userIconLabel ? userIconLabel.querySelector('svg.line') : null;

        const notLogDiv = isUserLi.querySelector('.NotLog');
        const donLogDiv = isUserLi.querySelector('.DonLog');
        const popupCheckbox = document.getElementById('forlogPop');
        // ابحث عن زر تسجيل الخروج داخل .DonLog باستخدام خاصية aria-label
        const logoutButton = donLogDiv ? donLogDiv.querySelector('div[aria-label="الخروج"]') : null;


        if (!userIconLabel || !notLogDiv || !donLogDiv || !popupCheckbox) {
            console.error('Error: One or more required elements within ".isUser" not found.');
            return; // توقف إذا لم يتم العثور على العناصر الضرورية
        }

        // === مستمع حالة المصادقة في Firebase (v11+ Modular) ===
        // يتم تشغيل هذا المستمع عند تغيير حالة تسجيل الدخول
        onAuthStateChanged(auth, (user) => { // استخدام الدالة والـ auth instance من الاستيراد
            // ابحث عن الأيقونة الحالية (SVG أو صورة) داخل الـ label
            const currentIcon = userIconLabel.querySelector('.line, .profileUser');

            if (user) {
                // المستخدم مُسجل الدخول
                console.log('User is logged in:', user.uid);

                // 1. تحديث أيقونة المستخدم
                if (user.photoURL) {
                    // إذا كان لدى المستخدم صورة حساب، استخدمها
                    const profileImg = document.createElement('img');
                    profileImg.src = user.photoURL;
                    profileImg.alt = user.displayName || 'صورة الحساب'; // استخدم اسم العرض أو نص بديل
                    profileImg.classList.add('profileUser'); // أضف الكلاس المخصص للصورة
                    // تأكد من أن الحجم مُناسب إذا لم يكن مُحددًا جيدًا في CSS
                    profileImg.style.width = '22px';
                    profileImg.style.height = '22px';
                    profileImg.style.objectFit = 'cover'; // لضمان عدم تشوه الصورة

                    if (currentIcon) {
                         // استبدل الأيقونة الحالية (SVG أو صورة سابقة) بالصورة الجديدة
                         userIconLabel.replaceChild(profileImg, currentIcon);
                    } else {
                         // في حالة نادرة لم يتم العثور على أيقونة حالية، أضف الصورة
                         userIconLabel.appendChild(profileImg);
                    }

                } else {
                    // إذا لم يكن لدى المستخدم صورة، تأكد من عرض أيقونة SVG الأصلية
                    if (currentIcon && currentIcon.tagName.toLowerCase() === 'img' && initialUserIconSvg) {
                        // إذا كانت الأيقونة الحالية هي صورة، استبدلها بأيقونة SVG الأصلية المحفوظة
                        userIconLabel.replaceChild(initialUserIconSvg, currentIcon);
                    } else if (!currentIcon && initialUserIconSvg) {
                        // إذا لم تكن هناك أيقونة حالية وأيقونة SVG الأصلية موجودة، أضفها
                         userIconLabel.appendChild(initialUserIconSvg);
                    }
                    // إذا لم يكن هناك photoURL والأيقونة الحالية هي بالفعل SVG الأصلية، لا تفعل شيئًا.
                }

                // 2. إظهار قائمة "مُسجل الدخول" وإخفاء قائمة "غير مُسجل الدخول"
                donLogDiv.classList.remove('hidden');
                notLogDiv.classList.add('hidden');

            } else {
                // المستخدم غير مُسجل الدخول
                console.log('User is logged out.');

                // 1. استعادة أيقونة المستخدم الافتراضية (SVG)
                 if (currentIcon && currentIcon.tagName.toLowerCase() === 'img' && initialUserIconSvg) {
                    // إذا كانت الأيقونة الحالية هي صورة (لأن المستخدم كان مُسجل الدخول)، استبدلها بأيقونة SVG الأصلية
                     userIconLabel.replaceChild(initialUserIconSvg, currentIcon);
                 } else if (!currentIcon && initialUserIconSvg) {
                     // إذا لم تكن هناك أيقونة حالية (حالة غير متوقعة)، أضف أيقونة SVG الأصلية
                      userIconLabel.appendChild(initialUserIconSvg);
                 }
                 // إذا كانت الأيقونة الحالية هي بالفعل SVG الأصلية، لا تفعل شيئًا.

                // 2. إظهار قائمة "غير مُسجل الدخول" وإخفاء قائمة "مُسجل الدخول"
                notLogDiv.classList.remove('hidden');
                donLogDiv.classList.add('hidden');

                // 3. إغلاق النافذة المنبثقة إذا كانت مفتوحة عند تسجيل الخروج
                popupCheckbox.checked = false;
            }
        });

        // === التعامل مع زر تسجيل الخروج (v11+ Modular) ===
        // الكود سيبحث عن العنصر الذي يمثل زر تسجيل الخروج داخل .DonLog
        if (logoutButton) {
            logoutButton.style.cursor = 'pointer'; // لإعطاء مؤشر بصري بأنه قابل للنقر
            logoutButton.addEventListener('click', () => {
                // استخدام الدالة signOut مع الـ auth instance
                signOut(auth).then(() => {
                    console.log('User signed out successfully.');
                    // سيقوم مستمع حالة المصادقة بتحديث الواجهة الأمامية تلقائيًا
                }).catch((error) => {
                    console.error('Error signing out:', error);
                    // يمكنك عرض رسالة خطأ للمستخدم هنا
                    alert('حدث خطأ أثناء تسجيل الخروج: ' + error.message);
                });
            });
        } else {
             console.warn('Logout button element (div with aria-label="الخروج") not found within ".DonLog".');
        }

    }); // نهاية DOMContentLoaded
})(); // نهاية IIFE (Immediately Invoked Function Expression)
