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
        
        // ✅ فقط إذا كان VIP وكان بريميوم → معفي من الإعلانات
        if (accountTypeLower === 'vipp') {
            // التحقق إذا كان المستخدم بريميوم
            const isPremiumActive = userProfile.premiumExpiry && 
                                  userProfile.premiumExpiry.seconds * 1000 > Date.now();
            const isPremiumType = userProfile.accountType === 'premium' || isPremiumActive;
            
            return isPremiumType; // فقط إذا كان بريميوم و VIP
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
            // ✅ المستخدم VIP + بريميوم: نخفي الإعلانات ونعرض الإشعار
            hideAllAds();
            showSimpleNotification("تم التحقق بنجاح! حسابك VIP - أنت معفي من عرض الإعلانات");
        } else if (userIsAdmin) {
            // ✅ الأدمن: نترك الإعلانات ظاهرة (للمراقبة)
            showAllAds();
        }
        // ✅ المستخدم العادي أو بريميوم فقط: نترك النظام الأصلي يعمل
    }
    
    function hideAllAds() {
        // طريقة آمنة لإخفاء الإعلانات بدون التعارض مع onload.js
        const style = document.createElement('style');
        style.id = 'vip-ad-free-style';
        style.textContent = `
            .adsbygoogle,
            [class*="ad-"],
            [class*="ads-"],
            iframe[src*="ads"],
            ins.adsbygoogle {
                display: none !important;
            }
            
            [id*="ad-"],
            [id*="ads-"],
            div[id*="Ad"],
            div[class*="banner"] {
                display: none !important;
            }
            
            .js-antiadblocker {
                display: none !important;
            }
        `;
        
        // إزالة النمط السابق إذا موجود
        const existingStyle = document.getElementById('vip-ad-free-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
        console.log('Ads hidden for VIP + Premium user');
    }
    
    function showAllAds() {
        // إزالة نمط الإخفاء (للأدمن فقط)
        const style = document.getElementById('vip-ad-free-style');
        if (style) {
            style.remove();
        }
    }
    
    // ✅ دالة بسيطة لعرض الإشعار (مشابهة لتلك في onload.js)
    function showSimpleNotification(message) {
        // استخدام نظام الإشعارات الموجود في onload.js إذا كان متاحاً
        if (window.PU && window.PU.tNtf) {
            window.PU.tNtf(message);
            return;
        }
        
        // بديل بسيط إذا لم يكن نظام الإشعارات متاحاً
        console.log("VIP Notification:", message);
        
        // إنشاء إشعار بسيط مشابه لنظام onload.js
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: fadeIn 0.3s ease-in;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // إزالة الإشعار بعد 3 ثوانٍ
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
        
        // إضافة أنيميشن بسيط إذا لم يكن موجوداً
        if (!document.querySelector('style#vip-notification-animations')) {
            const style = document.createElement('style');
            style.id = 'vip-notification-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }
    }
})();
