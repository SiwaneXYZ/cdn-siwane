// ad-control.js - إصدار v111 (إدارة الاستثناءات والإعلانات اليدوية)
// + ✅ [جديد] إضافة مصفوفة "صفحات الاستثناء" لتعطيل مانع الإعلانات عليها (مثل صفحة شراء الباقات).
// + ✅ [جديد] إخفاء الإعلانات اليدوية (.pAd, .rAd, .pAdIf) للمستخدمين المعفيين.
// + ✅ تعديل المتغير العام (PU.iAd) لخداع 'onload.js' وتجاوز نافذته المنبثقة.
// + ✅ تمكين التمرير الإجباري للمستخدمين المعفيين.

(function() {
    'use strict';

    // ==========================================================
    // ✅✅✅ [إعدادات جديدة] صفحات الاستثناء ✅✅✅
    // أضف هنا روابط الصفحات التي تريد السماح بالتصفح فيها
    // حتى لو كان مانع الإعلانات مفعلاً (مثل صفحة شراء الباقات)
    // ==========================================================
    const EXCEPTION_PATHS = [
        '/p/login.html',
        '/p/profile.html',
        '/p/packages.html' // <-- غير هذا الرابط إلى رابط صفحة الباقات الفعلي لديك
    ];
    // ==========================================================

    // ==========================================================
    // ✅ دالة لتمكين التمرير على الجسم
    // ==========================================================
    function enableBodyScroll() {
        const bodyStyle = document.body.style;
        if (bodyStyle.overflow === 'hidden' || bodyStyle.overflow === 'clip') {
            bodyStyle.overflow = '';
        }
        document.body.classList.remove('no-scroll'); 
    }
    // ==========================================================
    
    // الانتظار حتى تحميل الصفحة بالكامل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        console.log('Initializing Ad Control System (v111)...'); 
        // تطبيق القواعد فوراً عند التحميل
        checkAndApplyRules();
        
        // التحقق المتكرر (لضمان التقاط بيانات المستخدم)
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                checkAndApplyRules(); // إعادة التطبيق عند العثور على المستخدم
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
    // ✅ دالة عرض رسالة Toast (تعتمد على تنسيق الموقع)
    // ==========================================================
    function showToast(message) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'tNtf'; 
        
        toastContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;
            pointer-events: none; background: rgba(0, 0, 0, 0); 
        `;

        const toastMessage = document.createElement('div');
        toastMessage.textContent = message;
        toastMessage.style.pointerEvents = 'auto'; 
        toastContainer.appendChild(toastMessage);
        
        const existingToast = document.querySelector('.tNtf');
        if (existingToast) { existingToast.remove(); }

        document.body.appendChild(toastContainer);

        setTimeout(() => {
            toastContainer.remove();
        }, 5000); 
    }
    // ==========================================================
    
    // ==========================================================
    // ✅ الدالة المنطقية للتحقق من حالة الإعفاء (isUserAdFree)
    // ==========================================================
    function isUserAdFree(userProfile) {
        if (!userProfile) return false;

        if (userProfile.isAdmin) {
            console.log('Ad-Control: Admin user (Showing Ads for testing)');
            return false;
        }
        
        if (userProfile.isVip === true) {
            console.log('Ad-Control: Active (via isVip = true)');
            return true;
        }

        if (userProfile.adFreeExpiry === null) {
            console.log('Ad-Control: Active (Permanent via adFreeExpiry = null)');
            return true; 
        }

        const adFreeExpiry = userProfile.adFreeExpiry;
        if (adFreeExpiry && typeof adFreeExpiry === 'object' && adFreeExpiry.seconds) {
            const expiryTimestampMs = adFreeExpiry.seconds * 1000;
            if (expiryTimestampMs > Date.now()) {
                console.log('Ad-Control: Active (Temporary via adFreeExpiry)');
                return true; 
            }
        }
        
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        if (accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp') {
            console.log('Ad-Control: Active (Backward compatibility via old "vipp" status)');
            return true;
        }
        
        console.log('Ad-Control: Inactive (Showing Ads)');
        return false;
    }
    
    // ==========================================================
    // ✅ [جديد] دالة للتحقق إذا كانت الصفحة الحالية صفحة استثناء
    // ==========================================================
    function isExceptionPage() {
        const currentPath = window.location.pathname;
        for (let i = 0; i < EXCEPTION_PATHS.length; i++) {
            // نستخدم indexOf للتحقق من بداية الرابط (لتجنب مشاكل ? و #)
            if (currentPath.indexOf(EXCEPTION_PATHS[i]) === 0) {
                return true;
            }
        }
        return false;
    }
    
    // ==========================================================
    // ✅ [جديد] دالة لضبط متغير التجاوز العام (PU.iAd)
    // ==========================================================
    function setGlobalBypassFlag(isBypassed) {
        const attemptSet = () => {
            try {
                if (window.PU && typeof window.PU === 'object') {
                    window.PU.iAd = isBypassed; 
                    console.log(`Ad-Control: Set PU.iAd = ${isBypassed} to control onload.js.`);
                    return true;
                }
                // إذا كان PU غير موجود، أنشئه (احتياطي)
                if (typeof window.PU === 'undefined') {
                    window.PU = { iAd: isBypassed };
                    console.log(`Ad-Control: Created PU object and set PU.iAd = ${isBypassed}.`);
                    return true;
                }
                return false;
            } catch (e) {
                console.error('Ad-Control: Error setting global PU.iAd flag.', e);
                return true; // لا تعاود المحاولة إذا حدث خطأ
            }
        };

        if (!attemptSet()) {
            // PU غير جاهز بعد، محاولة احتياطية
            console.warn('Ad-Control: Global PU object not found. Retrying in 500ms.');
            setTimeout(attemptSet, 500);
        }
    }

    // ==========================================================
    // ✅✅✅  دالة تطبيق القواعد (تم إعادة هيكلتها بالكامل)  ✅✅✅
    // ==========================================================
    function applyAdRules(userProfile) {
        const userIsAdFree = isUserAdFree(userProfile);
        const pageIsException = isExceptionPage(); // فحص صفحة الاستثناء
        const isAdmin = userProfile ? userProfile.isAdmin : false;
        
        let statusMessage = '';
        let showStatusToast = true; // متغير للتحكم في إظهار التوست
        
        if (pageIsException) {
            // ----------------------------------------------------
            // 1. حالة صفحة الاستثناء (الأولوية القصوى)
            // ----------------------------------------------------
            console.log('Ad-Control: Exception page detected. Bypassing AdBlocker and hiding ads.');
            // خداع 'onload.js' للسماح بالتصفح (الأهم)
            setGlobalBypassFlag(true); 
            // إخفاء أي إعلانات قد تكون في هذه الصفحة
            hideAllAds();
            // ضمان تفعيل التمرير
            enableBodyScroll(); 
            hideBlockerPopups();
            // لا نظهر أي رسالة توست هنا
            showStatusToast = false; 

        } else if (isAdmin) {
            // ----------------------------------------------------
            // 2. حالة المسؤول (Admin) - (صفحة عادية)
            // ----------------------------------------------------
            statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
            console.log('Ad-Control: Admin mode. Showing ads.');
            setGlobalBypassFlag(true); // 'onload.js' سيتجاوزه
            showAllAds(); 
        
        } else if (userIsAdFree) {
            // ----------------------------------------------------
            // 3. حالة المستخدم المعفي (VIP) - (صفحة عادية)
            // ----------------------------------------------------
            statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
            console.log('Ad-Control: VIP mode. Hiding ads and bypassing AdBlocker popup.');
            setGlobalBypassFlag(true); // 'onload.js' سيتجاوزه
            hideAllAds(); 
            enableBodyScroll(); 
            hideBlockerPopups();

        } else {
            // ----------------------------------------------------
            // 4. حالة المستخدم العادي - (صفحة عادية)
            // ----------------------------------------------------
            statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
            console.log('Ad-Control: Normal user mode. Showing ads.');
            // هنا نترك 'onload.js' يقوم بعمله
            setGlobalBypassFlag(false); 
            showAllAds(); 
        }

        // عرض رسالة التوست مرة واحدة فقط (وفقط إذا لم تكن صفحة استثناء)
        if (showStatusToast && !window.__ad_control_toast_shown) {
            showToast(statusMessage);
            window.__ad_control_toast_shown = true;
        }
    }
    
    // دالة مخصصة لإخفاء النوافذ المنبثقة (احتياطي)
    function hideBlockerPopups() {
        const antiAdBlockerEl = document.querySelector('.js-antiadblocker');
        if (antiAdBlockerEl) {
             antiAdBlockerEl.style.cssText = 'display: none !important; visibility: hidden !important;';
        }
        const accessBlockerEl = document.querySelector('.js-accessblocker');
        if (accessBlockerEl) {
             accessBlockerEl.style.cssText = 'display: none !important; visibility: hidden !important;';
        }
    }
    
    // ==========================================================
    // ✅ [محدث] دالة إخفاء كل الإعلانات
    // ==========================================================
    function hideAllAds() {
        const styleId = 'vip-ad-free-style';
        let existingStyle = document.getElementById(styleId);
        if (existingStyle) return; // النمط موجود بالفعل

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* إخفاء إعلانات Google AdSense */
            .adsbygoogle, ins.adsbygoogle { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }
            iframe[src*="ads"], iframe[id*="aswift_"], iframe[id*="google_ads_frame"] { display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }
            div[id*="ad-slot"], div[id*="AdContainer"], div[class*="ad-unit"], div[class*="ads-container"], div[class*="ad_wrapper"] { display: none !important; }
            
            /* [جديد] إخفاء الإعلانات اليدوية التي أضفتها */
            .pAd.show-if-js,
            .rAd.show-if-js,
            .pAdIf.show-if-js,
            .adB {
                display: none !important; 
                visibility: hidden !important;
            }

            /* منع ظهور الويجت الخاصة بمانع الإعلانات (مهم جداً) */
            .js-antiadblocker,
            .js-accessblocker, 
            .papW, /* كلاس الويجت الأم */
            [class*="adblock"],
            [class*="anti-ad"] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    function showAllAds() {
        const style = document.getElementById('vip-ad-free-style');
        if (style) {
            style.remove();
            console.log('Ad-Control: Ads style removed (Showing Ads)');
        }
    }
})();
