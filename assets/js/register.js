/**
 * Registration Form Handler
 * Handles user account creation, form validation, Firestore submission, and duplicate checking
 */

// DOM Elements
const form = document.getElementById('registrationForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoading = submitBtn.querySelector('.btn-loading');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// Input Elements
const nameInput = document.getElementById('regName');
const mobileInput = document.getElementById('regMobile');
const penchanInput = document.getElementById('regPenchan');
const emailInput = document.getElementById('regEmail');

// Pre-fill fields from sessionStorage if redirected from Homepage CTA form
try {
    const pendingRegStr = sessionStorage.getItem('pendingRegistration');
    if (pendingRegStr) {
        const pendingReg = JSON.parse(pendingRegStr);
        if (pendingReg.name && nameInput) nameInput.value = pendingReg.name;
        if (pendingReg.mobile && mobileInput) mobileInput.value = pendingReg.mobile;
        if (pendingReg.pehchanNumber && penchanInput) penchanInput.value = pendingReg.pehchanNumber;
        if (pendingReg.userType) {
            const userTypeRadio = document.querySelector(`input[name="userType"][value="${pendingReg.userType}"]`);
            if (userTypeRadio) userTypeRadio.checked = true;
        }
        // Remove it so it doesn't prefill on subsequent visits
        sessionStorage.removeItem('pendingRegistration');
    }
} catch (err) {
    console.error("Error pre-filling registration fields:", err);
}

/**
 * Show a toast notification
 * @param {string} message - Toast message
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="bi bi-x-lg"></i>
        </button>
    `;
    toastContainer.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

/**
 * Show/hide loading state
 * @param {boolean} show - Whether to show or hide loading
 */
function setLoading(show) {
    if (show) {
        if (btnText) btnText.classList.add('d-none');
        if (btnLoading) btnLoading.classList.remove('d-none');
        submitBtn.disabled = true;
        if (loadingOverlay) loadingOverlay.classList.remove('d-none');
    } else {
        if (btnText) btnText.classList.remove('d-none');
        if (btnLoading) btnLoading.classList.add('d-none');
        submitBtn.disabled = false;
        if (loadingOverlay) loadingOverlay.classList.add('d-none');
    }
}

/**
 * Clear all validation errors
 */
function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

/**
 * Show a field-level error
 * @param {string} fieldId - The ID of the error element
 * @param {string} message - Error message
 * @param {HTMLElement} inputEl - The input element to highlight
 */
function showFieldError(fieldId, message, inputEl) {
    const errorEl = document.getElementById(fieldId);
    if (errorEl) errorEl.textContent = message;
    if (inputEl) inputEl.classList.add('input-error');
}

/**
 * Validate the registration form
 * @returns {boolean} Whether the form is valid
 */
function validateForm() {
    clearErrors();
    let isValid = true;

    // Validate Name
    const name = nameInput.value.trim();
    if (!name) {
        showFieldError('nameError', 'Full name is required.', nameInput);
        isValid = false;
    } else if (name.length < 2) {
        showFieldError('nameError', 'Name must be at least 2 characters.', nameInput);
        isValid = false;
    }

    // Validate Mobile
    const mobile = mobileInput.value.trim();
    if (!mobile) {
        showFieldError('mobileError', 'Mobile number is required.', mobileInput);
        isValid = false;
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
        showFieldError('mobileError', 'Enter a valid 10-digit mobile number.', mobileInput);
        isValid = false;
    }

    // Validate User Type
    const userType = document.querySelector('input[name="userType"]:checked');
    if (!userType) {
        showFieldError('userTypeError', 'Please select a user type.');
        isValid = false;
    }

    // Validate Email
    const email = emailInput.value.trim();
    if (!email) {
        showFieldError('emailError', 'Email address is required.', emailInput);
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldError('emailError', 'Please enter a valid email address.', emailInput);
        isValid = false;
    }



    return isValid;
}

/**
 * Generate a fast Registration ID without a Firestore transaction
 * Format: WL-YYYYMMDD-XXXX (timestamp-based + random suffix)
 * @returns {string} The generated registration ID
 */
function generateRegistrationId() {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
        String(today.getMonth() + 1).padStart(2, '0') +
        String(today.getDate()).padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `WL-${dateStr}-${randomNum}`;
}

/**
 * Handle form submission — optimized for speed
 * @param {Event} e - Form submit event
 */
async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
        const name = nameInput.value.trim();
        const mobile = mobileInput.value.trim();
        const userType = document.querySelector('input[name="userType"]:checked').value;
        const penchanNumber = penchanInput.value.trim();
        const email = emailInput.value.trim();
        const password = 'weaver_' + Math.random().toString(36).substring(2, 10) + 'A!';

        // Check for duplicate mobile number
        const querySnapshot = await window.db.collection('users')
            .where('mobile', '==', mobile)
            .limit(1)
            .get();

        if (!querySnapshot.empty) {
            setLoading(false);
            showToast('Mobile Number Already Registered', 'error');
            showFieldError('mobileError', 'Mobile Number Already Registered', mobileInput);
            return;
        }

        // Create user in Firebase Authentication
        let userCredential;
        try {
            userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
        } catch (authError) {
            setLoading(false);
            let authErrorMsg = 'Registration failed. Please try again.';
            if (authError.code === 'auth/email-already-in-use') {
                authErrorMsg = 'This email address is already in use.';
                showFieldError('emailError', authErrorMsg, emailInput);
            } else if (authError.code === 'auth/invalid-email') {
                authErrorMsg = 'Invalid email address.';
                showFieldError('emailError', authErrorMsg, emailInput);
            }
            showToast(authErrorMsg, 'error');
            return;
        }

        const uid = userCredential.user.uid;
        const registrationId = generateRegistrationId(); // instant, no network call

        // Save user profile to Firestore
        await window.db.collection('users').doc(uid).set({
            uid,
            name,
            email,
            mobile,
            userType,
            pehchanNumber: penchanNumber,
            role: 'user',
            registrationId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showToast('Registration successful! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = `preview.html?id=${uid}`;
        }, 1000);

    } catch (error) {
        setLoading(false);
        showToast(`Registration Error: ${error.message || error}`, 'error');
    }
}

