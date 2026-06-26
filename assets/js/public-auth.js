/**
 * Public Authentication state handler
 * Updates navbar button to "Admin Panel" only if logged in as admin.
 * For standard registered users and guests, it retains the standard "Login" button.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Only proceed if firebase.auth() is available
    if (typeof firebase === 'undefined' || !firebase.auth) {
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(async (user) => {
        // Match the navbar login wrapper button
        const loginBtn = document.querySelector('.btn-login-public') || document.querySelector('.btn-nav-action');
        if (!loginBtn) return;

        const parent = loginBtn.parentElement;
        if (!parent) return;

        if (user) {
            try {
                // Fetch user document from Firestore to check role
                const userDoc = await db.collection('users').doc(user.uid).get();
                let role = 'user';
                if (userDoc.exists) {
                    role = userDoc.data().role || 'user';
                }

                if (role === 'admin' || user.email === 'vinothfreelancer2017@gmail.com') {
                    // Admin is logged in -> show "Admin Panel" link
                    parent.innerHTML = '';
                    parent.className = 'nav ms-lg-auto pt-0 gap-3 align-items-center d-flex';

                    const dashboardBtn = document.createElement('a');
                    dashboardBtn.href = window.location.pathname.includes('/admin/') ? 'dashboard.html' : 'admin/dashboard.html';
                    dashboardBtn.className = 'btn btn-primary btn-nav-action';
                    dashboardBtn.textContent = 'Admin Panel';
                    parent.appendChild(dashboardBtn);
                    return;
                }
            } catch (err) {
                console.error("Error in public-auth listener:", err);
            }
        }

        // Fallback: If not logged in, or standard user -> retain standard "Login" button
        parent.innerHTML = '';
        parent.className = 'nav ms-lg-auto pt-0 gap-3 align-items-center d-flex';

        const standardLoginBtn = document.createElement('a');
        standardLoginBtn.href = window.location.pathname.includes('/admin/') ? 'login.html' : 'admin/login.html';
        standardLoginBtn.className = 'btn btn-primary btn-login-public';
        standardLoginBtn.textContent = 'Login';
        parent.appendChild(standardLoginBtn);
    });
});
