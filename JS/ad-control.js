// ad-control.js - إصدار v108 (العودة إلى Toast الأصلي للموقع)
// + ✅ [تعديل v108] استخدام كلاس .tNtf والاعتماد على CSS الموقع الأصلي للـ Toast.
// + ✅ [تعديل v107] حل مشكلة التمرير والـ AdBlocker عبر enableBodyScroll وإخفاء عناصر الحظر.
// + ✅ [تعديل v101] قراءة الحقل الجديد 'isVip' (Boolean).
(function() {
    'use strict';

    // ==========================================================
    // ✅✅✅ دالة لتمكين التمرير على الجسم (لحل مشكلة Anti-AdBlocker) ✅✅✅
    // ==========================================================
    function enableBodyScroll() {
        const bodyStyle = document.body.style;
        // إزالة overflow: hidden أو clip
        if (bodyStyle.overflow === 'hidden' || bodyStyle.overflow === 'clip') {
            bodyStyle.overflow = '';
        }
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
        console.log('Initializing Ad Control System (v108)...');
        
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                applyAdRules(userProfile);
            }
        }, 500); 
        
        setTimeout(() => {
            const userProfile = getUserProfile();
            if (userProfile) {
                applyAdRules(userProfile);
            }
        }, 3000); 
        
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
    // ✅✅✅ دالة عرض رسالة Toast (باستخدام CSS الموقع الأصلي) ✅✅✅
    // ==========================================================
    function showToast(message) {
        // إنشاء الحاوية الأم باستخدام الكلاس الأصلي
        const toastContainer = document.createElement('div');
        // نستخدم الكلاس الأصلي الذي يجب أن يتم تنسيقه عبر CSS الموقع
        toastContainer.className = 'tNtf'; 
        
        // إعداد خصائص بسيطة لضمان التغطية والسماح بالتمرير
        // هذا ضروري إذا كان الكلاس الأصلي لا يغطي كامل الشاشة ويسمح بالتمرير
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '0';
        toastContainer.style.left = '0';
        toastContainer.style.width = '100%';
        toastContainer.style.height = '100%';
        // السماح لأحداث الماوس والتمرير بالمرور عبر هذه الطبقة
        toastContainer.style.pointerEvents = 'none'; 

        // إنشاء عنصر الرسالة الداخلي
        const toastMessage = document.createElement('div');
        toastMessage.textContent = message;
        
        // إعادة خاصية التفاعل (النقر) لعنصر الرسالة نفسه ليكون مرئياً
        // يجب أن يظهر التوست كعنصر فرعي (قد يكون هذا هو العنصر الذي يتلقى تنسيقات .tNtf > * )
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

            // إخفاء عناصر الحظر القسرية التي يظهرها onload.js
            const antiAdBlockerEl = document.querySelector('.js-antiadblocker');
            if (antiAdBlockerEl) {
                 antiAdBlockerEl.style.cssText = 'display: none !important; visibility: hidden !important;';
            }
            const accessBlockerEl = document.querySelector('.js-accessblocker');
            if (accessBlockerEl) {
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
            
            /* منع ظهور البوب أب الخاص بمانع الإعلانات للمستخدمين VIP (مهم للـ onload.js) */
            .js-antiadblocker,
            .js-accessblocker, 
            [class*="adblock"],
            [class*="anti-ad"] {
                display: none !important;
            }
        `;
        
        const existingStyle = document.getElementById('vip-ad-free-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
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
