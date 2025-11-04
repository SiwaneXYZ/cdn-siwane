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
    // ✅ 2. إعدادات النظام
    // ==========================================================
    let checkInterval = null;
    let isInitialized = false;

    // ==========================================================
    // ✅ 3. التهيئة الرئيسية
    // ==========================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        if (isInitialized) return;
        
        console.log('Initializing Ad Control System...'); 
        isInitialized = true;
        
        // تطبيق القواعد فوراً عند التحميل
        checkAndApplyRules();
        
        // التحقق المتكرر (لضمان التقاط بيانات المستخدم)
        checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                checkInterval = null;
                checkAndApplyRules();
            }
        }, 500); 
        
        // الاستماع لتحديثات بيانات المستخدم
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
    
    // ==========================================================
    // ✅ 4. الحصول على بيانات المستخدم
    // ==========================================================
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
    // ✅ 5. نظام الإشعارات
    // ==========================================================
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
    // ✅ 6. التحقق من حالة الإعفاء
    // ==========================================================
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
    // ✅ 7. التحقق من صفحات الاستثناء
    // ==========================================================
    function isExceptionPage() {
        const currentPath = window.location.pathname;
        for (let i = 0; i < EXCEPTION_PATHS.length; i++) {
            if (currentPath.indexOf(EXCEPTION_PATHS[i]) === 0) {
                return true;
            }
        }
        return false;
    }
    
    // ==========================================================
    // ✅ 8. إدارة العلم العام
    // ==========================================================
    function setGlobalBypassFlag(isBypassed) {
        const attemptSet = () => {
            try {
                if (typeof window.PU === 'undefined') {
                    window.PU = {};
                    console.log(`Ad-Control: Created PU object.`);
                }
                
                window.PU.iAd = isBypassed; 
                console.log(`Ad-Control: Set PU.iAd = ${isBypassed}`);
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

    // ==========================================================
    // ✅ 9. إدارة التمرير
    // ==========================================================
    function enableBodyScroll() {
        const bodyStyle = document.body.style;
        const htmlStyle = document.documentElement.style;

        document.body.classList.remove('no-scroll', 'popup-visible', 'noscroll'); 
        document.documentElement.classList.remove('no-scroll', 'popup-visible', 'noscroll');

        if (bodyStyle.overflow) {
            bodyStyle.removeProperty('overflow');
        }
        if (htmlStyle.overflow) {
            htmlStyle.removeProperty('overflow');
        }
        
        console.log('Ad-Control: Scrolling restored to default.');
    }

    // ==========================================================
    // ✅ 10. تطبيق القواعد الرئيسية
    // ==========================================================
    function applyAdRules(userProfile) {
        const userIsAdFree = isUserAdFree(userProfile);
        const pageIsException = isExceptionPage(); 
        const isAdmin = userProfile ? userProfile.isAdmin : false;
        
        let statusMessage = '';
        let showStatusToast = true; 
        
        if (pageIsException) {
            console.log('Ad-Control: Exception page detected. Hiding ads.');
            setGlobalBypassFlag(true); 
            hideAllAds();
            enableBodyScroll();
            showStatusToast = false; 

        } else if (isAdmin) {
            statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
            setGlobalBypassFlag(true); 
            showAllAds(); 
        
        } else if (userIsAdFree) {
            statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
            console.log('Ad-Control: VIP mode. Hiding ads.');
            setGlobalBypassFlag(true); 
            hideAllAds(); 
            enableBodyScroll();

        } else {
            statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
            console.log('Ad-Control: Normal user mode. Showing ads.');
            setGlobalBypassFlag(false); 
            showAllAds(); 
        }

        if (showStatusToast && !window.__ad_control_toast_shown) {
            showToast(statusMessage);
            window.__ad_control_toast_shown = true;
        }
    }

    // ==========================================================
    // ✅ 11. إدارة الإعلانات
    // ==========================================================
    function hideAllAds() {
        const styleId = 'vip-ad-free-style';
        let existingStyle = document.getElementById(styleId);
        if (existingStyle) return; 

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* إخفاء إعلانات Google AdSense */
            .adsbygoogle, ins.adsbygoogle { 
                display: none !important; 
                visibility: hidden !important; 
                opacity: 0 !important; 
                height: 0 !important; 
                width: 0 !important; 
                overflow: hidden !important; 
            }
            
            /* إخفاء إطارات الإعلانات */
            iframe[src*="ads"], 
            iframe[id*="aswift_"], 
            iframe[id*="google_ads_frame"] { 
                display: none !important; 
                visibility: hidden !important; 
                height: 0 !important; 
                width: 0 !important; 
                overflow: hidden !important; 
            }
            
            /* إخفاء حاويات الإعلانات */
            div[id*="ad-slot"], 
            div[id*="AdContainer"], 
            div[class*="ad-unit"], 
            div[class*="ads-container"], 
            div[class*="ad_wrapper"] { 
                display: none !important; 
            }
            
            /* إخفاء الإعلانات اليدوية */
            .pAd.show-if-js,
            .rAd.show-if-js,
            .pAdIf.show-if-js,
            .adB {
                display: none !important; 
                visibility: hidden !important;
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

    // ==========================================================
    // ✅ 12. التنظيف
    // ==========================================================
    function cleanup() {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        isInitialized = false;
        console.log('Ad control system cleaned up');
    }

    // جعل دالة التنظيف متاحة globally إذا لزم الأمر
    window.adControlCleanup = cleanup;

})();
