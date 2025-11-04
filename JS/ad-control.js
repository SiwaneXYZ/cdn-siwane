// ad-control.js - إصدار v117 (مبسط بدون صفحات مستثنية)
// + ✅ إخفاء الإعلانات والطبقات الشفافة للمستخدمين VIPP
// + ✅ حل مشاكل التعارض مع أنظمة الحجب
// + ✅ تحسين الأداء والكفاءة

(function() {
    'use strict';

    // ==========================================================
    // ✅ 1. إعدادات النظام
    // ==========================================================
    let checkInterval = null;
    let isInitialized = false;
    let mutationObserver = null;

    const config = {
        checkDelay: 500,
        retryLimit: 10,
        toastDuration: 5000
    };

    // ==========================================================
    // ✅ 2. نظام التسجيل
    // ==========================================================
    const logger = {
        log: (message) => console.log(`[Ad-Control v117] ${message}`),
        error: (message, error) => console.error(`[Ad-Control v117] ${message}`, error),
        info: (message) => console.info(`[Ad-Control v117] ${message}`)
    };

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
        
        logger.log('Initializing Ad Control System...');
        isInitialized = true;
        
        setupUserMonitoring();
    }

    // ==========================================================
    // ✅ 4. مراقبة بيانات المستخدم
    // ==========================================================
    function setupUserMonitoring() {
        let retryCount = 0;
        
        checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                checkInterval = null;
                applyUserBasedRules(userProfile);
            } else if (retryCount >= config.retryLimit) {
                clearInterval(checkInterval);
                checkInterval = null;
                logger.log('User profile not found after retries, applying normal rules');
                applyUserBasedRules(null);
            }
            
            retryCount++;
        }, config.checkDelay);

        // مراقبة تغييرات التخزين
        window.adControlStorageHandler = (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(() => {
                    applyUserBasedRules(getUserProfile());
                }, 100);
            }
        };
        window.addEventListener('storage', window.adControlStorageHandler);
    }

    // ==========================================================
    // ✅ 5. الدوال المساعدة
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

    function isUserVipp(userProfile) {
        if (!userProfile) return false;
        
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        return accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp';
    }

    function isUserAdmin(userProfile) {
        return userProfile ? userProfile.isAdmin : false;
    }

    // ==========================================================
    // ✅ 6. إدارة التمرير
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
    // ✅ 7. نظام الإشعارات
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
    // ✅ 8. إدارة العلم العام
    // ==========================================================
    function setGlobalBypassFlag(isBypassed) {
        if (typeof window.PU === 'undefined') {
            window.PU = {};
        }
        window.PU.iAd = isBypassed;
        logger.log(`Global bypass flag set: ${isBypassed}`);
    }

    // ==========================================================
    // ✅ 9. القواعد الرئيسية بناءً على نوع المستخدم
    // ==========================================================
    function applyUserBasedRules(userProfile) {
        logger.log('Applying user-based ad rules');
        
        // إعادة التعيين أولاً
        document.body.classList.remove('js-antiadblocker');
        setGlobalBypassFlag(false);
        
        const isVipp = isUserVipp(userProfile);
        const isAdmin = isUserAdmin(userProfile);
        
        let statusMessage = '';

        // ✅ الأولوية: المستخدمون المعفيون (VIPP)
        if (isVipp) {
            logger.log('VIPP user detected - applying ad-free experience');
            
            setGlobalBypassFlag(true);
            hideAllAdsAndBlockers();
            enableBodyScroll();
            document.body.classList.add('js-antiadblocker');
            startMutationObserver();
            
            statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
            
        } 
        // ✅ الثاني: المسؤولون (يرون الإعلانات للاختبار)
        else if (isAdmin) {
            logger.log('Admin user - showing ads for testing');
            
            setGlobalBypassFlag(true);
            showAllAds();
            stopMutationObserver();
            
            statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
            
        } 
        // ✅ الثالث: المستخدمون العاديون
        else {
            logger.log('Normal user - showing standard ads');
            
            setGlobalBypassFlag(false);
            showAllAds();
            stopMutationObserver();
            
            statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
        }

        // عرض الإشعار (مرة واحدة فقط)
        if (statusMessage && !window.__ad_control_toast_shown) {
            showToast(statusMessage);
            window.__ad_control_toast_shown = true;
            
            // إعادة تعيين العلامة بعد فترة
            setTimeout(() => {
                window.__ad_control_toast_shown = false;
            }, 60000);
        }
    }

    // ==========================================================
    // ✅ 10. نظام إخفاء الإعلانات والطبقات الشفافة
    // ==========================================================
    function hideAllAdsAndBlockers() {
        const styleId = 'global-ad-free-style-v117';
        let styleElement = document.getElementById(styleId);
        
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        // ✅ CSS شامل لإخفاء كل الإعلانات والطبقات الشفافة
        styleElement.textContent = `
            /* ===== الإعلانات التقليدية ===== */
            .adsbygoogle, ins.adsbygoogle, 
            iframe[src*="ads"], iframe[id*="aswift_"], iframe[id*="google_ads_frame"],
            div[id*="ad-slot"], div[id*="AdContainer"], div[class*="ad-unit"], 
            div[class*="ads-container"], div[class*="ad_wrapper"],
            .pAd.show-if-js, .rAd.show-if-js, .pAdIf.show-if-js, .adB,
            [class*="advertisement"], [class*="banner-ad"],
            [data-ad-status], [data-adsbygoogle-status] {
                display: none !important; 
                visibility: hidden !important; 
                opacity: 0 !important; 
                height: 0 !important; 
                width: 0 !important; 
                overflow: hidden !important;
                pointer-events: none !important;
            }

            /* ===== أنظمة الحجب والطبقات الشفافة ===== */
            .js-antiadblocker, .js-accessblocker, .papW,
            [class*="adblock"], [class*="anti-ad"], 
            [class*="blocker"], [class*="overlay"],
            [class*="popup"], [class*="modal"],
            .ad-blocker-overlay, .anti-ad-overlay,
            .blocker-layer, .popup-backdrop,
            .modal-backdrop, .overlay-mask {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                background: transparent !important;
                pointer-events: none !important;
            }

            /* العناصر المخفية التي قد تعود للظهور */
            [style*="display: block"][class*="adblock"],
            [style*="display: flex"][class*="adblock"],
            [style*="visibility: visible"][class*="adblock"],
            [style*="opacity: 1"][class*="adblock"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
            }

            /* ✅ إصلاح مشكلة التمرير */
            body, html {
                overflow: auto !important;
                position: static !important;
                height: auto !important;
            }

            /* ✅ إزالة أي خلفيات شفافة */
            body::before, body::after,
            html::before, html::after,
            .overlay-bg, .backdrop-blur {
                display: none !important;
                background: transparent !important;
                backdrop-filter: none !important;
            }

            /* ✅ ضمان أن الجسم قابل للنقر والتمرير */
            body {
                pointer-events: auto !important;
                user-select: auto !important;
            }
        `;

        // ✅ التنظيف الفوري للعناصر الموجودة
        cleanupExistingElements();
        
        logger.log('Comprehensive ad and blocker hiding applied');
    }

    function cleanupExistingElements() {
        const selectorsToClean = [
            '.js-antiadblocker',
            '.js-accessblocker', 
            '.papW',
            '.adblock-overlay',
            '.anti-ad-overlay',
            '.blocker-overlay',
            '[class*="adblock"]',
            '[class*="anti-ad"]',
            '[class*="blocker"]'
        ];

        selectorsToClean.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(element => {
                    element.style.cssText = `
                        display: none !important; 
                        visibility: hidden !important; 
                        opacity: 0 !important;
                        position: fixed !important;
                        top: -9999px !important;
                        left: -9999px !important;
                        width: 0 !important;
                        height: 0 !important;
                        overflow: hidden !important;
                        pointer-events: none !important;
                    `;
                });
            } catch (error) {
                logger.error(`Error cleaning up selector: ${selector}`, error);
            }
        });

        // ✅ التأكد من أن الجسم قابل للتمرير
        document.body.style.cssText = `
            overflow: auto !important;
            position: static !important;
            height: auto !important;
            pointer-events: auto !important;
        `;
    }

    function showAllAds() {
        const styleElement = document.getElementById('global-ad-free-style-v117');
        if (styleElement) {
            styleElement.remove();
            logger.log('Ad hiding style removed - ads visible');
        }
        
        // ✅ إعادة تعيين تنسيقات الجسم
        document.body.style.cssText = '';
        document.documentElement.style.cssText = '';
    }

    // ==========================================================
    // ✅ 11. مراقبة العناصر الجديدة (للمستخدمين VIPP فقط)
    // ==========================================================
    function startMutationObserver() {
        if (mutationObserver) return;
        
        mutationObserver = new MutationObserver((mutations) => {
            let needsCleanup = false;
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        const element = node;
                        if (
                            element.classList?.contains('js-antiadblocker') ||
                            element.classList?.contains('js-accessblocker') ||
                            element.classList?.contains('papW') ||
                            element.classList?.value?.includes('adblock') ||
                            element.classList?.value?.includes('anti-ad') ||
                            element.classList?.value?.includes('blocker')
                        ) {
                            needsCleanup = true;
                        }
                    }
                });
            });
            
            if (needsCleanup) {
                setTimeout(cleanupExistingElements, 50);
            }
        });

        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });

        logger.log('Mutation observer started for VIPP user');
    }

    function stopMutationObserver() {
        if (mutationObserver) {
            mutationObserver.disconnect();
            mutationObserver = null;
            logger.log('Mutation observer stopped');
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
        
        stopMutationObserver();
        
        if (window.adControlStorageHandler) {
            window.removeEventListener('storage', window.adControlStorageHandler);
        }
        
        isInitialized = false;
        logger.log('Ad control system cleaned up');
    }

    // جعل دالة التنظيف متاحة globally
    window.adControlCleanup = cleanup;

})();
