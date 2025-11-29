
const SUPABASE_URL = 'https://ikpirfqborizdbgnhqdy.supabase.co'
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcGlyZnFib3JpemRiZ25ocWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjgzMjQsImV4cCI6MjA3MjcwNDMyNH0.izr4SU9UzcY_p6WeTq63AIGyJQcebDi8ORuNA8wWmLY"

// Configure Supabase client with persistent session
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
    }
})

// Test Supabase connection
window.testSupabaseConnection = async function() {
    try {
        console.log('Testing Supabase connection...');
        const { data, error } = await window.supabaseClient
            .from('comments')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('Supabase connection failed:', error);
            return false;
        }
        
        console.log('Supabase connection successful!');
        return true;
    } catch (error) {
        console.error('Supabase connection test failed:', error);
        return false;
    }
};

// Authentication functions
window.auth = {
    // Sign up with email and password
    async signUp(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: window.location.origin + '/templates/index.html'
                }
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign out
    async signOut() {
        try {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get current user
    async getCurrentUser() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            return user;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    },

    // Listen to auth state changes
    onAuthStateChange(callback) {
        return window.supabaseClient.auth.onAuthStateChange(callback);
    },

    // Check if session is expired (30 days)
    isSessionExpired() {
        const lastActivity = localStorage.getItem('lastActivity');
        if (!lastActivity) return true;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return new Date(lastActivity) < thirtyDaysAgo;
    },

    // Update last activity timestamp
    updateLastActivity() {
        localStorage.setItem('lastActivity', new Date().toISOString());
    },

    // Check session and auto-logout if expired
    async checkSessionValidity() {
        const user = await this.getCurrentUser();
        if (user && this.isSessionExpired()) {
            console.log('Session expired due to inactivity (30 days)');
            await this.signOut();
            return false;
        }
        return true;
    }
};

// Comment CRUD functions
window.comments = {
    // Create a new comment
    // 새 리뷰 작성 (user_id 자동 저장)
    async create(subject, difficulty, lectureStyle, engagingLevel, reason) {
        try {
            // Check if user is authenticated
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                console.error('User not authenticated');
                return { success: false, error: 'User not authenticated. Please login again.' };
            }

            console.log('Creating comment with data:', {
                subject, difficulty, lectureStyle, engagingLevel, reason, user_id: user.id
            });
            
            const { data, error } = await window.supabaseClient
                .from('comments')
                .insert([
                    {
                        subject: subject,
                        difficulty: difficulty,
                        lecture_style: lectureStyle,
                        engaging_level: engagingLevel,
                        reason: reason,
                        user_id: user.id
                    }
                ])
                .select();
            
            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            console.log('Comment created successfully:', data);
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Create comment error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get my comments only
    // 내 리뷰만 가져오기
    async getMyComments() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) {
                return { success: false, error: 'Not authenticated' };
            }

            console.log('Fetching my comments...');
            const { data, error } = await window.supabaseClient
                .from('comments')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            console.log('My comments fetched:', data?.length || 0);
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Get my comments error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get all comments (for public review list)
    // 전체 리뷰 가져오기 (공개용)
    async getAllPublic(subjectFilter = null) {
        try {
            console.log('📥 Fetching all public comments...');
            console.log('필터:', subjectFilter || '없음');
            
            let query = window.supabaseClient
                .from('comments')
                .select('*')
                .order('created_at', { ascending: false });
            
            // 과목 필터 적용
            if (subjectFilter) {
                query = query.eq('subject', subjectFilter);
            }
            
            const { data, error } = await query;
            
            if (error) {
                console.error('❌ Supabase 에러:', error);
                console.error('에러 코드:', error.code);
                console.error('에러 메시지:', error.message);
                console.error('에러 상세:', error.details);
                throw error;
            }
            
            console.log('✅ 전체 리뷰 조회 성공:', data?.length || 0, '개');
            if (data && data.length > 0) {
                console.log('첫 번째 리뷰 샘플:', data[0]);
            }
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('❌ getAllPublic 에러:', error);
            return { success: false, error: error.message };
        }
    },

    // Get all comments for current user (legacy - 기존 호환성 유지)
    async getAll() {
        try {
            console.log('Fetching comments for current user...');
            const { data, error } = await window.supabaseClient
                .from('comments')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            console.log('Comments fetched successfully:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Get comments error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update a comment
    async update(id, subject, difficulty, lectureStyle, engagingLevel, reason) {
        try {
            const { data, error } = await window.supabaseClient
                .from('comments')
                .update({
                    subject: subject,
                    difficulty: difficulty,
                    lecture_style: lectureStyle,
                    engaging_level: engagingLevel,
                    reason: reason
                })
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Update comment error:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete a comment
    async delete(id) {
        try {
            const { error } = await window.supabaseClient
                .from('comments')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete comment error:', error);
            return { success: false, error: error.message };
        }
    }
};