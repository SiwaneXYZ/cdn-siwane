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
        
        // التحقق من حالة المستخدم بشكل متكرر حتى يتم تحميل البيانات
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                
                // ✅ تطبيق القواعد فوراً بعد الحصول على البيانات
                applyAdRules(userProfile);
                
                // ✅ تشغيل متأخر إضافي (1 ثانية) للتعامل مع الإعلانات التي يتم حقنها لاحقاً
                setTimeout(() => applyAdRules(userProfile), 1000);
            }
        }, 500); // تقليل الفترة لسرعة الاستجابة
        
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

        // الأدمن والمشرفين يرون الإعلانات (للمراقبة)
        if (userProfile.isAdmin) return false;

        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        
        // 1. ✅ التحقق من حالة VIPP (الإعفاء الدائم)
        if (accountTypeLower === 'vipp') return true;
        
        // 2. ✅ التحقق من حقل الإعفاء المؤقت/الدائم (adFreeExpiry)
        if (userProfile.adFreeExpiry) {
            // adFreeExpiry === null يعني إعفاء دائم
            if (userProfile.adFreeExpiry === null) return true; 
            
            // التحقق من صلاحية الإعفاء المؤقت
            if (userProfile.adFreeExpiry.seconds * 1000 > Date.now()) return true; 
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
            // المستخدم المعفى: نخفي الإعلانات
            hideAllAds();
        } else {
            // الأدمن أو المستخدم العادي: نضمن ظهور الإعلانات
            showAllAds(); 
        }
    }
    
    function hideAllAds() {
        const style = document.createElement('style');
        style.id = 'vip-ad-free-style';
        
        // ✅✅✅ زيادة قوة محددات الإخفاء (CSS Specificity) ✅✅✅
        style.textContent = `
            /* إخفاء إعلانات Google AdSense بقوة عالية */
            html body .adsbygoogle,
            html body ins.adsbygoogle {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
            }
            
            /* إخفاء إطارات iframe التي تحمل كلمة ads أو أسماء معروفة لإعلانات جوجل */
            iframe[src*="ads"],
            iframe[id*="aswift_"],
            iframe[id*="google_ads_frame"] {
                display: none !important;
                visibility: hidden !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
            }

            /* حماية إضافية ضد أي كائنات إعلانية أخرى معروفة */
            html body div[id*="ad-slot"],
            html body div[id*="AdContainer"],
            html body div[class*="ad-unit"],
            html body div[class*="ads-container"],
            html body div[class*="ad_wrapper"] {
                display: none !important;
            }
            
            /* ✅✅✅ قواعد الاستثناء: منع إخفاء عناصر الواجهة الأساسية (يجب أن تتفوق هذه على محددات الإخفاء) */
            #account-type-badge.badge-ad-free,
            #profile-ad-free-item {
                display: block !important; 
                visibility: visible !important;
                opacity: 1 !important;
                height: auto !important;
                width: auto !important;
                overflow: visible !important;
                pointer-events: auto !important;
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
        // إزالة نمط الإخفاء
        const style = document.getElementById('vip-ad-free-style');
        if (style) {
            style.remove();
            console.log('Ads style removed for user');
        }
    }
})();
