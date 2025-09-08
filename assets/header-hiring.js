document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mobileMenu = document.getElementById('mobileMenu');
    const headerContainer = document.querySelector('.header_container');
    
    if (hamburgerMenu && mobileMenu) {
        hamburgerMenu.addEventListener('click', function() {
            // Toggle das classes active
            hamburgerMenu.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            if (headerContainer) {
                headerContainer.classList.toggle('menu-open');
                // Refresh aria-expanded
                const isExpanded = hamburgerMenu.classList.contains('active');
                hamburgerMenu.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
            }
        });
        
        // Fechar menu ao clicar fora dele
        document.addEventListener('click', function(event) {
            if (!hamburgerMenu.contains(event.target) && !mobileMenu.contains(event.target)) {
                hamburgerMenu.classList.remove('active');
                mobileMenu.classList.remove('active');
                if (headerContainer) {
                    headerContainer.classList.remove('menu-open');
                    hamburgerMenu.setAttribute('aria-expanded', 'false');
                }
            }
        });
        
        // Fechar menu ao redimensionar a tela para desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                hamburgerMenu.classList.remove('active');
                mobileMenu.classList.remove('active');
                if (headerContainer) {
                    headerContainer.classList.remove('menu-open');
                    hamburgerMenu.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }
});
