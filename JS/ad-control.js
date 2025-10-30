// ad-control.js - الإصدار v115 (مراقب استثنائي)
// يعمل كمراقب فقط ويتأكد من تطبيق نظام الاستثناءات

(function() {
    'use strict';
    
    console.log('Ad-Control: Exception Monitor v115 initialized');
    
    // دالة التحقق من المستخدم المعفي
    function isUserAdFree() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            if (!userDataString) return false;
            
            const userProfile = JSON.parse(userDataString);
            
            // شروط الإعفاء
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
        } catch (e) {
            console.error('Ad-Control: Error checking user status', e);
            return false;
        }
    }
    
    // دالة التحقق من صفحات الاستثناء
    function isExceptionPage() {
        const exceptionPaths = ['/p/login.html', '/p/profile.html', '/p/packages.html'];
        const currentPath = window.location.pathname;
        return exceptionPaths.some(path => currentPath.indexOf(path) === 0);
    }
    
    // دالة تطبيق نمط الإعلانات المخفية
    function applyAdFreeStyle() {
        const styleId = 'vip-ad-free-style';
        let existingStyle = document.getElementById(styleId);
        
        if (!existingStyle) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                /* إخفاء جميع أنواع الإعلانات */
                .adsbygoogle, 
                ins.adsbygoogle,
                [id*='ad-slot'],
                [class*='ad-unit'],
                .pAd.show-if-js,
                .rAd.show-if-js,
                .pAdIf.show-if-js,
                .adB,
                iframe[src*="ads"],
                iframe[id*="aswift_"],
                iframe[id*="google_ads_frame"],
                div[id*="AdContainer"],
                div[class*="ads-container"],
                div[class*="ad_wrapper"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    height: 0 !important;
                    width: 0 !important;
                    overflow: hidden !important;
                }
                
                /* ضمان التمرير الطبيعي */
                body, html {
                    overflow: auto !important;
                    position: static !important;
                }
                
                /* إخفاء نوافذ الحظر */
                .js-antiadblocker,
                .js-accessblocker,
                .papW,
                [class*="adblock"],
                [class*="anti-ad"] {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
            console.log('Ad-Control: Ad-free style applied');
        }
    }
    
    // دالة إزالة نمط الإعلانات المخفية
    function removeAdFreeStyle() {
        const style = document.getElementById('vip-ad-free-style');
        if (style) {
            style.remove();
            console.log('Ad-Control: Ad-free style removed');
        }
    }
    
    // دالة المراقبة الرئيسية
    function monitorAndApply() {
        const shouldBeAdFree = isUserAdFree() || isExceptionPage();
        
        if (shouldBeAdFree) {
            console.log('Ad-Control: User/page should be ad-free - applying rules');
            
            // 1. ضبط المتغير العام
            if (window.PU && typeof window.PU === 'object') {
                window.PU.iAd = true;
            }
            
            // 2. تطبيق نمط الإعلانات المخفية
            applyAdFreeStyle();
            
            // 3. ضمان التمرير الطبيعي
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            document.body.classList.remove('no-scroll', 'scroll-lock');
            
            // 4. إخفاء النوافذ المنبثقة يدوياً
            const blockers = document.querySelectorAll('.js-antiadblocker, .js-accessblocker');
            blockers.forEach(blocker => {
                blocker.style.display = 'none';
            });
            
        } else {
            console.log('Ad-Control: Normal user - showing ads');
            removeAdFreeStyle();
        }
    }
    
    // تهيئة النظام
    function init() {
        console.log('Ad-Control: Starting exception monitor...');
        
        // التطبيق الفوري
        monitorAndApply();
        
        // المراقبة المستمرة
        const monitorInterval = setInterval(monitorAndApply, 2000);
        
        // المراقبة عند تغيير التخزين
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(monitorAndApply, 500);
            }
        });
        
        // المراقبة عند تحميل الصفحة
        window.addEventListener('load', monitorAndApply);
        
        // إيقاف المراقبة بعد 5 دقائق (لأداء أفضل)
        setTimeout(() => {
            clearInterval(monitorInterval);
            console.log('Ad-Control: Monitor stopped after 5 minutes');
        }, 300000);
    }
    
    // بدء التنفيذ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
