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
        if (userProfile.isAdmin) return false;
        const accountTypeLower = (userProfile.accountType || 'normal').toLowerCase();
        return accountTypeLower === 'vipp';
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
            hideAdsOnly();
        } else if (userIsAdmin) {
            showAllAds();
        }
    }
    
    function hideAdsOnly() {
        // نهج متعدد المستويات لإخفاء الإعلانات
        const style = document.createElement('style');
        style.id = 'vip-ad-free-style';
        style.textContent = `
            /* المستوى 1: إعلانات Google المباشرة */
            .adsbygoogle,
            ins.adsbygoogle,
            .ad-container,
            .ad-unit,
            .ad-wrapper,
            .ad-section,
            [id*='ad-'],
            [id*='ads-'],
            [class*='ad-'],
            [class*='ads-'],
            [data-ad-slot],
            [data-ad-client],
            [data-ad-status] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                overflow: hidden !important;
            }
            
            /* المستوى 2: iframes إعلانية */
            iframe[src*='ads'],
            iframe[src*='doubleclick'],
            iframe[src*='googleads'],
            iframe[src*='pagead'],
            iframe[src*='adservice'] {
                display: none !important;
            }
            
            /* المستوى 3: عناصر إعلانية عامة */
            [id*='banner'],
            [class*='banner'],
            [id*='sponsor'],
            [class*='sponsor'],
            [id*='promo'],
            [class*='promo'] {
                display: none !important;
            }
            
            /* المستوى 4: منع popup مانع الإعلانات */
            .js-antiadblocker,
            .adblock-detector,
            .anti-adblock {
                display: none !important;
            }
            
            /* ✅ الحفاظ المطلق على عناصر البروفيل */
            #profile-ad-free-status,
            #profile-ad-free-item,
            #profile-premium-expiry,
            #profile-premium-expiry-item,
            #profile-account-type,
            #profile-current-points,
            #profile-current-points-item,
            #profile-total-points-earned,
            #profile-total-points-earned-item,
            #profile-total-exchanges,
            #profile-total-exchanges-item,
            #profile-fullname,
            #profile-username,
            #profile-email,
            #profile-phone,
            #profile-created-at,
            #profile-provider,
            #profile-email-status,
            [class*="profile-"],
            [id*="profile-"] {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                height: auto !important;
                width: auto !important;
                overflow: visible !important;
            }
            
            /* ✅ حماية خاصة للبادج والصور */
            #account-type-badge,
            .profile-pic-container,
            #pic,
            #astat {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
        `;
        
        // إزالة النمط السابق إذا موجود
        const existingStyle = document.getElementById('vip-ad-free-style');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(style);
        console.log('VIP Ad Control: Ads hidden successfully');
        
        // ✅ تفعيل المراقبة المستمرة للإعلانات الجديدة
        startAdMonitoring();
    }
    
    function showAllAds() {
        const style = document.getElementById('vip-ad-free-style');
        if (style) {
            style.remove();
            console.log('VIP Ad Control: Ads restored for admin');
        }
        stopAdMonitoring();
    }
    
    // ✅ نظام مراقبة الإعلانات الجديدة
    let adObserver = null;
    
    function startAdMonitoring() {
        if (adObserver) return;
        
        adObserver = new MutationObserver((mutations) => {
            let shouldReapply = false;
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        if (isAdElement(node)) {
                            shouldReapply = true;
                        }
                    }
                });
            });
            
            if (shouldReapply) {
                console.log('VIP Ad Control: New ads detected, reapplying hiding...');
                setTimeout(hideAdsOnly, 100);
            }
        });
        
        adObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('VIP Ad Control: Ad monitoring started');
    }
    
    function stopAdMonitoring() {
        if (adObserver) {
            adObserver.disconnect();
            adObserver = null;
            console.log('VIP Ad Control: Ad monitoring stopped');
        }
    }
    
    function isAdElement(element) {
        const adIndicators = [
            'adsbygoogle',
            'ad-container',
            'ad-unit',
            'ad-wrapper',
            'ad-section',
            'banner',
            'sponsor',
            'promo',
            'ad-',
            'ads-'
        ];
        
        const tagName = element.tagName.toLowerCase();
        const id = element.id || '';
        const className = element.className || '';
        
        // التحقق من iframes إعلانية
        if (tagName === 'iframe') {
            const src = element.src || '';
            return src.includes('ads') || 
                   src.includes('doubleclick') || 
                   src.includes('googleads') ||
                   src.includes('pagead');
        }
        
        // التحقق من العناصر بالإشارات الإعلانية
        return adIndicators.some(indicator => 
            id.includes(indicator) || 
            className.includes(indicator) ||
            element.hasAttribute('data-ad-slot') ||
            element.hasAttribute('data-ad-client')
        );
    }
})();
