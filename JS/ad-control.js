// ad-control.js - إصدار v150 (بدون إدارة الصفحات - يعتمد على Tags فقط)
(function() {
    'use strict';

    // ==========================================================
    // ✅ إشعار Toast محسّن يظهر في الأسفل
    // ==========================================================
    function showExemptionToast(message, type = 'success') {
        // إزالة أي إشعارات سابقة
        const existingToast = document.querySelector('.ad-control-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // تحديد الألوان حسب النوع
        const colors = {
            success: '#4CAF50',
            info: '#2196F3',
            warning: '#FF9800',
            error: '#f44336'
        };

        const backgroundColor = colors[type] || colors.success;

        // إنشاء عنصر Toast
        const toast = document.createElement('div');
        toast.className = 'ad-control-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                    &times;
                </button>
            </div>
        `;

        // إضافة الأنماط
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            z-index: 10000;
            background: ${backgroundColor};
            color: white;
            padding: 0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 300px;
            max-width: 90%;
            opacity: 0;
            transition: all 0.3s ease-in-out;
            font-family: system-ui, -apple-system, sans-serif;
        `;

        const toastContent = toast.querySelector('.toast-content');
        toastContent.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
        `;

        const toastMessage = toast.querySelector('.toast-message');
        toastMessage.style.cssText = `
            flex: 1;
            margin-right: 10px;
            font-size: 14px;
            font-weight: 500;
        `;

        const toastClose = toast.querySelector('.toast-close');
        toastClose.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s;
        `;

        toastClose.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(255,255,255,0.2)';
        });

        toastClose.addEventListener('mouseleave', function() {
            this.style.background = 'none';
        });

        // إضافة إلى الصفحة
        document.body.appendChild(toast);

        // تحريك Toast للدخول
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
            toast.style.opacity = '1';
        }, 100);

        // إخفاء تلقائي بعد 5 ثواني
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.transform = 'translateX(-50%) translateY(100px)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 5000);

        return toast;
    }

    // ==========================================================
    // ✅ اكتشاف إشارات استثناء الصفحات من خلال Tags فقط
    // ==========================================================
    function detectPageExemption() {
        // 1. التحقق من meta tag - الأفضلية الأولى
        const metaBypass = document.querySelector('meta[name="bypass-adblock"]');
        if (metaBypass && metaBypass.getAttribute('content') === 'true') {
            console.log('🎯 Ad-Control: Page exempted via meta tag');
            return true;
        }

        // 2. التحقق من class في body - الأفضلية الثانية
        if (document.body.classList.contains('adblock-bypass')) {
            console.log('🎯 Ad-Control: Page exempted via body class');
            return true;
        }

        // 3. التحقق من أي إشارة أخرى قد تكون مستخدمة في onload.js
        const additionalSelectors = [
            '[data-adblock-bypass="true"]',
            '.no-adblock-check',
            '.bypass-adblock'
        ];

        for (let selector of additionalSelectors) {
            if (document.querySelector(selector)) {
                console.log(`🎯 Ad-Control: Page exempted via selector: ${selector}`);
                return true;
            }
        }

        return false;
    }

    // ==========================================================
    // ✅ تطبيق الاستثناء العالمي مع إشعار
    // ==========================================================
    function applyGlobalExemption() {
        if (detectPageExemption()) {
            console.log('🎯 Ad-Control: Global page exemption detected via tags');
            
            setGlobalBypassFlag(true);
            hideAllBlockerPopups();
            enableBodyScroll();
            hideAllAds();
            
            // ⭐️ إشعار للمستخدم أن الصفحة معفاة
            showExemptionToast('🔓 تم استثناء هذه الصفحة من فحص الإعلانات', 'info');
            
            return true;
        }
        return false;
    }

    // ==========================================================
    // ✅ التهيئة الذكية
    // ==========================================================
    function initAdControl() {
        console.log('🚀 Ad-Control System (v150) - Initializing (Tags Only)...');

        // التحقق من الاستثناء العالمي أولاً عبر Tags
        if (applyGlobalExemption()) {
            return;
        }

        // النظام العادي للمستخدمين
        setTimeout(() => {
            checkAndApplyRules();
            setupUserMonitoring();
        }, 1500);
    }

    // ==========================================================
    // ✅ تطبيق قواعد المستخدم مع إشعارات مخصصة
    // ==========================================================
    function applyAdRules(userProfile) {
        // التحقق من الاستثناء العالمي عبر Tags
        if (detectPageExemption()) {
            return;
        }

        const userIsAdFree = isUserAdFree(userProfile);
        const isAdmin = userProfile ? userProfile.isAdmin : false;
        
        let statusMessage = '';
        let toastType = 'info';
        let showToast = true;
        
        if (isAdmin) {
            statusMessage = '⚙️ وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام';
            toastType = 'warning';
            setGlobalBypassFlag(true);
        } else if (userIsAdFree) {
            statusMessage = '🎉 مبروك! حسابك معفي من عرض الإعلانات';
            toastType = 'success';
            setGlobalBypassFlag(true);
            hideAllAds();
            enableBodyScroll();
            hideAllBlockerPopups();
        } else {
            statusMessage = 'ℹ️ لم يتم تفعيل الإعفاء من الإعلانات لحسابك';
            toastType = 'info';
            setGlobalBypassFlag(false);
        }

        if (showToast && !window.__ad_control_toast_shown) {
            showExemptionToast(statusMessage, toastType);
            window.__ad_control_toast_shown = true;
        }
    }

    // ==========================================================
    // ✅ الدوال المساعدة
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
        
        console.log(`Ad-Control: PU.iAd locked to ${isBypassed}`);
    }

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

        document.body.classList.remove('no-scroll', 'adblock-blocked');
        document.documentElement.classList.remove('no-scroll', 'adblock-blocked');
        
        const bodyStyle = document.body.style;
        if (bodyStyle.overflow === 'hidden') {
            bodyStyle.removeProperty('overflow');
        }
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
            
            console.log('Ad-Control: Ads hidden via CSS');
        }, 1000);
    }

    function getUserProfile() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            return userDataString ? JSON.parse(userDataString) : null;
        } catch (e) {
            console.log('Ad-Control: No user profile found');
            return null;
        }
    }

    function isUserAdFree(userProfile) {
        if (!userProfile) {
            console.log('Ad-Control: No user profile - showing ads');
            return false;
        }
        
        if (userProfile.isAdmin) {
            console.log('Ad-Control: Admin user - showing ads for testing');
            return false;
        }
        
        if (userProfile.isVip === true) {
            console.log('Ad-Control: VIP user detected - hiding ads');
            return true;
        }
        
        if (userProfile.adFreeExpiry === null) {
            console.log('Ad-Control: Permanent ad-free user - hiding ads');
            return true;
        }

        if (userProfile.adFreeExpiry && userProfile.adFreeExpiry.seconds) {
            const expiryMs = userProfile.adFreeExpiry.seconds * 1000;
            if (expiryMs > Date.now()) {
                console.log('Ad-Control: Temporary ad-free user - hiding ads');
                return true;
            }
        }
        
        const accountType = (userProfile.accountType || 'normal').toLowerCase();
        if (accountType === 'vipp' || userProfile.adStatus === 'vipp') {
            console.log('Ad-Control: Legacy VIP user - hiding ads');
            return true;
        }
        
        console.log('Ad-Control: Normal user - showing ads');
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

        // مراقبة تغييرات Tags الديناميكية
        observeDynamicChanges();
    }

    // ==========================================================
    // ✅ مراقبة التغييرات الديناميكية في الـ Tags
    // ==========================================================
    function observeDynamicChanges() {
        // مراقبة إضافة meta tags ديناميكياً
        const observer = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (let node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // التحقق إذا تم إضافة meta tag
                            if (node.tagName === 'META' && 
                                node.getAttribute('name') === 'bypass-adblock' &&
                                node.getAttribute('content') === 'true') {
                                console.log('Ad-Control: Dynamic meta tag added - applying exemption');
                                applyGlobalExemption();
                            }
                            
                            // التحقق إذا تم إضافة عناصر أخرى
                            if (node.matches && (
                                node.matches('.adblock-bypass') ||
                                node.matches('[data-adblock-bypass="true"]') ||
                                node.matches('.no-adblock-check')
                            )) {
                                console.log('Ad-Control: Dynamic exemption element added');
                                applyGlobalExemption();
                            }
                        }
                    }
                }
                
                // مراقبة تغييرات class في body
                if (mutation.type === 'attributes' && 
                    mutation.target === document.body &&
                    mutation.attributeName === 'class') {
                    if (document.body.classList.contains('adblock-bypass')) {
                        console.log('Ad-Control: Body class changed - applying exemption');
                        applyGlobalExemption();
                    }
                }
            }
        });

        observer.observe(document.head, { childList: true, subtree: true });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }

    // ==========================================================
    // ✅ البدء الفوري
    // ==========================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initAdControl, 100);
        });
    } else {
        setTimeout(initAdControl, 100);
    }
})();
