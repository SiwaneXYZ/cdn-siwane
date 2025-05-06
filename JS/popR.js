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

    // --- إضافة فحص مبكر لبيئة AMP ---
    // هذا السكربت مصمم لـ HTML القياسي، وليس لـ AMP الذي لديه قيود كبيرة على JavaScript.
    // نتحقق من مؤشرات AMP الشائعة.
    if (document.documentElement.hasAttribute('amp') || document.querySelector('link[rel="amphtml"]')) {
        console.warn('سكربت واجهة مستخدم مصادقة Firebase: تم الكشف عن بيئة AMP. هذا السكربت مصمم لـ HTML القياسي ولن يتم تشغيله.');
        return; // إيقاف التنفيذ في صفحات AMP
    }
    // --- نهاية فحص AMP ---


    // === تهيئة Firebase ===
    // تهيئة تطبيق Firebase. يتم التحقق للتأكد من عدم تهيئته مسبقاً.
    let app;
    if (!firebase.apps || firebase.apps.length === 0) {
         try {
            app = initializeApp(firebaseConfig);
            console.log('تم تهيئة تطبيق Firebase بنجاح.'); // رسالة معلومات في الكونسول
        } catch (error) {
            console.error('خطأ في تهيئة تطبيق Firebase:', error);
            return; // إيقاف السكريبت إذا فشلت التهيئة
        }
    } else {
         app = firebase.apps[0]; // الحصول على التطبيق الافتراضي إذا كان مُهيأ بالفعل
         console.log('تطبيق Firebase مُهيأ بالفعل.'); // رسالة معلومات في الكونسول
    }

    // الحصول على مُستمع المصادقة من كائن التطبيق المُهيأ
    const auth = getAuth(app);


    // الانتظار حتى يتم تحميل هيكل DOM بالكامل قبل محاولة الوصول إلى العناصر
    document.addEventListener('DOMContentLoaded', () => {

        // --- تحسين البحث عن العناصر والتحقق من وجودها ---
        // البحث عن العنصر الأساسي .isUser
        const isUserLi = document.querySelector('.isUser');

        // التحقق من وجود العنصر الأساسي قبل المتابعة
        if (!isUserLi) {
            // رسالة خطأ أكثر تحديداً الآن
            console.error(
                'خطأ في سكربت واجهة مستخدم مصادقة Firebase: لم يتم العثور على العنصر المطلوب بفئة ".isUser". ' +
                'لن يتم تحديث واجهة المستخدم. يرجى التأكد من وجود هذا العنصر في الشفرة المصدرية النهائية لصفحة HTML، ' +
                'خاصة عند فحص شروط قالب بلوجر إذا كانت موجودة.'
            );
            return; // إيقاف منطق الواجهة إذا كان العنصر الأساسي مفقوداً
        }

        // بما أننا وجدنا .isUser، نبحث عن العناصر الفرعية بداخله
        const userIconLabel = isUserLi.querySelector('label.logReg');
        // حفظ مرجع لأيقونة SVG الأصلية لاستعادتها عند تسجيل الخروج
        const initialUserIconSvg = userIconLabel ? userIconLabel.querySelector('svg.line') : null;

        const notLogDiv = isUserLi.querySelector('.NotLog'); // قسم الروابط للمستخدم غير المُسجل
        const donLogDiv = isUserLi.querySelector('.DonLog'); // قسم الروابط للمستخدم المُسجل
        const popupCheckbox = document.getElementById('forlogPop'); // الـ checkbox الذي يتحكم في النافذة المنبثقة (يفترض أن ID عام)

        // البحث عن زر تسجيل الخروج داخل قسم المستخدم المُسجل (بالاعتماد على aria-label)
        // نعيد البحث هنا للتأكد من أنه ضمن نطاق DOMContentLoaded
        const logoutButton = donLogDiv ? donLogDiv.querySelector('div[aria-label="الخروج"]') : null;


        // التحقق من وجود جميع العناصر الضرورية (العنصر الأساسي موجود بالفعل)
        if (!userIconLabel || !notLogDiv || !donLogDiv || !popupCheckbox) {
            console.error(
                'خطأ في سكربت واجهة مستخدم مصادقة Firebase: لم يتم العثور على عنصر أو أكثر من العناصر المطلوبة داخل ".isUser" (أو #forlogPop). ' +
                'لن يتم تحديث واجهة المستخدم. يرجى فحص هيكل HTML داخل ".isUser" وتأكد من وجود العناصر المطلوبة.',
                // لتسهيل التصحيح: نطبع حالة وجود كل عنصر (صحيح/خطأ)
                { 'label.logReg': !!userIconLabel, '.NotLog': !!notLogDiv, '.DonLog': !!donLogDiv, '#forlogPop': !!popupCheckbox }
            );
            return; // إيقاف منطق الواجهة إذا كانت العناصر الهامة مفقودة
        }
         // --- نهاية تحسين البحث عن العناصر والتحقق من وجودها ---


        // === مستمع حالة المصادقة في Firebase (Modular API) ===
        // يتم تشغيل هذا المستمع فوراً عند التهيئة، ثم كلما تغيرت حالة تسجيل الدخول.
        onAuthStateChanged(auth, (user) => {
            // ابحث عن الأيقونة الحالية (سواء كانت SVG أو صورة)
            const currentIcon = userIconLabel.querySelector('.line, .profileUser');

            if (user) {
                // المستخدم مُسجل الدخول
                console.log('حالة المستخدم: مسجل الدخول', user.uid);

                // 1. تحديث أيقونة المستخدم بصورة الحساب إذا وجدت
                if (user.photoURL) {
                    const profileImg = document.createElement('img');
                    profileImg.src = user.photoURL;
                    profileImg.alt = user.displayName || 'صورة الملف الشخصي'; // نص بديل للصورة
                    profileImg.classList.add('profileUser'); // إضافة كلاس CSS للتحكم بالمظهر
                    // ضبط بعض الأنماط الأساسية لضمان العرض الصحيح إذا لم تكن في CSS بشكل كافٍ
                    profileImg.style.width = '22px';
                    profileImg.style.height = '22px';
                    profileImg.style.borderRadius = '50%'; // لجعل الصورة دائرية
                    profileImg.style.objectFit = 'cover'; // لضمان تغطية الصورة للمساحة المحددة
                    profileImg.style.verticalAlign = 'middle'; // للمساعدة في محاذاة الأيقونة

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
                console.log('حالة المستخدم: غير مسجل الدخول');

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
        if (logoutButton) { // نستخدم متغير logoutButton الذي تم البحث عنه في الأعلى ضمن نطاق DOMContentLoaded
            logoutButton.style.cursor = 'pointer'; // تغيير مؤشر الفأرة لإظهاره كزر
            logoutButton.addEventListener('click', () => {
                // استدعاء دالة signOut لتسجيل خروج المستخدم
                signOut(auth).then(() => {
                    console.log('تم تسجيل خروج المستخدم بنجاح عبر زر الخروج.'); // رسالة تأكيد في الكونسول
                    // مستمع حالة المصادقة (onAuthStateChanged) سيقوم بتحديث الواجهة تلقائياً بعد تسجيل الخروج بنجاح
                }).catch((error) => {
                    console.error('خطأ في تسجيل الخروج:', error);
                    // يمكن عرض رسالة خطأ للمستخدم هنا إذا فشل تسجيل الخروج
                    alert('فشل تسجيل الخروج. يرجى المحاولة مرة أخرى.'); // لا يزال تنبيهاً بسيطاً
                });
            });
        } else {
             console.warn('تحذير سكربت واجهة مستخدم مصادقة Firebase: لم يتم العثور على زر تسجيل الخروج (div[aria-label="الخروج"]) داخل ".DonLog". لا يمكن إضافة مستمع النقر.'); // تحذير إذا لم يتم العثور على الزر
        }

        // === التحكم في إغلاق النافذة المنبثقة بالنقر خارجها ===
        // هذا الجزء يتم التعامل معه بواسطة هيكل HTML/CSS المقدم.
        // الـ label.fCls المرتبطة بالـ checkbox#forlogPop والمغطية للشاشة
        // تقوم بتبديل حالة الـ checkbox عند النقر عليها، مما يؤدي إلى إغلاق النافذة المنبثقة
        // عبر قواعد الـ CSS المعتمدة على حالة الـ :checked للـ checkbox.
        // لذلك، لا يلزم كود JavaScript إضافي هنا لهذا الغرض.

    }); // نهاية DOMContentLoaded

})(); // نهاية IIFE (الدالة التي تُنفذ فوراً)
