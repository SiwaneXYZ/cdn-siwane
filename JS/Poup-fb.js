import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signOut } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const firebaseConfigScript = document.getElementById('json:firebaseconfig');
    let firebaseConfig = {};

    if (firebaseConfigScript) {
        try {
            const configData = JSON.parse(firebaseConfigScript.textContent);
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
            } else {
                 console.error('Firebase config JSON does not contain the expected "links" array structure.');
            }
        } catch (e) {
            console.error('Error parsing firebase config JSON:', e);
        }
    } else {
         console.error('Firebase config script element (#json:firebaseconfig) not found in the DOM.');
    }

    let app;
    let auth = null;

    const apps = getApps();
    if (apps.length === 0) {
        if (Object.keys(firebaseConfig).length > 0) {
           try {
               app = initializeApp(firebaseConfig);
               console.log('Firebase App initialized.');
           } catch (error) {
               console.error('Error initializing Firebase App:', error);
           }
        } else {
           console.error('Firebase Config is empty or invalid. Cannot initialize app.');
        }
    } else {
       app = getApp();
       console.log('Firebase App already initialized. Using existing app.');
    }

    if (app) {
       try {
           auth = getAuth(app);
           console.log('Firebase Auth instance obtained.');
       } catch (error) {
           console.error('Error getting Firebase Auth instance:', error);
       }
    }

     if (!auth) {
         console.error("Firebase Auth instance is not available. Logout functionality will not work.");
     }

    const loginCheckbox = document.getElementById('forlogPop');
    const userIconLabel = document.querySelector('.logReg');
    const popupWrapper = document.querySelector('.logPop-wrp');
    const belumLogDiv = document.querySelector('.NotLog');
    const sudahLogDiv = document.querySelector('.DonLog');

    const logoutElement = sudahLogDiv ? sudahLogDiv.querySelector('div.loginS[aria-label="الخروج"]') : null;

    const FIREBASE_PROFILE_STORAGE_KEY = 'firebaseUserProfileData';

    const originalIconHtml = userIconLabel ? userIconLabel.innerHTML : '';

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
                console.error('Error parsing user data from localStorage:', e);
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
        if (!auth) {
            console.error("Firebase Auth is not initialized or available. Cannot perform Firebase sign out.");
            return;
        }

        console.log('Attempting Firebase sign-out...');
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
                console.error('Firebase Sign-out Error:', error);
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

    if (logoutElement) {
        logoutElement.removeAttribute('onclick');
        logoutElement.addEventListener('click', logOut);
        console.log('logOut function attached to logout button.');
    } else {
        console.warn('Logout element not found. Cannot attach logout listener.');
    }

    if (userIconLabel && loginCheckbox) {
        userIconLabel.addEventListener('click', (event) => {
            event.preventDefault();
            loginCheckbox.checked = !loginCheckbox.checked;
             console.log('User icon clicked. Checkbox state toggled to:', loginCheckbox.checked);
        });
    } else {
         console.warn('User icon label or checkbox not found. Cannot attach toggle listener.');
    }

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

    updateUI();
    console.log('Initial UI update executed.');
});
