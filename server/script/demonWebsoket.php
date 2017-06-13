<?php
namespace Project;

use \stdClass,
    \How\HowWebsockets,
    \Oda\OdaWebsockets,
    \Ratchet\App,
    \Oda\SimpleObject\OdaConfig    
;

require '../vendor/autoload.php';
require '../config/config.php';

$config = OdaConfig::getInstance();

$app = new App($config->websocket->host, $config->websocket->port);
$app->route('/'.$config->websocket->instanceName, new ProjectWebsockets);
//WARNING A Unix philosophy is "everything is a file". This would mean if you had 1024 users currently connected to your WebSocket server 
// Help http://socketo.me/docs/deploy
$app->run();