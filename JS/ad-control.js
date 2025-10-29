// ad-control.js - إصدار v101 (متوافق مع admin.js v101)
// + ✅ [تعديل v101] قراءة الحقل الجديد 'isVip' (Boolean).
// + ✅ [تعديل v101] إضافة دعم للخلف (Backward Compatibility) لقراءة 'adStatus: vipp'.
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

        console.log('Initializing Ad Control System (v101)...');
        
        // التحقق من حالة المستخدم كل 500 ملي ثانية (لضمان السرعة)
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                applyAdRules(userProfile);
            }
        }, 500); 
        
        // التحقق أيضاً بعد 3 ثوانٍ (كدعم إضافي في حالة تأخر تحميل البيانات)
        setTimeout(() => {
            const userProfile = getUserProfile();
            if (userProfile) {
                applyAdRules(userProfile);
            }
        }, 3000); 
        
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
    // ✅✅✅ [تعديل v101] الدالة المنطقية للتحقق من حالة الإعفاء ✅✅✅
    // ==========================================================
    function isUserAdFree(userProfile) {
        if (!userProfile) return false;

        // 1. الأدمن والمشرفين يرون الإعلانات (للمراقبة)
        if (userProfile.isAdmin) {
            console.log('Ad-Control: Admin user (Showing Ads for testing)');
            return false;
        }
        
        // 2. التحقق من حقل 'isVip' الجديد (الأولوية القصوى)
        if (userProfile.isVip === true) {
            console.log('Ad-Control: Active (via isVip = true)');
            return true;
        }

        // 3. التحقق من 'adFreeExpiry' الدائم (null)
        if (userProfile.adFreeExpiry === null) {
            console.log('Ad-Control: Active (Permanent via adFreeExpiry = null)');
            return true; 
        }

        // 4. التحقق من 'adFreeExpiry' المؤقت (Timestamp)
        const adFreeExpiry = userProfile.adFreeExpiry;
        if (adFreeExpiry && typeof adFreeExpiry === 'object' && adFreeExpiry.seconds) {
            const expiryTimestampMs = adFreeExpiry.seconds * 1000;
            
            if (expiryTimestampMs > Date.now()) {
                console.log('Ad-Control: Active (Temporary via adFreeExpiry)');
                return true; 
            }
        }
        
        // 5. [دعم للخلف] التحقق من الحقول القديمة (vipp)
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        if (accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp') {
            console.log('Ad-Control: Active (Backward compatibility via old "vipp" status)');
            return true;
        }
        
        // 6. إذا لم ينطبق أي من الشروط أعلاه، يعرض الإعلانات
        console.log('Ad-Control: Inactive (Showing Ads)');
        return false;
    }
    // ==========================================================
    
    function applyAdRules(userProfile) {
        const userIsAdFree = isUserAdFree(userProfile);
        
        console.log('Ad-Control: Applying rules. User is Ad-Free:', userIsAdFree);
        
        if (userIsAdFree) {
            // المستخدم المعفى: نخفي الإعلانات
            hideAllAds();
        } else {
            // الأدمن أو المستخدم العادي/الذي انتهت صلاحيته: نضمن ظهور الإعلانات
            showAllAds(); 
        }
    }
    
    function hideAllAds() {
        // ... (كود إخفاء الإعلانات دون تغيير) ...
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
        // console.log('Ads hidden for Ad-Free user'); // (تم تقليل التكرار)
    }
    
    function showAllAds() {
        // إزالة نمط الإخفاء
        const style = document.getElementById('vip-ad-free-style');
        if (style) {
            style.remove();
            console.log('Ad-Control: Ads style removed (Showing Ads)');
        }
    }
})();
