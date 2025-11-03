// ad-control.js - إصدار v120 (مصحح كامل - متوافق مع onload.js)
(function() {
    'use strict';

    // ==========================================================
    // ✅ إعدادات صفحات الاستثناء
    // ==========================================================
    const EXCEPTION_PATHS = [
        '/p/login.html',
        '/p/profile.html',
        '/p/packages.html'
    ];

    // ==========================================================
    // ✅ إصلاح التمرير الآمن
    // ==========================================================
    function enableBodyScroll() {
        const bodyStyle = document.body.style;
        const htmlStyle = document.documentElement.style;

        document.body.classList.remove('no-scroll', 'popup-visible', 'noscroll');
        document.documentElement.classList.remove('no-scroll', 'popup-visible', 'noscroll');

        if (bodyStyle.overflow) bodyStyle.removeProperty('overflow');
        if (htmlStyle.overflow) htmlStyle.removeProperty('overflow');
        
        console.log('Ad-Control: Scrolling restored to default.');
    }

    // ==========================================================
    // ✅ التهيئة الفورية بعد onload.js
    // ==========================================================
    function initAdControl() {
        console.log('🚀 Ad-Control System (v120) - Initializing...');
        
        // ⭐️ الانتظار حتى ينتهي onload.js
        setTimeout(() => {
            checkAndApplyRules();
            setupUserMonitoring();
        }, 1500); // ⭐️ زيادة وقت الانتظار
    }

    // ==========================================================
    // ✅ مراقبة المستخدم المستمرة
    // ==========================================================
    function setupUserMonitoring() {
        // التحقق المتكرر مع زيادة الفاصل
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                checkAndApplyRules();
            }
        }, 1000);
        
        // مراقبة تغييرات التخزين
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(checkAndApplyRules, 200);
            }
        });

        // ⭐️ مراقبة تغييرات PU.iAd
        monitorPUVariable();
    }

    // ==========================================================
    // ✅ مراقبة متغير PU.iAd لمنع التعديل
    // ==========================================================
    function monitorPUVariable() {
        let currentBypassState = null;
        
        setInterval(() => {
            const userProfile = getUserProfile();
            const shouldBypass = shouldBypassAdBlock(userProfile);
            
            if (shouldBypass !== currentBypassState) {
                setGlobalBypassFlag(shouldBypass);
                currentBypassState = shouldBypass;
            }
            
            // ⭐️ إصلاح أي تعديل خارجي
            if (window.PU && window.PU.iAd !== shouldBypass) {
                console.warn('Ad-Control: PU.iAd was modified externally, fixing...');
                setGlobalBypassFlag(shouldBypass);
            }
        }, 2000);
    }

    // ==========================================================
    // ✅ الدوال المساعدة
    // ==========================================================
    function getUserProfile() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            return userDataString ? JSON.parse(userDataString) : null;
        } catch (e) {
            console.error('Ad-Control: Failed to parse user profile', e);
            return null;
        }
    }

    function shouldBypassAdBlock(userProfile) {
        if (!userProfile) return false;
        
        const isExceptionPage = EXCEPTION_PATHS.some(path => 
            window.location.pathname.indexOf(path) === 0
        );
        
        if (isExceptionPage) return true;
        if (userProfile.isAdmin) return true; // ⭐️ المسؤول يتجاوز دائماً
        
        return isUserAdFree(userProfile);
    }

    function isUserAdFree(userProfile) {
        if (!userProfile) return false;

        // ⭐️ التحقق من isAdmin أولاً
        if (userProfile.isAdmin) {
            console.log('Ad-Control: Admin user detected');
            return false; // ⭐️ المسؤول يرى الإعلانات للاختبار
        }
        
        if (userProfile.isVip === true) return true;
        if (userProfile.adFreeExpiry === null) return true;

        if (userProfile.adFreeExpiry && userProfile.adFreeExpiry.seconds) {
            const expiryMs = userProfile.adFreeExpiry.seconds * 1000;
            if (expiryMs > Date.now()) return true;
        }
        
        const accountType = (userProfile.accountType || 'normal').toLowerCase();
        if (accountType === 'vipp' || userProfile.adStatus === 'vipp') return true;
        
        return false;
    }

    // ==========================================================
    // ✅ إدارة العلم العالمي المحسنة
    // ==========================================================
    function setGlobalBypassFlag(isBypassed) {
        if (typeof window.PU === 'undefined') {
            window.PU = {};
        }
        
        // ⭐️ استخدام defineProperty لمنع التعديل
        Object.defineProperty(window.PU, 'iAd', {
            value: isBypassed,
            writable: false,
            configurable: true
        });
        
        console.log(`Ad-Control: PU.iAd locked to ${isBypassed}`);
    }

    // ==========================================================
    // ✅ تطبيق القواعد المحسن
    // ==========================================================
    function applyAdRules(userProfile) {
        const shouldBypass = shouldBypassAdBlock(userProfile);
        const isAdmin = userProfile ? userProfile.isAdmin : false;
        
        let statusMessage = '';
        let showToast = true;
        
        if (shouldBypass) {
            if (isAdmin) {
                statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
                setGlobalBypassFlag(true);
                // ⭐️ المسؤول يرى الإعلانات
            } else {
                statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
                setGlobalBypassFlag(true);
                hideAllAds();
                enableBodyScroll();
                hideBlockerPopups();
            }
        } else {
            statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
            setGlobalBypassFlag(false);
            // ⭐️ المستخدم العادي يخضع لاكتشاف أدبلوك العادي
        }

        if (showToast && !window.__ad_control_toast_shown) {
            showToastMessage(statusMessage);
            window.__ad_control_toast_shown = true;
        }
    }

    // ==========================================================
    // ✅ إخفاء الإعلانات المتأخر (بعد اكتشاف أدبلوك)
    // ==========================================================
    function hideAllAds() {
        // ⭐️ الانتظار حتى ينتهي onload.js من الاكتشاف
        setTimeout(() => {
            const styleId = 'vip-ad-free-style';
            if (document.getElementById(styleId)) return;

            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .adsbygoogle, ins.adsbygoogle, 
                iframe[src*="ads"], iframe[id*="aswift_"], iframe[id*="google_ads_frame"],
                div[id*="ad-slot"], div[id*="AdContainer"], 
                div[class*="ad-unit"], div[class*="ads-container"], div[class*="ad_wrapper"],
                .pAd.show-if-js, .rAd.show-if-js, .pAdIf.show-if-js, .adB,
                .js-antiadblocker, .js-accessblocker, .papW,
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
            console.log('Ad-Control: Ads hidden successfully');
        }, 2000); // ⭐️ انتظار أطول
    }

    // ==========================================================
    // ✅ الدوال المساعدة المتبقية
    // ==========================================================
    function hideBlockerPopups() {
        const selectors = ['.js-antiadblocker', '.js-accessblocker'];
        selectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.cssText = 'display: none !important; visibility: hidden !important;';
            }
        });
    }

    function showToastMessage(message) {
        // ... (نفس الكود الأصلي)
    }

    function checkAndApplyRules() {
        const userProfile = getUserProfile();
        applyAdRules(userProfile);
    }

    // ==========================================================
    // ✅ البدء بعد onload.js مباشرة
    // ==========================================================
    // ⭐️ الانتظار حتى ينتهي تحميل الصفحة و onload.js
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initAdControl, 500);
        });
    } else {
        setTimeout(initAdControl, 500);
    }
})();
