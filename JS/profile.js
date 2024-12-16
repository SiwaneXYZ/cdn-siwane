// صفحة الملف الشخصي - آخر تحديث 06-05-2024 21:06
var keyCharacters = ['FGHIJKLijklmarstuv', 'NOPQRSWXYZhTUVABCDE'],
    keyDigits = ['wxyzefgnopbcd', '0123456789+/='],
    joinedKeyCharacters = keyCharacters.join('M'),
    joinedKeyDigits = keyDigits.join('q');

// دالة لفتح تسجيل الدخول
function loginOpen(encodedString) {
    var firstFunction = function () {
        var isFirstCall = true;
        return function (context, callback) {
            var innerFunction = isFirstCall ? function () {
                if (callback) {
                    var result = callback.apply(context, arguments);
                    return callback = null, result;
                }
            } : function () {};
            isFirstCall = false;
            return innerFunction;
        };
    }();

    var secondFunction = firstFunction(this, function () {
        var globalContext;
        try {
            var getGlobalContext = function () {
                return function () {}.constructor("return this")();
            };
            globalContext = getGlobalContext();
        } catch (error) {
            globalContext = window;
        }
        var consoleObject = globalContext.console = globalContext.console || {},
            consoleMethods = ['log', 'warn', 'info', 'error', 'exception', 'table', 'trace'];
        for (var i = 0; i < consoleMethods.length; i++) {
            var boundFunction = firstFunction.constructor.prototype.bind(firstFunction);
            var methodName = consoleMethods[i];
            var originalMethod = consoleObject[methodName] || boundFunction;
            boundFunction.__proto__ = firstFunction.bind(firstFunction);
            boundFunction.toString = originalMethod.toString.bind(originalMethod);
            consoleObject[methodName] = boundFunction;
        }
    });

    secondFunction();

    var decodedChar,
        firstChar,
        secondChar,
        thirdChar,
        fourthChar,
        fifthChar,
        sixthChar,
        combinedKeys = joinedKeyCharacters + joinedKeyDigits,
        resultString = '',
        index = 0;

    // فك تشفير السلسلة المشفرة
    for (encodedString = encodedString.replace(/[^A-Za-z0-9+/=]/g, ''); index < encodedString.length;) {
        decodedChar = combinedKeys.indexOf(encodedString.charAt(index++)) << 2 | (firstChar = combinedKeys.indexOf(encodedString.charAt(index++))) >> 4;
        secondChar = (15 & firstChar) << 4 | (fourthChar = combinedKeys.indexOf(encodedString.charAt(index++))) >> 2;
        thirdChar = (3 & fourthChar) << 6 | (fifthChar = combinedKeys.indexOf(encodedString.charAt(index++)));
        resultString += String.fromCharCode(decodedChar);
        if (64 !== fourthChar) resultString += String.fromCharCode(secondChar);
        if (64 !== fifthChar) resultString += String.fromCharCode(thirdChar);
    }
    return resultString = utf8Decode(resultString);
}
// دالة لفك تشفير UTF-8
function utf8Decode(encodedString) {
    var decodedString = '';
    var index = 0;
    var charCode, nextCharCode, thirdCharCode;

    while (index < encodedString.length) {
        charCode = encodedString.charCodeAt(index);
        if (charCode < 128) {
            decodedString += String.fromCharCode(charCode);
            index++;
        } else if (charCode > 191 && charCode < 224) {
            nextCharCode = encodedString.charCodeAt(index + 1);
            decodedString += String.fromCharCode((31 & charCode) << 6 | 63 & nextCharCode);
            index += 2;
        } else {
            nextCharCode = encodedString.charCodeAt(index + 1);
            thirdCharCode = encodedString.charCodeAt(index + 2);
            decodedString += String.fromCharCode((15 & charCode) << 12 | (63 & nextCharCode) << 6 | 63 & thirdCharCode);
            index += 3;
        }
    }
    return decodedString;
}

// إعدادات الميتا
var metaTag = document.querySelector('meta[property="og:url"]'),
    metaContent = metaTag.getAttribute('content'),
    splitMetaContent = metaContent.split('://')[1].split('/')[0],
    contentIdentifier = splitMetaContent.replace(/\./g, '_');

