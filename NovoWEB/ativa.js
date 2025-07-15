// script.js
function expandir(botao) {
    botao.querySelector('.conteudo-js').style.display = 'block';
    botao.style.height = '200px';
}

function recolher(botao) {
    botao.querySelector('.conteudo-js').style.display = 'none';
    botao.style.height = '50px';
}

// Adiciona eventos aos botões após o carregamento da página
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.botao-js').forEach(botao => {
        botao.addEventListener('mouseenter', () => expandir(botao));
        botao.addEventListener('mouseleave', () => recolher(botao));
    });
});