// ad-control.js - نظام الإعفاء من الإعلانات (الإصدار النهائي)
// يعتمد على نظام Plus UI الأصلي مع إضافة استثناءات المستخدمين المعفيين

(function() {
    'use strict';
    
    console.log('Ad-Control: System Initialized');
    
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
    
    // جلب بيانات المستخدم من Firebase
    function getUserProfile() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            if (!userDataString) return null;
            return JSON.parse(userDataString);
        } catch (error) {
            console.error('Ad-Control: Error parsing user profile', error);
            return null;
        }
    }
    
    // التحقق من المستخدم المعفي من الإعلانات
    function isUserAdFree(userProfile) {
        if (!userProfile) return false;
        
        // 1. الحالة الأساسية - VIP
        if (userProfile.isVip === true) {
            console.log('Ad-Control: VIP user detected');
            return true;
        }
        
        // 2. الإعفاء الدائم
        if (userProfile.adFreeExpiry === null) {
            console.log('Ad-Control: Permanent ad-free user detected');
            return true;
        }
        
        // 3. الإعفاء المؤقت (بناء على التاريخ)
        if (userProfile.adFreeExpiry && 
            userProfile.adFreeExpiry.seconds && 
            userProfile.adFreeExpiry.seconds * 1000 > Date.now()) {
            console.log('Ad-Control: Temporary ad-free user detected');
            return true;
        }
        
        return false;
    }
    
    // التحقق من صفحات الاستثناء
    function isExceptionPage() {
        const currentPath = window.location.pathname;
        return EXCEPTION_PATHS.some(path => currentPath.indexOf(path) === 0);
    }
    
    // التحقق من مسؤول Firebase
    function isFirebaseAdmin(userProfile) {
        return userProfile && userProfile.isAdmin === true;
    }
    
    // التحقق من مسؤول Blogger (النظام الأصلي)
    function isBloggerAdmin() {
        return window.PU && window.PU.iAd === true;
    }
    
    // ==========================================================
    // ✅ تطبيق قواعد الاستثناء
    // ==========================================================
    function applyExceptionRules() {
        const userProfile = getUserProfile();
        const userIsAdFree = isUserAdFree(userProfile);
        const pageIsException = isExceptionPage();
        const userIsFirebaseAdmin = isFirebaseAdmin(userProfile);
        const userIsBloggerAdmin = isBloggerAdmin();
        
        // تحديد الحالة الحالية
        let status = 'normal';
        if (userIsBloggerAdmin) status = 'blogger_admin';
        else if (userIsFirebaseAdmin) status = 'firebase_admin';
        else if (userIsAdFree) status = 'ad_free';
        else if (pageIsException) status = 'exception_page';
        
        console.log('Ad-Control: Status:', status);
        
        // تطبيق القواعد بناء على الحالة
        switch (status) {
            case 'ad_free':
            case 'exception_page':
                // ✅ مستخدم معفي أو صفحة استثناء - إخفاء كل شيء
                enableFullBypass();
                showStatusMessage('تم تفعيل الإعفاء من الإعلانات! 🎉');
                break;
                
            case 'firebase_admin':
                // ✅ مسؤول Firebase - إظهار الإعلانات مع رسالة توضيحية
                enableAdminBypass();
                showStatusMessage('وضع المسؤول: الإعلانات ظاهرة للاختبار ⚠️');
                break;
                
            case 'blogger_admin':
                // ✅ مسؤول Blogger - النظام يعمل كما هو
                console.log('Ad-Control: Blogger admin - system unchanged');
                break;
                
            default:
                // ❌ مستخدم عادي - لا تفعل شيء (النظام الأساسي سيتكفل)
                console.log('Ad-Control: Normal user - showing ads');
                break;
        }
    }
    
    // ==========================================================
    // ✅ دوال التطبيق
    // ==========================================================
    
    // تفعيل تجاوز كامل (للمستخدمين المعفيين وصفحات الاستثناء)
    function enableFullBypass() {
        // 1. خداع النظام الأساسي
        if (window.PU && typeof window.PU === 'object') {
            window.PU.iAd = true;
        }
        
        // 2. تمكين التمرير الطبيعي
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.classList.remove('no-scroll', 'scroll-lock');
        
        // 3. إخفاء نوافذ الحظر
        hideBlockerPopups();
        
        // 4. إخفاء الإعلانات اليدوية
        hideManualAds();
    }
    
    // تفعيل تجاوز المسؤول (الإعلانات ظاهرة ولكن بدون حظر)
    function enableAdminBypass() {
        // خداع النظام الأساسي للسماح بالتصفح
        if (window.PU && typeof window.PU === 'object') {
            window.PU.iAd = true;
        }
        
        // تمكين التمرير وإخفاء النوافذ المنبثقة فقط
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        hideBlockerPopups();
    }
    
    // إخفاء النوافذ المنبثقة للحظر
    function hideBlockerPopups() {
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
                el.style.display = 'none';
                el.style.visibility = 'hidden';
            });
        });
    }
    
    // إخفاء الإعلانات اليدوية
    function hideManualAds() {
        const manualAds = [
            '.pAd.show-if-js',
            '.rAd.show-if-js', 
            '.pAdIf.show-if-js',
            '.adB'
        ];
        
        manualAds.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
            });
        });
    }
    
    // عرض رسالة الحالة
    function showStatusMessage(message) {
        // استخدام نظام الإشعارات الموجود في Plus UI إذا كان متاحاً
        if (window.J && typeof window.J === 'function') {
            window.J(message);
        } else {
            // بديل بسيط
            console.log('Ad-Control:', message);
        }
    }
    
    // ==========================================================
    // ✅ نظام المراقبة والتهيئة
    // ==========================================================
    
    // بدء المراقبة
    function startMonitoring() {
        console.log('Ad-Control: Starting monitoring system');
        
        // التطبيق الفوري
        applyExceptionRules();
        
        // المراقبة عند تغيير بيانات المستخدم
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                console.log('Ad-Control: User data changed - reapplying rules');
                setTimeout(applyExceptionRules, 100);
            }
        });
        
        // مراقبة دورية خفيفة
        const interval = setInterval(applyExceptionRules, 10000);
        
        // إيقاف المراقبة بعد 5 دقائق (توفير أداء)
        setTimeout(() => {
            clearInterval(interval);
            console.log('Ad-Control: Monitoring stopped (performance optimization)');
        }, 300000);
    }
    
    // تهيئة النظام
    function init() {
        // الانتظار حتى يصبح DOM جاهزاً
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(startMonitoring, 500);
            });
        } else {
            setTimeout(startMonitoring, 500);
        }
        
        // أيضًا التطبيق عند اكتمال تحميل الصفحة
        window.addEventListener('load', () => {
            setTimeout(applyExceptionRules, 1000);
        });
    }
    
    // بدء التنفيذ
    init();
    
})();