// Real-time validation
nameInput.addEventListener('input', () => {
    const name = nameInput.value.trim();
    const errorEl = document.getElementById('nameError');
    if (name.length > 0 && name.length < 2) {
        errorEl.textContent = 'Name must be at least 2 characters.';
        nameInput.classList.add('input-error');
    } else {
        errorEl.textContent = '';
        nameInput.classList.remove('input-error');
    }
});

mobileInput.addEventListener('input', () => {
    // Only allow digits
    mobileInput.value = mobileInput.value.replace(/\D/g, '').slice(0, 10);
    const mobile = mobileInput.value;
    const errorEl = document.getElementById('mobileError');
    if (mobile.length > 0 && mobile.length < 10) {
        errorEl.textContent = 'Mobile number must be 10 digits.';
        mobileInput.classList.add('input-error');
    } else if (mobile.length === 10 && !/^[6-9]/.test(mobile)) {
        errorEl.textContent = 'Mobile number must start with 6-9.';
        mobileInput.classList.add('input-error');
    } else {
        errorEl.textContent = '';
        mobileInput.classList.remove('input-error');
    }
});

emailInput.addEventListener('input', () => {
    const email = emailInput.value.trim();
    const errorEl = document.getElementById('emailError');
    if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorEl.textContent = 'Please enter a valid email address.';
        emailInput.classList.add('input-error');
    } else {
        errorEl.textContent = '';
        emailInput.classList.remove('input-error');
    }
});



// Attach form submit handler
if (form) {
    form.addEventListener('submit', handleSubmit);
}
