<?php
// Pedagogical note: credentials come from the environment — never hardcode
// them in source (hardcoded credentials are flagged as CWE-798).
$host = getenv("DB_HOST") ?: "localhost";
$db   = getenv("DB_NAME") ?: "test";
$user = getenv("DB_USER") ?: "";
$pass = getenv("DB_PASS") ?: "";

try {
    $pdo = new PDO("mysql:host={$host};dbname={$db}", $user, $pass);
    $stmt = $pdo->prepare("SELECT * FROM users WHERE active = ?");
    $stmt->execute([1]);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Log a generic message; never echo raw exception output to users.
    error_log("Database error");
}
?>