// التحقق من تسجيل الدخول
if (splitMetaContent + 'firebaseLogin' === loginOpen(profileSettings.license)) {
    var userPasswordKey = loginOpen('OwK3SQ4brOFejdu==');
    localStorage.getItem('user') === null && (window.location.href = profileSettings.redirect);
    var userData = localStorage.getItem('user');

    if (userData) {
        var user = JSON.parse(userData),
            userId = user.uid,
            userName = user.name,
            userPhone = user.nomor,
            userEmail = user.email,
            userMembership = user.membership,
            premiumWrap = document.querySelector('#paket-premium-wrap'),
            premiumInput = document.querySelector('#paket-premium');

        // دالة للحصول على التاريخ الحالي
        async function getCurrentDate() {
            try {
                const response = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
                if (!response.ok) throw new Error('فشل تحميل API');
                const data = await response.json();
                return data.datetime.slice(0, 10);
            } catch (error) {
                throw error;
            }
        }

        getCurrentDate().then(currentDate => {
            const todayDate = new Date().toISOString().slice(0, 10);
            if (currentDate > todayDate) {
                var storedUserData = localStorage.getItem('user');
                if (storedUserData) {
                    var parsedUserData = JSON.parse(storedUserData);
                    var membershipStatus = parsedUserData.membership;
                    var newMembership = 'premium-' + todayDate.split('-')[2] + '-' + todayDate.split('-')[1] + '-' + todayDate.split('-')[0];
                    user.membership = newMembership;
                    localStorage.setItem('user', JSON.stringify(user));
                    membershipStatus !== newMembership && (localStorage.removeItem('user'), window.location.reload());
                }
            }
        });

        fetch(firebaseConfig.databaseURL + '/data' + loginOpen('mwzqY24='))
            .then(response => response.json())
            .then(data => {
                var decryptedData = CryptoJS.AES.decrypt(data[userId], userPasswordKey).toString(CryptoJS.enc.Utf8);
                var splitData = decryptedData.split('{split}');
                var userEmailCheck = splitData[0],
                    userPhoneCheck = splitData[2],
                    userNameCheck = splitData[1],
                    userMembershipCheck = splitData[3];

                if (data && data[userId] && userNameCheck === userName && userPhoneCheck === userPhone && userEmailCheck === userEmail) {
                    var membershipDetails = CryptoJS.AES.decrypt(data[userId], userPasswordKey).toString(CryptoJS.enc.Utf8).split('{split}')[3].replace(/^premium-/i, '');
                    var [day, month, year] = membershipDetails.split(/[- :]/);
                    month = parseInt(month) - 1;
                    var membershipExpiryDate = new Date(year, month, day),
                        currentDate = new Date(),
                        timeDifference = membershipExpiryDate - currentDate;

                    if (timeDifference <= 0) {
                        if (membershipDetails != '0-0-0') {
                            premiumInput.value = profileSettings.memberShipExp + membershipDetails;
                            premiumWrap.classList.remove('hidden');
                            return;
                        } else {
                            premiumWrap.classList.add('hidden');
                        }
                    } else {
                        premiumInput.value = profileSettings.memberShipAktif + membershipDetails;
                        premiumWrap.classList.remove('hidden');
                    }
                } else {
                    var membershipInfo = userMembershipCheck.replace(/^premium-/i, '');
                    var [day, month, year] = membershipInfo.split(/[- :]/);
                    month = parseInt(month) - 1;
                    var membershipExpiryDate = new Date(year, month, day);
                    var currentDate = new Date();
                    var timeDifference = membershipExpiryDate - currentDate;

                    if (timeDifference <= 0) {
                        if (membershipInfo != '0-0-0') {
                            premiumInput.value = profileSettings.memberShipExp + membershipInfo;
                            premiumWrap.classList.remove('hidden');
                            return;
                        } else {
                            premiumWrap.classList.add('hidden');
                        }
                    }
                }
            })
            .catch(error => {
                premiumWrap.classList.add('hidden');
            });

        document.querySelector('#email').value = user.email;
        user.name === null ? document.querySelector('#nama').value = profileSettings.empty : document.querySelector('#nama').value = user.name;
        user.nomor === null ? (document.querySelector('#noHp').type = 'text', document.querySelector('#noHp').value = profileSettings.empty, document.querySelector('#noHp').addEventListener('keyup', function () {
            this.type = 'number';
        })) : document.querySelector('#noHp').value = user.nomor;
        document.querySelector('#uId').value = user.uid;

        if (user.profile && user.profile.startsWith('https://')) {
            document.querySelector('.profile').innerHTML = '';
            var imgElement = document.createElement('img');
            imgElement.src = user.profile;
            imgElement.alt = user.name;
            var parentElement = document.querySelector('.profile');
            parentElement.appendChild(imgElement);
        }
    }

    document.querySelector('.editData').addEventListener('click', editDataProfileP);
}
// دالة لتعديل بيانات الملف الشخصي
function editDataProfileP() {
    document.querySelector('#noHp').toggleAttribute('disabled');
    document.querySelector('#nama').toggleAttribute('disabled');
    document.querySelector('.editData').classList.toggle('hidden');
    document.querySelector('.logout').classList.toggle('hidden');
    document.querySelector('.perbarui').classList.toggle('hidden');
    document.querySelector('.batal').classList.toggle('hidden');
    document.querySelector('kbd').classList.toggle('hidden');
}

