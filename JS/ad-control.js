// ad-control.js - إصدار مركّز على الإعلانات فقط
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
        
        // ✅ حساب premium مع إعفاء من الإعلانات (دائم أو مؤقت)
        if (accountTypeLower === 'premium') {
            // إعفاء دائم
            if (userProfile.adFreeExpiry === null) {
                return true;
            }
            
            // إعفاء مؤقت - التحقق من التاريخ
            if (userProfile.adFreeExpiry && userProfile.adFreeExpiry.seconds) {
                const expiryTime = userProfile.adFreeExpiry.seconds * 1000;
                const currentTime = Date.now();
                return expiryTime > currentTime;
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
        // ✅ CSS مركّز فقط على الإعلانات بدون لمس البروفيل
        const style = document.createElement('style');
        style.id = 'clean-ad-remover';
        style.textContent = `
            /* إعلانات Google فقط - بدون تأثير على البروفيل */
            ins.adsbygoogle,
            .adsbygoogle,
            iframe[src*="pagead2.googlesyndication.com"],
            iframe[src*="googleads.g.doubleclick.net"],
            iframe[src*="doubleclick.net"],
            [data-ad-slot],
            [data-ad-client],
            [data-ad-status] {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
            }
            
            /* منع popup مانع الإعلانات فقط */
            .js-antiadblocker {
                display: none !important;
            }
            
            /* ✅ تأكيد حماية كاملة للبروفيل - لا نغير أي شيء */
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
            .profile-pic-container {
                /* لا نضيف أي أنماط هنا - نتركها كما هي */
            }
        `;
        
        const existingStyle = document.getElementById('clean-ad-remover');
        if (existingStyle) existingStyle.remove();
        
        document.head.appendChild(style);
        
        // ✅ منع تحميل إعلانات جديدة بدون تأثير على البروفيل
        setupAdBlocking();
        
        console.log('🎉 تم إخفاء الإعلانات بنجاح');
    }
    
    function setupAdBlocking() {
        // منع تحميل scripts إعلانات Google
        const originalAppend = Element.prototype.appendChild;
        Element.prototype.appendChild = function(element) {
            if (element.tagName === 'SCRIPT' && element.src) {
                const src = element.src;
                if (src.includes('adsbygoogle') || 
                    src.includes('pagead2.googlesyndication.com') ||
                    src.includes('doubleclick.net')) {
                    console.log('🚫 تم منع تحميل إعلان:', src);
                    return element; // نمنع الإضافة
                }
            }
            return originalAppend.call(this, element);
        };
        
        // ✅ مراقبة بسيطة للإعلانات الجديدة
        const observer = new MutationObserver(() => {
            // نستهدف فقط الإعلانات الواضحة
            const ads = document.querySelectorAll(`
                ins.adsbygoogle,
                .adsbygoogle,
                iframe[src*="pagead2"],
                iframe[src*="doubleclick"]
            `);
            
            ads.forEach(ad => {
                ad.style.display = 'none';
                ad.style.visibility = 'hidden';
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
})();
