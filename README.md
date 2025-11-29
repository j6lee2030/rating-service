# CI Rating Service - Static Website

A static website for rating subjects and facilities at CI (Canadian International School).

## Features Fixed

✅ **Removed random 'facilities' button** from login page  
✅ **Fixed subjects display** - subjects are now properly listed in dropdown  
✅ **Made grade list visible** - grade menu now works properly  
✅ **Converted to static website** - no Python/Flask dependencies required  

## How to Use

1. Open `templates/index.html` in your web browser
2. Navigate through the pages:
   - **Home**: Welcome page with login button
   - **Login**: User login form
   - **Subjects**: Subject rating system with dropdown selection

## File Structure

```
rating-service/
├── templates/
│   ├── index.html          # Home page
│   ├── login.html          # Login page  
│   ├── subjects.html       # Subjects rating page
│   └── menu.html           # Grade menu (included in other pages)
├── static/
│   ├── bg.jpg              # Background image
│   ├── logo.jpg            # CI logo
│   ├── subjects.jpg        # Subjects page background
│   ├── facilities.jpg      # Facilities image
│   ├── styles.css          # External stylesheet
│   └── main.js             # JavaScript functionality
└── README.md
```

## Features

- **Subject Rating System**: Rate subjects on difficulty, lecture style, and engagement
- **Grade Selection**: Interactive grade menu (Grade 6, 7, 8)
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional design with smooth animations

## Technical Details

- Pure HTML, CSS, and JavaScript
- No server-side dependencies
- All assets are self-contained
- Compatible with any web server or local file system

https://chadwick.managebac.com/student/portfolio