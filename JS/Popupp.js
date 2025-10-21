import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- عناصر الواجهة ---
    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog'); 
    const sudahLogDiv = document.querySelector('.DonLog'); 

    const adminElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="ادمن"]') : null;
    const logoutElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="الخروج"]') : null;
    const pointsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="نقاطي"]') : null;
    const productsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="منتجاتي"]') : null;

    // --- متغيرات عامة ---
    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData'; // المفتاح الصحيح كما في profile.js
    const DEFAULT_PROFILE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; 
    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';
    let colorToggleInterval = null;

    // =================================================================
    //  --- [تحديث احترافي] جلب الإعدادات كما في profile.js ---
    // =================================================================
    let firebaseConfig = {};
    let ownerAdminEmail = ''; // <-- مهم لتمييز المالك

    // افتراض أن 'encryptedBase64' مُعرف في HTML كما في profile.js
    if (typeof encryptedBase64 !== 'undefined' && encryptedBase64.customSettings) {
        firebaseConfig = encryptedBase64.customSettings.firebase;
        ownerAdminEmail = encryptedBase64.customSettings.ownerAdminEmail;
    } else {
        console.error("Popup.js: Custom settings (encryptedBase64) not found. Firebase/Owner features will fail.");
    }
    // =================================================================

    let app;
    let auth = null;

    // --- تهيئة Firebase ---
    const apps = getApps();
    if (apps.length === 0) {
        if (Object.keys(firebaseConfig).length > 0) {
           try {
               app = initializeApp(firebaseConfig);
           } catch (error) {
               console.error("Firebase initialization failed:", error);
           }
        } else {
            console.warn("Firebase config is missing or invalid. Authentication features may not work.");
        }
    } else {
       app = getApp();
    }
    // --- نهاية تهيئة Firebase ---

    
    // =================================================================
    //  --- [إضافة احترافية] دالة حساب الأدوار (تحاكي profile.js) ---
    // =================================================================
    /**
     * يحسب أدوار المستخدم الحقيقية بناءً على البيانات المخزنة من profile.js.
     * @param {object | null} storedData - البيانات المفككة من 'firebaseUserProfileData'.
     * @param {object | null} currentUser - كائن المستخدم الحالي من Auth.
     * @returns {object} كائن يحتوي على أدوار boolean (isOwner, isAdmin, isVIP, isPremium, isAdFree).
     */
    function getCalculatedRoles(storedData, currentUser) {
        const roles = {
            isOwner: false,
            isAdmin: false,
            isVIP: false,
            isPremium: false,
            isAdFree: false,
        };

        if (!storedData || !currentUser) {
            return roles;
        }

        // 1. المالك والمدير (isOwner, isAdmin)
        // (يجب أن يكون ownerAdminEmail متاحاً)
        const isEmailOwner = currentUser.email && ownerAdminEmail &&
                             currentUser.email.toLowerCase() === ownerAdminEmail.toLowerCase();
        
        if (isEmailOwner) {
            roles.isOwner = true;
            roles.isAdmin = true; // المالك هو مدير أيضاً
        } else if (storedData.isAdmin === true) {
            roles.isAdmin = true;
        }

        // 2. العضوية المميزة (isVIP)
        const accountType = (storedData.accountType || 'normal').toLowerCase();
        if (accountType === 'vipp') {
            roles.isVIP = true;
        }

        // 3. البريميوم (isPremium) - يعتمد على تاريخ الانتهاء
        const premiumExpiry = storedData.premiumExpiry; // { seconds, nanoseconds }
        const isPremiumActive = premiumExpiry && (premiumExpiry.seconds * 1000) > Date.now();
        
        if (accountType === 'premium' || isPremiumActive) {
            roles.isPremium = true;
        }

        // 4. معفي من الإعلانات (isAdFree) - يعتمد على تاريخ الانتهاء
        const adFreeExpiry = storedData.adFreeExpiry; // null (دائم), أو { seconds, ... }
        const isAdFreePermanent = (adFreeExpiry === null);
        const isAdFreeTemporary = adFreeExpiry && (adFreeExpiry.seconds * 1000) > Date.now();

        if (isAdFreePermanent || isAdFreeTemporary) {
            roles.isAdFree = true;
        }
        
        // 5. [قاعدة من profile.js] عضوية VIP تشمل البريميوم والإعفاء
        if (roles.isVIP) {
            roles.isPremium = true;
            roles.isAdFree = true;
        }

        return roles;
    }
    // =================================================================


    if (app) {
       try {
           auth = getAuth(app);

           // =================================================================
           //  --- [تحديث احترافي] onAuthStateChanged يقرأ ولا يكتب localStorage ---
           // =================================================================
           onAuthStateChanged(auth, (user) => {
               if (user) {
                   // 1. جلب البيانات المخزنة التي وضعها profile.js
                   let cachedUserData = null;
                    const dataString = localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY);
                    if (dataString) {
                        try { cachedUserData = JSON.parse(dataString); } catch(e) { cachedUserData = null; }
                    }

                   // 2. [النقطة الأهم] حساب الأدوار الحقيقية
                   const calculatedRoles = getCalculatedRoles(cachedUserData, user);

                   // 3. دمج البيانات للعرض (بيانات Auth + الأدوار المحسوبة)
                   const displayData = {
                       uid: user.uid,
                       displayName: user.displayName,
                       photoURL: user.photoURL,
                       email: user.email,
                       ...calculatedRoles // <-- إضافة الأدوار الصحيحة (isOwner, isAdmin, etc.)
                   };

                   // 4. [تصحيح] لا تقم بحفظ البيانات من popup.js. profile.js هو المصدر.
                   // localStorage.setItem(FIREBASE_PROFILE_STORAGE_KEY, ...); // <-- تم الحذف

                   // 5. تحديث الواجهة بالصورة من الكاش (الأحدث) أو من Auth
                   const finalPhotoURL = cachedUserData?.photoURL || user.photoURL;
                   updateUI(true, displayData, finalPhotoURL);

               } else {
                   // مسح الكاش عند تسجيل الخروج
                   localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                   updateUI(false, null, null);
               }
               
               if (loginCheckbox) {
                   loginCheckbox.checked = false;
               }
           });
           // =================================================================

       } catch (error) {
           console.error("Failed to get Firebase Auth service:", error);
           updateUI(false, null, null);
           if (loginCheckbox) loginCheckbox.checked = false;
       }
    } else {
        updateUI(false, null, null);
        if (loginCheckbox) loginCheckbox.checked = false;
    }


    /**
     * (دالة محسنة)
     * وظيفة تحديد الدور وتطبيق فئات الألوان والريبل، مع منطق التناوب.
     * @param {HTMLElement} element - الـ label (.logReg)
     * @param {Object} userData - بيانات المستخدم (تحتوي على الأدوار المحسوبة)
     */
    function applyRoleClasses(element, userData) {
        // قائمة بكل فئات الأدوار الممكنة لمسحها
        const allRoleClasses = ['owner', 'admin', 'vipp', 'premium', 'adfree', 'normal'];
        
        const allBorderClasses = allRoleClasses.map(r => `border-${r}`);
        const allRippleClasses = allRoleClasses.map(r => `ripple-${r}`);
        const allRoleClassesSvg = allRoleClasses.map(r => `role-${r}`);

        // 2. مسح المؤقت السابق (للتناوب) إذا كان موجوداً
        if (colorToggleInterval) {
            clearInterval(colorToggleInterval);
            colorToggleInterval = null;
        }

        // 3. مسح جميع فئات الدور الحالية من الأيقونة والإطار
        element.classList.remove(...allRippleClasses, ...allRoleClassesSvg);
        
        const profileImage = element.querySelector('.current-profile-image');
        if (profileImage) {
            profileImage.classList.remove(...allBorderClasses);
        }

        // [تعديل] التحقق إذا كان المستخدم مسجلاً للخروج
        const isLoggedOut = !userData || !userData.uid;
        if (isLoggedOut) {
            return; // لا تقم بتطبيق أي فئات (للحفاظ على لون SVG الأصلي)
        }

        // 4. التحقق من حالة التناوب الخاصة (Premium + AdFree)
        // (الآن هذه القيم صحيحة 100% لأنها محسوبة)
        const hasPremium = userData.isPremium;
        const hasAdFree = userData.isAdFree;
        
        // (يجب ألا يكون مالك أو مدير، لأن لهم أولوية أعلى)
        const isSpecialToggleCase = hasPremium && hasAdFree && !userData.isOwner && !userData.isAdmin;

        if (isSpecialToggleCase) {
            // --- حالة خاصة: تناوب ---
            const toggleRoles = ['premium', 'adfree']; // الأدوار للتناوب
            const toggleBorderClasses = toggleRoles.map(r => `border-${r}`);
            const toggleRippleClasses = toggleRoles.map(r => `ripple-${r}`);
            let colorIndex = 0;

            element.classList.add('role-premium'); // لون SVG الافتراضي

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

            toggleColors(); // شغلها فوراً
            colorToggleInterval = setInterval(toggleColors, 3000); // كرر كل 3 ثوان

        } else {
            // --- 5. حالة عادية: تطبيق الدور الأعلى أولوية ---
            const rolesPriority = [
                { check: userData.isOwner, className: 'owner' },     // <-- (أحمر)
                { check: userData.isAdmin, className: 'admin' },    // <-- (أخضر)
                { check: userData.isVIP, className: 'vipp' },       // <-- (بنفسجي)
                { check: userData.isPremium, className: 'premium' },  // <-- (ذهبي)
                { check: userData.isAdFree, className: 'adfree' },    // <-- (أزرق)
            ];

            let primaryRole = 'normal'; // افتراضي (رمادي)
            for (const role of rolesPriority) {
                if (role.check) {
                    primaryRole = role.className;
                    break; 
                }
            }
            
            // 6. تطبيق اللون الأساسي الثابت
            const primaryBorderClass = `border-${primaryRole}`;
            const primaryRoleClass = `role-${primaryRole}`;
            const primaryRippleClass = `ripple-${primaryRole}`;

            if (profileImage) profileImage.classList.add(primaryBorderClass);
            element.classList.add(primaryRoleClass, primaryRippleClass); 
        }
    }


    /**
     * (دالة محدثة) - تحديث الواجهة بناءً على حالة تسجيل الدخول
     */
    function updateUI(isLoggedIn, userData, profileImageUrl) {
        
        if (userIconLabel) {
             userIconLabel.classList.remove('logged-in');
        }
        
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
                
                // (userData.isAdmin يتضمن الآن المالك أيضاً)
                const isAdminOrOwner = (userData.isAdmin === true); 

                if (adminElement) {
                    adminElement.classList.toggle('hidden', !isAdminOrOwner);
                }
                if (pointsElement) {
                     pointsElement.classList.toggle('hidden', isAdminOrOwner);
                }
                if (productsElement) {
                     productsElement.classList.toggle('hidden', isAdminOrOwner);
                }
                
                // تطبيق الألوان بناءً على الأدوار المحسوبة
                applyRoleClasses(userIconLabel, userData);

            } else { // Not logged in
                belumLogDiv.classList.remove('hidden');
                sudahLogDiv.classList.add('hidden');

                 if (adminElement) adminElement.classList.add('hidden');
                 if (pointsElement) pointsElement.classList.add('hidden');
                 if (productsElement) productsElement.classList.add('hidden');

                 const existingProfileImg = userIconLabel.querySelector('.current-profile-image');
                 if (existingProfileImg) {
                      existingProfileImg.remove();
                 }
                 if (!userIconLabel.querySelector('svg')) {
                     userIconLabel.innerHTML = originalIconHtml;
                 }
                 
                 // مسح الألوان عند تسجيل الخروج
                 applyRoleClasses(userIconLabel, null); 
            }
        }
    }

    // --- (باقي مستمعي الأحداث كما هم) ---

    function logOut() {
        const performLogoutActions = () => {
            if (loginCheckbox) { loginCheckbox.checked = false; }
            // لا حاجة لمسح localStorage يدوياً هنا، onAuthStateChanged سيتكفل بذلك
            window.location.href = "/p/login.html";
        };

        if (!auth) {
            localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
            updateUI(false, null, null);
            performLogoutActions();
            return;
        }

        signOut(auth)
            .then(() => { /* onAuthStateChanged سيقوم بالباقي */ })
            .catch((error) => { /* حتى لو فشل، أعد التوجيه */ })
            .finally(() => {
                performLogoutActions();
            });
    }

    if (logoutElement) {
        logoutElement.addEventListener('click', logOut);
    }
    if (adminElement) {
        adminElement.style.cursor = 'pointer';
        adminElement.addEventListener('click', () => { window.location.href = '/p/admin.html'; });
    }
     if (pointsElement) {
         pointsElement.style.cursor = 'pointer';
         pointsElement.addEventListener('click', (event) => {
             event.preventDefault();
             window.location.href = '/p/points.html';
         });
     }
    if (userIconLabel && loginCheckbox) {
        userIconLabel.style.cursor = 'pointer';
        userIconLabel.addEventListener('click', (event) => {
            event.preventDefault();
            loginCheckbox.checked = !loginCheckbox.checked;
        });
    }
    document.addEventListener('click', (event) => {
        const target = event.target;
        if (loginCheckbox && loginCheckbox.checked && userIconLabel && popupWrapper) {
            const isClickOutside = !userIconLabel.contains(target) && !popupWrapper.contains(target);
            if (isClickOutside) {
                loginCheckbox.checked = false;
            }
        }
    });
});
