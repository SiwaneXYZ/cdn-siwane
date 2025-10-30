// ad-control.js - الإصدار v119 (مراقب خفيف فقط)
// يستخدم نظام onload.js الأصلي ولا يتدخل في التخطيط

(function() {
    'use strict';
    
    console.log('Ad-Control: Light Monitor v119 - Using onload.js system');
    
    // هذه الدالة تتأكد فقط من أن النظام يعمل بشكل صحيح
    function verifySystem() {
        try {
            const userDataString = localStorage.getItem('firebaseUserProfileData');
            if (!userDataString) return;
            
            const userProfile = JSON.parse(userDataString);
            const isVip = userProfile && (
                userProfile.isVip === true ||
                userProfile.adFreeExpiry === null ||
                (userProfile.adFreeExpiry && userProfile.adFreeExpiry.seconds && 
                 userProfile.adFreeExpiry.seconds * 1000 > Date.now()) ||
                (userProfile.accountType || '').toLowerCase() === 'vipp' ||
                userProfile.adStatus === 'vipp'
            );
            
            const exceptionPaths = ['/p/login.html', '/p/profile.html', '/p/packages.html'];
            const currentPath = window.location.pathname;
            const isExceptionPage = exceptionPaths.some(path => currentPath.indexOf(path) === 0);
            
            if ((isVip || isExceptionPage) && window.PU) {
                // نتأكد من أن PU.iAd = true للمستخدمين المعفيين
                window.PU.iAd = true;
                
                // نتأكد من أن التمرير مفعل
                if (document.body.style.overflow === 'hidden') {
                    document.body.style.overflow = '';
                }
                if (document.documentElement.style.overflow === 'hidden') {
                    document.documentElement.style.overflow = '';
                }
                
                console.log('Ad-Control: System verified - VIP/Exception mode active');
            }
        } catch (error) {
            console.log('Ad-Control: Verification error', error);
        }
    }
    
    // نبدأ المراقبة بعد تحميل الصفحة
    window.addEventListener('load', () => {
        // ننتظر ثانيتين ثم نتحقق
        setTimeout(verifySystem, 2000);
        
        // نتحقق كل 10 ثوانٍ (مراقبة خفيفة)
        setInterval(verifySystem, 10000);
    });
    
})();
