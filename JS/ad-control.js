// ad-control.js - نظام آمن 100%
(function() {
    'use strict';
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        console.log('🚀 بدء نظام التحكم في الإعلانات للمستخدمين VIP...');
        
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                applyVIPAdRules(userProfile);
            }
        }, 2000);
        
        setTimeout(() => {
            const userProfile = getUserProfile();
            if (userProfile) applyVIPAdRules(userProfile);
        }, 5000);
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(() => {
                    const userProfile = getUserProfile();
                    if (userProfile) applyVIPAdRules(userProfile);
                }, 100);
            }
        });
    }
    
    function getUserProfile() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            return userDataString ? JSON.parse(userDataString) : null;
        } catch (e) {
            return null;
        }
    }
    
    function isUserVIP(userProfile) {
        if (!userProfile || userProfile.isAdmin) return false;
        return (userProfile.accountType || 'normal').toLowerCase() === 'vipp';
    }
    
    function applyVIPAdRules(userProfile) {
        if (isUserVIP(userProfile)) {
            console.log('✅ تطبيق إعدادات VIP - إخفاء الإعلانات');
            activateVIPMode();
        }
    }
    
    function activateVIPMode() {
        // 1. أولاً: منع تحميل إعلانات Google من الأساس
        blockGoogleAdsLoading();
        
        // 2. ثانياً: إخفاء الإعلانات الموجودة باستهداف محدد جداً
        hideExistingAdsSafely();
        
        // 3. ثالثاً: منع popup مانع الإعلانات
        blockAdBlockPopup();
        
        // 4. رابعاً: مراقبة مستمرة للإعلانات الجديدة
        startAggressiveAdMonitoring();
    }
    
    function blockGoogleAdsLoading() {
        // منع تحميل scripts إعلانات Google
        const originalAppendChild = Element.prototype.appendChild;
        Element.prototype.appendChild = function(element) {
            if (element.tagName === 'SCRIPT') {
                const src = element.src || '';
                if (src.includes('adsbygoogle') || 
                    src.includes('pagead2.googlesyndication.com') ||
                    src.includes('doubleclick.net')) {
                    console.log('🚫 تم منع تحميل إعلان Google:', src);
                    return element; // لا نضيفه إلى DOM
                }
            }
            return originalAppendChild.call(this, element);
        };
    }
    
    function hideExistingAdsSafely() {
        const style = document.createElement('style');
        style.id = 'vip-ad-remover-safe';
        style.textContent = `
            /* === استهداف الإعلانات فقط === */
            
            /* إعلانات Google المباشرة */
            ins.adsbygoogle,
            .adsbygoogle,
            iframe[src*="pagead2.googlesyndication.com"],
            iframe[src*="googleads.g.doubleclick.net"],
            iframe[src*="adsystem.google.com"],
            
            /* عناصر بإشارات إعلانية واضحة */
            [id*="-ad-"],
            [class*="-ad-"],
            [id*="_ad_"],
            [class*="_ad_"],
            [data-ad-slot]:not([id*="profile"]):not([class*="profile"]),
            [data-ad-client]:not([id*="profile"]):not([class*="profile"]),
            [data-ad-status]:not([id*="profile"]):not([class*="profile"]),
            
            /* إعلانات شائعة أخرى */
            [id*="banner-ad"],
            [class*="banner-ad"],
            [id*="sponsored"],
            [class*="sponsored"],
            [id*="advertisement"],
            [class*="advertisement"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
                position: absolute !important;
                left: -9999px !important;
            }
            
            /* === حماية كاملة لعناصر البروفيل === */
            #profile-ad-free-status,
            #profile-ad-free-item,
            #profile-premium-expiry,
            #profile-premium-expiry-item,
            #profile-account-type,
            #profile-current-points,
            #profile-current-points-item,
            #profile-total-points-earned,
            #profile-total-points-earned-item,
            #profile-total-exchanges,
            #profile-total-exchanges-item,
            #profile-fullname,
            #profile-username,
            #profile-email,
            #profile-phone,
            #profile-created-at,
            #profile-provider,
            #profile-email-status,
            #account-type-badge,
            #pic,
            #astat,
            .profile-pic-container,
            [id^="profile-"],
            [id*="profile-"],
            [class^="profile-"],
            [class*="profile-"] {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                height: auto !important;
                width: auto !important;
                overflow: visible !important;
                position: static !important;
                left: auto !important;
            }
            
            /* منع popup مانع الإعلانات */
            .js-antiadblocker,
            [class*="adblock"],
            [class*="anti-ad"] {
                display: none !important;
            }
        `;
        
        // إزالة أي أنماط سابقة
        const existingStyle = document.getElementById('vip-ad-remover-safe');
        if (existingStyle) existingStyle.remove();
        
        document.head.appendChild(style);
    }
    
    function blockAdBlockPopup() {
        // تأكد من إخفاء popup مانع الإعلانات
        const observer = new MutationObserver(() => {
            const popups = document.querySelectorAll('.js-antiadblocker, [class*="adblock"], [class*="anti-ad"]');
            popups.forEach(popup => {
                popup.style.display = 'none';
                popup.style.visibility = 'hidden';
                popup.style.opacity = '0';
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    function startAggressiveAdMonitoring() {
        // مراقبة مستمرة لأي إعلانات جديدة
        setInterval(() => {
            const ads = document.querySelectorAll(`
                ins.adsbygoogle,
                .adsbygoogle,
                iframe[src*="pagead2"],
                iframe[src*="doubleclick"],
                [data-ad-slot]:not([id*="profile"]),
                [data-ad-client]:not([id*="profile"])
            `);
            
            ads.forEach(ad => {
                if (ad.style.display !== 'none') {
                    ad.style.cssText = 'display:none!important;visibility:hidden!important;opacity:0!important;height:0!important;width:0!important;';
                }
            });
        }, 1000);
    }
})();
