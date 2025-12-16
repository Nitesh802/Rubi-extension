<?php
defined('MOODLE_INTERNAL') || die();

$functions = array(
    'local_rubi_ai_admin_get_org_config' => array(
        'classname'   => 'local_rubi_ai_admin\external\config_service',
        'methodname'  => 'get_org_config',
        'description' => 'Get organization configuration for Rubi AI',
        'type'        => 'read',
        'ajax'        => true,
        'services'    => array('rubi_ai_service'),
        'capabilities' => '',
        'loginrequired' => false
    ),
    'local_rubi_ai_admin_get_identity' => array(
        'classname'   => 'local_rubi_ai_admin\external\identity_service',
        'methodname'  => 'get_identity',
        'description' => 'Get user identity for Rubi AI',
        'type'        => 'read',
        'ajax'        => true,
        'services'    => array('rubi_ai_service'),
        'capabilities' => '',
        'loginrequired' => false
    ),
    'local_rubi_ai_admin_validate_session' => array(
        'classname'   => 'local_rubi_ai_admin\external\identity_service',
        'methodname'  => 'validate_session',
        'description' => 'Validate user session for Rubi AI',
        'type'        => 'read',
        'ajax'        => true,
        'services'    => array('rubi_ai_service'),
        'capabilities' => '',
        'loginrequired' => false
    )
);

$services = array(
    'Rubi AI Service' => array(
        'functions' => array(
            'local_rubi_ai_admin_get_org_config',
            'local_rubi_ai_admin_get_identity',
            'local_rubi_ai_admin_validate_session'
        ),
        'restrictedusers' => 0,
        'enabled' => 1,
        'shortname' => 'rubi_ai_service',
        'downloadfiles' => 0,
        'uploadfiles' => 0
    )
);