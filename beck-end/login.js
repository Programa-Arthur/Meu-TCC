import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const directory = resolve(fileURLToPath(new URL('.', import.meta.url)));
const frontendDirectory = resolve(directory, '../fron-end');
const credentialsPath = join(directory, 'atlas-credentials.env');
const port = Number(process.env.PORT || 3000);

function loadEnvironment(path) {
  const entries = readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
    .map((line) => {
      const separator = line.indexOf('=');
      return [line.slice(0, separator), line.slice(separator + 1).replace(/^['"]|['"]$/g, '')];
    });

  return Object.fromEntries(entries);
}

const environment = loadEnvironment(credentialsPath);
if (!environment.MONGODB_URI) {
  throw new Error('Defina MONGODB_URI em atlas-credentials.env antes de iniciar o servidor.');
}

const client = new MongoClient(environment.MONGODB_URI);
const database = client.db(environment.MONGODB_DATABASE || 'sample_mflix');
const users = database.collection(environment.MONGODB_USERS_COLLECTION || 'expert_users');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readJsonBody(request) {
  return new Promise((resolveBody, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 10_000) reject(new Error('O corpo da requisição é muito grande.'));
    });
    request.on('end', () => {
      try {
        resolveBody(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Envie os dados de login em JSON válido.'));
      }
    });
    request.on('error', reject);
  });
}

function passwordMatches(password, passwordHash) {
  if (passwordHash?.startsWith('scrypt$')) {
    const [, salt, storedHash] = passwordHash.split('$');
    if (!salt || !storedHash) return false;

    const expected = Buffer.from(storedHash, 'hex');
    const actual = scryptSync(password, salt, 64);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  // Compatibilidade para contas criadas pela versão anterior do projeto.
  if (passwordHash?.startsWith('sha256$')) {
    const expected = Buffer.from(passwordHash.slice('sha256$'.length), 'hex');
    const actual = Buffer.from(createHash('sha256').update(password).digest('hex'), 'hex');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  return false;
}

function createPasswordHash(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return 'scrypt$' + salt + '$' + hash;
}

function escapeRegExp(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

async function login(request, response) {
  try {
    const { email, password } = await readJsonBody(request);
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return sendJson(response, 400, { sucesso: false, mensagem: 'Informe e-mail e senha.' });
    }

    const user = await users.findOne(
      { email: { $regex: '^' + escapeRegExp(email.trim()) + '$', $options: 'i' } },
      { projection: { name: 1, email: 1, passwordHash: 1 } },
    );

    if (!user || !passwordMatches(password, user.passwordHash)) {
      return sendJson(response, 401, { sucesso: false, mensagem: 'E-mail ou senha inválidos.' });
    }

    return sendJson(response, 200, {
      sucesso: true,
      usuario: { nome: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Falha no login:', error.message);
    return sendJson(response, 500, { sucesso: false, mensagem: 'Não foi possível validar o acesso agora.' });
  }
}

async function register(request, response) {
  try {
    const { name, email, password } = await readJsonBody(request);
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedName = typeof name === 'string' ? name.trim() : '';

    if (!normalizedName || !normalizedEmail || typeof password !== 'string') {
      return sendJson(response, 400, { sucesso: false, mensagem: 'Informe nome, e-mail e senha.' });
    }
    if (password.length < 8) {
      return sendJson(response, 400, { sucesso: false, mensagem: 'A senha deve ter pelo menos 8 caracteres.' });
    }

    const existingUser = await users.findOne({ email: normalizedEmail }, { projection: { _id: 1 } });
    if (existingUser) {
      return sendJson(response, 409, { sucesso: false, mensagem: 'Já existe uma conta com este e-mail.' });
    }

    await users.insertOne({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: createPasswordHash(password),
      createdAt: new Date(),
    });

    return sendJson(response, 201, {
      sucesso: true,
      mensagem: 'Conta criada. Agora você já pode entrar.',
    });
  } catch (error) {
    console.error('Falha no cadastro:', error.message);
    return sendJson(response, 500, { sucesso: false, mensagem: 'Não foi possível criar a conta agora.' });
  }
}

async function sendFile(response, filePath) {
  try {
    const content = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream' });
    response.end(content);
  } catch {
    sendJson(response, 404, { mensagem: 'Arquivo não encontrado.' });
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://' + (request.headers.host || 'localhost'));

  if (request.method === 'POST' && url.pathname === '/api/login') {
    return login(request, response);
  }
  if (request.method === 'POST' && url.pathname === '/api/register') {
    return register(request, response);
  }
  if (request.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(response, 200, { status: 'ok' });
  }
  if (request.method !== 'GET') {
    return sendJson(response, 405, { mensagem: 'Método não permitido.' });
  }
  const relativePath = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const filePath = resolve(frontendDirectory, normalize(relativePath));
  if (!filePath.startsWith(frontendDirectory + '/')) {
    return sendJson(response, 403, { mensagem: 'Acesso não permitido.' });
  }
  return sendFile(response, filePath);
});

await client.connect();
await users.createIndex({ email: 1 }, { unique: true });
server.listen(port, () => {
  console.log('Plataforma ExpeRT disponível em http://localhost:' + port);
});

async function shutdown() {
  await client.close();
  server.close();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
