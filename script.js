'use strict';

document.addEventListener('DOMContentLoaded', function () {
	const botao = document.getElementById('meuBotao');
	const resultado = document.getElementById('resultado');
	if (botao && resultado) {
		botao.addEventListener('click', function () {
			resultado.textContent = 'Botão clicado!';
			botao.classList.toggle('ativo');
		});
	}

	// Controles de imagem do header
	const fileInput = document.getElementById('fileInput');
	const urlInput = document.getElementById('urlInput');
	const applyUrl = document.getElementById('applyUrl');
	const resetBtn = document.getElementById('resetBtn');
	const logoImg = document.getElementById('logoImg');
	const msg = document.getElementById('msg');

	// Limpa a logo (remove src)
	function resetLogo() {
		logoImg.removeAttribute('src');
		msg.textContent = 'Imagem removida.';
	}

	// Aplicar arquivo selecionado
	if (fileInput) {
		fileInput.addEventListener('change', function (e) {
			const file = e.target.files && e.target.files[0];
			if (!file) return;
			if (!file.type.startsWith('image/')) {
				msg.textContent = 'Por favor, selecione uma imagem.';
				return;
			}
			const url = URL.createObjectURL(file);
			logoImg.src = url;
			msg.textContent = 'Imagem carregada do arquivo.';
		});
	}

	// Aplicar URL informada
	if (applyUrl) {
		applyUrl.addEventListener('click', function () {
			const url = urlInput.value && urlInput.value.trim();
			if (!url) {
				msg.textContent = 'Cole uma URL válida.';
				return;
			}
			logoImg.src = url;
			msg.textContent = 'Imagem carregada da URL.';
		});
	}

	if (resetBtn) {
		resetBtn.addEventListener('click', resetLogo);
	}
});