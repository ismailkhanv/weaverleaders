/**
 * Admin Authentication Module
 * Handles admin login, logout, session persistence, and page access guards.
 */

/**
 * Log in admin using Firebase Authentication
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<User>}
 */
window.loginAdmin = async function(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Firebase Login Error:", error);
        throw error;
    }
}

/**
 * Log out the current admin
 * @returns {Promise<void>}
 */
window.logoutAdmin = async function() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Firebase Logout Error:", error);
        throw error;
    }
}

/**
 * Check the authentication state
 * @param {Function} onAuthenticated 
 * @param {Function} onNotAuthenticated 
 */
window.checkAuth = function(onAuthenticated, onNotAuthenticated) {
    auth.onAuthStateChanged((user) => {
        if (user) {
            onAuthenticated(user);
        } else {
            onNotAuthenticated();
        }
    });
}

/**
 * Ensures the logged-in user document is stored in the Firestore 'users' collection with appropriate role
 * @param {User} user - Firebase Auth user object
 * @returns {Promise<string>} The role of the user ('admin' or 'user')
 */
async function ensureUserStored(user) {
    const userDocRef = db.collection('users').doc(user.uid);
    try {
        const userDocSnap = await userDocRef.get();
        if (userDocSnap.exists) {
            const userData = userDocSnap.data();
            return userData.role || (user.email === 'vinothfreelancer2017@gmail.com' ? 'admin' : 'user');
        } else {
            // User does not exist in Firestore. Store user details with role: 'user' (or 'admin' if superadmin)
            const isSuperAdmin = user.email === 'vinothfreelancer2017@gmail.com';
            const assignedRole = isSuperAdmin ? 'admin' : 'user';
            
            await userDocRef.set({
                uid: user.uid,
                name: user.displayName || user.email.split('@')[0],
                email: user.email,
                mobile: '',
                userType: 'Non Weaver',
                pehchanNumber: '',
                role: assignedRole,
                registrationId: '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: isSuperAdmin ? 'Approved' : 'Pending'
            });
            return assignedRole;
        }
    } catch (error) {
        console.error("Error in ensureUserStored:", error);
        return user.email === 'vinothfreelancer2017@gmail.com' ? 'admin' : 'user';
    }
}

/**
 * Initialize the Admin Login page
 * Sets up submit listeners, password toggles, and UI updates
 */
window.initLoginPage = function() {
    const loginForm = document.getElementById('loginForm');
    const adminEmailInput = document.getElementById('adminEmail');
    const adminPasswordInput = document.getElementById('adminPassword');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginBtnSpinner = document.getElementById('loginBtnSpinner');
    const loginError = document.getElementById('loginError');
    const loginErrorText = document.getElementById('loginErrorText');

    let isInitialAuthCheck = true;

    // Redirect to dashboard if already logged-in as admin on page load.
    // If logged-in as standard user, sign them out silently without displaying any error.
    auth.onAuthStateChanged(async (user) => {
        if (user && isInitialAuthCheck) {
            isInitialAuthCheck = false;
            try {
                const role = await ensureUserStored(user);
                if (role === 'admin') {
                    window.location.href = 'dashboard.html';
                } else {
                    // Silently sign out standard user on page load without showing any error message
                    await auth.signOut();
                }
            } catch (error) {
                console.error("Initial auth check error:", error);
                await auth.signOut();
            }
        } else {
            isInitialAuthCheck = false;
        }
    });

    // Toggle password visibility
    if (togglePasswordBtn && adminPasswordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = adminPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            adminPasswordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const icon = togglePasswordBtn.querySelector('i');
            if (icon) {
                if (type === 'text') {
                    icon.classList.remove('bi-eye');
                    icon.classList.add('bi-eye-slash');
                } else {
                    icon.classList.remove('bi-eye-slash');
                    icon.classList.add('bi-eye');
                }
            }
        });
    }

    // Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = adminEmailInput.value.trim();
            const password = adminPasswordInput.value;

            // Hide previous errors
            if (loginError) loginError.classList.remove('show');

            // Show loading state
            if (loginBtn) loginBtn.disabled = true;
            if (loginBtnText) loginBtnText.classList.add('d-none');
            if (loginBtnSpinner) loginBtnSpinner.classList.remove('d-none');
            adminEmailInput.disabled = true;
            adminPasswordInput.disabled = true;

            try {
                const user = await loginAdmin(email, password);
                // Perform role validation immediately here
                const role = await ensureUserStored(user);
                if (role === 'admin') {
                    window.location.href = 'dashboard.html';
                } else {
                    // Show Access Denied since this was a submit attempt
                    if (loginErrorText) loginErrorText.textContent = "Access Denied: You are not authorized to view the Admin Panel.";
                    if (loginError) loginError.classList.add('show');
                    
                    // Reset fields
                    if (loginBtn) loginBtn.disabled = false;
                    if (loginBtnText) loginBtnText.classList.remove('d-none');
                    if (loginBtnSpinner) loginBtnSpinner.classList.add('d-none');
                    adminEmailInput.disabled = false;
                    adminPasswordInput.disabled = false;

                    await auth.signOut();
                }
            } catch (error) {
                // Show error message
                let errorMsg = "Admin only allow to login";
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                    errorMsg = "Admin only allow to login";
                } else if (error.code === 'auth/too-many-requests') {
                    errorMsg = "Too many login attempts. Please try again later.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMsg = "Please enter a valid email address.";
                }

                if (loginErrorText) loginErrorText.textContent = errorMsg;
                if (loginError) loginError.classList.add('show');

                // Reset loading state
                if (loginBtn) loginBtn.disabled = false;
                if (loginBtnText) loginBtnText.classList.remove('d-none');
                if (loginBtnSpinner) loginBtnSpinner.classList.add('d-none');
                adminEmailInput.disabled = false;
                adminPasswordInput.disabled = false;
            }
        });
    }

    // Forgot Password & Reset Modal Logic
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const resetEmailInput = document.getElementById('resetEmail');
    const resetBtn = document.getElementById('resetBtn');
    const resetBtnText = document.getElementById('resetBtnText');
    const resetBtnSpinner = document.getElementById('resetBtnSpinner');
    const resetError = document.getElementById('resetError');
    const resetErrorText = document.getElementById('resetErrorText');
    const resetSuccess = document.getElementById('resetSuccess');
    const resetPasswordModalEl = document.getElementById('resetPasswordModal');
    
    if (resetPasswordModalEl) {
        resetPasswordModalEl.addEventListener('show.bs.modal', () => {
            // Reset modal inputs and alerts when opened
            if (resetPasswordForm) resetPasswordForm.reset();
            if (resetError) resetError.style.display = 'none';
            if (resetSuccess) resetSuccess.style.display = 'none';
            if (resetBtn) resetBtn.disabled = false;
            if (resetBtnText) resetBtnText.classList.remove('d-none');
            if (resetBtnSpinner) resetBtnSpinner.classList.add('d-none');
            if (resetEmailInput) resetEmailInput.disabled = false;
        });
    }

    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = resetEmailInput.value.trim();

            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                if (resetErrorText) resetErrorText.textContent = "Please enter a valid email address.";
                if (resetError) resetError.style.display = 'block';
                return;
            }

            // Hide previous alerts
            if (resetError) resetError.style.display = 'none';
            if (resetSuccess) resetSuccess.style.display = 'none';

            // Show loading state
            if (resetBtn) resetBtn.disabled = true;
            if (resetBtnText) resetBtnText.classList.add('d-none');
            if (resetBtnSpinner) resetBtnSpinner.classList.remove('d-none');
            if (resetEmailInput) resetEmailInput.disabled = true;

            try {
                // Check if email exists in the Firestore database (except for superadmin email)
                const querySnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
                if (querySnapshot.empty && email !== 'vinothfreelancer2017@gmail.com') {
                    throw { code: 'auth/user-not-found', message: 'This email address is not registered.' };
                }

                // Send password reset email
                await auth.sendPasswordResetEmail(email);

                // Show success message
                if (resetSuccess) resetSuccess.style.display = 'block';
                if (resetPasswordForm) resetPasswordForm.reset();
            } catch (error) {
                console.error("Password reset error:", error);
                let errorMsg = "Failed to send password reset email. Please try again.";
                if (error.code === 'auth/user-not-found') {
                    errorMsg = "This email address is not registered.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMsg = "Please enter a valid email address.";
                } else if (error.code === 'auth/too-many-requests') {
                    errorMsg = "Too many attempts. Please try again later.";
                }
                
                if (resetErrorText) resetErrorText.textContent = errorMsg;
                if (resetError) resetError.style.display = 'block';
            } finally {
                // Reset button/loading state
                if (resetBtn) resetBtn.disabled = false;
                if (resetBtnText) resetBtnText.classList.remove('d-none');
                if (resetBtnSpinner) resetBtnSpinner.classList.add('d-none');
                if (resetEmailInput) resetEmailInput.disabled = false;
            }
        });
    }
}

