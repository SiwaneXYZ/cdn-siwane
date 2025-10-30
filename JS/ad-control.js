// ad-control.js - الإصدار النهائي (يعتمد على النظام الأصلي)
// نظام مراقبة خفيف الوزن للإعفاء من الإعلانات

(function() {
    'use strict';
    
    console.log('Ad-Control: Lightweight Exception System Initialized');
    
    // ==========================================================
    // ✅ إعدادات نظام الاستثناءات
    // ==========================================================
    const EXCEPTION_PATHS = [
        '/p/login.html',
        '/p/profile.html', 
        '/p/packages.html'
    ];
    
    // ==========================================================
    // ✅ الدوال الأساسية
    // ==========================================================
    
    // التحقق من بيانات المستخدم المعفي
    function checkAdFreeUser() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            if (!userDataString) return false;
            
            const userProfile = JSON.parse(userDataString);
            
            // 1. التحقق من VIP الأساسي
            if (userProfile.isVip === true) {
                console.log('Ad-Control: VIP user detected');
                return true;
            }
            
            // 2. التحقق من الإعفاء الدائم
            if (userProfile.adFreeExpiry === null) {
                console.log('Ad-Control: Permanent ad-free user detected');
                return true;
            }
            
            // 3. التحقق من الإعفاء المؤقت
            if (userProfile.adFreeExpiry && userProfile.adFreeExpiry.seconds) {
                const expiryTimestampMs = userProfile.adFreeExpiry.seconds * 1000;
                if (expiryTimestampMs > Date.now()) {
                    console.log('Ad-Control: Temporary ad-free user detected');
                    return true;
                }
            }
            
            // 4. التحقق من الحالات التراثية
            const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
            if (accountTypeLower === 'vipp' || userProfile.adStatus === 'vipp') {
                console.log('Ad-Control: Legacy VIP user detected');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Ad-Control: Error checking user profile', error);
            return false;
        }
    }
    
    // التحقق من صفحات الاستثناء
    function checkExceptionPage() {
        const currentPath = window.location.pathname;
        const isException = EXCEPTION_PATHS.some(path => currentPath.indexOf(path) === 0);
        
        if (isException) {
            console.log('Ad-Control: Exception page detected');
        }
        
        return isException;
    }
    
    // التحقق من المسؤول
    function checkAdminUser() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            if (!userDataString) return false;
            
            const userProfile = JSON.parse(userDataString);
            return userProfile.isAdmin === true;
        } catch (error) {
            return false;
        }
    }
    
    // ==========================================================
    // ✅ تطبيق نظام الاستثناءات
    // ==========================================================
    function applyExceptionRules() {
        const isAdFree = checkAdFreeUser();
        const isExceptionPage = checkExceptionPage();
        const isAdmin = checkAdminUser();
        
        // إذا كان المستخدم معفي أو في صفحة استثناء
        if (isAdFree || isExceptionPage) {
            console.log('Ad-Control: Applying exception rules');
            
            // 1. خداع النظام الأساسي
            if (window.PU && typeof window.PU === 'object') {
                window.PU.iAd = true;
            }
            
            // 2. تمكين التمرير الطبيعي
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            
            // 3. إخفاء نوافذ الحظر
            const antiAdBlocker = document.querySelector('.js-antiadblocker');
            const accessBlocker = document.querySelector('.js-accessblocker');
            
            if (antiAdBlocker) antiAdBlocker.style.display = 'none';
            if (accessBlocker) accessBlocker.style.display = 'none';
            
            return true;
        }
        
        // إذا كان مسؤولاً، نعطيه رسالة توضيحية
        if (isAdmin) {
            console.log('Ad-Control: Admin user - showing ads for testing');
            if (window.PU && typeof window.PU === 'object') {
                window.PU.iAd = true;
            }
        }
        
        return false;
    }
    
    // ==========================================================
    // ✅ نظام المراقبة المستمرة
    // ==========================================================
    function startMonitoring() {
        console.log('Ad-Control: Starting continuous monitoring');
        
        // التطبيق الفوري
        applyExceptionRules();
        
        // المراقبة عند تغيير التخزين المحلي
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(applyExceptionRules, 100);
            }
        });
        
        // المراقبة الدورية (خفيفة)
        const monitorInterval = setInterval(applyExceptionRules, 5000);
        
        // إيقاف المراقبة بعد 10 دقائق لتوفير الأداء
        setTimeout(() => {
            clearInterval(monitorInterval);
            console.log('Ad-Control: Monitoring stopped after 10 minutes');
        }, 600000);
    }
    
    // ==========================================================
    // ✅ التهيئة
    // ==========================================================
    function init() {
        // ننتظر تحميل DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(startMonitoring, 1000);
            });
        } else {
            setTimeout(startMonitoring, 1000);
        }
        
        // أيضًا نبدأ عند تحميل الصفحة بالكامل
        window.addEventListener('load', () => {
            setTimeout(applyExceptionRules, 2000);
        });
    }
    
    // بدء النظام
    init();
    
})();
