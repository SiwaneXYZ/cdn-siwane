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
        // تشغيل فحص فوري وسريع
        checkAndApplyRules();

        console.log('Initializing VIP Ad Control System...');
        
        // التحقق من حالة المستخدم كل 500 ملي ثانية (لضمان السرعة)
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                applyAdRules(userProfile);
            }
        }, 500); // تم تقليل الفترة لسرعة الاستجابة
        
        // التحقق أيضاً بعد 3 ثوانٍ (كدعم إضافي في حالة تأخر تحميل البيانات)
        setTimeout(() => {
            const userProfile = getUserProfile();
            if (userProfile) {
                applyAdRules(userProfile);
            }
        }, 3000); // تم تقليل الفترة
        
        // الاستماع لتحديثات بيانات المستخدم
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                // تأخير بسيط لمنح المتصفح وقتاً لمعالجة البيانات
                setTimeout(checkAndApplyRules, 100); 
            }
        });
    }

    // دالة مساعدة لتطبيق القواعد
    function checkAndApplyRules() {
        const userProfile = getUserProfile();
        if (userProfile) {
            applyAdRules(userProfile);
        }
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
    
    // ==========================================================
    // ✅✅✅ الدالة المنطقية للتحقق من حالة الإعفاء من الإعلانات ✅✅✅
    // ==========================================================
    function isUserAdFree(userProfile) {
        if (!userProfile) return false;

        // 1. الأدمن والمشرفين يرون الإعلانات (للمراقبة)
        if (userProfile.isAdmin) return false;
        
        // 2. التحقق من حقل الإعفاء (adFreeExpiry) - الأولوية القصوى
        const adFreeExpiry = userProfile.adFreeExpiry;

        if (adFreeExpiry !== undefined && adFreeExpiry !== null) {
            // الحالة أ: adFreeExpiry هو كائن طابع زمني (إعفاء مؤقت أو منتهي)
            if (typeof adFreeExpiry === 'object' && adFreeExpiry.seconds) {
                const expiryTimestampMs = adFreeExpiry.seconds * 1000;
                
                if (expiryTimestampMs > Date.now()) {
                    console.log('Ad-Free: Active (Temporary via adFreeExpiry)');
                    return true; 
                } else {
                    // التاريخ انتهى (مثل المثال الذي يرجع لعام 2015)
                    console.log('Ad-Free: Expired (Date has passed)');
                    return false;
                }
            }
        } 
        
        // 3. التحقق من adFreeExpiry === null (الحالة الدائمة)
        // يتم التعامل مع هذه الحالة بشكل منفصل في حال تم تعيين القيمة كـ null صراحةً
        if (adFreeExpiry === null) {
            console.log('Ad-Free: Active (Permanent via adFreeExpiry = null)');
            return true; 
        }

        // 4. التحقق من حالة VIPP (كدعم للسيناريوهات الدائمة البديلة)
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        if (accountTypeLower === 'vipp') {
            console.log('Ad-Free: Active (via accountType = VIPP)');
            return true;
        }
        
        // 5. إذا لم ينطبق أي من الشروط أعلاه، يعرض الإعلانات
        console.log('Ad-Free: Inactive (Showing Ads)');
        return false;
    }
    // ==========================================================
    
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
            // الأدمن أو المستخدم العادي/الذي انتهت صلاحيته: نضمن ظهور الإعلانات
            showAllAds(); 
        }
    }
    
    function hideAllAds() {
        const style = document.createElement('style');
        style.id = 'vip-ad-free-style';
        style.textContent = `
            /* إخفاء إعلانات Google AdSense */
            .adsbygoogle,
            ins.adsbygoogle {
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
            div[id*="ad-slot"],
            div[id*="AdContainer"],
            div[class*="ad-unit"],
            div[class*="ads-container"],
            div[class*="ad_wrapper"] {
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
        // إزالة نمط الإخفاء
        const style = document.getElementById('vip-ad-free-style');
        if (style) {
            style.remove();
            console.log('Ads style removed for user');
        }
    }
})();
