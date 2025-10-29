// ad-control.js - نظام مستقل تماماً عن onload.js
(function() {
    'use strict';
    
    // الانتظار حتى تحميل الصفحة بالكامل
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdControl);
    } else {
        initAdControl();
    }
    
    function initAdControl() {
        console.log('Initializing VIP Ad Control System...');
        
        // التحقق من حالة المستخدم كل ثانيتين (حتى يتم تحميل البيانات)
        const checkInterval = setInterval(() => {
            const userProfile = getUserProfile();
            if (userProfile && userProfile.uid) {
                clearInterval(checkInterval);
                applyAdRules(userProfile);
            }
        }, 2000);
        
        // التحقق أيضاً بعد 5 ثوانٍ (كدعم إضافي)
        setTimeout(() => {
            const userProfile = getUserProfile();
            if (userProfile) {
                applyAdRules(userProfile);
            }
        }, 5000);
        
        // الاستماع لتحديثات بيانات المستخدم
        window.addEventListener('storage', (e) => {
            if (e.key === 'firebaseUserProfileData') {
                setTimeout(() => {
                    const userProfile = getUserProfile();
                    if (userProfile) {
                        applyAdRules(userProfile);
                    }
                }, 100);
            }
        });
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
    
    function isUserAdFree(userProfile) {
        if (!userProfile) return false;

        // ✅ الأدمن والمشرفين يرون الإعلانات (للمراقبة)
        if (userProfile.isAdmin) return false;

        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        
        // ✅ حساب VIP دائم (معفي دائماً) - مع التحقق من البريميوم
        if (accountTypeLower === 'vipp') {
            // التحقق إذا كان المستخدم بريميوم (شرط مسبق لـ VIP)
            const isPremiumActive = userProfile.premiumExpiry && 
                                  userProfile.premiumExpiry.seconds * 1000 > Date.now();
            const isPremiumType = accountTypeLower === 'premium' || isPremiumActive;
            
            // فقط إذا كان VIP وكان بريميوم → معفي من الإعلانات
            if (isPremiumType) {
                return true;
            }
        }
        
        return false;
    }
    
    function applyAdRules(userProfile) {
        const userIsAdFree = isUserAdFree(userProfile);
        const userIsAdmin = userProfile.isAdmin;
        
        console.log('Applying ad rules for user:', { 
            accountType: userProfile.accountType,
            isAdFree: userIsAdFree,
            isAdmin: userIsAdmin 
        });
        
        if (userIsAdFree && !userIsAdmin) {
            // ✅ المستخدم VIP: نخفي الإعلانات ونعرض الإشعار
            hideAllAds();
            showVipNotification();
        } else if (userIsAdmin) {
            // ✅ الأدمن: نترك الإعلانات ظاهرة (للمراقبة)
            showAllAds();
            hideVipNotification();
        } else {
            // ✅ المستخدم العادي: نترك النظام الأصلي يعمل
            hideVipNotification();
        }
    }
    
    function hideAllAds() {
        // طريقة آمنة لإخفاء الإعلانات بدون التعارض مع onload.js
        const style = document.createElement('style');
        style.id = 'vip-ad-free-style';
        style.textContent = `
            /* إخفاء إعلانات Google */
            .adsbygoogle,
            [class*="ad-"],
            [class*="ads-"],
            iframe[src*="ads"],
            ins.adsbygoogle {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
            }
            
            /* حماية إضافية من أي إعلانات قد تظهر */
            [id*="ad-"],
            [id*="ads-"],
            div[id*="Ad"],
            div[class*="banner"] {
                display: none !important;
            }
            
            /* منع ظهور البوب أب الخاص بمانع الإعلانات للمستخدمين VIP */
            .js-antiadblocker,
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
        console.log('Ads hidden for VIP user');
    }
    
    function showAllAds() {
        // إزالة نمط الإخفاء (للأدمن فقط)
        const style = document.getElementById('vip-ad-free-style');
        if (style) {
            style.remove();
            console.log('Ads style removed for admin');
        }
    }
    
    // ✅ دالة جديدة لعرض إشعار VIP
    function showVipNotification() {
        // التحقق إذا كان الإشعار موجوداً مسبقاً
        const existingNotification = document.getElementById('vip-ad-free-notification');
        if (existingNotification) {
            return; // لا تعرض الإشعار مرة أخرى
        }
        
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.id = 'vip-ad-free-notification';
        notification.innerHTML = `
            <div class="vip-notification-content">
                <div class="vip-icon">👑</div>
                <div class="vip-message">
                    <strong>تم التحقق بنجاح!</strong>
                    <p>حسابك VIP - أنت معفي من عرض الإعلانات</p>
                </div>
                <button class="vip-close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // إضافة الإشعار إلى الصفحة
        document.body.appendChild(notification);
        
        // إزالة الإشعار تلقائياً بعد 5 ثوانٍ
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
        
        console.log('VIP notification shown');
    }
    
    // ✅ دالة لإخفاء إشعار VIP
    function hideVipNotification() {
        const notification = document.getElementById('vip-ad-free-notification');
        if (notification) {
            notification.remove();
        }
    }
})();

// ✅ إضافة أنماط CSS للإشعار
const vipNotificationStyles = `
    <style>
        #vip-ad-free-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.5s ease-out;
            max-width: 350px;
            border-left: 4px solid gold;
        }
        
        .vip-notification-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .vip-icon {
            font-size: 24px;
            flex-shrink: 0;
        }
        
        .vip-message {
            flex-grow: 1;
        }
        
        .vip-message strong {
            display: block;
            margin-bottom: 4px;
            font-size: 16px;
        }
        
        .vip-message p {
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
        }
        
        .vip-close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.3s;
        }
        
        .vip-close-btn:hover {
            background: rgba(255,255,255,0.2);
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @media (max-width: 768px) {
            #vip-ad-free-notification {
                top: 10px;
                right: 10px;
                left: 10px;
                max-width: none;
            }
        }
    </style>
`;

// إضافة الأنماط إلى head المستند
document.head.insertAdjacentHTML('beforeend', vipNotificationStyles);
