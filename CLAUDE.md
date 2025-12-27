# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development Server
```bash
# Start local development server on port 8000
./serve.sh
# OR directly with Python
python3 -m http.server 8000
```

The application is a **static website** - no build process or package management required. Simply open the HTML files in a browser or serve via HTTP.

### File Structure Access
```bash
# Open the main entry point
open index.html
# Or serve locally and visit http://localhost:8000
```

## High-Level Architecture

### Technology Stack
- **Frontend**: Pure HTML, CSS, JavaScript (ES6+)
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth with email/password
- **Deployment**: Static site hosting (no server required)

### Core Application Structure

**Main Pages:**
- `index.html` - Landing/welcome page with authentication state
- `login.html` - User authentication (login)
- `signup.html` - User registration
- `subjects.html` - Subject rating form (authenticated users only)
- `reviews.html` - Review browsing with tabs (all reviews vs my reviews)

**Key JavaScript Modules:**
- `static/main.js` - Global app logic, authentication state, UI management
- `static/db.js` - Supabase client setup and database operations
- `static/styles.css` - Complete styling system with CSS custom properties

### Data Architecture

**Supabase Database Schema:**
- `comments` table with columns:
  - `id` (UUID primary key)
  - `subject` (text) - Subject name from predefined list
  - `difficulty` (integer 1-5) - Difficulty rating
  - `lecture_style` (integer 1-5) - Lecture style rating
  - `engaging_level` (integer 1-5) - Engagement rating
  - `reason` (text) - Free-form review text
  - `grade` (integer) - Student grade level (6, 7, or 8)
  - `user_id` (UUID) - Foreign key to auth.users
  - `created_at` (timestamp)

### Authentication Flow
1. Users sign up/login via Supabase Auth
2. Session persistence in localStorage with 30-day timeout
3. Activity tracking prevents automatic logout on user interaction
4. All database operations scoped to authenticated user

### Subject Rating System
**Available Subjects:**
- Math, Science, English and Literature, Individuals and Societies
- Design, Chinese, Korean, Spanish
- Strings, Piano & Guitar, Vocal music, Media Arts

**Grade Levels:**
- 6학년 (Grade 6) - Blue themed
- 7학년 (Grade 7) - Green themed
- 8학년 (Grade 8) - Purple themed

**Rating Categories:** Each subject rated 1-5 stars on:
- Difficulty level
- Lecture style quality
- Engagement level

### Security Notes
- Database credentials are exposed in `static/db.js` (Supabase public key)
- Row Level Security (RLS) should be configured in Supabase
- All user data operations filtered by authenticated user_id

## Development Patterns

### State Management
- Global variables in `main.js` for current user and app state
- Authentication state managed through Supabase client callbacks
- UI updates through direct DOM manipulation

### Error Handling
- All async operations wrapped in try/catch with user-friendly messages
- Console logging for debugging with Korean/English mixed messages
- Validation on form submissions before database operations

### UI Patterns
- CSS custom properties for consistent theming
- Mobile-responsive design with CSS Grid/Flexbox
- Tab-based navigation in reviews page
- Custom dropdown components for subject selection

## Common Development Tasks

When modifying the rating system:
1. Update subject list in both `subjects.html` dropdown and `reviews.html` SUBJECTS array
2. Ensure consistent subject naming between database and UI
3. Test authentication flow after changes to auth state management
4. Grade selection is required before subject selection in `subjects.html`
5. Review filters support both subject and grade filtering in `reviews.html`

When adding new features:
1. Check Supabase RLS policies for new database operations
2. Update both mobile and desktop responsive breakpoints
3. Maintain Korean/English bilingual support in UI messages