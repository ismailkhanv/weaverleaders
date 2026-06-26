/**
 * Admin Dashboard Module
 * Handles loading stats, table data rendering, pagination, CRUD operations, filters, and Excel/PDF exports.
 */

// State Management
let allRegistrations = [];
let filteredRegistrations = [];
let currentPage = 1;
const itemsPerPage = 10;
const showToast = (message, type) => window.showToast(message, type);

/**
 * Show toast alerts matching the admin dashboard styling (v=6)
 * @param {string} message 
 * @param {string} type - 'success', 'error', or 'info'
 */
window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    
    let iconClass = 'bi-info-circle-fill';
    if (type === 'success') iconClass = 'bi-check-circle-fill';
    if (type === 'error') iconClass = 'bi-exclamation-triangle-fill';

    toast.innerHTML = `
        <i class="toast-icon bi ${iconClass}"></i>
        <div class="toast-message flex-grow-1">${message}</div>
        <button class="toast-close" type="button">
            <i class="bi bi-x"></i>
        </button>
    `;

    container.appendChild(toast);

    // Setup close button click
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        });
    }

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

/**
 * Helper to format Firebase timestamp or JS Date nicely (e.g., "25 Jun 2026")
 * @param {Timestamp|Date} timestamp 
 * @returns {string}
 */
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return 'N/A';
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
}

/**
 * Initialize the Admin Dashboard
 */
window.initDashboard = function() {
    const searchInput = document.getElementById('searchInput');
    const filterUserType = document.getElementById('filterUserType');
    const tableLoading = document.getElementById('tableLoading');

    // Load registrations in real-time
    const q = db.collection('users').orderBy('createdAt', 'desc');

    q.onSnapshot((snapshot) => {
        allRegistrations = [];
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            allRegistrations.push({
                id: docSnap.id,
                ...data
            });
        });

        // Hide loading skeleton
        if (tableLoading) tableLoading.style.display = 'none';

        // Update top statistics cards
        updateStats();

        // Apply any active filters and render
        applyFiltersAndRender();
    }, (error) => {
        console.error("Firestore loading error:", error);
        showToast("Failed to sync registration data.", "error");
        if (tableLoading) tableLoading.style.display = 'none';
    });

    // Attach search and filter event listeners
    if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; applyFiltersAndRender(); });
    if (filterUserType) filterUserType.addEventListener('change', () => { currentPage = 1; applyFiltersAndRender(); });

    // Setup action buttons in modals (save edit / confirm delete)
    setupModalActions();
}

/**
 * Recalculate statistics values on stats cards with count-up animation
 */
function updateStats() {
    let total = allRegistrations.length;
    let weavers = 0;
    let nonWeavers = 0;
    let weaverMembers = 0;

    allRegistrations.forEach(reg => {
        if (reg.userType === 'Weaver') weavers++;
        else if (reg.userType === 'Non Weaver') nonWeavers++;
        else if (reg.userType === 'Weaver Member') weaverMembers++;
    });

    animateCounter('statTotal', total);
    animateCounter('statWeavers', weavers);
    animateCounter('statNonWeavers', nonWeavers);
    animateCounter('statWeaverMembers', weaverMembers);
}

/**
 * Animate the statistical counters smoothly
 * @param {string} id 
 * @param {number} targetVal 
 */
function animateCounter(id, targetVal) {
    const el = document.getElementById(id);
    if (!el) return;

    let current = parseInt(el.textContent) || 0;
    if (current === targetVal) return;

    const diff = targetVal - current;
    const duration = 400; // ms
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        el.textContent = Math.floor(current + diff * progress);

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = targetVal;
        }
    }
    requestAnimationFrame(update);
}

/**
 * Applies search and selection filters with AND logic, then updates tables
 */
function applyFiltersAndRender() {
    const searchVal = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const typeVal = document.getElementById('filterUserType')?.value || '';

    filteredRegistrations = allRegistrations.filter(reg => {
        // Search by Name or Mobile
        const nameMatch = reg.name ? reg.name.toLowerCase().includes(searchVal) : false;
        const mobileMatch = reg.mobile ? reg.mobile.includes(searchVal) : false;
        if (searchVal && !nameMatch && !mobileMatch) return false;

        // User Type filter
        if (typeVal && reg.userType !== typeVal) return false;

        return true;
    });

    // Update count display
    const tableCount = document.getElementById('tableCount');
    if (tableCount) {
        tableCount.textContent = `${filteredRegistrations.length} record${filteredRegistrations.length === 1 ? '' : 's'}`;
    }

    renderTable();
}

/**
 * Render paginated table rows
 */
