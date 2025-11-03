// ad-control.js - إصدار v130 (استثناء الصفحات العالمي)
(function() {
    'use strict';

    // ==========================================================
    // ✅ الصفحات المستثناة عالمياً - للجميع حتى مع أدبلوك
    // ==========================================================
    const GLOBAL_EXEMPT_PATHS = [
        '/p/login.html',
        '/p/profile.html', 
        '/p/packages.html'
    ];

    // ==========================================================
    // ✅ اكتشاف إشارات استثناء الصفحات من onload.js
    // ==========================================================
    function detectPageExemption() {
        // 1. التحقق من meta tag
        const metaBypass = document.querySelector('meta[name="bypass-adblock"]');
        if (metaBypass && metaBypass.getAttribute('content') === 'true') {
            return true;
        }

        // 2. التحقق من class في body
        if (document.body.classList.contains('adblock-bypass')) {
            return true;
        }

        // 3. التحقق من المسارات المعفاة
        const currentPath = window.location.pathname;
        for (let i = 0; i < GLOBAL_EXEMPT_PATHS.length; i++) {
            if (currentPath.indexOf(GLOBAL_EXEMPT_PATHS[i]) === 0) {
                return true;
            }
        }

        return false;
    }

    // ==========================================================
    // ✅ تطبيق الاستثناء العالمي الفوري
    // ==========================================================
    function applyGlobalExemption() {
        if (detectPageExemption()) {
            console.log('🎯 Ad-Control: Global page exemption detected - bypassing all AdBlock checks');
            
            // 1. تعطيل كل اكتشافات الأدبلوك
            setGlobalBypassFlag(true);
            
            // 2. إخفاء كل نوافذ الحظر فوراً
            hideAllBlockerPopups();
            
            // 3. تمكين التمرير
            enableBodyScroll();
            
            // 4. إخفاء الإعلانات (اختياري - حسب رغبتك)
            hideAllAds();
            
            return true;
        }
        return false;
    }

    // ==========================================================
    // ✅ إخفاء جميع نوافذ الحظر (محسّن)
    // ==========================================================
    function hideAllBlockerPopups() {
        const blockers = [
            '.js-antiadblocker',
            '.js-accessblocker', 
            '.papW',
            '.adblock-overlay',
            '.adblock-popup',
            '[class*="adblock"]',
            '[class*="anti-ad"]',
            '[id*="adblock"]'
        ];

        blockers.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.cssText = `
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                `;
            });
        });

        // ⭐️ إزالة أي أنماط تمنع التمرير
        document.body.classList.remove('no-scroll', 'adblock-blocked');
        document.documentElement.classList.remove('no-scroll', 'adblock-blocked');
        
        const bodyStyle = document.body.style;
        if (bodyStyle.overflow === 'hidden') {
            bodyStyle.removeProperty('overflow');
        }
    }

    // ==========================================================
    // ✅ التهيئة الذكية - الاستثناء أولاً
    // ==========================================================
    function initAdControl() {
        console.log('🚀 Ad-Control System (v130) - Initializing...');

        // ⭐️ التحقق الفوري من الاستثناء العالمي
        if (applyGlobalExemption()) {
            console.log('✅ Ad-Control: Page is globally exempt - AdBlock bypassed for all users');
            return; // توقف هنا - لا حاجة لمزيد من المعالجة
        }

        // ⭐️ فقط للصفحات غير المستثناة - تطبيق النظام العادي
        setTimeout(() => {
            checkAndApplyRules();
            setupUserMonitoring();
        }, 1500);
    }

    // ==========================================================
    // ✅ تعديل دالة applyAdRules لتحترم الاستثناء العالمي
    // ==========================================================
    function applyAdRules(userProfile) {
        // ⭐️ التحقق مرة أخرى من الاستثناء العالمي
        if (detectPageExemption()) {
            console.log('Ad-Control: Global exemption active - skipping user rules');
            return;
        }

        // ... الكود الأصلي لمعالجة المستخدمين
        const userIsAdFree = isUserAdFree(userProfile);
        const isAdmin = userProfile ? userProfile.isAdmin : false;
        
        let statusMessage = '';
        let showToast = true;
        
        if (isAdmin) {
            statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
            setGlobalBypassFlag(true);
        } else if (userIsAdFree) {
            statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
            setGlobalBypassFlag(true);
            hideAllAds();
            enableBodyScroll();
            hideAllBlockerPopups();
        } else {
            statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
            setGlobalBypassFlag(false);
        }

        if (showToast && !window.__ad_control_toast_shown) {
            showToastMessage(statusMessage);
            window.__ad_control_toast_shown = true;
        }
    }

    // ==========================================================
    // ✅ الدوال المساعدة المتبقية (بدون تغيير)
    // ==========================================================
    function enableBodyScroll() {
        const bodyStyle = document.body.style;
        const htmlStyle = document.documentElement.style;

        document.body.classList.remove('no-scroll', 'popup-visible', 'noscroll');
        document.documentElement.classList.remove('no-scroll', 'popup-visible', 'noscroll');

        if (bodyStyle.overflow) bodyStyle.removeProperty('overflow');
        if (htmlStyle.overflow) htmlStyle.removeProperty('overflow');
    }

    function setGlobalBypassFlag(isBypassed) {
        if (typeof window.PU === 'undefined') {
            window.PU = {};
        }
        
        Object.defineProperty(window.PU, 'iAd', {
            value: isBypassed,
            writable: false,
            configurable: true
        });
    }

    function hideAllAds() {
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
                .pAd.show-if-js, .rAd.show-if-js, .pAdIf.show-if-js, .adB {
                    display: none !important; 
                    visibility: hidden !important;
                    opacity: 0 !important;
                    height: 0 !important;
                    width: 0 !important;
                    overflow: hidden !important;
                }
            `;
            document.head.appendChild(style);
        }, 1000);
    }

    function showToastMessage(message) {
        // ... (نفس الكود الأصلي)
    }

    function getUserProfile() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            return userDataString ? JSON.parse(userDataString) : null;
        } catch (e) {
            return null;
        }
    }

    function isUserAdFree(userProfile) {
        if (!userProfile) return false;
        if (userProfile.isAdmin) return false;
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

    function checkAndApplyRules() {
        const userProfile = getUserProfile();
        applyAdRules(userProfile);
    }

    function setupUserMonitoring() {
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                checkAndApplyRules();
            }
        }, 1000);
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(checkAndApplyRules, 200);
            }
        });
    }

    // ==========================================================
    // ✅ البدء الفوري مع أولوية الاستثناء العالمي
    // ==========================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initAdControl, 100);
        });
    } else {
        setTimeout(initAdControl, 100);
    }
})();
