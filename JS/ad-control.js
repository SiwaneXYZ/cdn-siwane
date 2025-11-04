(function() {
    'use strict';

    let checkInterval = null;
    let isInitialized = false;

    // ==========================================================
    // ✅ التهيئة الرئيسية
    // ==========================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        if (isInitialized) return;
        
        console.log('Initializing Ad Control System...'); 
        isInitialized = true;
        
        // تطبيق القواعد فوراً عند التحميل
        checkAndApplyRules();
        
        // التحقق المتكرر (لضمان التقاط بيانات المستخدم)
        checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                checkInterval = null;
                checkAndApplyRules();
            }
        }, 500); 
        
        // الاستماع لتحديثات بيانات المستخدم
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(checkAndApplyRules, 100); 
            }
        });
    }

    function checkAndApplyRules() {
        const userProfile = getUserProfile();
        applyAdRules(userProfile);
    }
    
    // ==========================================================
    // ✅ الحصول على بيانات المستخدم
    // ==========================================================
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
    // ✅ نظام الإشعارات
    // ==========================================================
    function showToast(message) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'ad-control-toast'; 
        toastContainer.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: #333; 
            color: white; 
            padding: 12px 20px; 
            border-radius: 4px; 
            z-index: 10000; 
            max-width: 300px;
            font-size: 14px;
        `;
        
        const toastMessage = document.createElement('div');
        toastMessage.textContent = message;
        toastContainer.appendChild(toastMessage);
        
        const existingToast = document.querySelector('.ad-control-toast');
        if (existingToast) { 
            existingToast.remove(); 
        }
        
        document.body.appendChild(toastContainer);
        
        setTimeout(() => {
            if (toastContainer.parentNode) {
                toastContainer.remove();
            }
        }, 5000); 
    }
    
    // ==========================================================
    // ✅ التحقق من حالة الإعفاء
    // ==========================================================
    function isUserAdFree(userProfile) {
        if (!userProfile) return false;

        // ✅ حساب مدير (لأغراض الاختبار)
        if (userProfile.isAdmin) {
            console.log('Ad-Control: Admin user (Showing Ads for testing)');
            return false;
        }
        
        // ✅ حساب معفي عبر isVip
        if (userProfile.isVip === true) {
            console.log('Ad-Control: Active (via isVip = true)');
            return true;
        }

        // ✅ حساب معفي دائم (adFreeExpiry = null)
        if (userProfile.adFreeExpiry === null) {
            console.log('Ad-Control: Active (Permanent via adFreeExpiry = null)');
            return true; 
        }

        // ✅ حساب معفي مؤقت (تاريخ انتهاء صالح)
        const adFreeExpiry = userProfile.adFreeExpiry;
        if (adFreeExpiry && typeof adFreeExpiry === 'object' && adFreeExpiry.seconds) {
            const expiryTimestampMs = adFreeExpiry.seconds * 1000;
            if (expiryTimestampMs > Date.now()) {
                console.log('Ad-Control: Active (Temporary via adFreeExpiry)');
                return true; 
            }
        }
        
        // ✅ دعم التوافق مع التسميات القديمة
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        if (accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp') {
            console.log('Ad-Control: Active (Backward compatibility via old "vipp" status)');
            return true;
        }
        
        // ❌ حساب عادي
        console.log('Ad-Control: Inactive (Showing Ads)');
        return false;
    }

    // ==========================================================
    // ✅ تطبيق القواعد الرئيسية
    // ==========================================================
    function applyAdRules(userProfile) {
        const userIsAdFree = isUserAdFree(userProfile);
        const isAdmin = userProfile ? userProfile.isAdmin : false;
        
        let statusMessage = '';
        
        if (isAdmin) {
            // 🔧 حالة المدير (لأغراض الاختبار)
            statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
            showAllAds(); 
        
        } else if (userIsAdFree) {
            // 🎉 حالة المستخدم المعفي
            statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
            console.log('Ad-Control: VIP mode. Hiding ads.');
            hideAllAds(); 

        } else {
            // 👤 حالة المستخدم العادي
            statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
            console.log('Ad-Control: Normal user mode. Showing ads.');
            showAllAds(); 
        }

        // عرض الإشعار مرة واحدة فقط
        if (!window.__ad_control_toast_shown) {
            showToast(statusMessage);
            window.__ad_control_toast_shown = true;
            
            // إعادة تعيين العلامة بعد فترة
            setTimeout(() => {
                window.__ad_control_toast_shown = false;
            }, 60000);
        }
    }

    // ==========================================================
    // ✅ إدارة الإعلانات
    // ==========================================================
    function hideAllAds() {
        const styleId = 'ad-control-hide-ads';
        let existingStyle = document.getElementById(styleId);
        if (existingStyle) return; 

        const style = document.createElement('style');
        style.id = styleId;
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
            
            /* إخفاء إطارات الإعلانات */
            iframe[src*="ads"], 
            iframe[id*="aswift_"], 
            iframe[id*="google_ads_frame"] { 
                display: none !important; 
                visibility: hidden !important; 
                height: 0 !important; 
                width: 0 !important; 
                overflow: hidden !important; 
            }
            
            /* إخفاء حاويات الإعلانات */
            div[id*="ad-slot"], 
            div[id*="AdContainer"], 
            div[class*="ad-unit"], 
            div[class*="ads-container"], 
            div[class*="ad_wrapper"] { 
                display: none !important; 
            }
            
            /* إخفاء الإعلانات اليدوية */
            .pAd.show-if-js,
            .rAd.show-if-js,
            .pAdIf.show-if-js,
            .adB {
                display: none !important; 
                visibility: hidden !important;
            }
        `;
        document.head.appendChild(style);
        console.log('Ad-Control: Ads hidden successfully');
    }
    
    function showAllAds() {
        const style = document.getElementById('ad-control-hide-ads');
        if (style) {
            style.remove();
            console.log('Ad-Control: Ads visible again');
        }
    }

    // ==========================================================
    // ✅ التنظيف
    // ==========================================================
    function cleanup() {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        isInitialized = false;
        console.log('Ad control system cleaned up');
    }

    // جعل دالة التنظيف متاحة globally إذا لزم الأمر
    window.adControlCleanup = cleanup;

})();
