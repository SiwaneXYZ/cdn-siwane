(function() {
    'use strict';

    let checkInterval = null;
    let isInitialized = false;

    const config = {
        checkDelay: 500,
        retryLimit: 10
    };

    // ==========================================================
    // ✅ التهيئة الرئيسية
    // ==========================================================
    function initAdControl() {
        if (isInitialized) return;
        
        console.log('[Ad-Control] Initializing...');
        isInitialized = true;
        
        setupUserMonitoring();
    }

    // ==========================================================
    // ✅ مراقبة بيانات المستخدم
    // ==========================================================
    function setupUserMonitoring() {
        let retryCount = 0;
        
        checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                checkInterval = null;
                applyVippRules(userProfile);
            } else if (retryCount >= config.retryLimit) {
                clearInterval(checkInterval);
                checkInterval = null;
                console.log('[Ad-Control] User profile not found');
            }
            
            retryCount++;
        }, config.checkDelay);
    }

    // ==========================================================
    // ✅ الحصول على بيانات المستخدم
    // ==========================================================
    function getUserProfile() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            if (!userDataString) return null;
            return JSON.parse(userDataString);
        } catch (e) {
            return null;
        }
    }

    // ==========================================================
    // ✅ التحقق من حساب VIPP
    // ==========================================================
    function isUserVipp(userProfile) {
        if (!userProfile) return false;
        
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        return accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp';
    }

    // ==========================================================
    // ✅ تطبيق قواعد VIPP
    // ==========================================================
    function applyVippRules(userProfile) {
        console.log('[Ad-Control] Checking user type...');
        
        const isVipp = isUserVipp(userProfile);
        
        if (isVipp) {
            console.log('[Ad-Control] VIPP user detected - hiding ads');
            hideAllAds();
        }
    }

    // ==========================================================
    // ✅ إخفاء جميع الإعلانات
    // ==========================================================
    function hideAllAds() {
        const styleId = 'ad-control-hide-ads';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .adsbygoogle, ins.adsbygoogle, 
            iframe[src*="ads"], iframe[id*="aswift_"], iframe[id*="google_ads_frame"],
            div[id*="ad-slot"], div[id*="AdContainer"], div[class*="ad-unit"], 
            div[class*="ads-container"], div[class*="ad_wrapper"],
            .pAd.show-if-js, .rAd.show-if-js, .pAdIf.show-if-js, .adB,
            [class*="adblock"], [class*="anti-ad"] {
                display: none !important; 
                visibility: hidden !important; 
                opacity: 0 !important; 
                height: 0 !important; 
                width: 0 !important; 
                overflow: hidden !important;
            }
        `;
        document.head.appendChild(style);
        console.log('[Ad-Control] Ads hidden for VIPP user');
    }

    // ==========================================================
    // ✅ بدء النظام
    // ==========================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }

})();
