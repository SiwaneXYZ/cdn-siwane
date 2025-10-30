// ad-control.js - الإصدار الآمن (لا يتلاعب بالعناصر)
// يعمل مع نظام الاستثناءات المدمج في onload.js

(function() {
    'use strict';
    
    console.log('Ad-Control: Safe mode initialized');
    
    // الانتظار حتى تحميل الصفحة بالكامل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        console.log('Ad-Control: Checking user status...');
        
        // التحقق من المستخدم وتطبيق القواعد بعد تأخير بسيط
        setTimeout(() => {
            checkAndApplyRules();
        }, 1000);
        
        // الاستماع لتحديثات بيانات المستخدم
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(checkAndApplyRules, 500);
            }
        });
    }
    
    function checkAndApplyRules() {
        const userProfile = getUserProfile();
        const isExceptionPage = checkExceptionPage();
        
        if (shouldApplyAdFree(userProfile, isExceptionPage)) {
            applyAdFreeMode();
        } else {
            console.log('Ad-Control: Normal mode - showing ads');
        }
    }
    
    function getUserProfile() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            if (!userDataString) return null;
            return JSON.parse(userDataString);
        } catch (e) {
            console.error('Ad-Control: Failed to parse user profile', e);
            return null;
        }
    }
    
    function checkExceptionPage() {
        const exceptionPaths = ['/p/login.html', '/p/profile.html', '/p/packages.html'];
        const currentPath = window.location.pathname;
        return exceptionPaths.some(path => currentPath.indexOf(path) === 0);
    }
    
    function shouldApplyAdFree(userProfile, isExceptionPage) {
        if (isExceptionPage) return true;
        if (!userProfile) return false;
        
        // نفس شروط الإعفاء المستخدمة في onload.js
        if (userProfile.isVip === true) return true;
        if (userProfile.adFreeExpiry === null) return true;
        
        if (userProfile.adFreeExpiry && userProfile.adFreeExpiry.seconds) {
            const expiryTimestampMs = userProfile.adFreeExpiry.seconds * 1000;
            if (expiryTimestampMs > Date.now()) return true;
        }
        
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        if (accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp') {
            return true;
        }
        
        return false;
    }
    
    function applyAdFreeMode() {
        console.log('Ad-Control: Applying ad-free mode');
        
        // إخفاء الإعلانات اليدوية فقط (آمن)
        const style = document.createElement('style');
        style.id = 'vip-ad-free-style';
        style.textContent = `
            /* إخفاء الإعلانات اليدوية فقط */
            .pAd.show-if-js,
            .rAd.show-if-js, 
            .pAdIf.show-if-js,
            .adB {
                display: none !important;
            }
            
            /* لا نلمس إعلانات Google أو نغير التمرير */
        `;
        
        // إزالة النمط القديم إذا موجود
        const oldStyle = document.getElementById('vip-ad-free-style');
        if (oldStyle) oldStyle.remove();
        
        document.head.appendChild(style);
        
        // عرض رسالة تأكيد
        showStatusMessage('تم تفعيل الإعفاء من الإعلانات! 🎉');
    }
    
    function showStatusMessage(message) {
        // استخدام نظام التنبيهات الموجود في onload.js إذا كان متاحاً
        if (window.J && typeof window.J === 'function') {
            window.J(message);
        } else {
            // بديل بسيط
            console.log('Ad-Control:', message);
        }
    }
})();
