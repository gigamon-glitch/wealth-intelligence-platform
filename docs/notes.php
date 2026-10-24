<?php
$selectedNote = isset($_GET['note']) && is_string($_GET['note']) ? $_GET['note'] : null;

if (!$selectedNote) {
    header("Location: /index.php");
    exit;
}

// Reject null bytes outright
if (strpos($selectedNote, "\0") !== false) {
    http_response_code(400);
    exit;
}

$appRoot = '/www/app';
$allowedDirs = [
    realpath($appRoot . '/rick_and_morty_notes'),
    realpath($appRoot . '/my_notes'),
];

// Accept relative paths (my_notes/x.md, ./my_notes/x.md) and absolute /www/app/... paths
$requested = $selectedNote;
if (strpos($requested, $appRoot . '/') === 0) {
    $requested = substr($requested, strlen($appRoot) + 1);
}
$file = realpath($appRoot . '/' . ltrim($requested, '/'));

$noteContent = null;
if ($file !== false && is_file($file) && pathinfo($file, PATHINFO_EXTENSION) === 'md') {
    foreach ($allowedDirs as $dir) {
        // realpath() has already resolved ../ and symlinks, so this prefix check is reliable
        if ($dir !== false && strpos($file, $dir . DIRECTORY_SEPARATOR) === 0) {
            $noteContent = file_get_contents($file);
            break;
        }
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
