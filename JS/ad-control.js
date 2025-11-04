(function() {
    'use strict';

    let checkInterval = null;
    let isInitialized = false;
    let toastTimeout = null;

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
                // تأخير أطول لضمان اكتمال تحميل البيانات
                setTimeout(checkAndApplyRules, 300); 
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
    // 🌟 جديد: مساعد تنسيق الوقت المتبقي
    // ==========================================================
    function formatRemainingTime(expiryTimestamp) {
        const now = Date.now();
        const remainingMs = expiryTimestamp - now;
        if (remainingMs <= 0) return '(منتهي الصلاحية)';

        const seconds = Math.floor(remainingMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 1) return `(باقي ${days} أيام)`;
        if (days === 1) return `(باقي يوم واحد)`;
        if (hours > 1) return `(باقي ${hours} ساعات)`;
        if (hours === 1) return `(باقي ساعة واحدة)`;
        if (minutes > 1) return `(باقي ${minutes} دقائق)`;
        
        return '(ينتهي قريباً)';
    }
    
    // ==========================================================
    // ✅ نظام الإشعارات المحسّن (🔄 معدل: يقبل مدة عرض متغيرة)
    // ==========================================================
    function showToast(message, delay = 0, duration = 5000) { // 🔄 إضافة duration
        // إزالة أي toast سابق وأي timeout pending
        const existingToast = document.querySelector('.ad-control-toast');
        if (existingToast) { 
            existingToast.remove(); 
        }
        if (toastTimeout) {
            clearTimeout(toastTimeout);
            toastTimeout = null;
        }

        const showToastNow = () => {
            const toastContainer = document.createElement('div');
            toastContainer.className = 'ad-control-toast'; 
            
            // (نفس التنسيقات السابقة)
            Object.assign(toastContainer.style, {
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#333',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '4px',
                zIndex: '10000',
                maxWidth: 'none',
                whiteSpace: 'nowrap',
                fontSize: '14px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                animation: 'fadeInUp 0.3s ease-out',
                fontFamily: 'Arial, sans-serif',
                lineHeight: '1.4'
            });

            const toastMessage = document.createElement('div');
            toastMessage.textContent = message;
            toastMessage.style.cssText = 'margin: 0; padding: 0; white-space: nowrap;';
            toastContainer.appendChild(toastMessage);
            
            document.body.appendChild(toastContainer);

            // (نفس كود الأنيميشن)
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
            
            // 🔄 إزالة الـ Toast بعد المدة المحددة
            setTimeout(() => {
                if (toastContainer.parentNode) {
                    toastContainer.style.animation = 'fadeInUp 0.3s ease-out reverse';
                    setTimeout(() => {
                        if (toastContainer.parentNode) {
                            toastContainer.remove();
                        }
                    }, 300);
                }
            }, duration); // 🔄 استخدام المتغير duration
        };

        if (delay > 0) {
            toastTimeout = setTimeout(showToastNow, delay);
        } else {
            showToastNow();
        }
    }
    
    // ==========================================================
    // ✅ التحقق من حالة الإعفاء (🔄 معدل: إرجاع كائن بالحالة)
    // ==========================================================
    function getAdFreeStatus(userProfile) {
        // 🔄 المستخدم هو زائر أو لم يسجل الدخول
        if (!userProfile || !userProfile.uid) {
            return { isAdFree: false, reason: 'guest' };
        }

        // ✅ حساب مدير (لأغراض الاختبار)
        if (userProfile.isAdmin) {
            console.log('Ad-Control: Admin user (Showing Ads for testing)');
            // المدير يرى الإعلانات للاختبار
            return { isAdFree: false, reason: 'admin_testing' };
        }
        
        // ✅ حساب معفي عبر isVip
        if (userProfile.isVip === true) {
            console.log('Ad-Control: Active (via isVip = true)');
            return { isAdFree: true, reason: 'vip' };
        }

        // ✅ حساب معفي دائم (adFreeExpiry = null)
        if (userProfile.adFreeExpiry === null) {
            console.log('Ad-Control: Active (Permanent via adFreeExpiry = null)');
            return { isAdFree: true, reason: 'permanent' };
        }

        // ✅ حساب معفي مؤقت (تاريخ انتهاء صالح)
        const adFreeExpiry = userProfile.adFreeExpiry;
        if (adFreeExpiry && typeof adFreeExpiry === 'object' && adFreeExpiry.seconds) {
            const expiryTimestampMs = adFreeExpiry.seconds * 1000;
            if (expiryTimestampMs > Date.now()) {
                console.log('Ad-Control: Active (Temporary via adFreeExpiry)');
                // 🔄 إرجاع كائن يتضمن تاريخ الانتهاء
                return { 
                    isAdFree: true, 
                    reason: 'temporary', 
                    expiryTimestamp: expiryTimestampMs 
                };
            }
        }
        
        // ✅ دعم التوافق مع التسميات القديمة
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        if (accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp') {
            console.log('Ad-Control: Active (Backward compatibility via old "vipp" status)');
            return { isAdFree: true, reason: 'legacy_vip' };
        }
        
        // ❌ حساب عادي
        console.log('Ad-Control: Inactive (Showing Ads)');
        return { isAdFree: false, reason: 'normal' };
    }

    // ==========================================================
    // ✅ إدارة كلاس js-antiadblocker (كما هو)
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
    // ✅ تطبيق القواعد (🔄 معدل: يستخدم كائن الحالة ورسائل مخصصة)
    // ==========================================================
    function applyAdRules(userProfile) {
        const status = getAdFreeStatus(userProfile); // 🔄 الحصول على كائن الحالة
        const isLoggedIn = userProfile && userProfile.uid;
        
        let statusMessage = '';
        let toastDuration = 5000; // 🌟 مدة افتراضية
        let shouldShowToast = false;
        
        // 🔄 استخدام switch/case للتعامل مع كل حالة
        switch (status.reason) {
            case 'admin_testing':
                statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
                showAllAds();
                toggleAntiAdblockerClass(false);
                shouldShowToast = true;
                toastDuration = 6000; // مدة أطول للمسؤول
                break;
            
            case 'vip':
                statusMessage = 'تم تفعيل إعفاء (VIP) من الإعلانات. 🎉';
                hideAllAds();
                toggleAntiAdblockerClass(true);
                shouldShowToast = true;
                break;

            case 'permanent':
                statusMessage = 'تم تفعيل الإعفاء الدائم من الإعلانات. 💎';
                hideAllAds();
                toggleAntiAdblockerClass(true);
                shouldShowToast = true;
                break;
            
            case 'temporary':
                // 🌟 استخدام الدالة الجديدة لتنسيق الوقت
                const remainingTime = formatRemainingTime(status.expiryTimestamp);
                statusMessage = `تم تفعيل الإعفاء المؤقت ${remainingTime} ⏳`;
                hideAllAds();
                toggleAntiAdblockerClass(true);
                shouldShowToast = true;
                toastDuration = 7000; // 🌟 مدة أطول لقراءة الوقت
                break;

            case 'legacy_vip':
                statusMessage = 'تم تفعيل الإعفاء (حساب قديم) بنجاح. ✨';
                hideAllAds();
                toggleAntiAdblockerClass(true);
                shouldShowToast = true;
                break;

            case 'normal':
                statusMessage = 'الإعلانات مفعلة لهذا الحساب.'; // 🔄 رسالة أكثر حيادية
                showAllAds();
                toggleAntiAdblockerClass(false);
                shouldShowToast = true;
                toastDuration = 4000; // 🌟 مدة أقصر
                break;

            case 'guest':
            default:
                // زائر أو حالة غير معروفة: لا تعرض إشعار
                console.log('Ad-Control: Guest mode. Showing ads.');
                showAllAds();
                toggleAntiAdblockerClass(false);
                shouldShowToast = false;
                break;
        }

        // 🌟 عرض الإشعار مع فترة سماح (Cooldown) 6 دقائق
        if (shouldShowToast && isLoggedIn) {
            
            // 6 دقائق بالمللي ثانية (6 * 60 * 1000)
            const COOLDOWN_DURATION = 7000; 
            const now = Date.now();

            // 1. جلب آخر وقت تم عرض الإشعار فيه
            let lastToastTime = localStorage.getItem('adControl_lastToastTime');
            lastToastTime = lastToastTime ? parseInt(lastToastTime, 10) : 0;

            // 2. التحقق مما إذا كانت فترة الـ 6 دقائق قد انتهت
            if (now - lastToastTime > COOLDOWN_DURATION) {
                
                // نعم، اعرض الإشعار
                console.log('Ad-Control: Showing toast and starting 6 min cooldown.');
                
                // تأخير 800ms لضمان اكتمال تحميل الصفحة والبيانات
                showToast(statusMessage, 800, toastDuration); 
                
                // 3. تخزين الوقت الحالي "الآن" كآخر وقت للعرض
                localStorage.setItem('adControl_lastToastTime', now.toString());

            } else {
                // لا، ما زلنا في فترة السماح
                const remaining = Math.round((COOLDOWN_DURATION - (now - lastToastTime)) / 60000);
                console.log(`Ad-Control: Toast hidden due to 6 min cooldown (Remaining: ${remaining} min).`);
            }
        }
    }

    // ==========================================================
    // ✅ إدارة الإعلانات (كما هو)
    // ==========================================================
    function hideAllAds() {
        const styleId = 'ad-control-hide-ads';
        let existingStyle = document.getElementById(styleId);
        if (existingStyle) return; 

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .adsbygoogle, 
            ins.adsbygoogle { 
                display: none !important; 
                visibility: hidden !important; 
                opacity: 0 !important; 
                height: 0 !important; 
                width: 0 !important; 
                overflow: hidden !important; 
            }
            iframe[src*="ads"], 
            iframe[id*="aswift_"], 
            iframe[id*="google_ads_frame"] { 
                display: none !important; 
                visibility: hidden !important; 
                height: 0 !important; 
                width: 0 !important; 
                overflow: hidden !important; 
            }
            div[id*="ad-slot"], 
            div[id*="AdContainer"], 
            div[class*="ad-unit"], 
            div[class*="ads-container"], 
            div[class*="ad_wrapper"] { 
                display: none !important; 
            }
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
    // ✅ التنظيف (كما هو)
    // ==========================================================
    function cleanup() {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        if (toastTimeout) {
            clearTimeout(toastTimeout);
            toastTimeout = null;
        }
        toggleAntiAdblockerClass(false);
        isInitialized = false;
        console.log('Ad control system cleaned up');
    }

    window.adControlCleanup = cleanup;

})();
