document.addEventListener('DOMContentLoaded', function() {
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
});