/*!
 * Plus UI Ad Controller (ad-controller.js)
 * الإصدار 2.0 | نظام متكامل لإدارة الإعلانات ومكافحة مانع الإعلانات.
 * يعتمد على onload.js (يجب تحميله أولاً).
 */
"use strict";

((e, t, n) => {
    // التأكد من تحميل PU (onload.js)
    if (!e || !e.df) {
        t.console.error("AdControl Error: PU (onload.js) is not loaded. ad-controller.js must be loaded AFTER onload.js.");
        return;
    }

    // المتغيرات الأساسية
    const l = t.console;
    const o = n.body;
    const a = "ads-hidden"; // الكلاس الرئيسي لإخفاء الإعلانات

    /**
     * -----------------------------------------------------------------
     * 1. منطق إخفاء الإعلانات (للمستخدمين المعفيين)
     * -----------------------------------------------------------------
     */

    /**
     * يحدد ما إذا كان يجب إعفاء المستخدم الحالي من مشاهدة الإعلانات.
     * @param {object | null} userProfile - كائن ملف تعريف المستخدم من Firebase.
     * @param {boolean} bloggerAdmin - حالة مسؤول بلوجر (من PU.vw.iAd).
     * @returns {boolean} - إرجاع 'true' إذا كان يجب إخفاء الإعلانات.
     */
    const isAdFree = (userProfile, bloggerAdmin) => {
        // 1. مسؤول بلوجر ($.iAd)
        if (bloggerAdmin === true) return true;

        // 2. مستخدم ضيف (لا يوجد ملف تعريف)
        if (!userProfile) return false;

        // 3. مسؤول Firebase
        if (userProfile.isAdmin === true) return true;

        // 4. حالة العضوية المميزة (VIP)
        if (userProfile.isVip === true) return true;

        // 5. إعفاء دائم (null)
        if (userProfile.adFreeExpiry === null) return true;

        // 6. إعفاء مؤقت (بناءً على التاريخ)
        if (userProfile.adFreeExpiry && userProfile.adFreeExpiry.seconds) {
            const expiryTimeMs = userProfile.adFreeExpiry.seconds * 1000;
            if (expiryTimeMs > Date.now()) {
                return true; // الإعفاء المؤقت لا يزال ساريًا
            }
        }

        // الافتراضي: إظهار الإعلانات
        return false;
    };

    /**
     * يطبق كلاس 'ads-hidden' على الـ <body> إذا تحققت الشروط.
     * @param {object | null} userProfile - ملف تعريف المستخدم من Firebase.
     */
    const applyAdPreference = (userProfile) => {
        // ننتظر جاهزية onload.js
        e.df.then(() => {
            const isBloggerAdmin = e.vw.iAd; 
            if (isAdFree(userProfile, isBloggerAdmin)) {
                if (!o.classList.contains(a)) {
                     o.classList.add(a);
                }
            } else {
                 if (o.classList.contains(a)) {
                    o.classList.remove(a);
                 }
            }
        });
    };

    /**
     * -----------------------------------------------------------------
     * 2. منطق مكافحة مانع الإعلانات (Anti-AdBlock)
     * -----------------------------------------------------------------
     * هذا الكود يعدل السلوك الافتراضي لـ onload.js.
     */
    
    // الانتظار حتى يتم تحميل (onload.js) بالكامل
    e.df.then(() => {
        // 1. تعريف الصفحات المستثناة
        const EXCEPTION_PATHS = [
            '/p/login.html',
            '/p/profile.html', 
            '/p/packages.html'
        ];
        // 2. الحصول على المسار الحالي
        const currentPath = location.pathname;

        // 3. الوصول إلى دوال ومتغيرات onload.js الضرورية
        const antiAdBlockPopup = e.qSel(".js-antiadblocker"); // نافذة الحظر
        const lazyPromise = e.lz;        // PU.lz (Promise)
        const adTools = e.ads;           // PU.ads (يحتوي على iBlk)
        const viewState = e.vw;          // PU.vw (يحتوي على iAd)
        const showToast = e.tNtf;        // PU.tNtf (إظهار تنبيه)
        const hideAdRemnants = () => e.cCss("body .adsbygoogle{display:none!important}");
        const showPopup = (el) => { // دالة إظهار النافذة المنبثقة
            e.sAb(el, "hidden");
            e.aCl(el, "hidden");
            if (e.hAb(el, "aria-hidden")) {
                e.sAb(el, "aria-hidden", "false");
            }
        };

        // 4. تنفيذ منطق مكافحة مانع الإعلانات المعدل
        if (antiAdBlockPopup) { // إذا وُجد عنصر الحظر
            lazyPromise.then(() => adTools.iBlk()).then((isAdBlockDetected) => {
                
                // إذا تم اكتشاف AdBlock
                if (isAdBlockDetected) {
                    
                    // التحقق من شروط السماح بالتصفح
                    const isBloggerAdmin = viewState.iAd;
                    const isExceptionPath = EXCEPTION_PATHS.includes(currentPath);
                    const isUserAdFree = o.classList.contains(a); // التحقق من الكلاس
                    
                    if (isBloggerAdmin) {
                        // 1. مسؤول بلوجر: اسمح بالتصفح + أظهر تنبيه
                        showToast("تم تمكين AdBlock! يبدو أنك مسؤول، لذلك لم يتم عرض النافذة المنبثقة.");
                    
                    } else if (isExceptionPath || isUserAdFree) {
                        // 2. صفحة مستثناة أو مستخدم معفي (VIP/Admin/etc):
                        // اسمح بالتصفح (بصمت، لا تفعل شيئًا)
                        l.log("AdControl: AdBlock detected, but user is exempt. Allowing browsing.");
                    
                    } else {
                        // 3. زائر عادي: اظهر نافذة الحظر
                        hideAdRemnants(); 
                        showPopup(antiAdBlockPopup); 
                    }
                }
            }).catch(err => {
                l.error("AdControl: AdBlock detection failed.", err);
            });
        }
    });

    /**
     * -----------------------------------------------------------------
     * 3. المتحكم العام (Controller)
     * -----------------------------------------------------------------
     * هذا هو الكائن الذي ستستخدمه للربط مع Firebase.
     */
    const controller = {
        /**
         * الدالة الرئيسية التي يجب استدعاؤها عند تغيير حالة مصادقة Firebase.
         * @param {object | null} userProfile - ملف تعريف المستخدم أو null.
         */
        update: applyAdPreference,

        /**
         * دالة مساعدة إذا كنت بحاجة للتحقق من الحالة في مكان آخر.
         * @param {object | null} userProfile
         * @returns {boolean}
         */
        isAdFree: (userProfile) => {
            const isBloggerAdmin = (e.vw && e.vw.iAd) || false;
            return isAdFree(userProfile, isBloggerAdmin);
        }
    };

    // كشف المتحكم في الكائن PU العام وفي Window لسهولة الوصول
    e.AdControl = controller;
    t.PU_AdControl = controller; // الآن يمكنك استدعاؤه باستخدام PU_AdControl.update(...)

})(window.PU, window, document);
