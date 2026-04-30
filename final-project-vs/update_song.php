<?php
// update_song.php - PHP script to insert or update a song in the database

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Database configuration
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'final_ai'; // Adjust this to your database name

// Connect to database
$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

$title = trim($input['title'] ?? '');
$artist = trim($input['artist'] ?? '');
$listens = intval($input['listens'] ?? 0);
$description = trim($input['description'] ?? '');

// Validate input
if (empty($title) || empty($artist) || $listens <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Title, artist, and positive listens count are required']);
    exit;
}

if ($listens > 10000000) {
    $listens = 10000000; // Cap at max
}

// Check if song already exists (by title and artist)
$stmt = $conn->prepare("SELECT id FROM songs WHERE title = ? AND artist = ?");
$stmt->bind_param("ss", $title, $artist);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // Update existing song
    $row = $result->fetch_assoc();
    $id = $row['id'];
    $updateStmt = $conn->prepare("UPDATE songs SET listens = listens + ? WHERE id = ?");
    $updateStmt->bind_param("ii", $listens, $id);
    if ($updateStmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Song listens updated', 'id' => $id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update song: ' . $updateStmt->error]);
    }
    $updateStmt->close();
} else {
    // Insert new song
    $insertStmt = $conn->prepare("INSERT INTO songs (title, artist, listens) VALUES (?, ?, ?)");
    $insertStmt->bind_param("ssi", $title, $artist, $listens);
    if ($insertStmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Song added', 'id' => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add song: ' . $insertStmt->error]);
    }
    $insertStmt->close();
}

$stmt->close();
$conn->close();
?>