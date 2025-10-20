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

                   // دمج بيانات الأدوار من التخزين المحلي (لأغراض العرض فقط، وليس للتحكم في الوصول)
                   const combinedUserData = {
                       // افتراض أن هذه القيم تأتي من مكان آخر ويتم تخزينها مؤقتاً هنا
                       isAdmin: cachedUserData ? cachedUserData.isAdmin : false, // مدير
                       isOwner: cachedUserData ? cachedUserData.isOwner : false, // مالك (أو مشرف)
                       isVIP: cachedUserData ? cachedUserData.isVIP : false, // VIP
                       isPremium: cachedUserData ? cachedUserData.isPremium : false, // بريميوم
                       isAdFree: cachedUserData ? cachedUserData.isAdFree : false, // إعفاء من الإعلانات
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


    /**
     * وظيفة تحديد الدور وتطبيق فئات الألوان والريبل، مع منطق التناوب.
     * @param {HTMLElement} element - الـ label (.logReg)
     * @param {Object} userData - بيانات المستخدم المدمجة
     */
    function applyRoleClasses(element, userData) {
        // قائمة بالأدوار حسب الأولوية (الأعلى إلى الأدنى)
        const roles = [
            { check: userData.isOwner, className: 'owner' },
            { check: userData.isAdmin, className: 'admin' },
            { check: userData.isVIP, className: 'vipp' },
            { check: userData.isPremium, className: 'premium' },
        ];

        // قائمة بجميع فئات الأدوار لضمان مسحها
        const allRoleClasses = ['owner', 'admin', 'vipp', 'premium', 'normal'].flatMap(r => [`border-${r}`, `ripple-${r}`, `role-${r}`]);

        // 1. مسح جميع فئات الدور الحالية
        const classesToRemove = element.className.split(' ').filter(c => allRoleClasses.some(roleClass => c.startsWith(roleClass.substring(0, roleClass.indexOf('-') + 1))));
        element.classList.remove(...classesToRemove);

        const profileImage = element.querySelector('.current-profile-image');
        if (profileImage) {
            profileImage.classList.remove(...allRoleClasses.filter(c => c.startsWith('border-')));
        }

        // 2. تحديد الدور الرئيسي (الأعلى أولوية)
        let primaryRole = 'normal';
        for (const role of roles) {
            if (role.check) {
                primaryRole = role.className;
                break; 
            }
        }
        
        // 3. تطبيق اللون الأساسي على الإطار والأيقونة/الريبل
        const primaryBorderClass = `border-${primaryRole}`;
        const primaryRoleClass = `role-${primaryRole}`;
        const primaryRippleClass = `ripple-${primaryRole}`;

        if (profileImage) {
            profileImage.classList.add(primaryBorderClass);
        }
        element.classList.add(primaryRoleClass, primaryRippleClass); 
        
        // 4. منطق التناوب اللوني (Premium + AdFree)
        const hasAdFree = userData.isAdFree;
        const hasPremium = userData.isPremium;

        // مسح أي مؤقت سابق للتناوب
        if (colorToggleInterval) {
            clearInterval(colorToggleInterval);
            colorToggleInterval = null;
        }

        if (hasPremium && hasAdFree) {
            // التناوب بين Premium (ذهبي) و Owner/Admin (الأخضر/الأحمر الداكن)
            const toggleRoles = ['premium', 'owner']; // استخدمنا 'owner' كبديل لـ 'AdFree' لون خاص
            let colorIndex = 0;

            colorToggleInterval = setInterval(() => {
                const currentRole = toggleRoles[colorIndex % toggleRoles.length];
                colorIndex++;
                
                const currentBorderClass = `border-${currentRole}`;
                const currentRippleClass = `ripple-${currentRole}`;

                // إزالة فئات التناوب القديمة
                if (profileImage) {
                     profileImage.classList.remove(...toggleRoles.map(r => `border-${r}`));
                }
                element.classList.remove(...toggleRoles.map(r => `ripple-${r}`));
                
                // تطبيق فئات التناوب الجديدة
                if (profileImage) {
                     profileImage.classList.add(currentBorderClass);
                }
                element.classList.add(currentRippleClass);
                
            }, 5000); // 5 ثواني للتناوب
        }
    }


    // Modified updateUI function
    function updateUI(isLoggedIn, userData, profileImageUrl) {
        
        // إزالة فئات الدور والريبل عند التحديث أو الخروج
        if (userIconLabel) {
             userIconLabel.classList.remove('logged-in');
             // مسح جميع فئات الدور
             userIconLabel.className = userIconLabel.className.split(' ').filter(c => !c.startsWith('role-') && !c.startsWith('ripple-')).join(' ');
        }
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
