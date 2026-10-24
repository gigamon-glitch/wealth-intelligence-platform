<?php
$selectedNote = isset($_GET['note']) && is_string($_GET['note']) ? $_GET['note'] : null;

if (!$selectedNote) {
    header("Location: /index.php");
    exit;
}

// Only allow files inside the two known note directories
$allowedDirs = [
    'rick_and_morty_notes' => '/www/app/rick_and_morty_notes',
    'my_notes'             => '/www/app/my_notes',
];

$noteContent = null;
$parts = explode('/', $selectedNote);

if (count($parts) === 2 && isset($allowedDirs[$parts[0]])) {
    $baseDir = realpath($allowedDirs[$parts[0]]);
    $file    = realpath($baseDir . '/' . basename($parts[1]));

    // Must resolve inside the base dir, be a regular file, and be a .md note
    if ($file !== false
        && strpos($file, $baseDir . DIRECTORY_SEPARATOR) === 0
        && is_file($file)
        && pathinfo($file, PATHINFO_EXTENSION) === 'md') {
        $noteContent = file_get_contents($file);
    }
}

if ($noteContent === null) {
    http_response_code(404);
    $noteContent = 'Note not found.';
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rick's Research Log</title>
    <link rel="stylesheet" href="css/bootstrap-5.3.3.min.css">
    <link rel="stylesheet" href="css/index.css">
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

</head>
<body class="portal-bg text-green-400">
<div class="container py-5">
    <header class="flex items-center justify-between mb-8 p-4 sci-fi-panel rounded-lg">
          <div class="flex items-center space-x-4">
            <!-- Brain icon from Lucide -->
            <i data-lucide="brain" class="w-10 h-10"></i>
            <h1 class="text-3xl font-bold rick-font" id="header-title">Rick's Research Log</h1>
          </div>

    </header>

    <div class="row g-4">
        <?php include "navbar.php"; ?>

        <div class="col-md-8">
            <div class="sci-fi-panel p-4 rounded">
                <pre class="wrapped-text">
                <?= htmlspecialchars($noteContent, ENT_QUOTES, 'UTF-8') ?>
                </pre>
            </div>
        </div>
    </div>
</div>
<script>
lucide.createIcons();
</script>
</body>
</html>
