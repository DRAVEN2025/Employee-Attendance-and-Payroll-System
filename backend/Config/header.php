<?php
 // Allow requests from your React app (localhost:5173)
 header("Access-Control-Allow-Origin: http://localhost:5173");
 header("Access-Control-Allow-Credentials: true");
 header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
 header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

 // Handle preflight requests (OPTIONS)
 if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
     http_response_code(200);
     exit();
 }
 ?>