
const SUPABASE_URL = 'https://ikpirfqborizdbgnhqdy.supabase.co'
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcGlyZnFib3JpemRiZ25ocWR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjgzMjQsImV4cCI6MjA3MjcwNDMyNH0.izr4SU9UzcY_p6WeTq63AIGyJQcebDi8ORuNA8wWmLY"

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Authentication functions
window.auth = {
    // Sign up with email and password
    async signUp(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password,
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
    }
};

// Comment CRUD functions
window.comments = {
    // Create a new comment
    async create(subject, difficulty, lectureStyle, engagingLevel, reason) {
        try {
            const { data, error } = await window.supabaseClient
                .from('comments')
                .insert([
                    {
                        subject: subject,
                        difficulty: difficulty,
                        lecture_style: lectureStyle,
                        engaging_level: engagingLevel,
                        reason: reason
                    }
                ])
                .select();
            
            if (error) throw error;
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Create comment error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get all comments for current user
    async getAll() {
        try {
            const { data, error } = await window.supabaseClient
                .from('comments')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
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