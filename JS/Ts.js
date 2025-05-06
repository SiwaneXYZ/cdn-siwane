import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Starting script execution."); // <-- رسالة بداية السكربت

    // --- الحصول على عناصر واجهة المستخدم وفحص وجودها ---
    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog'); // <-- تم التعديل ليطابق ما قدمته مؤخراً
    const sudahLogDiv = document.querySelector('.DonLog'); // <-- تم التعديل ليطابق ما قدمته مؤخراً

    console.log("Elements check: loginCheckbox:", loginCheckbox); // <-- فحص عنصر
    console.log("Elements check: userIconLabel:", userIconLabel); // <-- فحص عنصر
    console.log("Elements check: popupWrapper:", popupWrapper); // <-- فحص عنصر
    console.log("Elements check: belumLogDiv (NotLog):", belumLogDiv); // <-- فحص عنصر
    console.log("Elements check: sudahLogDiv (DonLog):", sudahLogDiv); // <-- فحص عنصر


    // الحصول على عنصر "الخروج" (داخل قسم sudahLogDiv)
    // تأكد من الفئة الصحيحة هنا (loginA أو loginS) بناءً على HTML الخاص بك
    const logoutElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="الخروج"]') : null; // <-- تم التعديل ليطابق class='loginS' من مثالك الأخير

    console.log("Elements check: logoutElement:", logoutElement); // <-- فحص عنصر


    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData';

    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';

    // --- قراءة إعدادات Firebase من وسم السكربت JSON في HTML ---
    console.log("Starting Firebase config parsing."); // <-- بداية قسم التهيئة

    const firebaseConfigScript = document.getElementById('json:firebaseconfig');
    console.log("1. Found config script:", firebaseConfigScript); // <-- فحص العثور على السكربت

    let firebaseConfig = {};

    if (firebaseConfigScript) {
        const configText = firebaseConfigScript.textContent;
        console.log("2. Config text content:", configText); // <-- عرض محتوى السكربت

        try {
            const configData = JSON.parse(configText);
            console.log("3. Parsed config data:", configData); // <-- عرض البيانات بعد التحليل

            if (configData && configData.links && Array.isArray(configData.links)) {
                 firebaseConfig = {
                     apiKey: configData.links.find(l => l.name === 'apiKey')?.target,
                     authDomain: configData.links.find(l => l.name === 'authDomain')?.target,
                     projectId: configData.links.find(l => l.name === 'projectId')?.target,
                     databaseURL: configData.links.find(l => l.name === 'databaseURL')?.target,
                     storageBucket: configData.links.find(l => l.name === 'storageBucket')?.target,
                     messagingSenderId: configData.links.find(l => l.name === 'messagingSenderId')?.target,
                     appId: configData.links.find(l => l.name === 'appId')?.target,
                 };
                  Object.keys(firebaseConfig).forEach(key => firebaseConfig[key] === undefined && delete firebaseConfig[key]);
                  console.log("4. Extracted firebaseConfig:", firebaseConfig); // <-- عرض الإعدادات المستخرجة
                  console.log("   Is firebaseConfig empty?", Object.keys(firebaseConfig).length === 0); // <-- فحص ما إذا كانت الإعدادات فارغة

            } else {
                 console.error('Firebase config JSON does not contain the expected "links" array structure.'); // <-- خطأ في هيكل JSON
            }

        } catch (e) {
            console.error('Error parsing firebase config JSON:', e, e.message); // <-- خطأ في تحليل JSON
        }
    } else {
         console.error('Firebase config script element (#json:firebaseconfig) not found in the DOM.'); // <-- خطأ عدم العثور على السكربت
    }

    // --- تهيئة Firebase App والحصول على مثيل المصادقة ---
    let app;
    let auth = null;

    const apps = getApps();
    console.log("5. Existing Firebase apps:", apps.length); // <-- فحص التطبيقات الموجودة

    if (apps.length === 0) {
        if (Object.keys(firebaseConfig).length > 0) {
           try {
               app = initializeApp(firebaseConfig);
               console.log('6. Firebase App initialized successfully:', app); // <-- نجاح تهيئة App
           } catch (error) {
               console.error('6. Error initializing Firebase App:', error, error.message); // <-- خطأ في تهيئة App
           }
        } else {
           console.error('6. Firebase Config is empty. Cannot initialize app.'); // <-- لا يمكن تهيئة App بدون إعدادات
        }
    } else {
       app = getApp();
       console.log('6. Using existing Firebase App instance:', app); // <-- استخدام App موجود
    }

    if (app) {
       try {
           auth = getAuth(app);
           console.log('7. Firebase Auth instance obtained:', auth); // <-- نجاح الحصول على Auth
       } catch (error) {
           console.error('7. Error getting Firebase Auth instance:', error, error.message); // <-- خطأ في الحصول على Auth
       }
    } else {
         console.error('7. Firebase App instance is null. Cannot get Auth instance.'); // <-- لا يمكن الحصول على Auth بدون App
    }

     if (!auth) {
         console.error("Final check: Firebase Auth instance is NOT available. Logout functionality will not work."); // <-- رسالة الفحص النهائي التي رأيتها
     } else {
          console.log("Final check: Firebase Auth instance IS available. Logout should work."); // <-- إذا Auth متاح
     }


    // --- بقية كود منطق الـ Popup الخاص بك ---
    // الدوال updateUI, logOut, simulateLogin, simulateLogout
    // ...

    function getUserDataFromStorage() {
        const dataString = localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY);
        let userData = null;
        let profileImageUrl = null;
        let isLoggedIn = false;

        if (dataString) {
            try {
                const parsedData = JSON.parse(dataString);
                if (parsedData && parsedData.userData) {
                    userData = parsedData.userData;
                    profileImageUrl = userData.photoURL || null;
                    isLoggedIn = true;
                }
            } catch (e) {
                console.error('Error parsing user data from localStorage:', e, e.message); // <-- خطأ في تحليل localStorage
                localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
            }
        }

        return { isLoggedIn, userData, profileImageUrl };
    }

    function updateUI() {
        const { isLoggedIn, profileImageUrl } = getUserDataFromStorage();

        if (belumLogDiv && sudahLogDiv) {
            if (isLoggedIn) {
                belumLogDiv.classList.add('hidden');
                    if(sudahLogDiv) sudahLogDiv.classList.remove('hidden');

                if (userIconLabel) {
                    userIconLabel.innerHTML = '';
                    if (profileImageUrl) {
                        const profileImg = document.createElement('img');
                        profileImg.src = profileImageUrl;
                        profileImg.alt = 'Profile Image';
                        profileImg.classList.add('profileUser');
                        profileImg.classList.add('current-profile-image');
                        userIconLabel.appendChild(profileImg);
                    } else {
                          userIconLabel.innerHTML = originalIconHtml;
                    }
                }

            } else {
                belumLogDiv.classList.remove('hidden');
                if(sudahLogDiv) sudahLogDiv.classList.add('hidden');

                 if (userIconLabel && userIconLabel.querySelector('.current-profile-image')) {
                     userIconLabel.innerHTML = originalIconHtml;
                 }
            }
        }
    }

    function logOut() {
        console.log("LogOut function called!"); // <-- تم استدعاء الدالة
        console.log("Value of auth inside logOut:", auth); // <-- قيمة auth

        if (!auth) {
            console.error("Firebase Auth is not initialized or available. Cannot perform Firebase sign out."); // <-- هذه رسالة الخطأ التي تظهر
            return; // توقف
        }

        console.log('Attempting Firebase sign-out...'); // <-- محاولة تسجيل الخروج
        signOut(auth)
            .then(() => {
                console.log('Firebase Sign-out successful. Updating local state.');
                localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                updateUI();
                if (loginCheckbox) {
                    loginCheckbox.checked = false;
                }
            })
            .catch((error) => {
                console.error('Firebase Sign-out Error:', error, error.message); // <-- خطأ Firebase signOut
            });
    }

    function simulateLogin(userDataObj) {
        console.warn('Using simulated login. This does NOT authenticate with Firebase.');
        if (typeof userDataObj === 'object' && userDataObj !== null && userDataObj.userData) {
            localStorage.setItem(FIREBASE_PROFILE_STORAGE_KEY, JSON.stringify(userDataObj));
            updateUI();
            if (loginCheckbox) {
                 loginCheckbox.checked = false;
            }
            console.log('Simulated login and user data stored.');
        } else {
            console.error('Provided data for simulated login is not in the expected format.');
        }
    }

     function simulateLogout() {
         console.warn('Using simulated logout. This does NOT call Firebase signOut.');
         localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
         updateUI();
         if (loginCheckbox) {
            loginCheckbox.checked = false;
         }
     }

    // ... مستمعي الأحداث ...

    // مستمع النقر لعنصر "الخروج"
    if (logoutElement) {
        logoutElement.removeAttribute('onclick');
        logoutElement.addEventListener('click', logOut);
        console.log('logOut function attached to logout button:', logoutElement); // <-- تم ربط المستمع
    } else {
        console.warn('Logout element not found. Cannot attach logout listener.'); // <-- لم يتم العثور على العنصر
    }

    // مستمع لفتح/إغلاق الصندوق عند النقر على أيقونة المستخدم
    if (userIconLabel && loginCheckbox) {
        userIconLabel.addEventListener('click', (event) => {
            event.preventDefault();
            loginCheckbox.checked = !loginCheckbox.checked;
             console.log('User icon clicked. Checkbox state toggled to:', loginCheckbox.checked);
        });
    } else {
         console.warn('User icon label or checkbox not found. Cannot attach toggle listener.');
    }

    // مستمع للإغلاق عند النقر خارج الصندوق
    document.addEventListener('click', (event) => {
        const target = event.target;
        const popup = document.querySelector('.logPop-wrp');
        const trigger = userIconLabel;

        if (loginCheckbox && loginCheckbox.checked && trigger && popup) {
            const isClickOutside = !trigger.contains(target) && !popup.contains(target);

            if (isClickOutside) {
                loginCheckbox.checked = false;
                console.log('Closed by clicking outside (JS controlled).');
            }
        }
    });


    // --- التهيئة الأولية ---
    updateUI();
    console.log('Initial UI update executed.'); // <-- نهاية التهيئة الأولية

    // يمكنك إضافة استدعاءات لدالات المحاكاة هنا لأغراض الاختبار، أو تشغيلها من أزرار أخرى
    // مثال: simulateLogin(YOUR_SAMPLE_USER_DATA_OBJECT);
});
