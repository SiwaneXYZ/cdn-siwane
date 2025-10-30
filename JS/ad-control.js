// ad-control.js - الإصدار v117 (يحافظ على العناصر الثابتة والمتنقلة)
// يعمل كمراقب ويتأكد من تطبيق نظام الاستثناءات دون التأثير على التخطيط

(function() {
    'use strict';
    
    console.log('Ad-Control: Exception Monitor v117 initialized');
    
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
    
    // دالة تطبيق نمط الإعلانات المخفية (آمن)
    function applyAdFreeStyle() {
        const styleId = 'vip-ad-free-style';
        let existingStyle = document.getElementById(styleId);
        
        if (!existingStyle) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                /* إخفاء جميع أنواع الإعلانات فقط - دون التأثير على التخطيط */
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
                
                /* إخفاء نوافذ الحظر */
                .js-antiadblocker,
                .js-accessblocker,
                .papW,
                [class*="adblock"],
                [class*="anti-ad"] {
                    display: none !important;
                }
                
                /* تمكين التمرير الطبيعي دون تغيير التموضع */
                body {
                    overflow: auto !important;
                    /* نحتفظ على position: relative للأصل */
                }
                
                html {
                    overflow: auto !important;
                    /* نحتفظ على position للأصل */
                }
            `;
            document.head.appendChild(style);
            console.log('Ad-Control: Ad-free style applied (safe mode)');
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
    
    // دالة لتمكين التمرير دون التأثير على العناصر الثابتة
    function enableSafeScroll() {
        try {
            // نستخدم طريقة آمنة لإزالة قفل التمرير
            const bodyStyle = document.body.style;
            const htmlStyle = document.documentElement.style;
            
            // نحتفظ بـ position الحالية للعناصر المهمة
            const mobileMenu = document.querySelector('#sec_Mobile_Menu');
            const fixedElements = document.querySelectorAll('[class*="fixed"], [style*="fixed"]');
            
            // نزيل فقط overflow hidden/clip
            if (bodyStyle.overflow === 'hidden' || bodyStyle.overflow === 'clip') {
                bodyStyle.overflow = 'auto';
            }
            if (htmlStyle.overflow === 'hidden' || htmlStyle.overflow === 'clip') {
                htmlStyle.overflow = 'auto';
            }
            
            // نزيل classes التي تمنع التمرير فقط
            document.body.classList.remove('no-scroll', 'scroll-lock', 'blurred');
            
            // نتأكد من بقاء العناصر الثابتة في مكانها
            if (mobileMenu) {
                const computedStyle = window.getComputedStyle(mobileMenu);
                if (computedStyle.position === 'fixed') {
                    // نتركها كما هي - لا نغير تموضعها
                }
            }
            
            fixedElements.forEach(el => {
                const computedStyle = window.getComputedStyle(el);
                if (computedStyle.position === 'fixed') {
                    // نتركها كما هي
                }
            });
            
            console.log('Ad-Control: Safe scroll enabled');
        } catch (error) {
            console.log('Ad-Control: Safe scroll error', error);
        }
    }
    
    // دالة إخفاء النوافذ المنبثقة بشكل آمن
    function safelyHideBlockers() {
        const blockers = [
            '.js-antiadblocker',
            '.js-accessblocker', 
            '.papW',
            '[class*="adblock"]',
            '[class*="anti-ad"]'
        ];
        
        blockers.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // نستخدم display: none فقط دون تغيير التموضع
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                
                // إذا كان العنصر يحتوي على position: fixed، نتركه كما هو
                const computedStyle = window.getComputedStyle(el);
                if (computedStyle.position === 'fixed') {
                    // نحتفظ بالتموضع الثابت ولكن نخفيه فقط
                    el.style.display = 'none';
                }
            });
        });
    }
    
    // دالة المراقبة الرئيسية
    function monitorAndApply() {
        const shouldBeAdFree = isUserAdFree() || isExceptionPage();
        
        if (shouldBeAdFree) {
            console.log('Ad-Control: User/page should be ad-free - applying safe rules');
            
            // 1. ضبط المتغير العام
            if (window.PU && typeof window.PU === 'object') {
                window.PU.iAd = true;
            }
            
            // 2. تطبيق نمط الإعلانات المخفية (آمن)
            applyAdFreeStyle();
            
            // 3. تمكين التمرير الآمن (لا يؤثر على التموضع)
            enableSafeScroll();
            
            // 4. إخفاء النوافذ المنبثقة بشكل آمن
            safelyHideBlockers();
            
            // 5. التأكد من بقاء القائمة المتنقلة في مكانها
            protectMobileMenu();
            
        } else {
            console.log('Ad-Control: Normal user - showing ads');
            removeAdFreeStyle();
        }
    }
    
    // دالة حماية القائمة المتنقلة
    function protectMobileMenu() {
        const mobileMenu = document.querySelector('#sec_Mobile_Menu');
        if (mobileMenu) {
            const computedStyle = window.getComputedStyle(mobileMenu);
            
            // إذا كانت القائمة ثابتة، نتأكد من بقائها كذلك
            if (computedStyle.position === 'fixed') {
                // نطبق نمط حماية إضافي
                const protectStyle = document.getElementById('mobile-menu-protect') || document.createElement('style');
                protectStyle.id = 'mobile-menu-protect';
                protectStyle.textContent = `
                    #sec_Mobile_Menu {
                        position: fixed !important;
                        bottom: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        z-index: 9999 !important;
                    }
                `;
                if (!document.getElementById('mobile-menu-protect')) {
                    document.head.appendChild(protectStyle);
                }
            }
        }
    }
    
    // تهيئة النظام
    function init() {
        console.log('Ad-Control: Starting safe exception monitor...');
        
        // التأخير قليلاً لضمان تحميل كل العناصر
        setTimeout(() => {
            monitorAndApply();
        }, 100);
        
        // المراقبة المستمرة (بفترات أطول)
        const monitorInterval = setInterval(monitorAndApply, 3000);
        
        // المراقبة عند تغيير التخزين
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(monitorAndApply, 500);
            }
        });
        
        // المراقبة عند تحميل الصفحة
        window.addEventListener('load', () => {
            setTimeout(monitorAndApply, 200);
        });
        
        // إيقاف المراقبة بعد 3 دقائق (لأداء أفضل)
        setTimeout(() => {
            clearInterval(monitorInterval);
            console.log('Ad-Control: Monitor stopped after 3 minutes');
        }, 180000);
    }
    
    // بدء التنفيذ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
