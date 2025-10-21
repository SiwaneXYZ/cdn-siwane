import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog'); 
    const sudahLogDiv = document.querySelector('.DonLog'); 

    // تحديد عناصر الروابط
    const adminElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="ادمن"]') : null;
    const logoutElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="الخروج"]') : null;
    const pointsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="نقاطي"]') : null;
    const productsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="منتجاتي"]') : null;

    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData';
    // الصورة الافتراضية المطلوبة
    const DEFAULT_PROFILE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; 

    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';
    let colorToggleInterval = null; // متغير لتخزين مؤقت التناوب اللوني

    // --- Firebase Initialization (As Original) ---
    const firebaseConfigScript = document.getElementById('json:firebaseconfig');
    let firebaseConfig = {};

    if (firebaseConfigScript) {
        const configText = firebaseConfigScript.textContent;
        try {
            const configData = JSON.parse(configText);
            if (configData && typeof configData === 'object') {
                 firebaseConfig = {
                     apiKey: configData.apiKey,
                     authDomain: configData.authDomain,
                     projectId: configData.projectId,
                     databaseURL: configData.databaseURL,
                     storageBucket: configData.storageBucket,
                     messagingSenderId: configData.messagingSenderId,
                     appId: configData.appId,
                 };
                 if (!firebaseConfig.apiKey || (!firebaseConfig.appId && !firebaseConfig.projectId)) {
                      firebaseConfig = {};
                      console.error("Firebase config is missing apiKey or appId/projectId.");
                 }
            }
        } catch (e) {
            console.error("Failed to parse Firebase config from script tag:", e);
        }
    }

    let app;
    let auth = null;

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
    // --- End Firebase Init ---

    if (app) {
       try {
           auth = getAuth(app);

           onAuthStateChanged(auth, (user) => {
               if (user) {
                   const firebaseUserData = {
                       uid: user.uid,
                       displayName: user.displayName,
                       photoURL: user.photoURL,
                       email: user.email,
                   };

                   let cachedUserData = null;
                    const dataString = localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY);
                    if (dataString) {
                        try { cachedUserData = JSON.parse(dataString); } catch(e) { cachedUserData = null; }
                    }

                   // دمج بيانات الأدوار من التخزين المحلي
                   const combinedUserData = {
                       isAdmin: cachedUserData ? cachedUserData.isAdmin : false, 
                       isOwner: cachedUserData ? cachedUserData.isOwner : false, 
                       isVIP: cachedUserData ? cachedUserData.isVIP : false, 
                       isPremium: cachedUserData ? cachedUserData.isPremium : false, 
                       isAdFree: cachedUserData ? cachedUserData.isAdFree : false, // <-- التأكد من قراءة هذا الدور
                       ...firebaseUserData, 
                   };

                   localStorage.setItem(FIREBASE_PROFILE_STORAGE_KEY, JSON.stringify(combinedUserData));

                   const finalPhotoURL = combinedUserData.photoURL || user.photoURL;
                   updateUI(true, combinedUserData, finalPhotoURL);

               } else {
                   localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                   updateUI(false, null, null);
               }
               if (loginCheckbox) {
                   loginCheckbox.checked = false;
               }
           });

       } catch (error) {
           console.error("Failed to get Firebase Auth service:", error);
           updateUI(false, null, null);
           if (loginCheckbox) {
                loginCheckbox.checked = false;
           }
       }
    } else {
        updateUI(false, null, null);
        if (loginCheckbox) {
            loginCheckbox.checked = false;
        }
    }


    // =================================================================
    //  --- الدالة الأساسية المُحسَّنة ---
    // =================================================================
    
    /**
     * وظيفة تحديد الدور وتطبيق فئات الألوان والريبل، مع منطق التناوب.
     * @param {HTMLElement} element - الـ label (.logReg)
     * @param {Object} userData - بيانات المستخدم المدمجة
     */
    function applyRoleClasses(element, userData) {
        // قائمة بكل فئات الأدوار الممكنة لمسحها
        const allRoleClasses = ['owner', 'admin', 'vipp', 'premium', 'adfree', 'normal'];
        
        // 1. تجميع كل الفئات (border, ripple, role)
        const allClassesToRemove = allRoleClasses.flatMap(r => [`border-${r}`, `ripple-${r}`, `role-${r}`]);
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

        // 4. التحقق من حالة التناوب الخاصة (Premium + AdFree)
        const hasPremium = userData.isPremium;
        const hasAdFree = userData.isAdFree;

        if (hasPremium && hasAdFree) {
            // --- حالة خاصة: تناوب ---
            const toggleRoles = ['premium', 'adfree']; // الأدوار للتناوب
            const toggleBorderClasses = toggleRoles.map(r => `border-${r}`);
            const toggleRippleClasses = toggleRoles.map(r => `ripple-${r}`);
            let colorIndex = 0;

            // تطبيق لون SVG الأساسي (ليكن بريميوم)
            element.classList.add('role-premium'); 

            // دالة التبديل
            const toggleColors = () => {
                const currentRole = toggleRoles[colorIndex % toggleRoles.length];
                colorIndex++;
                
                const currentBorderClass = `border-${currentRole}`;
                const currentRippleClass = `ripple-${currentRole}`;

                // إزالة *جميع* فئات التناوب (لضمان عدم التداخل)
                if (profileImage) {
                     profileImage.classList.remove(...toggleBorderClasses);
                }
                element.classList.remove(...toggleRippleClasses);
                
                // تطبيق فئات التناوب الجديدة
                if (profileImage) {
                     profileImage.classList.add(currentBorderClass);
                }
                element.classList.add(currentRippleClass);
            };

            // تشغيل التبديل فوراً عند التحميل
            toggleColors(); 
            // بدء المؤقت (كل 3 ثواني، يطابق تقريباً "موجتين" من الريبل)
            colorToggleInterval = setInterval(toggleColors, 3000); 

        } else {
            // --- 5. حالة عادية: تطبيق الدور الأعلى أولوية ---
            const rolesPriority = [
                { check: userData.isOwner, className: 'owner' },
                { check: userData.isAdmin, className: 'admin' },
                { check: userData.isVIP, className: 'vipp' },
                { check: userData.isPremium, className: 'premium' },
                { check: userData.isAdFree, className: 'adfree' }, // <-- تمت إضافته للأولوية
            ];

            let primaryRole = 'normal'; // افتراضي
            for (const role of rolesPriority) {
                if (role.check) {
                    primaryRole = role.className;
                    break; // توقف عند العثور على أعلى دور
                }
            }
            
            // 6. تطبيق اللون الأساسي الثابت
            const primaryBorderClass = `border-${primaryRole}`;
            const primaryRoleClass = `role-${primaryRole}`;
            const primaryRippleClass = `ripple-${primaryRole}`;

            if (profileImage) {
                profileImage.classList.add(primaryBorderClass);
            }
            element.classList.add(primaryRoleClass, primaryRippleClass); 
        }
    }


    // =================================================================
    //  --- باقي الدوال (بدون تغيير) ---
    // =================================================================

    // Modified updateUI function
    function updateUI(isLoggedIn, userData, profileImageUrl) {
        
        // إزالة فئات الدور والريبل عند التحديث أو الخروج
        if (userIconLabel) {
             userIconLabel.classList.remove('logged-in');
        }
        
        // مسح المؤقت عند تحديث الواجهة (مهم جداً عند تسجيل الخروج)
        if (colorToggleInterval) {
            clearInterval(colorToggleInterval);
            colorToggleInterval = null;
        }

        if (belumLogDiv && sudahLogDiv && userIconLabel) {
            if (isLoggedIn) {
                belumLogDiv.classList.add('hidden');
                sudahLogDiv.classList.remove('hidden');

                // تفعيل فئة الدخول لتشغيل الريبل في الـ CSS
                userIconLabel.classList.add('logged-in');

                // الصورة النهائية (مع الصورة الافتراضية إذا لزم الأمر)
                const finalImageUrl = profileImageUrl || DEFAULT_PROFILE_IMAGE;

                // تحديث الصورة
                let profileImg = userIconLabel.querySelector('.current-profile-image');
                if (!profileImg) {
                    profileImg = document.createElement('img');
                    profileImg.classList.add('profileUser', 'current-profile-image');
                    userIconLabel.innerHTML = '';
                    userIconLabel.appendChild(profileImg);
                }
                profileImg.src = finalImageUrl;
                
                // منطق إخفاء/إظهار الروابط للمدراء/المشرفين
                const isAdminOrOwner = (userData && (userData.isAdmin === true || userData.isOwner === true));

                // 1. إظهار/إخفاء زر الإدمن
                if (adminElement) {
                    if (isAdminOrOwner) { 
                        adminElement.classList.remove('hidden');
                    } else {
                        adminElement.classList.add('hidden');
                    }
                }
                
                // 2. إخفاء زر النقاط (Points) و المنتجات (Products) للمدير/المالك
                if (pointsElement) {
                     if (isAdminOrOwner) {
                         pointsElement.classList.add('hidden');
                     } else {
                         pointsElement.classList.remove('hidden');
                     }
                }
                if (productsElement) {
                     if (isAdminOrOwner) {
                         productsElement.classList.add('hidden');
                     } else {
                         productsElement.classList.remove('hidden');
                     }
                }
                
                // تطبيق فئات الألوان والريبل والتناوب
                // (هذه الدالة ستقوم بالمسح والتطبيق)
                applyRoleClasses(userIconLabel, userData);


            } else { // Not logged in
                belumLogDiv.classList.remove('hidden');
                sudahLogDiv.classList.add('hidden');

                 // إخفاء جميع الروابط الخاصة بتسجيل الدخول
                 if (adminElement) { adminElement.classList.add('hidden'); }
                 if (pointsElement) { pointsElement.classList.add('hidden'); }
                 if (productsElement) { productsElement.classList.add('hidden'); }

                 // استعادة أيقونة المستخدم الأصلية (SVG)
                 const existingProfileImg = userIconLabel.querySelector('.current-profile-image');
                 if (existingProfileImg) {
                      existingProfileImg.remove();
                 }
                 if (!userIconLabel.querySelector('svg')) {
                     userIconLabel.innerHTML = originalIconHtml;
                 }
                 
                 // مسح أي فئات ألوان متبقية من الأيقونة
                 applyRoleClasses(userIconLabel, {}); // استدعاء الدالة ببيانات فارغة لمسح الألوان
            }
        }
    }

    // --- Event Listeners (As Original) ---
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
            .then(() => { performLogoutActions(); })
            .catch((error) => { performLogoutActions(); });
    }

    if (logoutElement) {
        if (logoutElement.getAttribute('onclick')) { logoutElement.removeAttribute('onclick'); }
        logoutElement.addEventListener('click', logOut);
    }
    if (adminElement) {
        adminElement.style.cursor = 'pointer';
        if (adminElement.getAttribute('onclick')) { adminElement.removeAttribute('onclick'); }
        adminElement.addEventListener('click', () => { window.location.href = '/p/admin.html'; });
    }
     if (pointsElement) {
         pointsElement.style.cursor = 'pointer';
         if (pointsElement.getAttribute('onclick')) { pointsElement.removeAttribute('onclick'); }
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
