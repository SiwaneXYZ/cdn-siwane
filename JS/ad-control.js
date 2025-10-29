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
        
        // ✅ فقط إذا كان VIP → معفي من الإعلانات
        return accountTypeLower === 'vipp';
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
            // ✅ المستخدم VIP: نخفي الإعلانات فقط
            hideAdsOnly();
        } else if (userIsAdmin) {
            // ✅ الأدمن: نترك الإعلانات ظاهرة (للمراقبة)
            showAllAds();
        }
        // ✅ المستخدم العادي أو بريميوم: نترك النظام الأصلي يعمل (لا نتدخل)
    }
    
    function hideAdsOnly() {
        // طريقة آمنة لإخفاء الإعلانات فقط دون العناصر الوصفية
        const style = document.createElement('style');
        style.id = 'vip-ad-free-style';
        style.textContent = `
            /* إخفاء إعلانات Google التلقائية واليدوية فقط */
            .adsbygoogle,
            ins.adsbygoogle,
            iframe[src*="ads"],
            iframe[src*="doubleclick"],
            iframe[src*="googleads"],
            [data-ad-status],
            [data-ad-client],
            [data-ad-slot] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
            }
            
            /* منع ظهور البوب أب الخاص بمانع الإعلانات للمستخدمين VIP */
            .js-antiadblocker {
                display: none !important;
            }
            
            /* ✅ الحفاظ على العناصر الوصفية في البروفيل - مهم جداً */
            #profile-ad-free-status,
            #profile-ad-free-item,
            #profile-premium-expiry,
            #profile-premium-expiry-item,
            #profile-account-type,
            [class*="profile-"],
            [id*="profile-"] {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                height: auto !important;
                width: auto !important;
                overflow: visible !important;
            }
        `;
        
        // إزالة النمط السابق إذا موجود
        const existingStyle = document.getElementById('vip-ad-free-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
        console.log('Ads hidden for VIP user (preserving profile elements)');
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
