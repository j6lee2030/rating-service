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
// 사용자 댓글 로드 (전역 등록) - subjects.html에서는 동작하지 않음
window.loadUserComments = async function loadUserComments() {
    // subjects.html에서는 리뷰 목록을 표시하지 않음
    if (window.location.pathname.includes('subjects.html')) {
        return;
    }
    
    if (!currentUser || !window.comments) return;
    
    try {
        const result = await window.comments.getAll();
        if (result.success) {
            window.displayComments(result.data);
        } else {
            console.error('Failed to load comments:', result.error);
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Display comments in UI (reviews.html 전용)
// subjects.html에서는 동작하지 않음
window.displayComments = function displayComments(comments) {
    // subjects.html에서는 리뷰 목록을 표시하지 않음
    if (window.location.pathname.includes('subjects.html')) {
        return;
    }
    
    // 기존 댓글 목록 컨테이너 찾기
    let commentsList = document.getElementById('comments-list');
    let commentsContainer = document.getElementById('comments-container');
    
    // 컨테이너가 없으면 리턴 (동적 생성 제거)
    if (!commentsContainer || !commentsList) {
        return;
    }

    // 댓글이 없는 경우
    if (!comments || comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">아직 작성한 리뷰가 없습니다.</p>';
        return;
    }

    // 댓글 목록 렌더링
    commentsList.innerHTML = '';
    
    comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        commentDiv.innerHTML = `
            <div class="comment-header">
                <strong>${comment.subject}</strong>
                <span class="comment-date">${new Date(comment.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
            <div class="comment-ratings">
                <span>난이도: ${'★'.repeat(comment.difficulty)}${'☆'.repeat(5-comment.difficulty)}</span>
                <span>강의 스타일: ${'★'.repeat(comment.lecture_style)}${'☆'.repeat(5-comment.lecture_style)}</span>
                <span>흥미도: ${'★'.repeat(comment.engaging_level)}${'☆'.repeat(5-comment.engaging_level)}</span>
            </div>
            <div class="comment-reason">${comment.reason}</div>
            <div class="comment-actions">
                <button onclick="window.editComment('${comment.id}')" class="edit-btn">수정</button>
                <button onclick="window.deleteComment('${comment.id}')" class="delete-btn">삭제</button>
            </div>
        `;
        commentsList.appendChild(commentDiv);
    });
    
    console.log(`✅ ${comments.length}개의 리뷰가 표시됨`);
}

// Edit comment function
// 댓글 수정 함수 (전역 등록)
window.editComment = async function editComment(commentId) {
    if (!currentUser || !window.comments) return;
    
    try {
        const result = await window.comments.getAll();
        if (result.success) {
            const comment = result.data.find(c => c.id === commentId);
            
            if (comment) {
                // 리뷰 작성 탭으로 이동
                const writeTabBtn = document.querySelector('[data-tab="write-review"]');
                if (writeTabBtn) {
                    writeTabBtn.click();
                }
                
                // Set the subject
                const dropdownSelect = document.querySelector('.dropdown-select');
                if (dropdownSelect) {
                    dropdownSelect.textContent = comment.subject;
                    currentSubject = comment.subject;
                }
                
                // Set ratings
                window.setRating('difficulty', comment.difficulty);
                window.setRating('lecture_style', comment.lecture_style);
                window.setRating('engaging_level', comment.engaging_level);
                
                // Set reason
                const textarea = document.querySelector('.reason-box textarea');
                if (textarea) {
                    textarea.value = comment.reason;
                }
                
                // Show form and set editing state
                // 폼 표시 및 수정 모드 설정
                const ratingContent = document.querySelector('.rating-content');
                const formBottom = document.querySelector('.form-bottom');
                const submitButton = document.querySelector('.submit-button');
                
                if (ratingContent) ratingContent.style.display = 'flex';
                if (formBottom) formBottom.style.display = 'block';
                if (submitButton) submitButton.textContent = '수정하기';
                
                editingCommentId = commentId;
                
                // Scroll to form
                setTimeout(() => {
                    const mainBox = document.querySelector('.main-box');
                    if (mainBox) mainBox.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    } catch (error) {
        console.error('리뷰 수정 로드 실패:', error);
        alert('리뷰를 불러오는데 실패했습니다.');
    }
}

// Set rating stars
// 별점 설정 함수 (전역 등록)
window.setRating = function setRating(type, rating) {
    const stars = document.querySelector(`[data-rating-type="${type}"]`);
    if (stars) {
        const starElements = stars.querySelectorAll('.star');
        starElements.forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }
}

// Delete comment function
// 댓글 삭제 함수 (전역 등록)
window.deleteComment = async function deleteComment(commentId) {
    if (!currentUser || !window.comments) return;
    
    if (confirm('이 리뷰를 삭제하시겠습니까?')) {
        try {
            const result = await window.comments.delete(commentId);
            if (result.success) {
                // 현재 활성화된 탭 새로고침
                const activeTab = document.querySelector('.tab-btn.active');
                if (activeTab) {
                    const tabId = activeTab.dataset.tab;
                    if (tabId === 'all-reviews' && window.loadAllReviews) {
                        window.loadAllReviews();
                    } else if (tabId === 'my-reviews' && window.loadMyReviews) {
                        window.loadMyReviews();
                    }
                }
                // 레거시 호환
                if (window.loadUserComments) {
                    window.loadUserComments();
                }
            } else {
                alert(result.error || '삭제 실패. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('삭제 오류:', error);
            alert('네트워크 오류. 다시 시도해주세요.');
        }
    }
}

// Logout function
// 로그아웃 함수 (전역 등록)
window.logout = async function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        if (window.auth) {
            const result = await window.auth.signOut();
            if (result.success) {
                currentUser = null;
                stopActivityTracking();
                window.location.href = 'login.html';
            } else {
                alert('로그아웃 실패. 다시 시도해주세요.');
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