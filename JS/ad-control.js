// ad-control.js - إصدار v115 (تحسينات الاستثناءات الشاملة)
// + ✅ تطبيق إخفاء الإعلانات وإضافة كلاس 'js-antiadblocker' دائماً في الصفحات المختارة لجميع المستخدمين
// + ✅ تطبيق إخفاء الإعلانات وإضافة كلاس 'js-antiadblocker' دائماً للحسابات المعفية (VIPP) في جميع الصفحات
// + ✅ تحسين الأداء وإدارة الذاكرة

(function() {
    'use strict';

    // ==========================================================
    // ✅ 1. الصفحات المستثناة دائماً (لجميع أنواع الحسابات)
    // ==========================================================
    const ALWAYS_EXCEPTION_PATHS = [
        '/p/login.html',
        '/p/profile.html', 
        '/p/packages.html'
    ];

    // ==========================================================
    // ✅ 2. إعدادات النظام
    // ==========================================================
    let checkInterval = null;
    let isInitialized = false;

    const config = {
        checkDelay: 500,
        retryLimit: 10,
        toastDuration: 5000
    };

    // ==========================================================
    // ✅ 3. نظام التسجيل
    // ==========================================================
    const logger = {
        log: (message) => console.log(`[Ad-Control v115] ${message}`),
        error: (message, error) => console.error(`[Ad-Control v115] ${message}`, error),
        info: (message) => console.info(`[Ad-Control v115] ${message}`)
    };

    // ==========================================================
    // ✅ 4. التهيئة الرئيسية
    // ==========================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }

    function initAdControl() {
        if (isInitialized) return;
        
        logger.log('Initializing Enhanced Ad Control System...');
        isInitialized = true;
        
        applyImmediateRules();
        setupUserMonitoring();
    }

    // ==========================================================
    // ✅ 5. تطبيق القواعد الفورية (بدون انتظار بيانات المستخدم)
    // ==========================================================
    function applyImmediateRules() {
        // إذا كانت الصفحة مستثناة، تطبيق القواعد فوراً
        if (isAlwaysExceptionPage()) {
            logger.log('Immediate application for exception page');
            applyExceptionPageRules();
        }
    }

    // ==========================================================
    // ✅ 6. مراقبة بيانات المستخدم
    // ==========================================================
    function setupUserMonitoring() {
        let retryCount = 0;
        
        checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                checkInterval = null;
                applyComprehensiveRules(userProfile);
            } else if (retryCount >= config.retryLimit) {
                clearInterval(checkInterval);
                checkInterval = null;
                logger.log('User profile not found after retries, applying default rules');
                applyComprehensiveRules(null);
            }
            
            retryCount++;
        }, config.checkDelay);

        // مراقبة تغييرات التخزين
        window.adControlStorageHandler = (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(() => {
                    applyComprehensiveRules(getUserProfile());
                }, 100);
            }
        };
        window.addEventListener('storage', window.adControlStorageHandler);
    }

    // ==========================================================
    // ✅ 7. الدوال المساعدة
    // ==========================================================
    function getUserProfile() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            if (!userDataString) return null;
            return JSON.parse(userDataString);
        } catch (e) {
            logger.error('Failed to parse user profile data', e);
            return null;
        }
    }

    function isAlwaysExceptionPage() {
        const currentPath = window.location.pathname;
        return ALWAYS_EXCEPTION_PATHS.some(path => currentPath.startsWith(path));
    }

    function isUserVipp(userProfile) {
        if (!userProfile) return false;
        
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        return accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp';
    }

    function isUserAdmin(userProfile) {
        return userProfile ? userProfile.isAdmin : false;
    }

    // ==========================================================
    // ✅ 8. إدارة التمرير
    // ==========================================================
    function enableBodyScroll() {
        const body = document.body;
        const html = document.documentElement;
        
        ['no-scroll', 'popup-visible', 'noscroll'].forEach(className => {
            body.classList.remove(className);
            html.classList.remove(className);
        });
        
        body.style.removeProperty('overflow');
        html.style.removeProperty('overflow');
        
        logger.log('Body scrolling enabled');
    }

    // ==========================================================
    // ✅ 9. نظام الإشعارات
    // ==========================================================
    function showToast(message) {
        const existingToast = document.querySelector('.ad-control-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'ad-control-toast';
        toast.textContent = message;
        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#333',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '4px',
            zIndex: '10000',
            maxWidth: '300px',
            fontSize: '14px'
        });

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, config.toastDuration);
    }

    // ==========================================================
    // ✅ 10. إدارة العلم العام
    // ==========================================================
    function setGlobalBypassFlag(isBypassed) {
        if (typeof window.PU === 'undefined') {
            window.PU = {};
        }
        window.PU.iAd = isBypassed;
        logger.log(`Global bypass flag set: ${isBypassed}`);
    }

    // ==========================================================
    // ✅ 11. قواعد الصفحات المستثناة (تطبق دائماً)
    // ==========================================================
    function applyExceptionPageRules() {
        logger.log('Applying exception page rules (always ad-free)');
        
        setGlobalBypassFlag(true);
        hideAllAds();
        enableBodyScroll();
        hideBlockerPopups();
        document.body.classList.add('js-antiadblocker');
        
        logger.log('Exception page fully configured - ads hidden, class added');
    }

    // ==========================================================
    // ✅ 12. القواعد الشاملة الرئيسية
    // ==========================================================
    function applyComprehensiveRules(userProfile) {
        logger.log('Applying comprehensive ad rules');
        
        // إعادة التعيين أولاً
        document.body.classList.remove('js-antiadblocker');
        setGlobalBypassFlag(false);
        
        const isExceptionPage = isAlwaysExceptionPage();
        const isVipp = isUserVipp(userProfile);
        const isAdmin = isUserAdmin(userProfile);
        
        let statusMessage = '';
        let showToast = true;

        // ✅ الأولوية: الصفحات المستثناة (لجميع المستخدمين)
        if (isExceptionPage) {
            applyExceptionPageRules();
            showToast = false; // لا عرض إشعار في الصفحات المستثناة
            
        } 
        // ✅ الثاني: المستخدمون المعفيون (VIPP) في جميع الصفحات
        else if (isVipp) {
            logger.log('VIPP user detected - applying ad-free experience');
            
            setGlobalBypassFlag(true);
            hideAllAds();
            enableBodyScroll();
            hideBlockerPopups();
            document.body.classList.add('js-antiadblocker');
            
            statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
            
        } 
        // ✅ الثالث: المسؤولون (يرون الإعلانات للاختبار)
        else if (isAdmin) {
            logger.log('Admin user - showing ads for testing');
            
            setGlobalBypassFlag(true);
            showAllAds();
            
            statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
            
        } 
        // ✅ الرابع: المستخدمون العاديون
        else {
            logger.log('Normal user - showing standard ads');
            
            setGlobalBypassFlag(false);
            showAllAds();
            
            statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
        }

        // عرض الإشعار (مرة واحدة فقط)
        if (showToast && statusMessage && !window.__ad_control_toast_shown) {
            showToast(statusMessage);
            window.__ad_control_toast_shown = true;
            
            // إعادة تعيين العلامة بعد فترة
            setTimeout(() => {
                window.__ad_control_toast_shown = false;
            }, 60000);
        }
    }

    // ==========================================================
    // ✅ 13. إدارة الإعلانات والنوافذ المنبثقة
    // ==========================================================
    function hideBlockerPopups() {
        const blockers = [
            '.js-antiadblocker',
            '.js-accessblocker',
            '.papW',
            '[class*="adblock"]',
            '[class*="anti-ad"]'
        ];
        
        blockers.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.style.cssText = 'display: none !important; visibility: hidden !important;';
            });
        });
    }

    function hideAllAds() {
        const styleId = 'global-ad-free-style';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* إخفاء شامل للإعلانات */
            .adsbygoogle, ins.adsbygoogle, 
            iframe[src*="ads"], iframe[id*="aswift_"], iframe[id*="google_ads_frame"],
            div[id*="ad-slot"], div[id*="AdContainer"], div[class*="ad-unit"], 
            div[class*="ads-container"], div[class*="ad_wrapper"],
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
        logger.log('Global ad hiding style applied');
    }

    function showAllAds() {
        const style = document.getElementById('global-ad-free-style');
        if (style) {
            style.remove();
            logger.log('Ad hiding style removed - ads visible');
        }
    }

    // ==========================================================
    // ✅ 14. التنظيف
    // ==========================================================
    function cleanup() {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        if (window.adControlStorageHandler) {
            window.removeEventListener('storage', window.adControlStorageHandler);
        }
        isInitialized = false;
        logger.log('Ad control system cleaned up');
    }

    // جعل دالة التنظيف متاحة globally إذا لزم الأمر
    window.adControlCleanup = cleanup;

})();
