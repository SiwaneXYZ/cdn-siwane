// ad-control.js - النظام النهائي
(function() {
    'use strict';
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        console.log('🚀 بدء نظام التحكم في الإعلانات...');
        
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                applyAdRules(userProfile);
            }
        }, 2000);
        
        setTimeout(() => {
            const userProfile = getUserProfile();
            if (userProfile) applyAdRules(userProfile);
        }, 5000);
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(() => {
                    const userProfile = getUserProfile();
                    if (userProfile) applyAdRules(userProfile);
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
    
    function isUserAdFree(userProfile) {
        if (!userProfile || userProfile.isAdmin) return false;
        
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        
        // ✅ الشرط الصحيح: حساب premium مع adFreeExpiry = null
        if (accountTypeLower === 'premium') {
            // التحقق من adFreeExpiry
            if (userProfile.adFreeExpiry === null) {
                return true; // معفي دائم
            }
            
            // التحقق إذا كان adFreeExpiry نشط (للمواعيد المؤقتة)
            if (userProfile.adFreeExpiry && userProfile.adFreeExpiry.seconds) {
                const expiryTime = userProfile.adFreeExpiry.seconds * 1000;
                const currentTime = Date.now();
                return expiryTime > currentTime; // معفي مؤقت ونشط
            }
        }
        
        return false;
    }
    
    function applyAdRules(userProfile) {
        const userIsAdFree = isUserAdFree(userProfile);
        
        console.log('🔍 تطبيق قواعد الإعلانات للمستخدم:', { 
            accountType: userProfile.accountType,
            adFreeExpiry: userProfile.adFreeExpiry,
            isAdFree: userIsAdFree,
            isAdmin: userProfile.isAdmin 
        });
        
        if (userIsAdFree) {
            console.log('✅ حساب معفي من الإعلانات - تفعيل الوضع الخالي من الإعلانات');
            activateAdFreeMode();
        } else if (userProfile.isAdmin) {
            console.log('🛡️ حساب أدمن - عرض الإعلانات للمراقبة');
        } else {
            console.log('👤 حساب عادي أو بريميوم غير معفي - عرض الإعلانات');
        }
    }
    
    function activateAdFreeMode() {
        // 1. إنشاء نمط إخفاء الإعلانات
        const style = document.createElement('style');
        style.id = 'ad-free-mode-style';
        style.textContent = `
            /* === إخفاء جميع أنواع الإعلانات === */
            
            /* إعلانات Google الأساسية */
            .adsbygoogle,
            ins.adsbygoogle,
            [data-ad-status],
            [data-ad-client],
            [data-ad-slot],
            
            /* إعلانات iframe */
            iframe[src*="pagead2.googlesyndication.com"],
            iframe[src*="googleads.g.doubleclick.net"],
            iframe[src*="adsystem.google.com"],
            iframe[src*="doubleclick.net"],
            
            /* عناصر إعلانية شائعة */
            [id*="-ad-"],
            [class*="-ad-"],
            [id*="_ad_"],
            [class*="_ad_"],
            [id*="banner-ad"],
            [class*="banner-ad"],
            [id*="sponsored"],
            [class*="sponsored"] {
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
            
            /* منع ظهور popup مانع الإعلانات */
            .js-antiadblocker,
            [class*="adblock"],
            [class*="anti-ad"] {
                display: none !important;
            }
        `;
        
        // إزالة الأنماط السابقة
        const existingStyle = document.getElementById('ad-free-mode-style');
        if (existingStyle) existingStyle.remove();
        
        document.head.appendChild(style);
        
        // 2. منع تحميل إعلانات جديدة
        blockNewAdsLoading();
        
        // 3. مراقبة مستمرة للإعلانات الجديدة
        startAdMonitoring();
        
        console.log('🎉 تم تفعيل الوضع الخالي من الإعلانات بنجاح');
    }
    
    function blockNewAdsLoading() {
        // منع تحميل scripts إعلانات Google
        const originalAppend = Element.prototype.appendChild;
        Element.prototype.appendChild = function(element) {
            if (element.tagName === 'SCRIPT') {
                const src = element.src || '';
                if (src.includes('adsbygoogle') || 
                    src.includes('pagead2.googlesyndication.com') ||
                    src.includes('doubleclick.net')) {
                    console.log('🚫 تم منع تحميل إعلان:', src);
                    return element;
                }
            }
            return originalAppend.call(this, element);
        };
    }
    
    function startAdMonitoring() {
        // مراقبة أي إعلانات جديدة تظهر
        setInterval(() => {
            const ads = document.querySelectorAll(`
                ins.adsbygoogle,
                .adsbygoogle,
                iframe[src*="pagead2"],
                iframe[src*="doubleclick"],
                [data-ad-slot],
                [data-ad-client]
            `);
            
            ads.forEach(ad => {
                if (ad.offsetParent !== null || 
                    ad.style.display !== 'none' || 
                    window.getComputedStyle(ad).display !== 'none') {
                    ad.style.cssText = 'display:none!important;visibility:hidden!important;opacity:0!important;height:0!important;width:0!important;';
                }
            });
        }, 500);
    }
})();
