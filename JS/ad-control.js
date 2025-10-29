// ad-control.js - نظام مستقل تماماً عن onload.js
(function() {
    'use strict';
    
    // الانتظار حتى تحميل الصفحة بالكامل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        console.log('Initializing VIP Ad Control System...');
        
        // التحقق من حالة المستخدم كل ثانيتين (حتى يتم تحميل البيانات)
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                applyAdRules(userProfile);
            }
        }, 2000);
        
        // التحقق أيضاً بعد 5 ثوانٍ (كدعم إضافي)
        setTimeout(() => {
            const userProfile = getUserProfile();
            if (userProfile) {
                applyAdRules(userProfile);
            }
        }, 5000);
        
        // الاستماع لتحديثات بيانات المستخدم
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(() => {
                    const userProfile = getUserProfile();
                    if (userProfile) {
                        applyAdRules(userProfile);
                    }
                }, 100);
            }
        });
    }
    
    function getUserProfile() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            if (!userDataString) return null;
            return JSON.parse(userDataString);
        } catch (e) {
            console.error('Failed to parse user profile data', e);
            return null;
        }
    }
    
    function isUserAdFree(userProfile) {
        if (!userProfile) return false;

        // ✅ الأدمن والمشرفين يرون الإعلانات (للمراقبة)
        if (userProfile.isAdmin) return false;

        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        
        // ✅ حساب VIP دائم (معفي دائماً)
        if (accountTypeLower === 'vipp') return true;
        
        // ✅ حساب Premium نشط
        const isPremiumActive = userProfile.premiumExpiry && 
                              userProfile.premiumExpiry.seconds * 1000 > Date.now();
        if ((accountTypeLower === 'premium' || isPremiumActive)) return true;
        
        // ✅ إعفاء مؤقت من الإعلانات (adFreeExpiry)
        if (userProfile.adFreeExpiry) {
            if (userProfile.adFreeExpiry === null) return true; // دائم
            if (userProfile.adFreeExpiry.seconds * 1000 > Date.now()) return true; // نشط
        }
        
        return false;
    }
    
    function applyAdRules(userProfile) {
        const userIsAdFree = isUserAdFree(userProfile);
        const userIsAdmin = userProfile.isAdmin;
        
        console.log('Applying ad rules for user:', { 
            accountType: userProfile.accountType,
            isAdFree: userIsAdFree,
            isAdmin: userIsAdmin 
        });
        
        if (userIsAdFree && !userIsAdmin) {
            // ✅ المستخدم VIP: نخفي الإعلانات
            hideAllAds();
        } else if (userIsAdmin) {
            // ✅ الأدمن: نترك الإعلانات ظاهرة (للمراقبة)
            showAllAds();
        }
        // ✅ المستخدم العادي: نترك النظام الأصلي يعمل (لا نتدخل)
    }
    
    function hideAllAds() {
        // طريقة آمنة لإخفاء الإعلانات بدون التعارض مع onload.js
        const style = document.createElement('style');
        style.id = 'vip-ad-free-style';
        style.textContent = `
            /* إخفاء إعلانات Google */
            .adsbygoogle,
            [class*="ad-"],
            [class*="ads-"],
            iframe[src*="ads"],
            ins.adsbygoogle {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
            }
            
            /* حماية إضافية من أي إعلانات قد تظهر */
            [id*="ad-"],
            [id*="ads-"],
            div[id*="Ad"],
            div[class*="banner"] {
                display: none !important;
            }
            
            /* منع ظهور البوب أب الخاص بمانع الإعلانات للمستخدمين VIP */
            .js-antiadblocker,
            [class*="adblock"],
            [class*="anti-ad"] {
                display: none !important;
            }
        `;
        
        // إزالة النمط السابق إذا موجود
        const existingStyle = document.getElementById('vip-ad-free-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
        console.log('Ads hidden for VIP user');
    }
    
    function showAllAds() {
        // إزالة نمط الإخفاء (للأدمن فقط)
        const style = document.getElementById('vip-ad-free-style');
        if (style) {
            style.remove();
            console.log('Ads style removed for admin');
        }
    }
})();
