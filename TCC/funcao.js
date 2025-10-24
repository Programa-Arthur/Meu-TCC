window.onload = function() {
    // Logo no canto superior esquerdo
    var logoContainer = document.getElementById('logo-container');
    if (logoContainer) {
        logoContainer.style.position = 'absolute';
        logoContainer.style.top = '20px';
        logoContainer.style.left = '40px';
    }
    // Botões no canto superior direito
    var headerButtons = document.getElementById('header-buttons');
    if (headerButtons) {
        headerButtons.style.position = 'absolute';
        headerButtons.style.top = '20px';
        headerButtons.style.right = '40px';
        headerButtons.style.display = 'flex';
        headerButtons.style.gap = '10px';
    }
    // Estilos para o conteúdo principal
    var mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.background = '#3e57c7';
        mainContent.style.width = '80%';
        mainContent.style.margin = '40px auto';
        mainContent.style.padding = '30px';
        mainContent.style.borderRadius = '10px';
        mainContent.style.color = '#fff';
        mainContent.style.textAlign = 'center';
    }
};