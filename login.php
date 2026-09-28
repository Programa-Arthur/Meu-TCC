<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

// 1. Configurações de conexão ao MySQL
$host = getenv('DB_HOST') ?: 'localhost';
$db   = getenv('DB_NAME') ?: 'expert_platform';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASSWORD') ?: '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    http_response_code(503);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Não foi possível conectar ao banco. Confira as configurações e importe schema.sql.']);
    exit;
}

// 2. Recebe os dados JSON enviados pelo HTML/JavaScript
$dados = json_decode(file_get_contents('php://input'), true);
if (!is_array($dados)) {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Requisição inválida.']);
    exit;
}

$email = $dados['email'] ?? '';
$senha = $dados['password'] ?? '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $senha === '') {
    http_response_code(400);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha todos os campos.']);
    exit;
}

// 3. Consulta o utilizador no banco de dados MySQL
$stmt = $pdo->prepare("SELECT u.id, u.nome, u.email, u.senha_hash, r.nome AS role FROM usuarios u JOIN roles r ON u.role_id = r.id WHERE u.email = :email AND u.status = 'ativo'");
$stmt->execute(['email' => $email]);
$usuario = $stmt->fetch();

if ($usuario && password_verify($senha, $usuario['senha_hash'])) {
    // Registra o log de acesso no MySQL
    $logStmt = $pdo->prepare("INSERT INTO logs_acesso (usuario_id, ip_origem) VALUES (:id, :ip)");
    $logStmt->execute([
        'id' => $usuario['id'],
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'desconhecido'
    ]);

    // Retorna resposta positiva para o HTML
    echo json_encode([
        'sucesso' => true,
        'usuario' => [
            'id' => $usuario['id'],
            'nome' => $usuario['nome'],
            'role' => $usuario['role']
        ]
    ]);
} else {
    echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail ou senha incorretos.']);
}