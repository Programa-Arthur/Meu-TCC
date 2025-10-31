// Conectar ao servidor WebSocket
const ws = new WebSocket('ws://localhost:3000');
const connectionStatus = document.getElementById('connectionStatus');

// Atualizar status da conexão
ws.onopen = function() {
    connectionStatus.textContent = 'Conectado';
    connectionStatus.className = 'status-connected';
};

ws.onclose = function() {
    connectionStatus.textContent = 'Desconectado';
    connectionStatus.className = 'status-disconnected';
};

// Processar dados recebidos
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Dados recebidos via WebSocket:', data);
    // Atualizar os valores na interface
    document.getElementById('temperature').textContent = data.temperatura.toFixed(1);
    document.getElementById('distance').textContent = data.distancia.toFixed(1);
    document.getElementById('period').textContent = data.periodo.toFixed(1);
    document.getElementById('light').textContent = data.luminosidade.toFixed(1);
};

// Funções para buscar dados do servidor e atualizar as páginas de ferramenta.

const sensorAlias = {
	// aceitamos variações de nome que aparecem nos arquivos
	'diastancia': 'distancia',
	'distância': 'distancia',
};

function resolveSensorName(name){
	return sensorAlias[name] || name;
}

async function fetchSensorData(sensor){
	sensor = resolveSensorName(sensor);
	try {
		const res = await fetch(`/api/${sensor}`);
		if (!res.ok) throw new Error('Erro na resposta do servidor');
		return await res.json();
	} catch (err) {
		console.error('fetchSensorData:', err);
		return { error: true };
	}
}

function updateElementText(id, text){
	const el = document.getElementById(id);
	if (el) el.textContent = text;
}

function startPolling(sensor, elementId, interval = 1000){
	async function poll(){
		const data = await fetchSensorData(sensor);
		if (data && !data.error){
			const value = data.value !== undefined ? data.value : JSON.stringify(data);
			updateElementText(elementId, value);
		} else {
			updateElementText(elementId, '—');
		}
	}
	poll();
	return setInterval(poll, interval);
}

document.addEventListener('DOMContentLoaded', () => {
	// Detecta elementos nas páginas de ferramentas e inicia polling apropriado
	if (document.getElementById('valor-luminosidade')) {
		startPolling('luminosidade', 'valor-luminosidade', 1200);
	}
	if (document.getElementById('valor-distancia')) {
		// suporta 'diastancia' e 'distancia' no backend via alias
		startPolling('distancia', 'valor-distancia', 900);
	}
	if (document.getElementById('valor-temperatura')) {
		startPolling('temperatura', 'valor-temperatura', 1500);
	}
	if (document.getElementById('valor-frequencia')) {
		startPolling('frequencia', 'valor-frequencia', 800);
	}
});

// Enviar comando para o Arduino
async function sendCommand(command) {
    try {
        const response = await fetch(`/command/${command}`);
        const data = await response.text();
        console.log(data);
    } catch (error) {
        console.error('Erro:', error);
    }
}