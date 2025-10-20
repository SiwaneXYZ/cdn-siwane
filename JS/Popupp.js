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
    const pointsElement = sudahLogDiv ? sudahLogDiv.querySelector('a.loginS[aria-label="منتجاتي"]') : null;


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
                       // Add any custom claims if available (more secure for roles)
                       // Example: isAdmin: user.customClaims ? user.customClaims.admin : false
                       // For this example, we will try to read isAdmin from the local cache
                   };

                   // Try to get additional profile data (like isAdmin) from local cache
                   // NOTE: Relying on localStorage for isAdmin is INSECURE for access control.
                   // This is only used here to potentially show/hide UI elements.
                   // True admin checks must be server-side or via Security Rules.
                   let cachedUserData = null;
                    const dataString = localStorage.getItem(FIREBASE_PROFILE_STORAGE_KEY);
                    if (dataString) {
                        try { cachedUserData = JSON.parse(dataString); } catch(e) { console.error("Failed to parse cached user data:", e); cachedUserData = null; }
                    }

                   // Combine Firebase Auth data with cached data (prioritizing Firebase data)
                   const combinedUserData = {
                       ...cachedUserData, // Start with cached data
                       ...firebaseUserData, // Overwrite with fresh Firebase Auth data
                       // Explicitly merge isAdmin if exists in cache (still insecure for enforcement!)
                       isAdmin: cachedUserData ? cachedUserData.isAdmin : false // Default to false if no cache
                   };

                   // Optionally update the cache with the latest auth data (but keep isAdmin if fetched securely elsewhere)
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


    // Modified updateUI function to accept state and data
    function updateUI(isLoggedIn, userData, profileImageUrl) {
        if (belumLogDiv && sudahLogDiv) {
            if (isLoggedIn) {
                belumLogDiv.classList.add('hidden');
                sudahLogDiv.classList.remove('hidden');

                // Handle Admin element visibility (UI hint - not secure access control)
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


                // Update user icon with profile image or original icon
                if (userIconLabel) {
                    // Remove any existing profile image to prevent duplicates
                     const existingProfileImg = userIconLabel.querySelector('.current-profile-image');
                     if (existingProfileImg) {
                         existingProfileImg.remove();
                     }

                    if (profileImageUrl) {
                        const profileImg = document.createElement('img');
                        profileImg.src = profileImageUrl;
                        profileImg.alt = 'Profile Image';
                        profileImg.classList.add('profileUser');
                        profileImg.classList.add('current-profile-image'); // Add class for easy removal
                        userIconLabel.appendChild(profileImg);
                        // Hide original icon HTML if added as text somehow
                        if (userIconLabel.innerHTML.includes(originalIconHtml)) {
                             userIconLabel.innerHTML = ''; // Clear if original HTML is still text
                             userIconLabel.appendChild(profileImg); // Add image again
                         }
                    } else {
                         // If no profile image, ensure original icon is there
                        if (!userIconLabel.innerHTML.includes(originalIconHtml)) {
                             userIconLabel.innerHTML = originalIconHtml;
                        }
                    }
                }

            } else { // Not logged in
                belumLogDiv.classList.remove('hidden');
                sudahLogDiv.classList.add('hidden');

                 // Ensure admin and points elements are hidden when logged out
                 if (adminElement) {
                     adminElement.classList.add('hidden');
                 }
                 if (pointsElement) {
                      pointsElement.classList.add('hidden');
                 }

                 // Restore original user icon HTML
                 if (userIconLabel) {
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
        // Actions to perform after sign out is complete (or fails)
        const performLogoutActions = () => {
            console.log("Performing post-logout cleanup and navigation.");
            // onAuthStateChanged listener will handle clearing localStorage and updateUI
            // Close the popup
            if (loginCheckbox) {
                loginCheckbox.checked = false;
            }
            // Navigate to login page
            window.location.href = "/p/login.html";
        };

        if (!auth) {
            console.warn("Firebase Auth not available. Cannot perform Firebase signOut. Clearing local state and navigating.");
            // Fallback: Clear local state and navigate even if auth is not available
            localStorage.removeItem(FIREBASE_PROFILE_STORAGE_KEY);
            updateUI(false, null, null); // Update UI manually if listener isn't active
            performLogoutActions(); // Navigate
            return;
        }

        console.log("Attempting Firebase signOut...");
        signOut(auth)
            .then(() => {
                console.log("Firebase signOut successful.");
                // onAuthStateChanged listener will be triggered and call updateUI
                performLogoutActions(); // Cleanup and navigate
            })
            .catch((error) => {
                 console.error("Logout failed:", error);
                 // Even if Firebase signOut fails, clean up local state and navigate as a fallback
                 performLogoutActions(); // Cleanup and navigate
            });
    }

    // --- Event Listeners ---

    // Logout button listener
    if (logoutElement) {
        // Ensure no inline onclick handler interferes
        if (logoutElement.getAttribute('onclick')) {
            logoutElement.removeAttribute('onclick');
        }
        logoutElement.addEventListener('click', logOut);
        console.log("Logout listener added.");
    }

    // Admin element click listener (navigation only)
    if (adminElement) {
        adminElement.style.cursor = 'pointer'; // Change cursor to indicate clickable
        // Ensure no inline onclick handler interferes
        if (adminElement.getAttribute('onclick')) {
             adminElement.removeAttribute('onclick');
         }
        adminElement.addEventListener('click', () => {
            console.log("Admin element clicked. Redirecting...");
            // Note: Actual access control for /p/admin.html must be secured separately.
            window.location.href = '/p/admin.html';
        });
        console.log("Admin listener added.");
    }

     // Points element click listener (navigation only) - Assuming it just navigates
    if (pointsElement) {
         pointsElement.style.cursor = 'pointer'; // Change cursor
         // Ensure no inline onclick handler
         if (pointsElement.getAttribute('onclick')) {
              pointsElement.removeAttribute('onclick');
          }
         pointsElement.addEventListener('click', (event) => {
             // Prevent default if it's an <a> tag with href="#"
             event.preventDefault();
             console.log("Points element clicked. Redirecting...");
             window.location.href = '/p/points.html'; // Navigate to points page
         });
         console.log("Points listener added.");
     }


    // User icon click listener to toggle the popup checkbox
    if (userIconLabel && loginCheckbox) {
        userIconLabel.style.cursor = 'pointer'; // Change cursor
        // Prevent default if the label is part of a form or has a default action
        userIconLabel.addEventListener('click', (event) => {
            event.preventDefault();
            // Toggle the checkbox checked state
            loginCheckbox.checked = !loginCheckbox.checked;
            console.log("User icon clicked. Popup checkbox state:", loginCheckbox.checked);
        });
        console.log("User icon listener added.");
    }

    // Close the popup when clicking outside of it
    document.addEventListener('click', (event) => {
        const target = event.target;
        // Check if the checkbox is currently checked (popup is open)
        if (loginCheckbox && loginCheckbox.checked && userIconLabel && popupWrapper) {
            // Check if the click was outside the user icon trigger AND outside the popup wrapper
            const isClickOutside = !userIconLabel.contains(target) && !popupWrapper.contains(target);

            if (isClickOutside) {
                // Uncheck the checkbox to close the popup
                loginCheckbox.checked = false;
                console.log("Clicked outside popup. Closing popup.");
            }
        }
    });
    console.log("Document click listener for popup closing added.");

    // Initial UI update will happen automatically when onAuthStateChanged fires on page load
    // (It fires even if the user is initially signed out)

});
