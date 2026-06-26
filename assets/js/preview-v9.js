/**
 * Preview Page Handler
 * Fetches registration data from Firestore and handles PDF download
 */

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');
const downloadBtn = document.getElementById('downloadBtn');

// Certificate field elements
const certRegId = document.getElementById('certRegId');
const certName = document.getElementById('certName');
const certMobile = document.getElementById('certMobile');
const certEmail = document.getElementById('certEmail');
const certUserType = document.getElementById('certUserType');
const certPenchan = document.getElementById('certPenchan');
const certDate = document.getElementById('certDate');

// Store mobile number for PDF filename
let registrationMobile = '';

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

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

/**
 * Format a Firestore timestamp to a readable date string
 * @param {Object} timestamp - Firestore timestamp object
 * @returns {string} Formatted date string like "25 June 2026"
 */
function formatDate(timestamp) {
    if (!timestamp) return '—';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Show/hide loading overlay
 * @param {boolean} show - Whether to show loading
 */
function setLoading(show) {
    if (show) {
        loadingOverlay.classList.remove('d-none');
    } else {
        loadingOverlay.classList.add('d-none');
    }
}

/**
 * Fetch registration data from Firestore and populate certificate
 */
async function loadCertificate() {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('id');

    if (!docId) {
        setLoading(false);
        showToast('No registration ID found. Please register first.', 'error');
        return;
    }

    try {
        const docRef = db.collection('users').doc(docId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            setLoading(false);
            showToast('Registration not found. The record may have been deleted.', 'error');
            return;
        }

        const data = docSnap.data();
        registrationMobile = data.mobile || '';

        // Populate certificate fields
        certRegId.textContent = data.registrationId || '—';
        certName.textContent = data.name || '—';
        certMobile.textContent = data.mobile || '—';
        certEmail.textContent = data.email || '—';
        certUserType.textContent = data.userType || '—';
        certPenchan.textContent = data.pehchanNumber || data.penchanNumber || '—';
        certDate.textContent = formatDate(data.createdAt);

        setLoading(false);

    } catch (error) {
        console.error('Error loading certificate:', error);
        setLoading(false);
        showToast('Failed to load registration data. Please try again.', 'error');
    }
}

/**
 * Download the certificate as a PDF
 * Builds the PDF directly using jsPDF primitives — no canvas, no taint issues.
 * Works with file:// protocol and does not require a web server.
 */
function downloadPDF() {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Generating PDF...';

    try {
        const jsPDFClass = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
        if (!jsPDFClass) throw new Error('jsPDF library is not loaded.');

        const pdf = new jsPDFClass('p', 'mm', 'a4');
        const W = pdf.internal.pageSize.getWidth();   // 210mm
        const H = pdf.internal.pageSize.getHeight();  // 297mm

        // ── Helpers ──────────────────────────────────────────────────────────
        const hex = (h) => {
            const r = parseInt(h.slice(1, 3), 16);
            const g = parseInt(h.slice(3, 5), 16);
            const b = parseInt(h.slice(5, 7), 16);
            return [r, g, b];
        };

        // ── Background ───────────────────────────────────────────────────────
        pdf.setFillColor(...hex('#ffffff'));
        pdf.rect(0, 0, W, H, 'F');

        // Outer decorative border
        pdf.setDrawColor(...hex('#c9a84c'));
        pdf.setLineWidth(0.8);
        pdf.rect(8, 8, W - 16, H - 16, 'S');

        // Inner border line
        pdf.setDrawColor(...hex('#8a6d2e'));
        pdf.setLineWidth(0.3);
        pdf.rect(11, 11, W - 22, H - 22, 'S');

        // ── Gold accent bar at top ────────────────────────────────────────────
        pdf.setFillColor(...hex('#c9a84c'));
        pdf.rect(8, 8, W - 16, 1.5, 'F');
        pdf.rect(8, H - 9.5, W - 16, 1.5, 'F');

        // ── Organisation name (header) ────────────────────────────────────────
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...hex('#c9a84c'));
        pdf.text('WE THE WEAVER LEADERS', W / 2, 22, { align: 'center' });

        // ── Main title ────────────────────────────────────────────────────────
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(...hex('#1a1a2e'));
        pdf.text('REGISTRATION FORM', W / 2, 38, { align: 'center' });

        // Decorative underline for title
        pdf.setDrawColor(...hex('#c9a84c'));
        pdf.setLineWidth(0.5);
        pdf.line(30, 42, W - 30, 42);
        // Diamond in center of divider
        pdf.setFillColor(...hex('#c9a84c'));
        pdf.circle(W / 2, 42, 1.2, 'F');

        // ── Read live data from the DOM ───────────────────────────────────────
        const getValue = (id) => {
            const el = document.getElementById(id);
            return el ? (el.textContent.trim() || '—') : '—';
        };

        const fields = [
            { label: 'Registration ID',   value: getValue('certRegId') },
            { label: 'Full Name',         value: getValue('certName') },
            { label: 'Mobile Number',     value: getValue('certMobile') },
            { label: 'Email Address',     value: getValue('certEmail') },
            { label: 'User Type',         value: getValue('certUserType') },
            { label: 'Pehchan Number',    value: getValue('certPenchan') },
            { label: 'Registration Date', value: getValue('certDate') },
        ];

        // ── Data rows ─────────────────────────────────────────────────────────
        const startY = 55;
        const rowH   = 20;
        const labelX = 25;
        const valueX = W / 2 + 5;
        const cardW  = W - 50;
        const cardX  = 25;

        fields.forEach((field, i) => {
            const y = startY + i * rowH;

            // Alternating row background
            if (i % 2 === 0) {
                pdf.setFillColor(...hex('#f8fafc'));
            } else {
                pdf.setFillColor(...hex('#f1f5f9'));
            }
            pdf.roundedRect(cardX, y - 5, cardW, rowH - 1, 2, 2, 'F');

            // Left accent strip
            pdf.setFillColor(...hex('#c9a84c'));
            pdf.rect(cardX, y - 5, 2, rowH - 1, 'F');

            // Label
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8.5);
            pdf.setTextColor(...hex('#475569'));
            pdf.text(field.label.toUpperCase(), labelX + 4, y + 3.5);

            // Separator dot
            pdf.setTextColor(...hex('#c9a84c'));
            pdf.text(':', W / 2 - 3, y + 3.5);

            // Value — highlight Status specially
            if (field.label === 'Status') {
                const isApproved = field.value.toLowerCase() === 'approved';
                pdf.setTextColor(...hex(isApproved ? '#22c55e' : '#f59e0b'));
                pdf.setFont('helvetica', 'bold');
            } else {
                pdf.setTextColor(...hex('#1e293b'));
                pdf.setFont('helvetica', 'bold');
            }
            pdf.setFontSize(10);
            pdf.text(field.value, valueX, y + 3.5);
        });

        // ── Bottom divider ────────────────────────────────────────────────────
        const bottomY = startY + fields.length * rowH + 8;
        pdf.setDrawColor(...hex('#c9a84c'));
        pdf.setLineWidth(0.4);
        pdf.line(30, bottomY, W - 30, bottomY);
        pdf.setFillColor(...hex('#c9a84c'));
        pdf.circle(W / 2, bottomY, 1.2, 'F');

        // ── Footer note ───────────────────────────────────────────────────────
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...hex('#64748b'));
        pdf.text(
            'This is a computer-generated document and does not require a physical signature.',
            W / 2, bottomY + 10, { align: 'center' }
        );

        // ── Page number / timestamp ───────────────────────────────────────────
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(...hex('#94a3b8'));
        const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        pdf.text(`Generated: ${now}`, W / 2, H - 13, { align: 'center' });

        // ── Save ──────────────────────────────────────────────────────────────
        const filename = registrationMobile
            ? `Registration-${registrationMobile}.pdf`
            : 'Registration-Form.pdf';

        pdf.save(filename);
        showToast('PDF downloaded successfully!', 'success');

    } catch (error) {
        console.error('PDF generation error:', error);
        showToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<i class="bi bi-download me-2"></i> Download PDF';
    }
}

// Event Listeners
downloadBtn.addEventListener('click', downloadPDF);

// Initialize - load certificate data
loadCertificate();
