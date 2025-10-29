// ad-control-clean.js - إصدار نظيف بدون أي CSS
(function() {
    'use strict';
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        console.log('🚀 بدء نظام التحكم في الإعلانات (بدون CSS)...');
        
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
        
        if (accountTypeLower === 'premium') {
            if (userProfile.adFreeExpiry === null) return true;
            
            if (userProfile.adFreeExpiry && userProfile.adFreeExpiry.seconds) {
                const expiryTime = userProfile.adFreeExpiry.seconds * 1000;
                return expiryTime > Date.now();
            }
        }
        
        return false;
    }
    
    function applyAdRules(userProfile) {
        const userIsAdFree = isUserAdFree(userProfile);
        
        console.log('🔍 تطبيق قواعد الإعلانات:', { 
            accountType: userProfile.accountType,
            adFreeExpiry: userProfile.adFreeExpiry,
            isAdFree: userIsAdFree
        });
        
        if (userIsAdFree) {
            console.log('✅ حساب معفي من الإعلانات - التفعيل');
            activateAdFreeMode();
        }
    }
    
    function activateAdFreeMode() {
        // ✅ لا نضيف أي CSS - نستخدم JavaScript مباشرة
        hideAdsWithJS();
        blockNewAds();
        hideAdBlockPopup();
        
        console.log('🎉 تم إخفاء الإعلانات بنجاح (بدون CSS)');
    }
    
    function hideAdsWithJS() {
        // إخفاء الإعلانات الحالية باستخدام JavaScript مباشرة
        const hideExistingAds = () => {
            const ads = document.querySelectorAll('ins.adsbygoogle, .adsbygoogle');
            ads.forEach(ad => {
                // ✅ نستخدم فقط style.display بدون CSS
                ad.style.display = 'none';
            });
        };
        
        // التنفيذ الفوري
        hideExistingAds();
        
        // تكرار كل ثانية للإعلانات الجديدة
        setInterval(hideExistingAds, 1000);
    }
    
    function blockNewAds() {
        // منع تحميل إعلانات جديدة
        const originalAppend = Element.prototype.appendChild;
        Element.prototype.appendChild = function(element) {
            if (element.tagName === 'SCRIPT' && element.src) {
                const src = element.src;
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
    
    function hideAdBlockPopup() {
        // إخفاء popup مانع الإعلانات باستخدام JavaScript
        const hidePopup = () => {
            const popups = document.querySelectorAll('.js-antiadblocker');
            popups.forEach(popup => {
                popup.style.display = 'none';
            });
        };
        
        hidePopup();
        setInterval(hidePopup, 1000);
    }
})();
