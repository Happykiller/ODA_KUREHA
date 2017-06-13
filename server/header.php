<?php
namespace Oda;

header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Credentials: true"); 
header('Access-Control-Allow-Headers: X-Requested-With');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    die();
}

///////////////////
// Gestion d'env
///////////////////
ini_set('max_execution_time', 0); // Aucune limite d'execution

// Désactiver le rapport d'erreurs -1 (tout) ou 0(rien)
error_reporting(-1);
//error_reporting(E_ERROR | E_PARSE);

//les erreurs sont converties en exceptions
//set_error_handler('exceptions_error_handler');

//Config var_dump
ini_set('xdebug.var_display_max_depth', -1);
ini_set('xdebug.var_display_max_children', -1);
ini_set('xdebug.var_display_max_data', -1);