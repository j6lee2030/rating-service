// Global variables
let currentUser = null;
let currentSubject = null;
let editingCommentId = null;
let activityTimer = null;

// Initialize authentication and UI
document.addEventListener('DOMContentLoaded', function() {
    // Test Supabase connection
    if (window.testSupabaseConnection) {
        window.testSupabaseConnection().then(success => {
            if (success) {
                console.log('✅ Supabase connection is working!');
            } else {
                console.error('❌ Supabase connection failed!');
            }
        });
    }
    
    // Check if user is logged in
    checkAuthState();
    
    // Set up menu functionality
    setupMenu();
    
    // Set up activity tracking
    setupActivityTracking();
    
    // Set up auth state listener
    if (window.auth) {
        window.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                currentUser = session.user;
                updateUIForLoggedInUser();
                startActivityTracking();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                updateUIForLoggedOutUser();
                stopActivityTracking();
            }
        });
    }
});

// Check authentication state
async function checkAuthState() {
    if (window.auth) {
        try {
            // Wait a bit for Supabase to initialize
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if session is still valid (not expired due to inactivity)
            const isValid = await window.auth.checkSessionValidity();
            if (!isValid) {
                updateUIForLoggedOutUser();
                return;
            }
            
            currentUser = await window.auth.getCurrentUser();
            if (currentUser) {
                updateUIForLoggedInUser();
                startActivityTracking();
            } else {
                updateUIForLoggedOutUser();
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            updateUIForLoggedOutUser();
        }
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    // Update login button to show "Get started"
    const loginBtn = document.querySelector('.login-link-btn');
    if (loginBtn && currentUser) {
        loginBtn.textContent = 'Get started';
        loginBtn.href = 'subjects.html';
        
        // Add or update welcome message below the button
        let welcomeMsg = document.querySelector('.welcome-message');
        if (!welcomeMsg) {
            welcomeMsg = document.createElement('div');
            welcomeMsg.className = 'welcome-message';
            loginBtn.parentNode.insertBefore(welcomeMsg, loginBtn.nextSibling);
        }
        welcomeMsg.textContent = `Welcome, ${currentUser.email}`;
    }
    
    // Load comments if on subjects page
    if (window.location.pathname.includes('subjects.html')) {
        loadUserComments();
    }
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    const loginBtn = document.querySelector('.login-link-btn');
    if (loginBtn) {
        loginBtn.textContent = 'Login';
        loginBtn.href = 'login.html';
        
        // Remove welcome message if it exists
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
    }
}

// Set up menu functionality
function setupMenu() {
    if (document.getElementById('menu-btn')) {
        const menuBtn = document.getElementById('menu-btn');
        const closeMenuBtn = document.getElementById('close-menu-btn');
        const menuOverlay = document.getElementById('grade-menu-overlay');

        menuBtn.addEventListener('click', () => {
            menuOverlay.classList.add('visible');
        });

        closeMenuBtn.addEventListener('click', () => {
            menuOverlay.classList.remove('visible');
        });

        menuOverlay.addEventListener('click', (event) => {
            if (event.target === menuOverlay) {
                menuOverlay.classList.remove('visible');
            }
        });
    }
}

// Load user comments
async function loadUserComments() {
    if (!currentUser || !window.comments) return;
    
    try {
        const result = await window.comments.getAll();
        if (result.success) {
            displayComments(result.data);
        } else {
            console.error('Failed to load comments:', result.error);
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Display comments in UI
function displayComments(comments) {
    // Remove existing comments display
    const existingComments = document.querySelector('.comments-display');
    if (existingComments) {
        existingComments.remove();
    }

    if (comments.length === 0) {
        return;
    }

    const commentsContainer = document.createElement('div');
    commentsContainer.className = 'comments-display';
    commentsContainer.innerHTML = `
        <h3>Your Comments</h3>
        <div class="comments-list"></div>
    `;

    const commentsList = commentsContainer.querySelector('.comments-list');
    
    comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        commentDiv.innerHTML = `
            <div class="comment-header">
                <strong>${comment.subject}</strong>
                <span class="comment-date">${new Date(comment.created_at).toLocaleDateString()}</span>
            </div>
            <div class="comment-ratings">
                <span>Difficulty: ${'★'.repeat(comment.difficulty)}${'☆'.repeat(5-comment.difficulty)}</span>
                <span>Lecture Style: ${'★'.repeat(comment.lecture_style)}${'☆'.repeat(5-comment.lecture_style)}</span>
                <span>Engaging: ${'★'.repeat(comment.engaging_level)}${'☆'.repeat(5-comment.engaging_level)}</span>
            </div>
            <div class="comment-reason">${comment.reason}</div>
            <div class="comment-actions">
                <button onclick="editComment('${comment.id}')" class="edit-btn">Edit</button>
                <button onclick="deleteComment('${comment.id}')" class="delete-btn">Delete</button>
            </div>
        `;
        commentsList.appendChild(commentDiv);
    });

    // Insert after the main box
    const mainBox = document.querySelector('.main-box');
    if (mainBox) {
        mainBox.insertAdjacentElement('afterend', commentsContainer);
    }
}

// Edit comment function
async function editComment(commentId) {
    if (!currentUser || !window.comments) return;
    
    try {
        const result = await window.comments.getAll();
        if (result.success) {
            const comment = result.data.find(c => c.id === commentId);
            
            if (comment) {
                // Set the subject
                const dropdownSelect = document.querySelector('.dropdown-select');
                if (dropdownSelect) {
                    dropdownSelect.textContent = comment.subject;
                    currentSubject = comment.subject;
                }
                
                // Set ratings
                setRating('difficulty', comment.difficulty);
                setRating('lecture_style', comment.lecture_style);
                setRating('engaging_level', comment.engaging_level);
                
                // Set reason
                const textarea = document.querySelector('.reason-box textarea');
                if (textarea) {
                    textarea.value = comment.reason;
                }
                
                // Show form and set editing state
                const ratingContent = document.querySelector('.rating-content');
                const formBottom = document.querySelector('.form-bottom');
                const submitButton = document.querySelector('.submit-button');
                
                if (ratingContent) ratingContent.style.display = 'flex';
                if (formBottom) formBottom.style.display = 'block';
                if (submitButton) submitButton.textContent = 'Update Comment';
                
                editingCommentId = commentId;
                
                // Scroll to form
                ratingContent.scrollIntoView({ behavior: 'smooth' });
            }
        }
    } catch (error) {
        console.error('Failed to load comment for editing:', error);
        alert('Failed to load comment for editing');
    }
}

// Set rating stars
function setRating(type, rating) {
    const stars = document.querySelector(`[data-rating-type="${type}"]`);
    if (stars) {
        const starElements = stars.querySelectorAll('.star');
        starElements.forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }
}

// Delete comment function
async function deleteComment(commentId) {
    if (!currentUser || !window.comments) return;
    
    if (confirm('Are you sure you want to delete this comment?')) {
        try {
            const result = await window.comments.delete(commentId);
            if (result.success) {
                loadUserComments();
            } else {
                alert(result.error || 'Failed to delete comment');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Network error. Please try again.');
        }
    }
}

// Logout function
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        if (window.auth) {
            const result = await window.auth.signOut();
            if (result.success) {
                currentUser = null;
                stopActivityTracking();
                window.location.href = 'login.html';
            } else {
                alert('Logout failed. Please try again.');
            }
        }
    }
}

// Activity tracking functions
function setupActivityTracking() {
    // Track user activity events
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
        document.addEventListener(event, updateActivity, true);
    });
}

function startActivityTracking() {
    if (currentUser && window.auth) {
        // Update activity immediately when user logs in
        window.auth.updateLastActivity();
        
        // Set up periodic session validity check (every 5 minutes)
        activityTimer = setInterval(async () => {
            if (currentUser && window.auth) {
                const isValid = await window.auth.checkSessionValidity();
                if (!isValid) {
                    console.log('Session expired due to inactivity');
                    currentUser = null;
                    updateUIForLoggedOutUser();
                    stopActivityTracking();
                }
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    }
}

function stopActivityTracking() {
    if (activityTimer) {
        clearInterval(activityTimer);
        activityTimer = null;
    }
}

function updateActivity() {
    if (currentUser && window.auth) {
        window.auth.updateLastActivity();
    }
}