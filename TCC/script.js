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

// Gerenciamento de intervalos por sensor para permitir start/pause/restart
const pollingIntervals = {}; // { sensorName: intervalId }

function startSensorPolling(sensor, elementId, interval){
    // se já existir, não criar outro
    if (pollingIntervals[sensor]) return;
    pollingIntervals[sensor] = startPolling(sensor, elementId, interval);
}

function stopSensorPolling(sensor){
    const id = pollingIntervals[sensor];
    if (id){
        clearInterval(id);
        delete pollingIntervals[sensor];
    }
}

function restartSensorPolling(sensor, elementId, interval){
    stopSensorPolling(sensor);
    // pequena espera para garantir limpeza
    setTimeout(()=> startSensorPolling(sensor, elementId, interval), 100);
}

// Adiciona listeners para os botões de controle presentes nas páginas de ferramenta
document.addEventListener('click', (e)=>{
    // tratar o botão de voltar presente dentro da div (classe .back-arrow)
    const backBtn = e.target.closest('.back-arrow');
    if (backBtn){
        if (window.history.length > 1){
            window.history.back();
        } else {
            // fallback para a página inicial caso não haja histórico
            window.location.href = '../index.html';
        }
        return;
    }

    const btn = e.target.closest('.btn-control');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const sensor = btn.getAttribute('data-sensor');

    if (action === 'back'){
        // volta para a página anterior com fallback
        if (window.history.length > 1){
            window.history.back();
        } else {
            window.location.href = '../index.html';
        }
        return;
    }
    if (!sensor) return;

    // mapear sensor para id do elemento e intervalo padrão
    const sensorConfig = {
        'luminosidade': { id: 'valor-luminosidade', interval: 1200 },
        'distancia': { id: 'valor-distancia', interval: 900 },
        'temperatura': { id: 'valor-temperatura', interval: 1500 },
        'frequencia': { id: 'valor-frequencia', interval: 800 }
    };
    const cfg = sensorConfig[sensor] || sensorConfig[resolveSensorName(sensor)];
    if (!cfg) return;

    if (action === 'start'){
        startSensorPolling(sensor, cfg.id, cfg.interval);
        btn.classList.add('ativo');
    } else if (action === 'pause'){
        stopSensorPolling(sensor);
        btn.classList.remove('ativo');
    } else if (action === 'restart'){
        restartSensorPolling(sensor, cfg.id, cfg.interval);
        btn.classList.add('ativo');
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