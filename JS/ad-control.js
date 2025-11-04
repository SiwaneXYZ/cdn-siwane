function applyAdRules(userProfile) {
    const userIsAdFree = isUserAdFree(userProfile); 
    const pageIsException = isExceptionPage(); 
    const isAdmin = userProfile?.isAdmin || false;
    
    // إعادة تعيين الحالة أولاً
    document.body.classList.remove('js-antiadblocker');
    setGlobalBypassFlag(false);
    
    let statusMessage = '';
    let showStatusToast = true;
    
    if (pageIsException) {
        logger.log('Exception page - bypassing all restrictions');
        setGlobalBypassFlag(true);
        hideAllAds();
        enableBodyScroll();
        hideBlockerPopups();
        showStatusToast = false;
        
    } else if (isAdmin) {
        statusMessage = 'وضع المراقبة: أنت مسؤول، الإعلانات ظاهرة لاختبار النظام. ⚠️';
        setGlobalBypassFlag(true);
        showAllAds();
        
    } else if (userIsAdFree) {
        statusMessage = 'تم تفعيل الإعفاء من الإعلانات بنجاح! 🎉';
        logger.log('VIPP mode activated - hiding ads and bypassing blockers');
        setGlobalBypassFlag(true);
        hideAllAds();
        enableBodyScroll();
        hideBlockerPopups();
        document.body.classList.add('js-antiadblocker');
        
    } else {
        statusMessage = 'لم يتم تفعيل الإعفاء من الإعلانات لحسابك.';
        logger.log('Normal user mode - showing ads');
        setGlobalBypassFlag(false);
        showAllAds();
    }
    
    // عرض الرسالة مرة واحدة فقط
    if (showStatusToast && !window.__ad_control_toast_shown) {
        showToast(statusMessage);
        window.__ad_control_toast_shown = true;
        
        // إعادة تعيين العلامة بعد فترة
        setTimeout(() => {
            window.__ad_control_toast_shown = false;
        }, 60000); // دقيقة واحدة
    }
}
