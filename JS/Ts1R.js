Import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Starting script execution.");

    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog');
    const sudahLogDiv = document.querySelector('.DonLog');

    console.log("Elements check: loginCheckbox:", loginCheckbox);
    console.log("Elements check: userIconLabel:", userIconLabel);
    console.log("Elements check: popupWrapper:", popupWrapper);
    console.log("Elements check: belumLogDiv (NotLog):", belumLogDiv);
    console.log("Elements check: sudahLogDiv (DonLog):", sudahLogDiv);

    const logoutElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="الخروج"]') : null;

    console.log("Elements check: logoutElement:", logoutElement);

    // هذا المفتاح صحيح ويجب استخدامه
    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData';

    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';

    console.log("Starting Firebase config parsing.");

    const firebaseConfigScript = document.getElementById('json:firebaseconfig');
    console.log("1. Found config script:", firebaseConfigScript);

    let firebaseConfig = {};

    if (firebaseConfigScript) {
        const configText = firebaseConfigScript.textContent;
        console.log("2. Config text content:", configText);

        try {
            const configData = JSON.parse(configText);
            console.log("3. Parsed config data:", configData);

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
                      console.error('Extracted firebaseConfig is missing critical keys (apiKey, appId/projectId). Check JSON content.');
                      firebaseConfig = {};
                 }

                 console.log("4. Extracted firebaseConfig:", firebaseConfig);
                 console.log("   Is firebaseConfig empty?", Object.keys(firebaseConfig).length === 0);

            } else {
                 console.error('Parsed config data is not a valid object.');
            }

        } catch (e) {
            console.error('Error parsing firebase config JSON:', e, e.message);
        }
    } else {
         console.error('Firebase config script element (#json:firebaseconfig) not found in the DOM.');
    }

    let app;
    let auth = null;

    const apps = getApps();
    console.log("5. Existing Firebase apps:", apps.length);

    if (apps.length === 0) {
        if (Object.keys(firebaseConfig).length > 0) {
           try {
               app = initializeApp(firebaseConfig);
               console.log('6. Firebase App initialized successfully:', app);
           } catch (error) {
               console.error('6. Error initializing Firebase App:', error, error.message);
           }
        } else {
           console.error('6. Firebase Config is empty. Cannot initialize app.');
        }
    } else {
       app = getApp();
       console.log('6. Using existing Firebase App instance:', app);
    }

    if (app) {
       try {
           auth = getAuth(app);
           console.log('7. Firebase Auth instance obtained:', auth);
       } catch (error) {
           console.error('7. Error getting Firebase Auth instance:', error, error.message);
       }
    } else {
         console.error('7. Firebase App instance is null. Cannot get Auth instance.');
    }

     if (!auth) {
         console.error("Final check: Firebase Auth instance is NOT available. Logout functionality will not work.");
     } else {
          console.log("Final check: Firebase Auth instance IS available. Logout should work.");
     }

    function getUserDataFromStorage() {
        const dataString = localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY);
        let userData = null; // هذا المتغير سيحتوي على كائن بيانات المستخدم من localStorage
        let profileImageUrl = null;
        let isLoggedIn = false;

        if (dataString) {
            try {
                const parsedData = JSON.parse(dataString); // هذا هو الكائن المحفوظ مثل {uid: ..., accountType: ..., photoURL: ...}

                // تم التعديل هنا: لم يعد نتوقع وجود "userData" داخل الكائن
                // نتحقق فقط مما إذا كان الكائن موجوداً ويحتوي على معرف المستخدم (uid)
                if (parsedData && typeof parsedData === 'object' && parsedData.uid) {
                    userData = parsedData; // الكائن بأكمله هو بيانات المستخدم
                    profileImageUrl = userData.photoURL || null; // الوصول إلى الصورة مباشرة
                    isLoggedIn = true;
                    console.log("Successfully loaded user data from localStorage:", userData);
                } else {
                    console.log("Data found in localStorage but does not match expected structure (missing uid or not object). Clearing.", parsedData);
                    localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY); // مسح البيانات غير الصحيحة
                }
            } catch (e) {
                console.error('Error parsing user data from localStorage (corrupted data?):', e, e.message);
                localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY); // مسح البيانات التالفة
            }
        } else {
            console.log("No user data found in localStorage.");
        }

        // الدالة الآن تعيد الكائن الكامل userData
        return { isLoggedIn, userData, profileImageUrl };
    }

    function updateUI() {
        // تم استلام userData هنا أيضاً، على الرغم من أن الوظيفة الحالية لا تستخدمه إلا لتحديد isLoggedIn و profileImageUrl
        const { isLoggedIn, userData, profileImageUrl } = getUserDataFromStorage();

        if (belumLogDiv && sudahLogDiv) {
            if (isLoggedIn) {
                belumLogDiv.classList.add('hidden');
                // تم التعديل هنا: التأكد من وجود sudhLogDiv قبل محاولة إزالة الكلاس
                if(sudahLogDiv) sudahLogDiv.classList.remove('hidden');

                if (userIconLabel) {
                    // إزالة أي صورة حالية قبل إضافة الجديدة أو إعادة المحتوى الأصلي
                    const existingImg = userIconLabel.querySelector('.current-profile-image');
                    if(existingImg) {
                         userIconLabel.removeChild(existingImg);
                    }

                    if (profileImageUrl) {
                        const profileImg = document.createElement('img');
                        profileImg.src = profileImageUrl;
                        profileImg.alt = 'Profile Image';
                        profileImg.classList.add('profileUser');
                        profileImg.classList.add('current-profile-image'); // كلاس للمساعدة في العثور عليها لاحقاً
                        userIconLabel.appendChild(profileImg);
                    } else {
                        // إعادة محتوى الأيقونة الأصلي إذا لم تتوفر صورة
                        userIconLabel.innerHTML = originalIconHtml;
                    }
                }

            } else {
                // إزالة كلاس hidden من belumLogDiv
                belumLogDiv.classList.remove('hidden');
                // تم التعديل هنا: التأكد من وجود sudhLogDiv قبل محاولة إضافة الكلاس
                if(sudahLogDiv) sudahLogDiv.classList.add('hidden');

                 // إعادة محتوى الأيقونة الأصلي عند تسجيل الخروج
                 if (userIconLabel && userIconLabel.querySelector('.current-profile-image')) {
                     userIconLabel.innerHTML = originalIconHtml;
                 }
            }
        }
    }

    function logOut() {
        console.log("LogOut function called!");
        console.log("Value of auth inside logOut:", auth);

        if (!auth) {
            console.error("Firebase Auth is not initialized or available. Cannot perform Firebase sign out.");
            // في حالة عدم توفر المصادقة، لا يزال بإمكاننا مسح localStorage وتحديث الواجهة
             localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
             updateUI();
             if (loginCheckbox) {
                 loginCheckbox.checked = false;
             }
            return;
        }

        console.log('Attempting Firebase sign-out...');
        signOut(auth)
            .then(() => {
                console.log('Firebase Sign-out successful. Updating local state.');
                localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY); // تم التأكد من بقاء هذا
                updateUI();
                if (loginCheckbox) {
                    loginCheckbox.checked = false;
                }
            })
            .catch((error) => {
                console.error('Firebase Sign-out Error:', error, error.message);
                // حتى في حالة الخطأ، قد يكون من الجيد مسح localStorage على الأقل
                localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                 updateUI();
            });
    }

    // تم التعديل هنا: دالة المحاكاة الآن تتوقع كائن بيانات الملف الشخصي مباشرةً
    function simulateLogin(profileDataObj) {
        console.warn('Using simulated login. This does NOT authenticate with Firebase.');
        // نتحقق مما إذا كان الكائن المقدم يشبه كائن بيانات الملف الشخصي الذي نخرجه من Firestore
        if (typeof profileDataObj === 'object' && profileDataObj !== null && profileDataObj.uid && profileDataObj.fullName) {
             try {
                localStorage.setItem(FIREBASE_PROFILE_STORAGE_KEY, JSON.stringify(profileDataObj)); // حفظ الكائن مباشرةً
                updateUI();
                if (loginCheckbox) {
                    loginCheckbox.checked = false;
                }
                console.log('Simulated login and user data stored.');
             } catch (e) {
                 console.error('Error saving simulated user data to localStorage:', e);
             }
        } else {
            console.error('Provided data for simulated login is not in the expected profile format (missing uid or fullName, or not object).', profileDataObj);
        }
    }

    // دالة المحاكاة هذه صحيحة كما هي
     function simulateLogout() {
         console.warn('Using simulated logout. This does NOT call Firebase signOut.');
         localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
         updateUI();
         if (loginCheckbox) {
            loginCheckbox.checked = false;
         }
     }


    if (logoutElement) {
        // إزالة onclick القديم للتأكد من عدم تكرار معالج الحدث
        logoutElement.removeAttribute('onclick');
        logoutElement.addEventListener('click', logOut);
        console.log('logOut function attached to logout button:', logoutElement);
    } else {
        console.warn('Logout element not found. Cannot attach logout listener.');
    }

    if (userIconLabel && loginCheckbox) {
        userIconLabel.addEventListener('click', (event) => {
            event.preventDefault(); // منع أي سلوك افتراضي للرابط إذا كان الأيقونة رابط
            loginCheckbox.checked = !loginCheckbox.checked;
             console.log('User icon clicked. Checkbox state toggled to:', loginCheckbox.checked);
        });
    } else {
         console.warn('User icon label or checkbox not found. Cannot attach toggle listener.');
    }

    // هذا الجزء جيد لإغلاق الـ popup عند النقر خارجه
    document.addEventListener('click', (event) => {
        const target = event.target;
        const popup = document.querySelector('.logPop-wrp');
        const trigger = userIconLabel; // الأيقونة التي تفتح الـ popup

        if (loginCheckbox && loginCheckbox.checked && trigger && popup) {
            // تحقق مما إذا كان النقر خارج كل من الزر والـ popup نفسه
            const isClickOutside = !trigger.contains(target) && !popup.contains(target);

            if (isClickOutside) {
                loginCheckbox.checked = false;
                console.log('Closed by clicking outside (JS controlled).');
            }
        }
    });


    // تنفيذ تحديث الواجهة عند تحميل الصفحة لاستعراض حالة المستخدم من localStorage
    updateUI();
    console.log('Initial UI update executed.');

    // ملاحظة: إذا كنت تستخدم الدوال simulateLogin أو simulateLogout للاختبار،
    // تأكد عند استدعاء simulateLogin أن تمرر لها كائناً بنفس هيكلة
    // بيانات الملف الشخصي المحفوظة (مثل: {uid: '...', fullName: '...', ...})،
    // وليس كائناً يحتوي على {userData: {...}}

});
