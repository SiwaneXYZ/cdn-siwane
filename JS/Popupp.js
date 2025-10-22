import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog');
    const sudahLogDiv = document.querySelector('.DonLog');

    // تحديد العناصر باستخدام الكلاسات الجديدة
    const adminElement = document.querySelector('.admin-link');
    const logoutElement = document.querySelector('.logout-link');
    const pointsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="نقاطي"]') : null;
    const myProductsElement = document.querySelector('.my-products-link');

    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData';
    const DEFAULT_PROFILE_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';

    // قراءة إعدادات Firebase
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

    // تهيئة Firebase
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

    // الحصول على خدمة المصادقة
    if (app) {
       try {
           auth = getAuth(app);
           console.log("Firebase Auth service obtained.");

           onAuthStateChanged(auth, (user) => {
               if (user) {
                   console.log("User is logged in:", user.uid);

                   const firebaseUserData = {
                       uid: user.uid,
                       displayName: user.displayName,
                       photoURL: user.photoURL,
                       email: user.email,
                   };

                   let cachedUserData = null;
                    const dataString = localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY);
                    if (dataString) {
                        try { cachedUserData = JSON.parse(dataString); } catch(e) { 
                            console.error("Failed to parse cached user data:", e); 
                            cachedUserData = null; 
                        }
                    }

                   const combinedUserData = {
                       ...cachedUserData,
                       ...firebaseUserData,
                       isAdmin: cachedUserData ? cachedUserData.isAdmin : false
                   };

                   localStorage.setItem(FIREBASE_PROFILE_STORAGE_KEY, JSON.stringify(combinedUserData));

                   updateUI(true, combinedUserData, combinedUserData.photoURL || user.photoURL);

               } else {
                   console.log("User is logged out.");
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
        console.warn("Firebase App is not initialized. Auth state listener will not be set.");
        updateUI(false, null, null);
        if (loginCheckbox) {
            loginCheckbox.checked = false;
        }
    }

    // دوال تأثير الريبل
    function activateRippleEffect() {
        if (userIconLabel) {
            userIconLabel.classList.remove('ripple-active');
            void userIconLabel.offsetWidth;
            userIconLabel.classList.add('ripple-active');
            
            setTimeout(() => {
                userIconLabel.classList.remove('ripple-active');
            }, 2000);
        }
    }

    function startContinuousRipple() {
        if (userIconLabel) {
            userIconLabel.classList.add('logged-in');
        }
    }

    function stopContinuousRipple() {
        if (userIconLabel) {
            userIconLabel.classList.remove('logged-in');
            userIconLabel.classList.remove('ripple-active');
        }
    }

    // تحديث واجهة المستخدم
    function updateUI(isLoggedIn, userData, profileImageUrl) {
        if (belumLogDiv && sudahLogDiv) {
            if (isLoggedIn) {
                belumLogDiv.classList.add('hidden');
                sudahLogDiv.classList.remove('hidden');

                // التحكم في عنصر المشرف
                if (adminElement) {
                    if (userData && userData.isAdmin === true) {
                        adminElement.classList.remove('hidden');
                    } else {
                        adminElement.classList.add('hidden');
                    }
                }

                // التحكم في عنصر "منتجاتي" (إخفاء إذا كان مشرف)
                if (myProductsElement) {
                     if (userData && userData.isAdmin === true) {
                         myProductsElement.classList.add('hidden');
                     } else {
                         myProductsElement.classList.remove('hidden');
                     }
                }

                // التحكم في عنصر "نقاطي"
                if (pointsElement) {
                     if (userData && userData.isAdmin === true) {
                         pointsElement.classList.add('hidden');
                     } else {
                         pointsElement.classList.remove('hidden');
                     }
                }

                // تحديث صورة المستخدم
                if (userIconLabel) {
                    const existingProfileImg = userIconLabel.querySelector('.current-profile-image');
                    if (existingProfileImg) {
                        existingProfileImg.remove();
                    }

                    const imageUrl = profileImageUrl || DEFAULT_PROFILE_IMAGE;
                    
                    const profileImg = document.createElement('img');
                    profileImg.src = imageUrl;
                    profileImg.alt = 'Profile Image';
                    profileImg.classList.add('profileUser');
                    profileImg.classList.add('current-profile-image');
                    
                    profileImg.onerror = function() {
                        this.src = DEFAULT_PROFILE_IMAGE;
                    };
                    
                    userIconLabel.innerHTML = '';
                    userIconLabel.appendChild(profileImg);

                    startContinuousRipple();
                    
                    setTimeout(() => {
                        activateRippleEffect();
                    }, 100);
                }

            } else {
                belumLogDiv.classList.remove('hidden');
                sudahLogDiv.classList.add('hidden');

                 if (adminElement) adminElement.classList.add('hidden');
                 if (pointsElement) pointsElement.classList.add('hidden');
                 if (myProductsElement) myProductsElement.classList.add('hidden');

                 if (userIconLabel) {
                      const existingProfileImg = userIconLabel.querySelector('.current-profile-image');
                      if (existingProfileImg) {
                          existingProfileImg.remove();
                      }
                      userIconLabel.innerHTML = originalIconHtml;
                      stopContinuousRipple();
                 }
            }
        }
    }

    // تسجيل الخروج
    function logOut() {
        const performLogoutActions = () => {
            console.log("Performing post-logout cleanup and navigation.");
            if (loginCheckbox) {
                loginCheckbox.checked = false;
            }
            window.location.href = "/p/login.html";
        };

        if (!auth) {
            console.warn("Firebase Auth not available. Cannot perform Firebase signOut.");
            localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
            updateUI(false, null, null);
            performLogoutActions();
            return;
        }

        console.log("Attempting Firebase signOut...");
        signOut(auth)
            .then(() => {
                console.log("Firebase signOut successful.");
                performLogoutActions();
            })
            .catch((error) => {
                 console.error("Logout failed:", error);
                 performLogoutActions();
            });
    }

    // إضافة مستمعي الأحداث
    if (logoutElement) {
        if (logoutElement.getAttribute('onclick')) {
            logoutElement.removeAttribute('onclick');
        }
        logoutElement.addEventListener('click', logOut);
    }

    if (adminElement) {
        adminElement.style.cursor = 'pointer';
        if (adminElement.getAttribute('onclick')) {
             adminElement.removeAttribute('onclick');
         }
        adminElement.addEventListener('click', () => {
            window.location.href = '/p/admin.html';
        });
    }

    if (pointsElement) {
         pointsElement.style.cursor = 'pointer';
         if (pointsElement.getAttribute('onclick')) {
              pointsElement.removeAttribute('onclick');
          }
         pointsElement.addEventListener('click', (event) => {
             event.preventDefault();
             window.location.href = '/p/points.html';
         });
     }

    if (myProductsElement) {
         myProductsElement.style.cursor = 'pointer';
         if (myProductsElement.getAttribute('onclick')) {
              myProductsElement.removeAttribute('onclick');
          }
         myProductsElement.addEventListener('click', (event) => {
             event.preventDefault();
             window.location.href = '/p/my-products.html';
         });
     }

    if (userIconLabel && loginCheckbox) {
        userIconLabel.style.cursor = 'pointer';
        userIconLabel.addEventListener('click', (event) => {
            event.preventDefault();
            loginCheckbox.checked = !loginCheckbox.checked;
            activateRippleEffect();
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
