const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve arquivos estáticos do diretório pai (projeto TCC)
const projectRoot = path.join(__dirname, '..');
app.use(express.static(projectRoot));

// Alias de nomes conhecidos
const sensorFileMap = {
	'luminosidade': 'luminosidade.html',
	'distancia': 'diastancia.html', // arquivo existente usa "diastancia.html"
	'diastancia': 'diastancia.html',
	'temperatura': 'temperatura.html',
	'frequencia': 'frequencia.html',
};

// Rota para servir a página da ferramenta por nome de sensor
app.get('/sensor/:name', (req, res) => {
	const name = req.params.name.toLowerCase();
	const file = sensorFileMap[name];
	if (file) {
		return res.sendFile(path.join(projectRoot, 'feramentas', file));
	}
	res.status(404).send('Ferramenta não encontrada');
});

// Endpoints API que retornam valores simulados (integre com Arduino/serial conforme necessário)
app.get('/api/:sensor', (req, res) => {
	const sensor = req.params.sensor.toLowerCase();
	let value;
	switch (sensor) {
		case 'luminosidade':
			value = Math.round(Math.random() * 1000); // lux simulado
			break;
		case 'distancia':
		case 'diastancia':
			value = (Math.random() * 400).toFixed(1); // cm simulado
			break;
		case 'temperatura':
			value = (20 + Math.random() * 15).toFixed(1); // °C simulado
			break;
		case 'frequencia':
			value = (50 + Math.random() * 10).toFixed(2); // Hz simulado
			break;
		default:
			return res.status(404).json({ error: 'Sensor desconhecido' });
	}
	return res.json({ sensor, value, ts: Date.now() });
});

app.listen(PORT, () => {
	console.log(`Servidor iniciado em http://localhost:${PORT}`);
});