// ad-control.js - إصدار نظيف بدون تدخل في التخصيصات
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
        // ✅ CSS نظيف جداً - يستهدف الإعلانات فقط
        const style = document.createElement('style');
        style.id = 'clean-ad-remover-final';
        style.textContent = `
            /* إعلانات Google فقط - بدون أي تأثير جانبي */
            ins.adsbygoogle {
                display: none !important;
            }
            
            .adsbygoogle {
                display: none !important;
            }
            
            /* منع popup مانع الإعلانات فقط */
            .js-antiadblocker {
                display: none !important;
            }
        `;
        
        const existingStyle = document.getElementById('clean-ad-remover-final');
        if (existingStyle) existingStyle.remove();
        
        document.head.appendChild(style);
        
        // ✅ مراقبة بسيطة للإعلانات الجديدة
        startMinimalAdMonitoring();
        
        console.log('🎉 تم إخفاء الإعلانات بنجاح');
    }
    
    function startMinimalAdMonitoring() {
        // مراقبة بسيطة دون تدخل في الأنماط
        setInterval(() => {
            const ads = document.querySelectorAll('ins.adsbygoogle, .adsbygoogle');
            ads.forEach(ad => {
                if (ad.style.display !== 'none') {
                    ad.style.display = 'none';
                }
            });
        }, 1000);
    }
})();
