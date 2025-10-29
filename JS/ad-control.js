// ad-control.js - إصدار v109 (الحل النهائي لـ AdBlocker والـ Scroll)
// + ✅ تمكين التمرير الإجباري للمستخدمين المعفيين.
// + ✅ إخفاء ويجت AdBlocker (عنصر .js-antiadblocker) وإزالة سمة 'hidden' منه.
// + ✅ استخدام Toast يعتمد على كلاسات الموقع الأصلي مع ضمان عدم حجب التمرير.
// + ✅ التحقق من حالة الإعفاء (isVip, adFreeExpiry, vipp).

(function() {
    'use strict';

    // ==========================================================
    // ✅✅✅ دالة لتمكين التمرير على الجسم ✅✅✅
    // ==========================================================
    function enableBodyScroll() {
        const bodyStyle = document.body.style;
        // إزالة overflow: hidden أو clip التي قد يفرضها الـ AdBlocker
        if (bodyStyle.overflow === 'hidden' || bodyStyle.overflow === 'clip') {
            bodyStyle.overflow = '';
        }
        // إزالة أي كلاسات قد تمنع التمرير
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
        checkAndApplyRules();
        console.log('Initializing Ad Control System (v109)...'); 
        
        // التحقق المتكرر في البداية
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                applyAdRules(userProfile);
            }
        }, 500); 
        
        // التحقق بعد 3 ثوانٍ كدعم
        setTimeout(() => {
            const userProfile = getUserProfile();
            if (userProfile) {
                applyAdRules(userProfile);
            }
        }, 3000); 
        
        // الاستماع لتحديثات بيانات المستخدم
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(checkAndApplyRules, 100); 
            }
        });
    }

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
    // ✅✅✅ دالة عرض رسالة Toast (تعتمد على تنسيق الموقع) ✅✅✅
    // ==========================================================
    function showToast(message) {
        // إنشاء الحاوية الأم باستخدام الكلاس الأصلي
        const toastContainer = document.createElement('div');
        toastContainer.className = 'tNtf'; 
        
        // تطبيق خصائص تسمح بالتمرير عبر الحاوية (مهم جداً لضمان عدم حجب التمرير)
        toastContainer.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;
            pointer-events: none; 
            background: rgba(0, 0, 0, 0); 
        `;

        // إنشاء عنصر الرسالة الداخلي
        const toastMessage = document.createElement('div');
        toastMessage.textContent = message;
        
        // إعادة خاصية التفاعل لعنصر الرسالة نفسه
        toastMessage.style.pointerEvents = 'auto'; 

        toastContainer.appendChild(toastMessage);
        
        // إزالة أي توست سابق
        const existingToast = document.querySelector('.tNtf');
        if (existingToast) {
            existingToast.remove();
        }

        document.body.appendChild(toastContainer);

        // إزالة التوست بعد 5 ثوانٍ
        setTimeout(() => {
            toastContainer.remove();
        }, 5000); 
    }
    // ==========================================================
    
    // ==========================================================
    // ✅✅✅ الدالة المنطقية للتحقق من حالة الإعفاء (isUserAdFree) ✅✅✅
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
        
        let statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
        
        if (userProfile.isAdmin) {
             statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
        } else if (userIsAdFree) {
            statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
            
            // 🌟🌟🌟 الحل لمشكلة التمرير والـ AdBlocker 🌟🌟🌟
            enableBodyScroll(); 

            // إخفاء الويجت وإزالة أي سمات حظر
            const antiAdBlockerEl = document.querySelector('.js-antiadblocker');
            if (antiAdBlockerEl) {
                 // إزالة سمات الحجب لتقليد سلوك الـ Admin بعد الإظهار
                 antiAdBlockerEl.removeAttribute('hidden');
                 antiAdBlockerEl.removeAttribute('aria-hidden');
                 // إخفاء العنصر عبر CSS المباشر لتغطية أي تأخير
                 antiAdBlockerEl.style.cssText = 'display: none !important; visibility: hidden !important;';
            }
            // تغطية أي عنصر حجب آخر قد يظهر
            const accessBlockerEl = document.querySelector('.js-accessblocker');
            if (accessBlockerEl) {
                 accessBlockerEl.removeAttribute('hidden');
                 accessBlockerEl.removeAttribute('aria-hidden');
                 accessBlockerEl.style.cssText = 'display: none !important; visibility: hidden !important;';
            }
        }

        // يتم عرض التوست فقط في أول تطبيق للقواعد
        if (!window.__ad_control_toast_shown) {
            showToast(statusMessage);
            window.__ad_control_toast_shown = true;
        }
        
        if (userIsAdFree) {
            hideAllAds();
        } else {
            showAllAds(); 
        }
    }
    
    function hideAllAds() {
        const style = document.createElement('style');
        style.id = 'vip-ad-free-style';
        style.textContent = `
            /* إخفاء إعلانات Google AdSense */
            .adsbygoogle, ins.adsbygoogle { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }
            iframe[src*="ads"], iframe[id*="aswift_"], iframe[id*="google_ads_frame"] { display: none !important; visibility: hidden !important; height: 0 !important; width: 0 !important; overflow: hidden !important; }
            div[id*="ad-slot"], div[id*="AdContainer"], div[class*="ad-unit"], div[class*="ads-container"], div[class*="ad_wrapper"] { display: none !important; }
            
            /* منع ظهور الويجت الخاصة بمانع الإعلانات (مهم جداً) */
            .js-antiadblocker,
            .js-accessblocker, 
            .papW, /* كلاس الويجت الأم */
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
