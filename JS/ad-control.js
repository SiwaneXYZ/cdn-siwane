// ad-control.js - إصدار v114 (الإلغاء التام لكاشف AdBlock عند الإعفاء)
// + ✅ إلغاء تنشيط كاشف AdBlock عن طريق PU.iAd = true في جميع حالات الإعفاء والاستثناء.
// + ✅ إزالة الإعلانات يدوياً للمستخدمين المعفيين.
// + ✅ إصلاح التمرير القوي (Forced Scroll) لتعطيل قيود القالب.

(function() {
    'use strict';

    // ==========================================================
    // ✅ 1. إعدادات صفحات الاستثناء
    // ==========================================================
    const EXCEPTION_PATHS = [
        '/p/login.html',
        '/p/profile.html',
        '/p/packages.html'
    ];
    // ==========================================================


    // ==========================================================
    // ✅ [ إصلاح نهائي ] دالة لتمكين التمرير (بشكل آمن)
    // ==========================================================
    function enableBodyScroll() {
        const bodyStyle = document.body.style;
        const htmlStyle = document.documentElement.style; // <html>

        // 1. إزالة أي كلاسات تمنع التمرير (التي قد يضيفها onload.js)
        document.body.classList.remove('no-scroll', 'popup-visible', 'noscroll'); 
        document.documentElement.classList.remove('no-scroll', 'popup-visible', 'noscroll');

        // 2. إزالة خاصية "overflow" المضافة (inline)
        if (bodyStyle.overflow) {
            bodyStyle.removeProperty('overflow');
        }
        if (htmlStyle.overflow) {
            htmlStyle.removeProperty('overflow');
        }
        
        console.log('Ad-Control: Scrolling restored to default (Fixed-Menu Safe).');
    }
    // ==========================================================

    // الانتظار حتى تحميل الصفحة بالكامل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        console.log('Initializing Ad Control System (v114)...'); 
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
    
    // دالة عرض رسالة Toast (لم يتم تغييرها)
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
    
    // الدالة المنطقية للتحقق من حالة الإعفاء (لم يتم تغييرها)
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
    
    // دالة للتحقق إذا كانت الصفحة الحالية صفحة استثناء (لم يتم تغييرها)
    function isExceptionPage() {
        const currentPath = window.location.pathname;
        for (let i = 0; i < EXCEPTION_PATHS.length; i++) {
            if (currentPath.indexOf(EXCEPTION_PATHS[i]) === 0) {
                return true;
            }
        }
        return false;
    }
    
    // دالة لضبط متغير التجاوز العام (PU.iAd) - ضروري لـ "الإلغاء"
    function setGlobalBypassFlag(isBypassed) {
        const attemptSet = () => {
            try {
                // التأكد من وجود PU وإنشائه إذا لم يكن موجوداً
                if (typeof window.PU === 'undefined') {
                    window.PU = {};
                    console.log(`Ad-Control: Created PU object.`);
                }
                
                // تعيين القيمة (هذه هي نقطة إلغاء تنشيط onload.js)
                window.PU.iAd = isBypassed; 
                console.log(`Ad-Control: Set PU.iAd = ${isBypassed} to Deactivate Blocker.`);
                return true;

            } catch (e) {
                console.error('Ad-Control: Error setting global PU.iAd flag.', e);
                return true; 
            }
        };

        if (!attemptSet()) {
            console.warn('Ad-Control: Global PU object not found. Retrying in 500ms.');
            setTimeout(attemptSet, 500);
        }
    }

    // دالة تطبيق القواعد (المنطق الرئيسي المُعدّل)
    function applyAdRules(userProfile) {
        const userIsAdFree = isUserAdFree(userProfile);
        const pageIsException = isExceptionPage(); 
        const isAdmin = userProfile ? userProfile.isAdmin : false;
        
        let statusMessage = '';
        let showStatusToast = true; 
        
        // 🔴 المنطق هنا: إذا كان معفياً أو صفحة استثناء، يجب الإلغاء!
        const shouldDeactivateBlocker = userIsAdFree || pageIsException;
        
        if (isAdmin) {
            // 1. حالة المسؤول: لا إلغاء (للاختبار)، إعلانات مرئية
            statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
            setGlobalBypassFlag(true); // الإبقاء على PU.iAd=true لتجنب منبثقات Admin
            showAllAds(); 
        
        } else if (shouldDeactivateBlocker) {
            // 2. حالة الإلغاء: (معفي أو صفحة استثناء)
            if (userIsAdFree) {
                statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
                console.log('Ad-Control: VIP mode. Deactivating Ad Blocker and hiding ads.');
            } else {
                 statusMessage = 'صفحة استثناء: تم إلغاء تنشيط كاشف الإعلانات.';
                 showStatusToast = false;
                 console.log('Ad-Control: Exception page. Deactivating Ad Blocker.');
            }
            
            // ✅ الإجراء الأهم: إلغاء تنشيط الكاشف (يجعل onload.js يتوقف)
            setGlobalBypassFlag(true); 
            
            // ✅ إلغاء جميع القيود والإعلانات
            hideAllAds(); // إخفاء الإعلانات والودجت يدوياً
            enableBodyScroll(); // إصلاح التمرير
            hideBlockerPopups(); // إخفاء نافذة المنع المنبثقة

        } else {
            // 3. المستخدم العادي: الكاشف يعمل والإعلانات مرئية
            statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
            console.log('Ad-Control: Normal user mode. Ad Blocker active.');
            setGlobalBypassFlag(false); 
            showAllAds(); 
        }

        if (showStatusToast && !window.__ad_control_toast_shown) {
            showToast(statusMessage);
            window.__ad_control_toast_shown = true;
        }
    }
    
    // دالة مخصصة لإخفاء النوافذ المنبثقة (تستهدف الودجت الخاص بك: .papW)
    function hideBlockerPopups() {
        const selectors = ['.js-antiadblocker', '.js-accessblocker', '.papW'];
        selectors.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                 // إخفاء قسري
                 el.style.cssText = 'display: none !important; visibility: hidden !important;';
                 // إزالة السمة hidden التي قد يحاول onload.js إضافتها أو إزالتها
                 el.removeAttribute('hidden'); 
            }
        });
    }
    
    // دالة إخفاء كل الإعلانات
    function hideAllAds() {
        const styleId = 'vip-ad-free-style';
        let existingStyle = document.getElementById(styleId);
        if (existingStyle) return; 

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* إخفاء شامل لجميع الإعلانات */
            .adsbygoogle, ins.adsbygoogle,
            iframe[src*="ads"], iframe[id*="aswift_"], iframe[id*="google_ads_frame"],
            div[id*="ad-slot"], div[id*="AdContainer"], div[class*="ad-unit"], div[class*="ads-container"], div[class*="ad_wrapper"],
            .pAd.show-if-js, .rAd.show-if-js, .pAdIf.show-if-js, .adB {
                display: none !important; 
                visibility: hidden !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
            }

            /* إخفاء الودجت الخاص بك وكاشف AdBlocker */
            .js-antiadblocker, 
            .js-accessblocker, 
            .papW,
            [class*="adblock"],
            [class*="anti-ad"] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // دالة إظهار الإعلانات
    function showAllAds() {
        const style = document.getElementById('vip-ad-free-style');
        if (style) {
            style.remove();
            console.log('Ad-Control: Ads style removed (Showing Ads)');
        }
    }
})();
