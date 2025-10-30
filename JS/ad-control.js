// ad-control.js - إصدار v110 (حل نهائي لـ AdBlocker و Scroll وتعارض onload.js)
// + ✅ تعديل المتغير العام (PU.iAd) لخداع 'onload.js' وتجاوز نافذته المنبثقة.
// + ✅ تمكين التمرير الإجباري للمستخدمين المعفيين.
// + ✅ إخفاء ويجت AdBlocker (عنصر .js-antiadblocker).
// + ✅ إعادة هيكلة 'applyAdRules' لضمان إخفاء/إظهار الإعلانات بشكل صحيح.

(function() {
    'use strict';

    // ==========================================================
    // ✅ دالة لتمكين التمرير على الجسم
    // ==========================================================
    function enableBodyScroll() {
        const bodyStyle = document.body.style;
        if (bodyStyle.overflow === 'hidden' || bodyStyle.overflow === 'clip') {
            bodyStyle.overflow = '';
        }
        document.body.classList.remove('no-scroll'); 
    }
    // ==========================================================
    
    // الانتظار حتى تحميل الصفحة بالكامل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        checkAndApplyRules();
        console.log('Initializing Ad Control System (v110)...'); 
        
        // التحقق المتكرر
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                applyAdRules(userProfile);
            }
        }, 500); 
        
        // التحقق بعد 3 ثوانٍ كدعم
        setTimeout(() => {
            const userProfile = getUserProfile();
            if (userProfile) {
                applyAdRules(userProfile);
            }
        }, 3000); 
        
        // الاستماع لتحديثات بيانات المستخدم
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(checkAndApplyRules, 100); 
            }
        });
    }

    function checkAndApplyRules() {
        const userProfile = getUserProfile();
        if (userProfile) {
            applyAdRules(userProfile);
        }
    }
    
    function getUserProfile() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            if (!userDataString) return null;
            return JSON.parse(userDataString);
        } catch (e) {
            console.error('Failed to parse user profile data', e);
            return null;
        }
    }
    
    // ==========================================================
    // ✅ دالة عرض رسالة Toast (تعتمد على تنسيق الموقع)
    // ==========================================================
    function showToast(message) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'tNtf'; 
        
        toastContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;
            pointer-events: none; 
            background: rgba(0, 0, 0, 0); 
        `;

        const toastMessage = document.createElement('div');
        toastMessage.textContent = message;
        toastMessage.style.pointerEvents = 'auto'; 
        toastContainer.appendChild(toastMessage);
        
        const existingToast = document.querySelector('.tNtf');
        if (existingToast) {
            existingToast.remove();
        }

        document.body.appendChild(toastContainer);

        setTimeout(() => {
            toastContainer.remove();
        }, 5000); 
    }
    // ==========================================================
    
    // ==========================================================
    // ✅ الدالة المنطقية للتحقق من حالة الإعفاء (isUserAdFree)
    // ==========================================================
    function isUserAdFree(userProfile) {
        if (!userProfile) return false;

        // 1. الأدمن والمشرفين يرون الإعلانات (للمراقبة)
        if (userProfile.isAdmin) {
            console.log('Ad-Control: Admin user (Showing Ads for testing)');
            return false;
        }
        
        // 2. التحقق من حقل 'isVip' الجديد
        if (userProfile.isVip === true) {
            console.log('Ad-Control: Active (via isVip = true)');
            return true;
        }

        // 3. التحقق من 'adFreeExpiry' الدائم (null)
        if (userProfile.adFreeExpiry === null) {
            console.log('Ad-Control: Active (Permanent via adFreeExpiry = null)');
            return true; 
        }

        // 4. التحقق من 'adFreeExpiry' المؤقت (Timestamp)
        const adFreeExpiry = userProfile.adFreeExpiry;
        if (adFreeExpiry && typeof adFreeExpiry === 'object' && adFreeExpiry.seconds) {
            const expiryTimestampMs = adFreeExpiry.seconds * 1000;
            if (expiryTimestampMs > Date.now()) {
                console.log('Ad-Control: Active (Temporary via adFreeExpiry)');
                return true; 
            }
        }
        
        // 5. [دعم للخلف] التحقق من الحقول القديمة (vipp)
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        if (accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp') {
            console.log('Ad-Control: Active (Backward compatibility via old "vipp" status)');
            return true;
        }
        
        console.log('Ad-Control: Inactive (Showing Ads)');
        return false;
    }
    // ==========================================================

    // ==========================================================
    // ✅✅✅  دالة تطبيق القواعد (تم تعديلها بالكامل)  ✅✅✅
    // ==========================================================
    function applyAdRules(userProfile) {
        const userIsAdFree = isUserAdFree(userProfile);
        let statusMessage = '';
        
        if (userProfile.isAdmin) {
            // 1. حالة المسؤول (Admin)
            statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
            console.log('Ad-Control: Admin mode. Showing ads.');
            // 'onload.js' سيتعرف عليه كـ $.iAd = true
            // نحن فقط نتأكد من إظهار الإعلانات
            showAllAds(); 
        
        } else if (userIsAdFree) {
            // 2. حالة المستخدم المعفي (VIP)
            statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
            console.log('Ad-Control: VIP mode. Hiding ads and bypassing AdBlocker popup.');
            
            // 🌟🌟🌟 [الحل الرئيسي] 🌟🌟🌟
            // نقوم بتعيين المتغير العام (PU) الذي يستخدمه 'onload.js'
            // هذا يجعل 'onload.js' يعتقد أن هذا المستخدم "مسؤول"
            // وبالتالي يتجاوز نافذة مانع الإعلانات ومشكلة قفل التمرير.
            try {
                if (window.PU && typeof window.PU === 'object') {
                    window.PU.iAd = true; 
                    console.log('Ad-Control: Set PU.iAd = true to bypass onload.js anti-adblock.');
                } else {
                     console.warn('Ad-Control: Global PU object not found. Retrying in 1s.');
                     // محاولة احتياطية إذا كان 'onload.js' يتأخر في التحميل
                     setTimeout(() => {
                         if (window.PU && typeof window.PU === 'object') {
                             window.PU.iAd = true;
                             console.log('Ad-Control: Set PU.iAd = true (Retry successful).');
                         }
                     }, 1000);
                }
            } catch (e) {
                console.error('Ad-Control: Error setting global PU.iAd flag.', e);
            }
            // 🌟🌟🌟 [نهاية الحل الرئيسي] 🌟🌟🌟

            // إخفاء جميع الإعلانات بشكل قسري
            hideAllAds(); 
            // تمكين التمرير (كإجراء احترازي إضافي)
            enableBodyScroll(); 
            // إخفاء نوافذ الحظر (كإجراء احترازي إضافي)
            hideBlockerPopups();

        } else {
            // 3. حالة المستخدم العادي
            statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
            console.log('Ad-Control: Normal user mode. Showing ads.');
            // المستخدم عادي، نترك 'onload.js' يقوم بعمله
            // ونتأكد من إظهار الإعلانات
            showAllAds(); 
        }

        // عرض رسالة التوست مرة واحدة فقط
        if (!window.__ad_control_toast_shown) {
            showToast(statusMessage);
            window.__ad_control_toast_shown = true;
        }
    }
    
    // دالة مخصصة لإخفاء النوافذ المنبثقة (احتياطي)
    function hideBlockerPopups() {
        const antiAdBlockerEl = document.querySelector('.js-antiadblocker');
        if (antiAdBlockerEl) {
             antiAdBlockerEl.style.cssText = 'display: none !important; visibility: hidden !important;';
        }
        const accessBlockerEl = document.querySelector('.js-accessblocker');
        if (accessBlockerEl) {
             accessBlockerEl.style.cssText = 'display: none !important; visibility: hidden !important;';
        }
    }
    
    function hideAllAds() {
        const styleId = 'vip-ad-free-style';
        let existingStyle = document.getElementById(styleId);
        if (existingStyle) return; // النمط موجود بالفعل

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* إخفاء إعلانات Google AdSense */
            .adsbygoogle, ins.adsbygoogle { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }
            iframe[src*="ads"], iframe[id*="aswift_"], iframe[id*="google_ads_frame"] { display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }
            div[id*="ad-slot"], div[id*="AdContainer"], div[class*="ad-unit"], div[class*="ads-container"], div[class*="ad_wrapper"] { display: none !important; }
            
            /* منع ظهور الويجت الخاصة بمانع الإعلانات (مهم جداً) */
            .js-antiadblocker,
            .js-accessblocker, 
            .papW, /* كلاس الويجت الأم */
            [class*="adblock"],
            [class*="anti-ad"] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    function showAllAds() {
        const style = document.getElementById('vip-ad-free-style');
        if (style) {
            style.remove();
            console.log('Ad-Control: Ads style removed (Showing Ads)');
        }
    }
})();
