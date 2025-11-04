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
            
            const profile = JSON.parse(userDataString);
            
            // التحقق من وجود UID (مستخدم مسجل الدخول)
            if (!profile.uid) {
                console.log('Ad-Control: No user logged in');
                return null;
            }
            
            return profile;
        } catch (e) {
            console.error('Failed to parse user profile data', e);
            return null;
        }
    }
    
    // ==========================================================
    // ✅ نظام الإشعارات المحسّن
    // ==========================================================
    function showToast(message) {
        // إزالة أي toast سابق
        const existingToast = document.querySelector('.ad-control-toast');
        if (existingToast) { 
            existingToast.remove(); 
        }

        const toastContainer = document.createElement('div');
        toastContainer.className = 'ad-control-toast'; 
        
        // تنسيق Toast في أسفل الصفحة في المنتصف
        Object.assign(toastContainer.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#333',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: '10000',
            maxWidth: '90%',
            fontSize: '14px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            animation: 'fadeInUp 0.3s ease-out'
        });

        // إضافة رسالة الـ Toast
        const toastMessage = document.createElement('div');
        toastMessage.textContent = message;
        toastMessage.style.cssText = 'margin: 0; padding: 0;';
        toastContainer.appendChild(toastMessage);
        
        // إضافة الـ Toast إلى الصفحة
        document.body.appendChild(toastContainer);

        // إضافة أنيميشن إذا لم تكن موجودة
        if (!document.querySelector('#ad-control-animations')) {
            const style = document.createElement('style');
            style.id = 'ad-control-animations';
            style.textContent = `
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // إزالة الـ Toast بعد 5 ثواني
        setTimeout(() => {
            if (toastContainer.parentNode) {
                toastContainer.style.animation = 'fadeInUp 0.3s ease-out reverse';
                setTimeout(() => {
                    if (toastContainer.parentNode) {
                        toastContainer.remove();
                    }
                }, 300);
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
    // ✅ إدارة كلاس js-antiadblocker
    // ==========================================================
    function toggleAntiAdblockerClass(shouldAdd) {
        if (shouldAdd) {
            document.body.classList.add('js-antiadblocker');
            console.log('Ad-Control: Added js-antiadblocker class to body');
        } else {
            document.body.classList.remove('js-antiadblocker');
            console.log('Ad-Control: Removed js-antiadblocker class from body');
        }
    }

    // ==========================================================
    // ✅ تطبيق القواعد الرئيسية المحسّنة
    // ==========================================================
    function applyAdRules(userProfile) {
        const userIsAdFree = isUserAdFree(userProfile);
        const isAdmin = userProfile ? userProfile.isAdmin : false;
        const isLoggedIn = userProfile && userProfile.uid; // التحقق من تسجيل الدخول
        
        let statusMessage = '';
        let shouldShowToast = false;
        
        if (isAdmin) {
            // 🔧 حالة المدير (لأغراض الاختبار)
            statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
            showAllAds();
            toggleAntiAdblockerClass(false);
            shouldShowToast = true;
        
        } else if (userIsAdFree) {
            // 🎉 حالة المستخدم المعفي
            statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
            console.log('Ad-Control: VIP mode. Hiding ads.');
            hideAllAds();
            toggleAntiAdblockerClass(true);
            shouldShowToast = true;

        } else {
            // 👤 حالة المستخدم العادي
            statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
            console.log('Ad-Control: Normal user mode. Showing ads.');
            showAllAds();
            toggleAntiAdblockerClass(false);
            shouldShowToast = true;
        }

        // عرض الإشعار فقط إذا كان المستخدم مسجل الدخول ومرة واحدة فقط
        if (shouldShowToast && isLoggedIn && !window.__ad_control_toast_shown) {
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
        // إزالة الكلاس عند التنظيف
        toggleAntiAdblockerClass(false);
        isInitialized = false;
        console.log('Ad control system cleaned up');
    }

    // جعل دالة التنظيف متاحة globally إذا لزم الأمر
    window.adControlCleanup = cleanup;

})();
