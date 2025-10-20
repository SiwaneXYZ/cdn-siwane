import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg'); // هذا هو الـ <label for="forlogPop">
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog'); 
    const sudahLogDiv = document.querySelector('.DonLog'); 

    // تحديد عناصر القائمة
    const adminElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="ادمن"]') : null;
    const logoutElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="الخروج"]') : null;
    const productsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="منتجاتي"]') : null;
    const pointsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="نقاطي"]') : null;


    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData';

    // المحتوى الأصلي لـ userIconLabel (أيقونة SVG الافتراضية)
    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';

    // منطق جلب وتهيئة Firebase (مختصر)
    const firebaseConfigScript = document.getElementById('json:firebaseconfig');
    let firebaseConfig = {};
    if (firebaseConfigScript) {
        try {
            const configData = JSON.parse(firebaseConfigScript.textContent);
            if (configData && typeof configData === 'object') {
                 firebaseConfig = {
                     apiKey: configData.apiKey, authDomain: configData.authDomain, projectId: configData.projectId,
                     databaseURL: configData.databaseURL, storageBucket: configData.storageBucket,
                     messagingSenderId: configData.messagingSenderId, appId: configData.appId,
                 };
                 if (!firebaseConfig.apiKey || (!firebaseConfig.appId && !firebaseConfig.projectId)) {
                      firebaseConfig = {};
                 }
            }
        } catch (e) {
            console.error("Failed to parse Firebase config:", e);
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
        }
    } else {
       app = getApp();
    }
    
    // Auth State Listener
    if (app) {
       try {
           auth = getAuth(app);
           onAuthStateChanged(auth, (user) => {
               let combinedUserData = {};
               let profilePhotoURL = null;

               if (user) {
                   const firebaseUserData = { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL, email: user.email };
                   let cachedUserData = JSON.parse(localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY) || '{}');
                   
                   combinedUserData = {
                       ...cachedUserData, 
                       ...firebaseUserData, 
                       isAdmin: cachedUserData.isAdmin || false,
                       accountType: cachedUserData.accountType || 'normal',
                       premiumExpiry: cachedUserData.premiumExpiry || null
                   };

                   localStorage.setItem(FIREBASE_PROFILE_STORAGE_KEY, JSON.stringify(combinedUserData));
                   profilePhotoURL = combinedUserData.photoURL || user.photoURL;
                   
                   updateUI(true, combinedUserData, profilePhotoURL);
               } else {
                   localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                   updateUI(false, null, null);
               }

               if (loginCheckbox) {
                   loginCheckbox.checked = false;
               }
           });
       } catch (error) {
           updateUI(false, null, null);
           if (loginCheckbox) loginCheckbox.checked = false;
       }
    } else {
        updateUI(false, null, null);
        if (loginCheckbox) loginCheckbox.checked = false;
    }

    // ==========================================================
    //  دالة تحديد نمط الحساب
    // ==========================================================
    function getAccountStyle(userData) {
        const defaultStyle = { className: 'border-normal', color: 'var(--acct-normal-col, #6c757d)' };
        if (!userData) return defaultStyle;

        const accountTypeLower = (userData.accountType || 'normal').toLowerCase();
        let isPremiumActive = false;
        if (userData.premiumExpiry && userData.premiumExpiry.seconds) {
             isPremiumActive = userData.premiumExpiry.seconds * 1000 > Date.now();
        }

        if (userData.isAdmin === true) {
            return { className: 'border-admin', color: 'var(--acct-admin-col, blue)' };
        }
        if (accountTypeLower === 'vipp') {
            return { className: 'border-vipp', color: 'var(--acct-vip-col, purple)' };
        }
        if (accountTypeLower === 'premium' || isPremiumActive) {
            return { className: 'border-premium', color: 'var(--acct-premium-col, gold)' };
        }
        
        return defaultStyle;
    }


    // ==========================================================
    //  دالة تحديث الواجهة
    // ==========================================================
    function updateUI(isLoggedIn, userData, profileImageUrl) {
        if (belumLogDiv && sudahLogDiv) {
            if (isLoggedIn) {
                // إظهار وإخفاء القوائم
                belumLogDiv.classList.add('hidden');
                sudahLogDiv.classList.remove('hidden');

                const isAdmin = userData && userData.isAdmin === true;

                // إظهار وإخفاء عنصر الادمن
                if (adminElement) {
                    adminElement.classList.toggle('hidden', !isAdmin);
                }

                // إخفاء "منتجاتي" و "نقاطي" للمشرف/المالك
                if (productsElement) {
                     productsElement.classList.toggle('hidden', isAdmin);
                }
                 if (pointsElement) {
                     pointsElement.classList.toggle('hidden', isAdmin);
                }


                // تطبيق البوردر والموجات وعرض الصورة
                if (userIconLabel) {
                    const style = getAccountStyle(userData);
                    const borderClasses = ['border-admin', 'border-vipp', 'border-premium', 'border-normal'];

                    // 1. تنظيف الـ DOM وإضافة الموجة
                    userIconLabel.innerHTML = ''; 
                    let ripple = userIconLabel.querySelector('.ripple-effect');
                    if (!ripple) {
                        ripple = document.createElement('span');
                        ripple.className = 'ripple-effect';
                    }
                    ripple.style.borderColor = style.color;
                    ripple.style.display = 'block';
                    userIconLabel.appendChild(ripple);
                    
                    // 2. إزالة كلاسات البوردر القديمة من الحاوية
                    userIconLabel.classList.remove(...borderClasses);
                    
                    if (profileImageUrl) {
                        // (أ) في حال وجود صورة بروفايل:
                        const profileImg = document.createElement('img');
                        profileImg.src = profileImageUrl;
                        profileImg.alt = 'Profile Image';
                        profileImg.classList.add('profileUser', 'current-profile-image'); 
                        
                        profileImg.classList.add(style.className); 
                        userIconLabel.appendChild(profileImg);
                        
                    } else {
                        // (ب) في حال عدم وجود صورة (الأيقونة الافتراضية):
                        
                        userIconLabel.insertAdjacentHTML('beforeend', originalIconHtml);
                        
                        userIconLabel.classList.add(style.className); 
                    }
                }

            } else { // Not logged in
                // حالة تسجيل الخروج
                
                belumLogDiv.classList.remove('hidden');
                sudahLogDiv.classList.add('hidden');
                if (adminElement) adminElement.classList.add('hidden');
                if (productsElement) productsElement.classList.add('hidden');
                if (pointsElement) pointsElement.classList.add('hidden');

                 // تنظيف الواجهة عند تسجيل الخروج
                 if (userIconLabel) {
                      const borderClasses = ['border-admin', 'border-vipp', 'border-premium', 'border-normal'];
                      
                      const ripple = userIconLabel.querySelector('.ripple-effect');
                      if (ripple) ripple.remove();
                      
                      userIconLabel.classList.remove(...borderClasses);
                      userIconLabel.innerHTML = originalIconHtml;
                 }
            }
        }
    }

    // منطق تسجيل الخروج (بقي كما هو)
    function logOut() {
        const performLogoutActions = () => {
            if (loginCheckbox) loginCheckbox.checked = false;
            window.location.href = "/p/login.html";
        };

        if (!auth) {
            localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
            updateUI(false, null, null); 
            performLogoutActions(); 
            return;
        }

        signOut(auth)
            .then(() => {
                performLogoutActions(); 
            })
            .catch((error) => {
                 console.error("Logout failed:", error);
                 performLogoutActions(); 
            });
    }

    // --- Event Listeners (بقي كما هو) ---

    // Logout listener
    if (logoutElement) {
        if (logoutElement.getAttribute('onclick')) logoutElement.removeAttribute('onclick');
        logoutElement.addEventListener('click', logOut);
    }

    // Admin listener
    if (adminElement) {
        adminElement.style.cursor = 'pointer'; 
        if (adminElement.getAttribute('onclick')) adminElement.removeAttribute('onclick');
        adminElement.addEventListener('click', () => {
            window.location.href = '/p/admin.html';
        });
    }

    // Points listener
    if (pointsElement) {
         pointsElement.style.cursor = 'pointer'; 
         if (pointsElement.getAttribute('onclick')) pointsElement.removeAttribute('onclick');
         pointsElement.addEventListener('click', (event) => {
             event.preventDefault();
             window.location.href = '/p/points.html'; 
         });
     }

    // Products listener
    if (productsElement) {
         productsElement.style.cursor = 'pointer'; 
         if (productsElement.getAttribute('onclick')) productsElement.removeAttribute('onclick');
         productsElement.addEventListener('click', (event) => {
             event.preventDefault();
             window.location.href = '/p/my-products.html'; 
         });
     }

    // Close the popup when clicking outside of it
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
