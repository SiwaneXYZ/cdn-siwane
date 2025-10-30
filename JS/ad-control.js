// ad-control.js - إصدار v112 (الحل النهائي)
// + ✅ [إصلاح] تنفيذ فوري قبل كل شيء
// + ✅ [إصلاح] إزالة قفل التمرير بالقوة
// + ✅ [إصلاح] خداع النظام الأساسي بشكل فعال

(function() {
    'use strict';

    // ==========================================================
    // ✅✅✅ تنفيذ فوري - لا تنتظر DOMContentLoaded ✅✅✅
    // ==========================================================
    
    // 1. ضبط المتغير العام فوراً - هذا أهم خطوة
    if (typeof window.PU === 'undefined') {
        window.PU = {};
    }
    window.PU.iAd = true; // خداع النظام الأساسي

    // 2. إزالة قفل التمرير فوراً
    function forceEnableScroll() {
        try {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.documentElement.style.overflow = '';
            document.documentElement.style.position = '';
            document.body.classList.remove('no-scroll', 'scroll-lock', 'blurred');
            
            // إزالة أي ستايل يمنع التمرير
            const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
            styleElements.forEach(style => {
                if (style.textContent && style.textContent.includes('overflow') && 
                    (style.textContent.includes('hidden') || style.textContent.includes('clip'))) {
                    style.remove();
                }
            });
        } catch (e) {
            console.log('Scroll force enable:', e);
        }
    }

    // 3. إخفاء النوافذ المنبثقة بالقوة
    function forceHideBlockers() {
        const blockers = [
            '.js-antiadblocker',
            '.js-accessblocker', 
            '.papW',
            '.adblock-detector',
            '.access-blocker',
            '[class*="blocker"]',
            '[class*="adblock"]'
        ];
        
        blockers.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; position: fixed !important; top: -9999px !important;';
                el.remove();
            });
        });
        
        // إزالة أي عنصر بستايل يمنع التمرير
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' && (style.top === '0px' || style.bottom === '0px')) {
                if (el.innerHTML.includes('adblock') || el.innerHTML.includes('blocker')) {
                    el.style.cssText = 'display: none !important;';
                    el.remove();
                }
            }
        });
    }

    // 4. التحقق من المستخدم وتطبيق القواعد
    function checkUserAndApply() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            let userProfile = null;
            
            if (userDataString) {
                userProfile = JSON.parse(userDataString);
            }
            
            const isExceptionPage = () => {
                const paths = ['/p/login.html', '/p/profile.html', '/p/packages.html'];
                const currentPath = window.location.pathname;
                return paths.some(path => currentPath.indexOf(path) === 0);
            };
            
            const shouldBypass = userProfile?.isVip === true || 
                               userProfile?.adFreeExpiry !== undefined ||
                               userProfile?.accountType === 'vipp' ||
                               isExceptionPage() ||
                               userProfile?.isAdmin === true;
            
            if (shouldBypass) {
                console.log('Ad-Control: Bypass activated for user/page');
                // تأكيد الخداع
                window.PU.iAd = true;
                
                // تطبيق الإجراءات فوراً
                forceEnableScroll();
                forceHideBlockers();
                
                // إخفاء الإعلانات إذا لزم
                if (userProfile?.isVip === true || userProfile?.adFreeExpiry !== undefined) {
                    const style = document.createElement('style');
                    style.id = 'vip-ad-free-style';
                    style.textContent = `
                        .adsbygoogle, ins.adsbygoogle, 
                        .pAd.show-if-js, .rAd.show-if-js, .pAdIf.show-if-js,
                        .js-antiadblocker, .js-accessblocker, .papW {
                            display: none !important; 
                            visibility: hidden !important;
                        }
                        body, html { 
                            overflow: auto !important; 
                            position: static !important; 
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                // إظهار رسالة تأكيد
                if (!window.__ad_control_toast_shown) {
                    setTimeout(() => {
                        const message = userProfile?.isAdmin ? 
                            'وضع المسؤول: الإعلانات ظاهرة للاختبار' : 
                            'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
                        alert(message); // استخدام alert كبديل مؤقت
                    }, 1000);
                    window.__ad_control_toast_shown = true;
                }
            }
            
        } catch (error) {
            console.log('Ad-Control check error:', error);
        }
    }

    // ==========================================================
    // ✅✅✅ التنفيذ الفوري والمتكرر ✅✅✅
    // ==========================================================
    
    // التنفيذ الأولي الفوري
    forceEnableScroll();
    forceHideBlockers();
    checkUserAndApply();
    
    // تكرار التنفيذ كل 100ms للأول 10 ثواني
    let counter = 0;
    const interval = setInterval(() => {
        forceEnableScroll();
        forceHideBlockers();
        checkUserAndApply();
        
        counter++;
        if (counter > 100) { // 100 * 100ms = 10 seconds
            clearInterval(interval);
        }
    }, 100);
    
    // أيضًا عند تحميل DOM
    document.addEventListener('DOMContentLoaded', function() {
        forceEnableScroll();
        forceHideBlockers();
        checkUserAndApply();
    });
    
    // وعند كل تغيير في الصفحة
    window.addEventListener('load', function() {
        forceEnableScroll();
        forceHideBlockers();
        checkUserAndApply();
    });

})();
