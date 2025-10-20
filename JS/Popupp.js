import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog'); // Not Logged In section
    const sudahLogDiv = document.querySelector('.DonLog'); // Logged In section

    // Select elements within the logged-in section using aria-label
    const adminElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="ادمن"]') : null;
    const logoutElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="الخروج"]') : null;
    // Select the "نقاطي" element
    const pointsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="نقاطي"]') : null;


    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData';

    // Store the original HTML of the user icon label to revert if no profile image
    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';

    // Read Firebase config from script tag
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

                 // Basic validation
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

    // Initialize Firebase App
    const apps = getApps();
    if (apps.length === 0) {
        if (Object.keys(firebaseConfig).length > 0) {
           try {
               app = initializeApp(firebaseConfig);
               console.log("Firebase App initialized.");
           } catch (error) {
               console.error("Firebase initialization failed:", error);
           }
        } else {
            console.warn("Firebase config is missing or invalid. Authentication features may not work.");
        }
    } else {
       app = getApp();
       console.log("Firebase App already initialized.");
    }

    // Get Firebase Auth service and set up Auth State Listener
    if (app) {
       try {
           auth = getAuth(app);
           console.log("Firebase Auth service obtained.");

           // *** Use onAuthStateChanged as the source of truth ***
           onAuthStateChanged(auth, (user) => {
               if (user) {
                   // User is signed in
                   console.log("User is logged in:", user.uid);

                   // Get basic user data from Firebase Auth user object
                   const firebaseUserData = {
                       uid: user.uid,
                       displayName: user.displayName,
                       photoURL: user.photoURL,
                       email: user.email,
                   };

                   let cachedUserData = null;
                    const dataString = localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY);
                    if (dataString) {
                        try { cachedUserData = JSON.parse(dataString); } catch(e) { console.error("Failed to parse cached user data:", e); cachedUserData = null; }
                    }

                   // Combine Firebase Auth data with cached data (prioritizing Firebase data)
                   const combinedUserData = {
                       ...cachedUserData, // Start with cached data
                       ...firebaseUserData, // Overwrite with fresh Firebase Auth data
                       
                       // جلب البيانات الهامة من الكاش (التي لا يوفرها Auth)
                       isAdmin: cachedUserData ? cachedUserData.isAdmin : false,
                       accountType: cachedUserData ? cachedUserData.accountType : 'normal',
                       premiumExpiry: cachedUserData ? cachedUserData.premiumExpiry : null
                   };

                   // Optionally update the cache with the latest auth data
                   localStorage.setItem(FIREBASE_PROFILE_STORAGE_KEY, JSON.stringify(combinedUserData));


                   // Update UI based on the authenticated user data
                   updateUI(true, combinedUserData, combinedUserData.photoURL || user.photoURL);

               } else {
                   // User is signed out
                   console.log("User is logged out.");
                   // Clear local cache on sign out
                   localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                   // Update UI to logged out state
                   updateUI(false, null, null);
               }
               // Close the popup regardless of state change after load/auth check
               if (loginCheckbox) {
                   loginCheckbox.checked = false;
               }
           });

       } catch (error) {
           console.error("Failed to get Firebase Auth service:", error);
           // If Auth service fails, ensure UI shows logged out state as a fallback
           updateUI(false, null, null);
           if (loginCheckbox) {
                loginCheckbox.checked = false;
           }
       }
    } else {
        console.warn("Firebase App is not initialized. Auth state listener will not be set.");
        // If App failed, ensure UI shows logged out state
        updateUI(false, null, null);
        if (loginCheckbox) {
            loginCheckbox.checked = false;
        }
    }

    // ==========================================================
    //  [إضافة] دالة تحديد نمط الحساب (اللون والكلاس)
    // ==========================================================
    /**
     * يحدد كلاس CSS واللون بناءً على بيانات المستخدم المخزنة.
     * @param {object} userData - كائن بيانات المستخدم من localStorage.
     * @returns {{className: string, color: string}}
     */
    function getAccountStyle(userData) {
        // القيم الافتراضية
        const defaultStyle = { className: 'border-normal', color: 'var(--acct-normal-col, #6c757d)' };

        if (!userData) return defaultStyle;

        const accountTypeLower = (userData.accountType || 'normal').toLowerCase();
        
        // تحويل premiumExpiry (الذي قد يكون {seconds:..., nanoseconds:...}) إلى تاريخ للمقارنة
        let isPremiumActive = false;
        if (userData.premiumExpiry && userData.premiumExpiry.seconds) {
             isPremiumActive = userData.premiumExpiry.seconds * 1000 > Date.now();
        }

        // 1. الأدمن (أو المالك، لأن ملف البروفايل يضع isAdmin:true للمالك في الكاش)
        if (userData.isAdmin === true) {
            return { className: 'border-admin', color: 'var(--acct-admin-col, blue)' };
        }
        // 2. العضوية الدائمة (VIPP)
        if (accountTypeLower === 'vipp') {
            return { className: 'border-vipp', color: 'var(--acct-vip-col, purple)' };
        }
        // 3. العضوية المميزة (Premium) النشطة
        if (accountTypeLower === 'premium' || isPremiumActive) {
            return { className: 'border-premium', color: 'var(--acct-premium-col, gold)' };
        }
        
        // 4. الحساب العادي
        return defaultStyle;
    }


    // ==========================================================
    //  [تعديل] دالة تحديث الواجهة (لتطبيق البوردر والموجات)
    // ==========================================================
    function updateUI(isLoggedIn, userData, profileImageUrl) {
        if (belumLogDiv && sudahLogDiv) {
            if (isLoggedIn) {
                // --- [1] (منطق موجود) إظهار وإخفاء القوائم ---
                belumLogDiv.classList.add('hidden');
                sudahLogDiv.classList.remove('hidden');

                // Handle Admin element visibility
                if (adminElement) {
                    if (userData && userData.isAdmin === true) {
                        adminElement.classList.remove('hidden');
                    } else {
                        adminElement.classList.add('hidden');
                    }
                }

                // Handle Points element visibility (Hide if Admin)
                if (pointsElement) {
                     if (userData && userData.isAdmin === true) {
                         pointsElement.classList.add('hidden'); // Hide points for admin
                     } else {
                         pointsElement.classList.remove('hidden'); // Show points for non-admin
                     }
                }

                // --- [2] (منطق جديد) تطبيق البوردر والموجات ---
                if (userIconLabel) {
                    // 1. الحصول على النمط (اللون والكلاس) بناءً على بيانات المستخدم
                    const style = getAccountStyle(userData);

                    // 2. تنظيف أي كلاسات بوردر قديمة من الحاوية
                    userIconLabel.className = 'logReg'; // إعادة تعيين الكلاسات

                    // 3. إنشاء أو تحديث عنصر الموجات (Ripple)
                    let ripple = userIconLabel.querySelector('.ripple-effect');
                    if (!ripple) {
                        ripple = document.createElement('span');
                        ripple.className = 'ripple-effect';
                        userIconLabel.appendChild(ripple); // إضافته داخل الحاوية
                    }
                    ripple.style.borderColor = style.color; // تطبيق لون الموجة
                    ripple.style.display = 'block';         // إظهار الموجة

                    // 4. (منطق موجود) إزالة الصورة القديمة إن وجدت
                     const existingProfileImg = userIconLabel.querySelector('.current-profile-image');
                     if (existingProfileImg) {
                         existingProfileImg.remove();
                     }

                    // 5. (منطق معدل) عرض الصورة الجديدة أو الأيقونة الافتراضية
                    if (profileImageUrl) {
                        // (أ) في حال وجود صورة بروفايل:
                        const profileImg = document.createElement('img');
                        profileImg.src = profileImageUrl;
                        profileImg.alt = 'Profile Image';
                        profileImg.classList.add('profileUser');
                        profileImg.classList.add('current-profile-image'); 
                        
                        profileImg.classList.add(style.className); // <-- تطبيق كلاس البوردر على الصورة

                        userIconLabel.appendChild(profileImg);
                        if (userIconLabel.innerHTML.includes(originalIconHtml)) {
                             userIconLabel.innerHTML = ''; 
                             userIconLabel.appendChild(ripple); // إعادة إضافة الموجة
                             userIconLabel.appendChild(profileImg);
                         }
                    } else {
                        // (ب) في حال عدم وجود صورة (أيقونة افتراضية):
                        if (!userIconLabel.innerHTML.includes(originalIconHtml)) {
                             userIconLabel.innerHTML = originalIconHtml;
                             userIconLabel.appendChild(ripple); // إعادة إضافة الموجة
                        }
                        userIconLabel.classList.add(style.className); // <-- تطبيق كلاس البوردر على الحاوية نفسها
                    }
                }

            } else { // Not logged in
                // --- [3] (منطق معدل) حالة تسجيل الخروج ---
                
                // (منطق موجود) إظهار وإخفاء القوائم
                belumLogDiv.classList.remove('hidden');
                sudahLogDiv.classList.add('hidden');
                 if (adminElement) adminElement.classList.add('hidden');
                 if (pointsElement) pointsElement.classList.add('hidden');

                 // (منطق معدل) تنظيف الواجهة عند تسجيل الخروج
                 if (userIconLabel) {
                      // 1. إزالة عنصر الموجات
                      const ripple = userIconLabel.querySelector('.ripple-effect');
                      if (ripple) ripple.remove();
                      
                      // 2. إزالة كلاسات البوردر
                      userIconLabel.className = 'logReg';

                      // 3. (منطق موجود) إزالة الصورة وإرجاع الأيقونة الأصلية
                      const existingProfileImg = userIconLabel.querySelector('.current-profile-image');
                      if (existingProfileImg) {
                          existingProfileImg.remove();
                      }
                      if (!userIconLabel.innerHTML.includes(originalIconHtml)) {
                         userIconLabel.innerHTML = originalIconHtml;
                     }
                 }
            }
        }
    }

    // Handle Logout
    function logOut() {
        const performLogoutActions = () => {
            console.log("Performing post-logout cleanup and navigation.");
            if (loginCheckbox) {
                loginCheckbox.checked = false;
            }
            window.location.href = "/p/login.html";
        };

        if (!auth) {
            console.warn("Firebase Auth not available. Clearing local state and navigating.");
            localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
            updateUI(false, null, null); // Update UI manually
            performLogoutActions(); // Navigate
            return;
        }

        console.log("Attempting Firebase signOut...");
        signOut(auth)
            .then(() => {
                console.log("Firebase signOut successful.");
                performLogoutActions(); // onAuthStateChanged سيهتم بالباقي
            })
            .catch((error) => {
                 console.error("Logout failed:", error);
                 performLogoutActions(); // تنظيف احتياطي
            });
    }

    // --- Event Listeners ---

    // Logout button listener
    if (logoutElement) {
        if (logoutElement.getAttribute('onclick')) {
            logoutElement.removeAttribute('onclick');
        }
        logoutElement.addEventListener('click', logOut);
        console.log("Logout listener added.");
    }

    // Admin element click listener (navigation only)
    if (adminElement) {
        adminElement.style.cursor = 'pointer'; 
        if (adminElement.getAttribute('onclick')) {
             adminElement.removeAttribute('onclick');
         }
        adminElement.addEventListener('click', () => {
            console.log("Admin element clicked. Redirecting...");
            window.location.href = '/p/admin.html';
        });
        console.log("Admin listener added.");
    }

     // Points element click listener
    if (pointsElement) {
         pointsElement.style.cursor = 'pointer'; 
         if (pointsElement.getAttribute('onclick')) {
              pointsElement.removeAttribute('onclick');
          }
         pointsElement.addEventListener('click', (event) => {
             event.preventDefault();
             console.log("Points element clicked. Redirecting...");
             window.location.href = '/p/points.html'; 
         });
         console.log("Points listener added.");
     }


    // User icon click listener to toggle the popup checkbox
    if (userIconLabel && loginCheckbox) {
        userIconLabel.style.cursor = 'pointer'; 
        userIconLabel.addEventListener('click', (event) => {
            event.preventDefault();
            loginCheckbox.checked = !loginCheckbox.checked;
            console.log("User icon clicked. Popup checkbox state:", loginCheckbox.checked);
        });
        console.log("User icon listener added.");
    }

    // Close the popup when clicking outside of it
    document.addEventListener('click', (event) => {
        const target = event.target;
        if (loginCheckbox && loginCheckbox.checked && userIconLabel && popupWrapper) {
            const isClickOutside = !userIconLabel.contains(target) && !popupWrapper.contains(target);

            if (isClickOutside) {
                loginCheckbox.checked = false;
                console.log("Clicked outside popup. Closing popup.");
            }
        }
    });
    console.log("Document click listener for popup closing added.");

});