function renderTable() {
    const tableBody = document.getElementById('tableBody');
    const tableContent = document.getElementById('tableContent');
    const emptyState = document.getElementById('emptyState');
    const paginationWrapper = document.getElementById('paginationWrapper');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (filteredRegistrations.length === 0) {
        if (tableContent) tableContent.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (paginationWrapper) paginationWrapper.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableContent) tableContent.style.display = 'block';
    if (paginationWrapper) paginationWrapper.style.display = 'flex';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredRegistrations.length);
    const paginatedItems = filteredRegistrations.slice(startIndex, endIndex);

    paginatedItems.forEach((reg, index) => {
        const row = document.createElement('tr');
        const globalIndex = startIndex + index + 1;
        const dateFormatted = formatDate(reg.createdAt);


        row.innerHTML = `
            <td>${globalIndex}</td>
            <td><span class="reg-id">${reg.registrationId || 'N/A'}</span></td>
            <td class="fw-semibold text-white">${reg.name || 'N/A'}</td>
            <td>${reg.mobile || 'N/A'}</td>
            <td>${reg.userType || 'N/A'}</td>
            <td>${reg.pehchanNumber || reg.penchanNumber || '—'}</td>
            <td>${dateFormatted}</td>
            <td>
                <div class="d-flex gap-1">
                    <button class="btn btn-action view" data-id="${reg.id}" title="View Details">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-action delete" data-id="${reg.id}" data-name="${reg.name}" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    renderPagination(startIndex + 1, endIndex, filteredRegistrations.length);
    attachTableRowListeners();
}

/**
 * Generate pagination links nicely
 */
function renderPagination(start, end, total) {
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationBtns = document.getElementById('paginationBtns');
    
    if (paginationInfo) {
        paginationInfo.textContent = `Showing ${start} to ${end} of ${total} entries`;
    }

    if (!paginationBtns) return;
    paginationBtns.innerHTML = '';

    const totalPages = Math.ceil(total / itemsPerPage);
    if (totalPages <= 1) return;

    // Previous button
    const prevItem = document.createElement('li');
    prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevItem.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><i class="bi bi-chevron-left"></i></a>`;
    if (currentPage > 1) {
        prevItem.querySelector('.page-link').addEventListener('click', (e) => {
            e.preventDefault();
            currentPage--;
            renderTable();
        });
    }
    paginationBtns.appendChild(prevItem);

    // Number buttons
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${currentPage === i ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageItem.querySelector('.page-link').addEventListener('click', (e) => {
            e.preventDefault();
            currentPage = i;
            renderTable();
        });
        paginationBtns.appendChild(pageItem);
    }

    // Next button
    const nextItem = document.createElement('li');
    nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextItem.innerHTML = `<a class="page-link" href="#" aria-label="Next"><i class="bi bi-chevron-right"></i></a>`;
    if (currentPage < totalPages) {
        nextItem.querySelector('.page-link').addEventListener('click', (e) => {
            e.preventDefault();
            currentPage++;
            renderTable();
        });
    }
    paginationBtns.appendChild(nextItem);
}

/**
 * Handle individual row action buttons click
 */
function attachTableRowListeners() {
    // View details
    document.querySelectorAll('.btn-action.view').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const reg = allRegistrations.find(r => r.id === id);
            if (reg) {
                document.getElementById('viewRegId').textContent = reg.registrationId || 'N/A';
                document.getElementById('viewName').textContent = reg.name || 'N/A';
                document.getElementById('viewMobile').textContent = reg.mobile || 'N/A';
                document.getElementById('viewEmail').textContent = reg.email || '—';
                document.getElementById('viewUserType').textContent = reg.userType || 'N/A';
                document.getElementById('viewPenchan').textContent = reg.pehchanNumber || reg.penchanNumber || '—';
                document.getElementById('viewDate').textContent = formatDate(reg.createdAt);
                
                const viewModal = new bootstrap.Modal(document.getElementById('viewModal'));
                viewModal.show();
            }
        });
    });


    document.querySelectorAll('.btn-action.delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            if (id && name) {
                document.getElementById('deleteDocId').value = id;
                document.getElementById('deleteRegName').textContent = name;

                const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
                deleteModal.show();
            }
        });
    });
}

/**
 * Hook up modal actions (confirm deletion)
 */
function setupModalActions() {
    // Delete document
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            const id = document.getElementById('deleteDocId').value;
            const name = document.getElementById('deleteRegName').textContent;

            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';

            try {
                await db.collection('users').doc(id).delete();
                window.showToast(`Deleted registration for ${name}`, "success");

                const modalEl = document.getElementById('deleteModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();
            } catch (error) {
                console.error("Delete error:", error);
                window.showToast("Failed to delete user record.", "error");
            } finally {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.innerHTML = 'Delete';
            }
        });
    }
}

