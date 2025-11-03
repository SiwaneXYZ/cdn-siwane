// ad-control.js - إصدار v114 (الإعفاء لحالة VIPP فقط)
// + ✅ تطبيق إخفاء الإعلانات وإضافة كلاس 'js-antiadblocker'
//   فقط للحسابات التي تحمل حالة 'vipp'.
// + ✅ إصلاح خطأ مطبعي في (hideBlockerPopups).
// + ✅ (يحتوي على جميع مميزات v112/v113 السابقة).

(function() {
    'use strict';

    // ==========================================================
    // ✅ 1. إعدادات صفحات الاستثناء
    // ==========================================================
    const EXCEPTION_PATHS = [
        '/p/login.html',
        '/p/profile.html',
        '/p/packages.html'
    ];
    // ==========================================================


    // ==========================================================
    // ✅ 2. دالة لتمكين التمرير (بشكل آمن)
    // ==========================================================
    function enableBodyScroll() {
        const bodyStyle = document.body.style;
        const htmlStyle = document.documentElement.style; // <html>

        document.body.classList.remove('no-scroll', 'popup-visible', 'noscroll'); 
        document.documentElement.classList.remove('no-scroll', 'popup-visible', 'noscroll');

        if (bodyStyle.overflow) {
            bodyStyle.removeProperty('overflow');
        }
        if (htmlStyle.overflow) {
            htmlStyle.removeProperty('overflow');
        }
        
        console.log('Ad-Control: Scrolling restored to default (Fixed-Menu Safe).');
    }
    // ==========================================================

    // الانتظار حتى تحميل الصفحة بالكامل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        console.log('Initializing Ad Control System (v114)...'); 
        checkAndApplyRules();
        
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                checkAndApplyRules(); 
            }
        }, 500); 
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(checkAndApplyRules, 100); 
            }
        });
    }

    function checkAndApplyRules() {
        const userProfile = getUserProfile();
        applyAdRules(userProfile);
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
    
    // دالة عرض رسالة Toast
    function showToast(message) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'tNtf'; 
        toastContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;
            pointer-events: none; background: rgba(0, 0, 0, 0); 
        `;
        const toastMessage = document.createElement('div');
        toastMessage.textContent = message;
        toastMessage.style.pointerEvents = 'auto'; 
        toastContainer.appendChild(toastMessage);
        const existingToast = document.querySelector('.tNtf');
        if (existingToast) { existingToast.remove(); }
        document.body.appendChild(toastContainer);
        setTimeout(() => {
            toastContainer.remove();
        }, 5000); 
    }
    
    // ==========================================================
    // ✅ [ تم التعديل ] الدالة المنطقية للتحقق من حالة الإعفاء
    // ==========================================================
    function isUserAdFree(userProfile) {
        if (!userProfile) return false;

        // 1. التحقق من حالة "vipp" (فقط) كما طلبت
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        if (accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp') {
            console.log('Ad-Control: Active (VIPP status detected)');
            return true;
        }

        // 2. حالة المسؤول (يرى الإعلانات)
        if (userProfile.isAdmin) {
            console.log('Ad-Control: Admin user (Showing Ads for testing)');
            return false;
        }
        
        // 3. أي حالة أخرى (مثل isVip:true أو adFreeExpiry) تعتبر مستخدم عادي
        console.log('Ad-Control: Inactive (Not VIPP status). Showing Ads.');
        return false;
    }
    
    // دالة للتحقق إذا كانت الصفحة الحالية صفحة استثناء
    function isExceptionPage() {
        const currentPath = window.location.pathname;
        for (let i = 0; i < EXCEPTION_PATHS.length; i++) {
            if (currentPath.indexOf(EXCEPTION_PATHS[i]) === 0) {
                return true;
            }
        }
        return false;
    }
    
    // دالة لضبط متغير التجاوز العام (PU.iAd)
    function setGlobalBypassFlag(isBypassed) {
        const attemptSet = () => {
            try {
                if (typeof window.PU === 'undefined') {
                    window.PU = {};
                    console.log(`Ad-Control: Created PU object.`);
                }
                
                window.PU.iAd = isBypassed; 
                console.log(`Ad-Control: Set PU.iAd = ${isBypassed} to control onload.js.`);
                return true;

            } catch (e) {
                console.error('Ad-Control: Error setting global PU.iAd flag.', e);
                return true; 
            }
        };

        if (!attemptSet()) {
            console.warn('Ad-Control: Global PU object not found. Retrying in 500ms.');
            setTimeout(attemptSet, 500);
        }
    }

    // دالة تطبيق القواعد (v113)
    function applyAdRules(userProfile) {
        // [ملاحظة] userIsAdFree الآن = true فقط لـ "vipp"
        const userIsAdFree = isUserAdFree(userProfile); 
        const pageIsException = isExceptionPage(); 
        const isAdmin = userProfile ? userProfile.isAdmin : false;
        
        let statusMessage = '';
        let showStatusToast = true; 
        
        // 1. إزالة الكلاس دائماً في البداية كإجراء احتياطي
        document.body.classList.remove('js-antiadblocker');

        if (pageIsException) {
            // 2. حالة صفحة الاستثناء (الأولوية القصوى)
            console.log('Ad-Control: Exception page detected. Bypassing AdBlocker and hiding ads.');
            setGlobalBypassFlag(true); 
            hideAllAds();
            enableBodyScroll();
            hideBlockerPopups();
            showStatusToast = false; 

        } else if (isAdmin) {
            // 3. حالة المسؤول (Admin)
            statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
            setGlobalBypassFlag(true); 
            showAllAds(); 
        
        } else if (userIsAdFree) {
            // 4. حالة المستخدم المعفي (VIPP فقط)
            statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
            console.log('Ad-Control: VIPP mode. Hiding ads and bypassing AdBlocker popup.');
            setGlobalBypassFlag(true); 
            hideAllAds(); // <-- ✅ (الهدف 1: إخفاء الإعلانات)
            enableBodyScroll();
            hideBlockerPopups();

            // 4b. إضافة كلاس الإعفاء إلى body
            document.body.classList.add('js-antiadblocker'); // <-- ✅ (الهدف 2: إضافة الكلاس)
            console.log('Ad-Control: Added .js-antiadblocker to <body> for VIPP.');

        } else {
            // 5. حالة المستخدم العادي (بما في ذلك isVip:true و adFreeExpiry)
            statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
            console.log('Ad-Control: Normal user mode (Not VIPP). Showing ads.');
            setGlobalBypassFlag(false); 
            showAllAds(); 
        }

        if (showStatusToast && !window.__ad_control_toast_shown) {
            showToast(statusMessage);
            window.__ad_control_toast_shown = true;
        }
    }
    
    // ==========================================================
    // ✅ [ تم الإصلاح ] دالة مخصصة لإخفاء النوافذ المنبثقة
    // ==========================================================
    function hideBlockerPopups() {
        const antiAdBlockerEl = document.querySelector('.js-antiadblocker');
        if (antiAdBlockerEl) {
             antiAdBlockerEl.style.cssText = 'display: none !important; visibility: hidden !important;';
        }
        const accessBlockerEl = document.querySelector('.js-accessblocker');
        // [تم الإصلاح] كان الخطأ هنا (accessBlockVl)
        if (accessBlockerEl) { 
             accessBlockerEl.style.cssText = 'display: none !important; visibility: hidden !important;';
        }
    }
    
    // دالة إخفاء كل الإعلانات
    function hideAllAds() {
        const styleId = 'vip-ad-free-style';
        let existingStyle = document.getElementById(styleId);
        if (existingStyle) return; 

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* إخفاء إعلانات Google AdSense */
            .adsbygoogle, ins.adsbygoogle { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }
            iframe[src*="ads"], iframe[id*="aswift_"], iframe[id*="google_ads_frame"] { display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }
            div[id*="ad-slot"], div[id*="AdContainer"], div[class*="ad-unit"], div[class*="ads-container"], div[class*="ad_wrapper"] { display: none !important; }
            
            /* إخفاء الإعلانات اليدوية */
            .pAd.show-if-js,
            .rAd.show-if-js,
            .pAdIf.show-if-js,
            .adB {
                display: none !important; 
                visibility: hidden !important;
            }

            /* منع ظهور الويجت الخاصة بمانع الإعلانات */
            .js-antiadblocker,
            .js-accessblocker, 
            .papW,
            [class*="adblock"],
            [class*="anti-ad"] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // دالة إظهار الإعلانات
    function showAllAds() {
        const style = document.getElementById('vip-ad-free-style');
        if (style) {
            style.remove();
            console.log('Ad-Control: Ads style removed (Showing Ads)');
        }
    }
})();
