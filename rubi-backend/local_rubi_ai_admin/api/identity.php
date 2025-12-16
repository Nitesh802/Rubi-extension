<?php
require_once(__DIR__ . '/../../../config.php');
require_once($CFG->libdir . '/sessionlib.php');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: X-API-Token, Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$api_token = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
$expected_token = get_config('local_rubi_ai_admin', 'backend_api_token');

if (empty($api_token) || $api_token !== $expected_token) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized'
    ]);
    exit();
}

$sessionid = optional_param('session', '', PARAM_TEXT);

if (empty($sessionid)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Session ID required'
    ]);
    exit();
}

$session = $DB->get_record('sessions', ['sid' => $sessionid]);

if (!$session || $session->state !== 0) {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid or expired session'
    ]);
    exit();
}

$user = $DB->get_record('user', ['id' => $session->userid]);

if (!$user) {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'User not found'
    ]);
    exit();
}

$context = context_system::instance();
$roles = get_user_roles($context, $user->id);
$role_names = [];
$permissions = [];

foreach ($roles as $role) {
    $role_names[] = $role->shortname;
    $caps = get_role_capabilities($role->roleid);
    foreach ($caps as $cap) {
        if ($cap->permission > 0) {
            $permissions[] = $cap->capability;
        }
    }
}

$permissions = array_unique($permissions);

$orgid = get_config('local_rubi_ai_admin', 'default_org_id') ?: 'default';

$identity_secret = get_config('local_rubi_ai_admin', 'identity_jwt_secret');
if (empty($identity_secret)) {
    $identity_secret = 'default_jwt_secret';
}

$payload = [
    'sub' => strval($user->id),
    'email' => $user->email,
    'name' => fullname($user),
    'org' => $orgid,
    'roles' => $role_names,
    'permissions' => array_slice($permissions, 0, 10),
    'session' => $sessionid,
    'instance' => $CFG->wwwroot,
    'iat' => time(),
    'exp' => time() + 3600
];

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

$header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
$payload_json = json_encode($payload);

$base64_header = base64url_encode($header);
$base64_payload = base64url_encode($payload_json);

$signature = hash_hmac('sha256', $base64_header . '.' . $base64_payload, $identity_secret, true);
$base64_signature = base64url_encode($signature);

$jwt = $base64_header . '.' . $base64_payload . '.' . $base64_signature;

echo json_encode([
    'status' => 'success',
    'data' => [
        'userId' => strval($user->id),
        'email' => $user->email,
        'fullName' => fullname($user),
        'orgId' => $orgid,
        'roles' => $role_names,
        'permissions' => array_slice($permissions, 0, 10),
        'jwt' => $jwt
    ],
    'timestamp' => date('c')
]);