// إضافة حدث للنقر على زر "إلغاء"
document.querySelector('.batal').addEventListener('click', cancelProfileEdit);

// دالة لإلغاء تعديل الملف الشخصي
function cancelProfileEdit() {
    document.querySelector('#noHp').toggleAttribute('disabled');
    document.querySelector('#nama').toggleAttribute('disabled');
    document.querySelector('.editData').classList.toggle('hidden');
    document.querySelector('.logout').classList.toggle('hidden');
    document.querySelector('.perbarui').classList.toggle('hidden');
    document.querySelector('.batal').classList.toggle('hidden');
    document.querySelector('kbd').classList.toggle('hidden');
}

// إضافة حدث للنقر على زر "تحديث"
document.querySelector('.perbarui').addEventListener('click', updateProfileData);

// دالة لتحديث بيانات الملف الشخصي
function updateProfileData() {
    if (document.querySelector('#nama').value == '' || document.querySelector('#nama').value.length < 2) {
        document.querySelector('#nama').focus();
    } else {
        if (document.querySelector('#noHp').value == '' || document.querySelector('#noHp').value.length < 5) {
            document.querySelector('#noHp').focus();
        } else {
            document.querySelector('#noHp').toggleAttribute('disabled');
            document.querySelector('#nama').toggleAttribute('disabled');
            document.querySelector('.editData').classList.toggle('hidden');
            document.querySelector('.logout').classList.toggle('hidden');
            document.querySelector('.perbarui').classList.toggle('hidden');
            document.querySelector('kbd').innerHTML = 'جاري التحميل...';
            firebase.initializeApp(firebaseConfig);

            // دالة لتحديث البيانات في قاعدة البيانات
            function handleUpdate() {
                fetch(firebaseConfig.databaseURL + '/data.json')
                    .then(response => response.json())
                    .then(data => {
                        const userId = user.uid;
                        const decryptedData = CryptoJS.AES.decrypt(data[userId], usrPswKey).toString(CryptoJS.enc.Utf8);
                        const userPhone = decryptedData.split('{split}')[2];
                        const userName = decryptedData.split('{split}')[1];

                        var updatedUserData = {
                            name: userName,
                            email: user.email,
                            profile: user.profile,
                            uid: user.uid,
                            nomor: userPhone,
                            membership: user.membership
                        };

                        localStorage.setItem('user', JSON.stringify(updatedUserData));
                    })
                    .catch(error => {
                        document.querySelector('kbd').innerHTML = profileSettings.fail;
                    });

                document.querySelector('kbd').innerHTML = profileSettings.sukses;
                setTimeout(function () {
                    window.location.reload();
                }, 2000);
            }

            const userRef = firebase.database().ref('data/' + user.uid);
            userRef.once('value').then(snapshot => {
                const email = document.querySelector('#email').value;
                const name = document.querySelector('#nama').value;
                const phone = document.querySelector('#noHp').value;

                var userDataString = email + '{split}' + name + '{split}' + phone + '{split}premium-0-0-0';
                if (user.membership != null) {
                    userDataString = email + '{split}' + name + '{split}' + phone + '{split}' + user.membership;
                }

                const encryptedData = CryptoJS.AES.encrypt(userDataString, usrPswKey).toString();
                return userRef.set(encryptedData);
            }).then(() => {
                handleUpdate();
            }).catch(error => {
                document.querySelector('kbd').innerHTML = profileSettings.fail;
            });
        }
    }
}

// إضافة حدث للنقر على زر "تسجيل الخروج"
document.querySelector('.logout').addEventListener('click', logoutProfileP);
// دالة لتسجيل الخروج من الملف الشخصي
function logoutProfileP() {
    if (confirm(profileSettings.logoutConfirm)) {
        localStorage.clear();
        localStorage.removeItem('user');
        window.location.href = profileSettings.redirect;
    }
} else {
    window.location.reload();
}

// التحقق من حالة تسجيل الدخول
fetch(loginOpen('Xiv0Zia6md9gY2hzYB1qXNK4TRynWLPwSRPghH1dhLvBmwWzZwPBSRrEXQ8oS29nm2WzZwPBSRrENL9xXQ4oXxrpYV='))
    .then(response => response.json())
    .then(data => {
        if (!data.user || data.user[contentIdentifier] !== true) {
            window.location.reload();
        }
    })
    .catch(error => {
        window.location.reload();
    });
