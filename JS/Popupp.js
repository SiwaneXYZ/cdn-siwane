// 1. قائمة الاستيراد: فقط Firebase App و Auth
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- عناصر الواجهة (كما هي) ---
    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog'); 
    const sudahLogDiv = document.querySelector('.DonLog'); 

    const adminElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="ادمن"]') : null;
    const logoutElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="الخروج"]') : null;
    const pointsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="نقاطي"]') : null;
    const productsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="منتجاتي"]') : null;

    // --- متغيرات عامة (كما هي) ---
    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData';
    const DEFAULT_PROFILE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; 
    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';
    let colorToggleInterval = null;

    // ⚠️ يجب تعريف هذا يدوياً لأنه كان يتم جلبه سابقاً من إعدادات مُعقّدة
    // تأكد من أن هذا البريد الإلكتروني هو البريد الفعلي للمالك في نظامك.
    let ownerAdminEmail = 'siwane.tutorials@gmail.com'; 

    // --- تهيئة Firebase (المعتادة) ---
    let app;
    let auth = null;

    const apps = getApps();
    if (apps.length === 0) {
       console.warn("Firebase App is not initialized. Assuming another script will handle it or using minimal Auth.");
    } else {
       app = getApp();
    }

    if (app) {
       try {
           auth = getAuth(app);
       } catch (error) {
           console.error("Failed to get Firebase Auth service:", error);
       }
    }
    // --- نهاية التهيئة ---

    
    /**
     * [مهم جداً] دالة حساب الأدوار (مستخدمة الآن فقط للكاش)
     * تحسب الأدوار بناءً على البيانات المخزنة في localStorage.
     */
    function getCalculatedRoles(storedData, currentUser) {
        const roles = { isOwner: false, isAdmin: false, isVIP: false, isPremium: false, isAdFree: false, };

        if (!storedData || !currentUser) return roles;

        // ⚠️ يجب تحويل حقول تاريخ الانتهاء من FireStore Timestamp (إن وجدت في الكاش) 
        // إلى Date أو قيم قابلة للمقارنة إذا كان سكربت profile.js يحفظها ككائن.
        // نفترض هنا أن البيانات المخزنة في LocalStorage قابلة للمقارنة مباشرة.
        
        // 1. المالك والمدير
        const isEmailOwner = currentUser.email && ownerAdminEmail &&
                             currentUser.email.toLowerCase() === ownerAdminEmail.toLowerCase();
        
        if (isEmailOwner) { roles.isOwner = true; roles.isAdmin = true; } 
        else if (storedData.isAdmin === true) { roles.isAdmin = true; }

        // 2. العضوية
        const accountType = (storedData.accountType || 'normal').toLowerCase();
        if (accountType === 'vipp') { roles.isVIP = true; }

        // 3. البريميوم (يعتمد على تاريخ الانتهاء)
        const premiumExpiry = storedData.premiumExpiry; 
        // إذا كان الكاش يحفظ كائن Timestamp، نحتاج إلى الوصول إلى seconds
        const premiumExpiryMillis = premiumExpiry && premiumExpiry.seconds ? premiumExpiry.seconds * 1000 : (typeof premiumExpiry === 'number' ? premiumExpiry : null);

        const isPremiumActive = premiumExpiryMillis && premiumExpiryMillis > Date.now();
        
        if (accountType === 'premium' || isPremiumActive) { roles.isPremium = true; }

        // 4. معفي من الإعلانات (يعتمد على تاريخ الانتهاء)
        const adFreeExpiry = storedData.adFreeExpiry; 
        const adFreeExpiryMillis = adFreeExpiry && adFreeExpiry.seconds ? adFreeExpiry.seconds * 1000 : (typeof adFreeExpiry === 'number' ? adFreeExpiry : null);

        const isAdFreePermanent = (adFreeExpiry === null);
        const isAdFreeTemporary = adFreeExpiryMillis && adFreeExpiryMillis > Date.now();

        if (isAdFreePermanent || isAdFreeTemporary) { roles.isAdFree = true; }
        
        // 5. VIP يشمل البريميوم والإعفاء
        if (roles.isVIP) { roles.isPremium = true; roles.isAdFree = true; }

        return roles;
    }


    // =================================================================
    //  --- onAuthStateChanged (الآن يعتمد فقط على LocalStorage) ---
    // =================================================================
    if (auth) { 
        onAuthStateChanged(auth, (user) => { 
            let cachedUserData = null;
            let finalPhotoURL = DEFAULT_PROFILE_IMAGE;
            let displayData = null;

            if (user) {
                // 1. محاولة القراءة من localStorage (المسار السريع)
                const dataString = localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY);
                if (dataString) {
                    try { cachedUserData = JSON.parse(dataString); } catch (e) { cachedUserData = null; }
                }

                // 2. التحقق من صلاحية الكاش وتطبيقه
                const isCacheValid = cachedUserData && cachedUserData.uid === user.uid;
                
                if (isCacheValid) {
                    console.log("Popup.js: تم استخدام بيانات الكاش الصالحة.");
                    const rolesData = getCalculatedRoles(cachedUserData, user);
                    displayData = {
                        uid: user.uid,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        email: user.email,
                        ...rolesData 
                    };
                    finalPhotoURL = cachedUserData.photoURL || user.photoURL || DEFAULT_PROFILE_IMAGE;

                } else {
                     console.warn("Popup.js: لا يوجد كاش صالح للأدوار. سيتم استخدام بيانات Auth الأساسية.");
                     // في حالة عدم وجود كاش صالح، نعتمد على بيانات Auth فقط (بدون أدوار معقدة/ريبل)
                     displayData = {
                        uid: user.uid,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        email: user.email,
                        isOwner: false, isAdmin: false, isVIP: false, isPremium: false, isAdFree: false,
                     };
                     // فحص المالك الأساسي
                     if (user.email && ownerAdminEmail && user.email.toLowerCase() === ownerAdminEmail.toLowerCase()) {
                         displayData.isOwner = true;
                         displayData.isAdmin = true;
                     }
                     finalPhotoURL = user.photoURL || DEFAULT_PROFILE_IMAGE;
                }
                
                updateUI(true, displayData, finalPhotoURL);

            } else {
                // مستخدم غير مسجل الدخول
                localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                updateUI(false, null, null);
            }
            if (loginCheckbox) loginCheckbox.checked = false;
        });
    } else {
        // فشل تهيئة Auth، عرض حالة تسجيل الخروج
        updateUI(false, null, null);
        if (loginCheckbox) loginCheckbox.checked = false;
    }
    // =================================================================


    /**
     * دالة تطبيق الأدوار (تشمل الريبل) - (كما هي)
     */
    function applyRoleClasses(element, userData) {
        const allRoleClasses = ['owner', 'admin', 'vipp', 'premium', 'adfree', 'normal'];
        const allBorderClasses = allRoleClasses.map(r => `border-${r}`);
        const allRippleClasses = allRoleClasses.map(r => `ripple-${r}`);
        const allRoleClassesSvg = allRoleClasses.map(r => `role-${r}`);

        if (colorToggleInterval) {
            clearInterval(colorToggleInterval);
            colorToggleInterval = null;
        }

        element.classList.remove(...allRippleClasses, ...allRoleClassesSvg);
        const profileImage = element.querySelector('.current-profile-image');
        if (profileImage) {
            profileImage.classList.remove(...allBorderClasses);
        }

        const isLoggedOut = !userData || !userData.uid;
        if (isLoggedOut) {
            return; 
        }

        const hasPremium = userData.isPremium;
        const hasAdFree = userData.isAdFree;
        const isSpecialToggleCase = hasPremium && hasAdFree && !userData.isOwner && !userData.isAdmin;

        if (isSpecialToggleCase) {
            const toggleRoles = ['premium', 'adfree'];
            const toggleBorderClasses = toggleRoles.map(r => `border-${r}`);
            const toggleRippleClasses = toggleRoles.map(r => `ripple-${r}`);
            let colorIndex = 0;
            element.classList.add('role-premium'); 

            const toggleColors = () => {
                const currentRole = toggleRoles[colorIndex % toggleRoles.length];
                colorIndex++;
                const currentBorderClass = `border-${currentRole}`;
                const currentRippleClass = `ripple-${currentRole}`;
                if (profileImage) profileImage.classList.remove(...toggleBorderClasses);
                element.classList.remove(...toggleRippleClasses);
                if (profileImage) profileImage.classList.add(currentBorderClass);
                element.classList.add(currentRippleClass);
            };
            toggleColors();
            colorToggleInterval = setInterval(toggleColors, 3000);
        } else {
            const rolesPriority = [
                { check: userData.isOwner, className: 'owner' },
                { check: userData.isAdmin, className: 'admin' },
                { check: userData.isVIP, className: 'vipp' },
                { check: userData.isPremium, className: 'premium' },
                { check: userData.isAdFree, className: 'adfree' },
            ];
            let primaryRole = 'normal';
            for (const role of rolesPriority) {
                if (role.check) {
                    primaryRole = role.className;
                    break; 
                }
            }
            const primaryBorderClass = `border-${primaryRole}`;
            const primaryRoleClass = `role-${primaryRole}`;
            const primaryRippleClass = `ripple-${primaryRole}`;
            if (profileImage) profileImage.classList.add(primaryBorderClass);
            element.classList.add(primaryRoleClass, primaryRippleClass); 
        }
    }


    /**
     * دالة تحديث الواجهة (كما هي)
     */
    function updateUI(isLoggedIn, userData, profileImageUrl) {
        if (userIconLabel) userIconLabel.classList.remove('logged-in');
        if (colorToggleInterval) {
            clearInterval(colorToggleInterval);
            colorToggleInterval = null;
        }

        if (belumLogDiv && sudahLogDiv && userIconLabel) {
            if (isLoggedIn && userData) {
                belumLogDiv.classList.add('hidden');
                sudahLogDiv.classList.remove('hidden');
                userIconLabel.classList.add('logged-in');
                const finalImageUrl = profileImageUrl || DEFAULT_PROFILE_IMAGE;

                let profileImg = userIconLabel.querySelector('.current-profile-image');
                if (!profileImg) {
                    profileImg = document.createElement('img');
                    profileImg.classList.add('profileUser', 'current-profile-image');
                    userIconLabel.innerHTML = '';
                    userIconLabel.appendChild(profileImg);
                }
                profileImg.src = finalImageUrl;
                
                const isAdminOrOwner = (userData.isAdmin === true); 

                if (adminElement) adminElement.classList.toggle('hidden', !isAdminOrOwner);
                if (pointsElement) pointsElement.classList.toggle('hidden', isAdminOrOwner);
                if (productsElement) productsElement.classList.toggle('hidden', isAdminOrOwner);
                
                applyRoleClasses(userIconLabel, userData); 

            } else { // Not logged in
                belumLogDiv.classList.remove('hidden');
                sudahLogDiv.classList.add('hidden');
                 if (adminElement) adminElement.classList.add('hidden');
                 if (pointsElement) pointsElement.classList.add('hidden');
                 if (productsElement) productsElement.classList.add('hidden');

                 const existingProfileImg = userIconLabel.querySelector('.current-profile-image');
                 if (existingProfileImg) existingProfileImg.remove();
                 if (!userIconLabel.querySelector('svg')) {
                     userIconLabel.innerHTML = originalIconHtml;
                 }
                 applyRoleClasses(userIconLabel, null); 
            }
        }
    }

    // --- (مستمعي الأحداث وتسجيل الخروج) - (كما هي) ---
    function logOut() {
        const performLogoutActions = () => {
            if (loginCheckbox) { loginCheckbox.checked = false; }
            window.location.href = "/p/login.html";
        };
        if (!auth) {
            localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
            updateUI(false, null, null);
            performLogoutActions();
            return;
        }
        signOut(auth)
            .finally(() => {
                performLogoutActions();
            });
    }

    if (logoutElement) logoutElement.addEventListener('click', logOut);
    if (adminElement) adminElement.addEventListener('click', () => { window.location.href = '/p/admin.html'; });
    if (pointsElement) pointsElement.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/p/points.html'; });
    if (productsElement) productsElement.addEventListener('click', (e) => { e.preventDefault(); window.location.href = '/p/products.html'; });
    
    if (userIconLabel && loginCheckbox) {
        userIconLabel.addEventListener('click', (e) => { e.preventDefault(); loginCheckbox.checked = !loginCheckbox.checked; });
    }
    document.addEventListener('click', (e) => {
        if (loginCheckbox && loginCheckbox.checked && userIconLabel && popupWrapper) {
            if (!userIconLabel.contains(e.target) && !popupWrapper.contains(e.target)) {
                loginCheckbox.checked = false;
            }
        }
    });
});
