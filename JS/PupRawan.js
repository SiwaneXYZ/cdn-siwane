import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog');
    const sudahLogDiv = document.querySelector('.DonLog');

    const adminElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="ادمن"]') : null;

    const logoutElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="الخروج"]') : null;

    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData';

    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';

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
                 }
            }
        } catch (e) {
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
           }
        }
    } else {
       app = getApp();
    }

    if (app) {
       try {
           auth = getAuth(app);
       } catch (error) {
       }
    }

    function getUserDataFromStorage() {
        const dataString = localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY);
        let userData = null;
        let profileImageUrl = null;
        let isLoggedIn = false;

        if (dataString) {
            try {
                const parsedData = JSON.parse(dataString);
                if (parsedData && typeof parsedData === 'object' && parsedData.uid) {
                    userData = parsedData;
                    profileImageUrl = parsedData.photoURL || null;
                    isLoggedIn = true;
                } else {
                     localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                }
            } catch (e) {
                localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
            }
        }

        return { isLoggedIn, userData, profileImageUrl };
    }

    function updateUI() {
        const { isLoggedIn, userData, profileImageUrl } = getUserDataFromStorage();

        if (belumLogDiv && sudahLogDiv) {
            if (isLoggedIn) {
                belumLogDiv.classList.add('hidden');
                sudahLogDiv.classList.remove('hidden');

                if (adminElement) {
                    if (userData && userData.isAdmin === true) {
                        adminElement.classList.remove('hidden');
                    } else {
                        adminElement.classList.add('hidden');
                    }
                }

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
                sudahLogDiv.classList.add('hidden');

                 if (adminElement) {
                     adminElement.classList.add('hidden');
                 }

                 if (userIconLabel && userIconLabel.querySelector('.current-profile-image')) {
                     userIconLabel.innerHTML = originalIconHtml;
                 }
            }
        }
    }

    function logOut() {
        if (!auth) {
            localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
            updateUI();
            if (loginCheckbox) {
                loginCheckbox.checked = false;
            }
            window.location.href = "/p/login.html";
            return;
        }

        signOut(auth)
            .then(() => {
                localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                updateUI();
                if (loginCheckbox) {
                    loginCheckbox.checked = false;
                }
                window.location.href = "/p/login.html";
            })
            .catch((error) => {
                 console.error("Logout failed:", error);
                 localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
                 updateUI();
                 if (loginCheckbox) {
                    loginCheckbox.checked = false;
                 }
            });
    }

    function simulateLogin(userDataObj) {
        if (typeof userDataObj === 'object' && userDataObj !== null && userDataObj.userData) {
             const dataToSaveInSimulate = userDataObj.userData;
             if(dataToSaveInSimulate.uid) {
                 localStorage.setItem(FIREBASE_PROFILE_STORAGE_KEY, JSON.stringify(dataToSaveInSimulate));
                 updateUI();
                 if (loginCheckbox) {
                      loginCheckbox.checked = false;
                 }
             }
        }
    }

     function simulateLogout() {
         localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
         updateUI();
         if (loginCheckbox) {
            loginCheckbox.checked = false;
         }
     }

    if (logoutElement) {
        logoutElement.removeAttribute('onclick');
        logoutElement.addEventListener('click', logOut);
    }

    if (userIconLabel && loginCheckbox) {
        userIconLabel.addEventListener('click', (event) => {
            event.preventDefault();
            loginCheckbox.checked = !loginCheckbox.checked;
        });
    }

    document.addEventListener('click', (event) => {
        const target = event.target;
        const popup = document.querySelector('.logPop-wrp');
        const trigger = userIconLabel;

        if (loginCheckbox && loginCheckbox.checked && trigger && popup) {
            const isClickOutside = !trigger.contains(target) && !popup.contains(target);

            if (isClickOutside) {
                loginCheckbox.checked = false;
            }
        }
    });

    updateUI();

});