/**
 * Initialize Authentication Guard for Admin Dashboard
 * Redirects to login page if unauthorized
 * @param {Function} onAuthSuccess 
 */
window.initDashboardAuth = function(onAuthSuccess) {
    const authLoading = document.getElementById('authLoading');
    const dashboardContent = document.getElementById('dashboardContent');
    const adminEmailDisplay = document.getElementById('adminEmailDisplay');
    const adminAvatar = document.getElementById('adminAvatar');
    const logoutBtn = document.getElementById('logoutBtn');

    window.checkAuth(
        async (user) => {
            // Validate if the user is authorized as an admin
            let isAdminUser = false;
            try {
                // Ensure user document is stored in Firestore with correct role
                const role = await ensureUserStored(user);
                if (role === 'admin') {
                    isAdminUser = true;
                }
            } catch (err) {
                console.error("Error verifying admin dashboard access:", err);
            }

            // Fallback check for the superadmin email
            if (user.email === 'vinothfreelancer2017@gmail.com') {
                isAdminUser = true;
            }

            if (!isAdminUser) {
                alert("Access Denied: You are not authorized to view the admin dashboard.");
                await auth.signOut();
                window.location.href = 'login.html';
                return;
            }

            // User is authenticated
            if (adminEmailDisplay) adminEmailDisplay.textContent = user.email;
            if (adminAvatar && user.email) {
                adminAvatar.textContent = user.email.charAt(0).toUpperCase();
            }

            // Hide loader and show dashboard
            if (authLoading) authLoading.style.display = 'none';
            if (dashboardContent) dashboardContent.style.display = 'block';

            // Setup logout button
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    if (confirm("Are you sure you want to log out?")) {
                        try {
                            if (authLoading) authLoading.style.display = 'flex';
                            if (dashboardContent) dashboardContent.style.display = 'none';
                            await window.logoutAdmin();
                            window.location.href = 'login.html';
                        } catch (error) {
                            alert("Failed to sign out. Please try again.");
                            if (authLoading) authLoading.style.display = 'none';
                            if (dashboardContent) dashboardContent.style.display = 'block';
                        }
                    }
                });
            }

            // Trigger dashboard specific features
            if (typeof onAuthSuccess === 'function') {
                onAuthSuccess(user);
            }
        },
        () => {
            // User is not authenticated, redirect to login
            window.location.href = 'login.html';
        }
    );
}
