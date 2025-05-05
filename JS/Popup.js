// هذا السكريبت يستخدم Firebase Authentication (Modular API v11.6.1) للتحكم في واجهة المستخدم.
// يجب تضمين هذا الملف في ملف HTML باستخدام وسم <script type="module" src="..."></script>.

// ***** هام: تم تحديث إصدار Firebase إلى 11.6.1 وتم إضافة إعدادات مشروعك *****
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

(function() {
    // === إعدادات Firebase الخاصة بك ===
    // تم استبدال هذه الإعدادات بمعلومات مشروع Firebase الفعلي الخاص بك.
    const firebaseConfig = {
        apiKey: "AIzaSyAOFOmlFrEtkTHSGL1co2mpcmbmQWCc5sA",
        authDomain: "login-project-e5756.firebaseapp.com",
        projectId: "login-project-e5756",
        storageBucket: "login-project-e5756.appspot.com",
        messagingSenderId: "352188346930",
        appId: "1:352188346930:web:a4fec2fec28e844081c22b"
    };

    // === تهيئة Firebase ===
    // تهيئة تطبيق Firebase. يتم التحقق للتأكد من عدم تهيئته مسبقاً.
    let app;
    if (!firebase.apps || firebase.apps.length === 0) {
         try {
            app = initializeApp(firebaseConfig);
            console.log('Firebase app initialized successfully.'); // رسالة معلومات في الكونسول
        } catch (error) {
            console.error('Error initializing Firebase app:', error);
            return; // إيقاف السكريبت إذا فشلت التهيئة
        }
    } else {
         app = firebase.apps[0]; // الحصول على التطبيق الافتراضي إذا كان مُهيأ بالفعل
         console.log('Firebase app already initialized.'); // رسالة معلومات في الكونسول
    }

    // الحصول على مُستمع المصادقة من كائن التطبيق المُهيأ
    const auth = getAuth(app);


    // الانتظار حتى يتم تحميل هيكل DOM بالكامل قبل محاولة الوصول إلى العناصر
    document.addEventListener('DOMContentLoaded', () => {
        // الحصول على مراجع للعناصر الرئيسية في الصفحة
        const isUserLi = document.querySelector('.isUser');
        // التحقق من وجود العنصر الأساسي قبل المتابعة
        if (!isUserLi) {
            console.error('Error: Could not find the required element with class "isUser". UI will not be updated.');
            return;
        }

        const userIconLabel = isUserLi.querySelector('label.logReg');
        // حفظ مرجع لأيقونة SVG الأصلية لاستعادتها عند تسجيل الخروج
        const initialUserIconSvg = userIconLabel ? userIconLabel.querySelector('svg.line') : null;

        const notLogDiv = isUserLi.querySelector('.NotLog'); // قسم الروابط للمستخدم غير المُسجل
        const donLogDiv = isUserLi.querySelector('.DonLog'); // قسم الروابط للمستخدم المُسجل
        const popupCheckbox = document.getElementById('forlogPop'); // الـ checkbox الذي يتحكم في النافذة المنبثقة
        // البحث عن زر تسجيل الخروج داخل قسم المستخدم المُسجل (بالاعتماد على aria-label)
        const logoutButton = donLogDiv ? donLogDiv.querySelector('div[aria-label="الخروج"]') : null;

        // التحقق من وجود جميع العناصر الضرورية داخل isUserLi
        if (!userIconLabel || !notLogDiv || !donLogDiv || !popupCheckbox) {
            console.error('Error: One or more required elements within ".isUser" not found. UI will not be updated.', {userIconLabel, notLogDiv, donLogDiv, popupCheckbox});
            return;
        }

        // === مستمع حالة المصادقة في Firebase (Modular API) ===
        // يتم تشغيل هذا المستمع فوراً عند التهيئة، ثم كلما تغيرت حالة تسجيل الدخول.
        onAuthStateChanged(auth, (user) => {
            // ابحث عن الأيقونة الحالية (سواء كانت SVG أو صورة)
            const currentIcon = userIconLabel.querySelector('.line, .profileUser');

            if (user) {
                // المستخدم مُسجل الدخول
                console.log('User state: Logged in', user.uid);

                // 1. تحديث أيقونة المستخدم بصورة الحساب إذا وجدت
                if (user.photoURL) {
                    const profileImg = document.createElement('img');
                    profileImg.src = user.photoURL;
                    profileImg.alt = user.displayName || 'Profile picture'; // نص بديل للصورة
                    profileImg.classList.add('profileUser'); // إضافة كلاس CSS للتحكم بالمظهر
                    // ضبط بعض الأنماط الأساسية لضمان العرض الصحيح إذا لم تكن في CSS بشكل كافٍ
                    profileImg.style.width = '22px';
                    profileImg.style.height = '22px';
                    profileImg.style.borderRadius = '50%';
                    profileImg.style.objectFit = 'cover';

                    if (currentIcon) {
                         // استبدال الأيقونة الحالية (SVG أو صورة سابقة) بالصورة الجديدة
                         userIconLabel.replaceChild(profileImg, currentIcon);
                    } else {
                         // في حالة نادرة لم يتم العثور على أيقونة حالية، أضف الصورة
                         userIconLabel.appendChild(profileImg);
                    }

                } else {
                    // إذا لم يكن لدى المستخدم صورة حساب، التأكد من عرض أيقونة SVG الأصلية
                    if (currentIcon && currentIcon.tagName.toLowerCase() === 'img' && initialUserIconSvg) {
                        // إذا كانت الأيقونة الحالية هي صورة، استبدلها بأيقونة SVG الأصلية المحفوظة
                        userIconLabel.replaceChild(initialUserIconSvg, currentIcon);
                    } else if (!currentIcon && initialUserIconSvg) {
                         // إذا لم تكن هناك أيقونة حالية وأيقونة SVG الأصلية موجودة، أضفها
                          userIconLabel.appendChild(initialUserIconSvg);
                    }
                    // إذا لم يكن هناك photoURL والأيقونة الحالية هي بالفعل SVG الأصلية، لا تفعل شيئًا.
                }

                // 2. إظهار قسم الروابط للمستخدم المُسجل وإخفاء قسم غير المُسجل
                donLogDiv.classList.remove('hidden');
                notLogDiv.classList.add('hidden');

            } else {
                // المستخدم غير مُسجل الدخول
                console.log('User state: Logged out');

                // 1. استعادة أيقونة المستخدم الافتراضية (SVG)
                 if (currentIcon && currentIcon.tagName.toLowerCase() === 'img' && initialUserIconSvg) {
                    // إذا كانت الأيقونة الحالية هي صورة، استبدلها بأيقونة SVG الأصلية
                     userIconLabel.replaceChild(initialUserIconSvg, currentIcon);
                 } else if (!currentIcon && initialUserIconSvg) {
                     // إذا لم تكن هناك أيقونة حالية (حالة غير متوقعة)، أضف أيقونة SVG الأصلية
                      userIconLabel.appendChild(initialUserIconSvg);
                 }
                 // إذا كانت الأيقونة الحالية هي بالفعل SVG الأصلية، لا تفعل شيئًا.


                // 2. إظهار قسم الروابط للمستخدم غير المُسجل وإخفاء قسم المُسجل
                notLogDiv.classList.remove('hidden');
                donLogDiv.classList.add('hidden');

                // 3. إغلاق النافذة المنبثقة إذا كانت مفتوحة عند تسجيل الخروج
                popupCheckbox.checked = false; // هذا سيؤدي إلى إغلاقها عبر الـ CSS

            }
        }); // نهاية onAuthStateChanged

        // === التعامل مع زر تسجيل الخروج (Modular API) ===
        // إضافة مستمع حدث النقر لزر تسجيل الخروج إذا تم العثور عليه.
        if (logoutButton) {
            logoutButton.style.cursor = 'pointer'; // تغيير مؤشر الفأرة لإظهاره كزر
            logoutButton.addEventListener('click', () => {
                // استدعاء دالة signOut لتسجيل خروج المستخدم
                signOut(auth).then(() => {
                    console.log('User signed out successfully via logout button.'); // رسالة تأكيد في الكونسول
                    // مست
