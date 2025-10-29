// ad-control.js - إصدار v107 (حل شامل لمشاكل التمرير والـ AdBlocker)
// + ✅ [تعديل v107] إضافة إخفاء إجباري لعناصر الحظر .js-antiadblocker و .js-accessblocker.
// + ✅ [تعديل v106] إضافة دالة enableBodyScroll() واستدعائها لضمان عمل التمرير.
// + ✅ [تعديل v105] استخدام دالة showToast جديدة بتخصيص CSS مضمن (Inline) لحل مشاكل التمرير.
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
        // يمكن إضافة المزيد من الإجراءات هنا لإزالة كلاسات مخصصة تمنع التمرير
    }
    // ==========================================================
    
    // الانتظار حتى تحميل الصفحة بالكامل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        // تشغيل فحص فوري وسريع
        checkAndApplyRules();

        console.log('Initializing Ad Control System (v107)...');
        
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
    // ✅✅✅ دالة عرض رسالة Toast (تخصيص جديد ومستقل) ✅✅✅
    // ==========================================================
    function showToast(message) {
        const toastId = 'gemini-custom-toast'; 

        const existingToast = document.getElementById(toastId);
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.textContent = message;

        // تطبيق تخصيص CSS مباشر مع pointer-events: none لضمان التمرير
        toast.style.cssText = `
            position: fixed;
            left: 50%;
            transform: translateX(-50%) translateY(70px); 
            bottom: 25px; 
            display: inline-flex;
            align-items: center;
            text-align: center;
            justify-content: center;
            z-index: 9999; 
            background: #323232;
            color: rgba(255, 255, 255, .9);
            font-size: 14px;
            border-radius: 3px;
            padding: 13px 24px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            opacity: 0;
            transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
            pointer-events: none; /* الأهم: منع حجب التمرير */
        `;

        document.body.appendChild(toast);

        // تشغيل الـ animation للإظهار 
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)'; 
        });

        // تشغيل الـ animation للإخفاء بعد 3 ثوانٍ
        const displayDuration = 3000;
        const fadeDuration = 500;

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(70px)'; 
        }, displayDuration);

        // إزالة العنصر بالكامل بعد انتهاء مدة الإخفاء
        setTimeout(() => {
            toast.remove();
        }, displayDuration + fadeDuration);
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

            // إخفاء عناصر الحظر القسرية التي يظهرها onload.js
            const antiAdBlockerEl = document.querySelector('.js-antiadblocker');
            if (antiAdBlockerEl) {
                 // استخدام !important لضمان الإخفاء
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
            
            /* منع ظهور البوب أب الخاص بمانع الإعلانات للمستخدمين VIP (مهم للـ onload.js) */
            .js-antiadblocker,
            .js-accessblocker, 
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
