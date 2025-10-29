// ad-control.js - إصدار v115 (تثبيت قائمة الهاتف السفلية)
// + ✅ تم إضافة قاعدة صارمة لتثبيت الويجت TextList99.
(function() {
    'use strict';

    // ==========================================================
    // ✅✅✅ دالة لتمكين التمرير على الجسم (إجراء إلزامي وقوي) ✅✅✅
    // ==========================================================
    function enableBodyScroll() {
        const bodyStyle = document.body.style;
        // إزالة القيود الصارمة مباشرة
        bodyStyle.overflow = '';
        bodyStyle.overflowY = '';
        bodyStyle.overflowX = '';
        // إزالة أي كلاسات قد تمنع التمرير
        document.body.classList.remove('no-scroll', 'overlay-active', 'scroll-lock'); 
        
        // إجراء إلزامي لحذف عنصر الـ AdBlocker جسدياً، وإزالة التوست المتبقي (إن وجد)
        const adBlockerElement = document.querySelector('.js-antiadblocker, .tNtf, .papW');
        if (adBlockerElement) {
            adBlockerElement.remove();
        }
    }
    // ==========================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        checkAndApplyRules();
        console.log('Initializing Ad Control System (v115) - Fixed Bar Forcefully Applied...'); 
        
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
    
    // ... (بقية الدالة isUserAdFree كما هي) ...
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
            
            // 🌟 إجراء إلزامي: تمكين التمرير وحذف العنصر المسبب للحظر
            enableBodyScroll();
        }

        if (!window.__ad_control_toast_shown) {
            console.log('Message Status:', statusMessage);
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
            
            /* منع ظهور طبقات الـ AdBlocker والـ Overlay والـ Toast (بشكل صارم) */
            .js-antiadblocker, .js-accessblocker, .papW, .tNtf {
                display: none !important;
            }
            
            /* ✅ القاعدة الجديدة: تثبيت شريط الأدوات للهاتف إجبارياً */
            #TextList99.mobC,
            .widget.TextList.mobC {
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 99999 !important; /* أولوية عرض عالية جداً */
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
