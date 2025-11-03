// ad-control.js - إصدار v201 (إدارة كلاس الإعفاء)
// هذا الكود يضيف 'js-antiadblocker' إلى body فقط
// إذا كان المستخدم معفياً (VIP) والصفحة ليست من الاستثناءات.

(function() {
    'use strict';

    // ==========================================================
    // ✅ 1. الإعدادات الأساسية
    // ==========================================================

    const LOCALSTORAGE_KEY = 'firebaseUserProfileData';

    const EXCEPTION_PATHS = [
        '/p/login.html',
        '/p/profile.html',
        '/p/packages.html'
    ];

    // ==========================================================
    // ✅ 2. تهيئة وتشغيل الكود
    // ==========================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    window.addEventListener('storage', (e) => {
        if (e.key === LOCALSTORAGE_KEY) {
            setTimeout(applyAdBlockerLogic, 100); 
        }
    });

    function initAdControl() {
        console.log('Ad-Control (v201): Initializing Exemption Class Logic...');
        
        applyAdBlockerLogic();
        
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                applyAdBlockerLogic();
            }
        }, 500);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
    }

    // ==========================================================
    // ✅ 3. الدوال المساعدة للتحقق
    // ==========================================================

    function getUserProfile() {
        try {
            const userDataString = localStorage.getItem(LOCALSTORAGE_KEY);
            if (!userDataString) return null;
            return JSON.parse(userDataString);
        } catch (e) {
            console.error('Ad-Control: Failed to parse user profile data', e);
            return null;
        }
    }

    function isExceptionPage() {
        const currentPath = window.location.pathname;
        return EXCEPTION_PATHS.some(path => currentPath.startsWith(path));
    }

    function isUserAdFree(userProfile) {
        if (!userProfile) return false;
        if (userProfile.isVip === true) return true;
        if (userProfile.adFreeExpiry === null) return true; 
        if (userProfile.adFreeExpiry && typeof userProfile.adFreeExpiry === 'object' && userProfile.adFreeExpiry.seconds) {
            const expiryTimestampMs = userProfile.adFreeExpiry.seconds * 1000;
            if (expiryTimestampMs > Date.now()) return true; 
        }
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        if (accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp') return true;
        
        return false;
    }

    // ==========================================================
    // ✅ 4. تطبيق المنطق الرئيسي وإشعار Toast
    // ==========================================================

    function showAdFreeToast() {
        if (window.__ad_free_toast_shown) return;
        window.__ad_free_toast_shown = true;
        
        console.log('Ad-Control: User is Ad-Free. Showing toast in 3s.');

        setTimeout(() => {
            const toastContainer = document.createElement('div');
            toastContainer.className = 'tNtf';
            toastContainer.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;
                pointer-events: none; background: rgba(0, 0, 0, 0); 
            `;
            const toastMessage = document.createElement('div');
            toastMessage.textContent = 'تم تفعيل الإعفاء من الإعلانات لحسابك. 🎉';
            toastMessage.style.pointerEvents = 'auto'; 
            
            toastContainer.appendChild(toastMessage);
            
            const existingToast = document.querySelector('.tNtf');
            if (existingToast) { existingToast.remove(); }
            
            document.body.appendChild(toastContainer);
            
            setTimeout(() => {
                toastContainer.remove();
            }, 5000);

        }, 3000); // <-- تأخير 3 ثوانٍ
    }

    /**
     * الدالة الرئيسية لتطبيق القواعد (المنطق المعكوس)
     */
    function applyAdBlockerLogic() {
        const userProfile = getUserProfile();
        const userIsAdFree = isUserAdFree(userProfile);
        const pageIsException = isExceptionPage();

        // 1. أولاً، نقوم بإزالة الكلاس دائماً كإجراء احتياطي
        // هذا يضمن أن المستخدم العادي أو صفحات الاستثناء لن تحتوي عليه أبداً
        document.body.classList.remove('js-antiadblocker');

        // 2. الحالة الوحيدة التي نضيف فيها الكلاس:
        // إذا كان المستخدم معفياً (VIP) + الصفحة *ليست* من الاستثناءات
        if (userIsAdFree && !pageIsException) {
            
            console.log('Ad-Control: User is VIP. Adding .js-antiadblocker to <body>.');
            document.body.classList.add('js-antiadblocker');
            
            // إظهار رسالة الترحيب
            showAdFreeToast();

        } else if (pageIsException) {
            // 3. إذا كانت صفحة استثناء
             console.log('Ad-Control: Exception page. No class added.');
             // (الكلاس تمت إزالته مسبقاً)

        } else {
            // 4. إذا كان مستخدم عادي
            console.log('Ad-Control: Normal user. No class added.');
            // (الكلاس تمت إزالته مسبقاً)
        }
    }

})();
