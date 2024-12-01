const alphabet = ['FGHIJKLijklmarstuv', 'NOPQRSWXYZhTUVABCDE'];
const symbols = ['wxyzefgnopbcd', '0123456789+/='];
const joinedAlphabet = alphabet.join('M');
const joinedSymbols = symbols.join('q');

function decodeLoginString(encodedString) {
  let result = '';
  let pointer = 0;
  const alphabetSymbols = joinedAlphabet + joinedSymbols;
  
  // Clean the input string
  encodedString = encodedString.replace(/[^A-Za-z0-9+/=]/g, '');
  
  while (pointer < encodedString.length) {
    let char1 = alphabetSymbols.indexOf(encodedString.charAt(pointer++)) << 2;
    let char2 = alphabetSymbols.indexOf(encodedString.charAt(pointer++)) >> 4;
    let char3 = (char2 & 15) << 4;
    let char4 = alphabetSymbols.indexOf(encodedString.charAt(pointer++)) >> 2;
    let char5 = (char4 & 3) << 6;
    let char6 = alphabetSymbols.indexOf(encodedString.charAt(pointer++));
    
    result += String.fromCharCode(char1 | char2);
    if (char3 !== 64) result += String.fromCharCode(char3 | char4);
    if (char5 !== 64) result += String.fromCharCode(char5 | char6);
  }

  return utf8Decode(result);
}

function utf8Decode(encodedText) {
  let decodedText = '';
  let index = 0;

  while (index < encodedText.length) {
    const charCode = encodedText.charCodeAt(index);
    
    if (charCode < 128) {
      decodedText += String.fromCharCode(charCode);
      index++;
    } else if (charCode > 191 && charCode < 224) {
      const nextCharCode = encodedText.charCodeAt(index + 1);
      decodedText += String.fromCharCode((charCode & 31) << 6 | (nextCharCode & 63));
      index += 2;
    } else {
      const nextCharCode1 = encodedText.charCodeAt(index + 1);
      const nextCharCode2 = encodedText.charCodeAt(index + 2);
      decodedText += String.fromCharCode((charCode & 15) << 12 | (nextCharCode1 & 63) << 6 | (nextCharCode2 & 63));
      index += 3;
    }
  }

  return decodedText;
}

// Handling login setup
const metaTag = document.querySelector('meta[property="og:url"]');
const metaContent = metaTag.getAttribute('content');
const domain = metaContent.split('://')[1].split('/')[0];
const formattedDomain = domain.replace(/\./g, '_');

if (formattedDomain + 'firebaseLogin') {
  const userPasswordKey = decodeLoginString('OwK3SQ4brOFejdu==');
  
  if (localStorage.getItem('user') != null) {
    window.location.href = loginSettings.redirect;
  }
  
  const emailField = document.querySelector('#email');
  const passwordField = document.querySelector('#password');
  const notification = document.querySelector('#logNotif');

  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function getInitials(name) {
    return name.split(' ').map(word => word[0].toUpperCase()).join('');
  }

  function togglePasswordVisibility() {
    if (passwordField.type === 'password') {
      passwordField.type = 'text';
      document.querySelector('.icon1').classList.toggle('hidden');
      document.querySelector('.icon2').classList.toggle('hidden');
    } else {
      passwordField.type = 'password';
      document.querySelector('.icon1').classList.toggle('hidden');
      document.querySelector('.icon2').classList.toggle('hidden');
    }
  }

  emailField.addEventListener('keyup', function () {
    this.value = this.value.toLowerCase().replace(/\s/g, '');
  });

  passwordField.addEventListener('keyup', function () {
    this.value = this.value.replace(/\s/g, '');
  });

  function redirectToLoginPage() {
    const targetUrl = new URLSearchParams(window.location.search).get('target');
    window.location.href = targetUrl !== null ? targetUrl : loginSettings.redirect;
  }

  if (document.querySelector('.loginGoogle')) {
    firebase.initializeApp(firebaseConfig);

    function loginWithGoogle() {
      notification.classList.remove('hidden');
      toastNotif('<span class="info">' + loginSettings.loading + '</span>');

      const googleProvider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(googleProvider).then(function (result) {
        const user = result.user;
        handleUserData(user);
      }).catch(function (error) {
        notification.classList.remove('hidden');
        notification.innerHTML = error.message;
      });
    }

    function handleUserData(user) {
      fetch(firebaseConfig.databaseURL + '/data.json').then(response => response.json()).then(data => {
        if (data.hasOwnProperty(user.uid)) {
          const userData = decryptUserData(data[user.uid]);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          const userData = {
            name: user.displayName,
            email: user.email,
            profile: user.photoURL,
            uid: user.uid,
            phoneNumber: user.phoneNumber,
            membership: 'premium-0-0-0',
            session: new Date()
          };
          localStorage.setItem('user', JSON.stringify(userData));
        }

        notification.classList.remove('hidden');
        toastNotif('<span class="info">' + loginSettings.loading + '</span>');

        setTimeout(function () {
          redirectToLoginPage();
        }, 1000);
      }).catch(function (error) {
        notification.classList.remove('hidden');
        notification.innerHTML = error.message;
      });
    }

    function decryptUserData(encryptedData) {
      const decryptedData = CryptoJS.AES.decrypt(encryptedData, userPasswordKey).toString(CryptoJS.enc.Utf8);
      const userParts = decryptedData.split('{split}');
      return {
        name: userParts[1],
        email: userParts[2],
        profile: userParts[3],
        uid: userParts[4],
        membership: userParts[5]
      };
    }
  }

  const auth = firebase.auth();
  
  function login() {
    if (emailField.value === '') {
      emailField.focus();
      notification.classList.remove('hidden');
      toastNotif('<span class="error">' + loginSettings.emailempty + '</span>');
    } else {
      if (!validateEmail(emailField.value)) {
        notification.classList.remove('hidden');
        toastNotif('<span class="error"><i class="warn"></i>' + loginSettings.emaileinvalid + '</span>');
      } else if (passwordField.value === '') {
        passwordField.focus();
        notification.classList.remove('hidden');
        toastNotif('<span class="error"><i class="warn"></i>' + loginSettings.passwordempty + '</span>');
      } else {
        notification.classList.remove('hidden');
        toastNotif('<span class="error"><i class="warn"></i>' + loginSettings.loading + '</span>');
        auth.signInWithEmailAndPassword(emailField.value, passwordField.value).then(function (userCredential) {
          const user = userCredential.user;
          fetch(firebaseConfig.databaseURL + '/data.json').then(response => response.json()).then(data => {
            if (data.hasOwnProperty(user.uid)) {
              const userData = decryptUserData(data[user.uid]);
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }).catch(function (error) {
            notification.classList.remove('hidden');
            notification.innerHTML = error.message;
          });
        });
      }
    }
  }
}
