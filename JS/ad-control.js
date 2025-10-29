// ad-control.js - إصدار v112 (الحل الإلزامي لمشكلة التمرير/اللمس)
// + ✅ إعادة تفعيل دالة enableBodyScroll() واستدعائها كإجراء إلزامي في حال الإعفاء.
// + ✅ إضافة إجراء إلزامي لحذف عنصر AdBlocker Overlay من الـ DOM.
// + ✅ إضافة قواعد CSS صارمة لـ body لضمان التمرير.
(function() {
    'use strict';

    // ==========================================================
    // ✅✅✅ دالة لتمكين التمرير على الجسم (إجراء إلزامي وقوي) ✅✅✅
    // ==========================================================
    function enableBodyScroll() {
        const bodyStyle = document.body.style;
        // إزالة القيود الصارمة مباشرة
        bodyStyle.overflow = '';
        bodyStyle.overflowY = '';
        bodyStyle.overflowX = '';
        // إزالة أي كلاسات قد تمنع التمرير
        document.body.classList.remove('no-scroll', 'overlay-active', 'scroll-lock'); 
        
        // إزالة أي توست متبقي قد يكون سبباً
        const existingToast = document.querySelector('.tNtf');
        if (existingToast) {
            existingToast.remove();
        }
        
        // إجراء إلزامي لحذف عنصر الـ AdBlocker جسدياً
        const adBlockerElement = document.querySelector('.js-antiadblocker');
        if (adBlockerElement) {
            adBlockerElement.remove();
        }
    }
    // ==========================================================

    // ... (بقية دوال initAdControl, checkAndApplyRules, getUserProfile كما هي) ...

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        checkAndApplyRules();
        console.log('Initializing Ad Control System (v112)...'); 
        
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                applyAdRules(userProfile);
            }
        }, 500); 
        
        setTimeout(() => {
            const userProfile = getUserProfile();
            if (userProfile) {
                applyAdRules(userProfile);
            }
        }, 3000); 
        
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
    
    // 🚫 دالة عرض رسالة Toast (معطلة مؤقتاً) 🚫
    // يمكن حذف هذه الدالة إذا قررت عدم استخدام التوست
    /* function showToast(message) {
        // ...
    }
    */
    
    // ... (بقية الدالة isUserAdFree كما هي) ...
    function isUserAdFree(userProfile) {
        if (!userProfile) return false;

        if (userProfile.isAdmin) {
            console.log('Ad-Control: Admin user (Showing Ads for testing)');
            return false;
        }
        
        if (userProfile.isVip === true) {
            console.log('Ad-Control: Active (via isVip = true)');
            return true;
        }

        if (userProfile.adFreeExpiry === null) {
            console.log('Ad-Control: Active (Permanent via adFreeExpiry = null)');
            return true; 
        }

        const adFreeExpiry = userProfile.adFreeExpiry;
        if (adFreeExpiry && typeof adFreeExpiry === 'object' && adFreeExpiry.seconds) {
            const expiryTimestampMs = adFreeExpiry.seconds * 1000;
            
            if (expiryTimestampMs > Date.now()) {
                console.log('Ad-Control: Active (Temporary via adFreeExpiry)');
                return true; 
            }
        }
        
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        if (accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp') {
            console.log('Ad-Control: Active (Backward compatibility via old "vipp" status)');
            return true;
        }
        
        console.log('Ad-Control: Inactive (Showing Ads)');
        return false;
    }
    // ==========================================================
    
    function applyAdRules(userProfile) {
        const userIsAdFree = isUserAdFree(userProfile);
        
        console.log('Ad-Control: Applying rules. User is Ad-Free:', userIsAdFree);
        
        let statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
        
        if (userProfile.isAdmin) {
             statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
        } else if (userIsAdFree) {
            statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
            
            // 🌟 إجراء إلزامي: تمكين التمرير وحذف العنصر المسبب للحظر
            enableBodyScroll();
            
            // إزالة أي سمات حظر (إجراء احتياطي)
            const antiAdBlockerEl = document.querySelector('.js-antiadblocker');
            if (antiAdBlockerEl) {
                 antiAdBlockerEl.removeAttribute('hidden');
                 antiAdBlockerEl.removeAttribute('aria-hidden');
            }
            const accessBlockerEl = document.querySelector('.js-accessblocker');
            if (accessBlockerEl) {
                 accessBlockerEl.removeAttribute('hidden');
                 accessBlockerEl.removeAttribute('aria-hidden');
            }
        }

        // يتم عرض الرسالة/التوست فقط في أول تطبيق للقواعد
        if (!window.__ad_control_toast_shown) {
            console.log('Message Status:', statusMessage);
            // showToast(statusMessage); // معطل مؤقتاً
            window.__ad_control_toast_shown = true;
        }
        
        if (userIsAdFree) {
            hideAllAds();
        } else {
            showAllAds(); 
        }
    }
    
    function hideAllAds() {
        const style = document.createElement('style');
        style.id = 'vip-ad-free-style';
        style.textContent = `
            /* إخفاء إعلانات Google AdSense */
            .adsbygoogle, ins.adsbygoogle { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }
            iframe[src*="ads"], iframe[id*="aswift_"], iframe[id*="google_ads_frame"] { display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }
            div[id*="ad-slot"], div[id*="AdContainer"], div[class*="ad-unit"], div[class*="ads-container"], div[class*="ad_wrapper"] { display: none !important; }
            
            /* منع ظهور طبقات الـ AdBlocker والـ Overlay والـ Toast (بشكل صارم) */
            .js-antiadblocker,
            .js-accessblocker, 
            .papW,  /* كلاس الويجت الأم */
            .tNtf {
                display: none !important;
            }
            
            /* الإجراء الصارم لإعادة التمرير على الجسم */
            body, html {
                overflow: auto !important;
                overflow-x: hidden !important; /* ضمان عدم وجود تمرير أفقي */
            }
            /* إزالة كلاسات قفل التمرير التي قد تكون مضافة */
            body.no-scroll, body.overlay-active, body.scroll-lock {
                overflow: auto !important;
            }
        `;
        
        const existingStyle = document.getElementById('vip-ad-free-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
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
