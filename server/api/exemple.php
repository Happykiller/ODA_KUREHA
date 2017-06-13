<?php
namespace Project;

require '../header.php';
require '../vendor/autoload.php';
require '../config/config.php';

use \stdClass, \Oda\SimpleObject\OdaPrepareInterface, \Oda\SimpleObject\OdaPrepareReqSql, \Oda\OdaLibBd;

//--------------------------------------------------------------------------
//Build the interface
$params = new OdaPrepareInterface();
$params->arrayInput = array("param_name");
$INTERFACE = new ProjectInterface($params);

//--------------------------------------------------------------------------
// api/exemple.php?milis=123450&ctrl=ok&param_name=nom_site

//--------------------------------------------------------------------------
//EXEMPLE SELECT 1 ROW
$params = new OdaPrepareReqSql();
$params->sql = "SELECT *
    FROM `api_tab_parametres` a
    WHERE 1=1
    AND a.`param_name` = :param_name
;";
$params->bindsValue = [
    "param_name" => $INTERFACE->inputs["param_name"]
];
$params->typeSQL = OdaLibBd::SQL_GET_ONE;
$retour = $INTERFACE->BD_ENGINE->reqODASQL($params);

$params = new stdClass();
$params->label = "resultat_get_one";
$params->retourSql = $retour;
$INTERFACE->addDataReqSQL($params);

//--------------------------------------------------------------------------
//EXEMPLE SELECT N ROWS
$params = new OdaPrepareReqSql();
$params->sql = "SELECT *
    FROM `api_tab_parametres` a
    WHERE 1=1
;";
$params->typeSQL = OdaLibBd::SQL_GET_ALL;
$retour = $INTERFACE->BD_ENGINE->reqODASQL($params);

$params = new stdClass();
$params->label = "resultat_get_all";
$params->retourSql = $retour;
$INTERFACE->addDataReqSQL($params);

//--------------------------------------------------------------------------
//EXEMPLE CLASS
class objRetour {
    public $id;
    public $param_name;
    public $param_type;
    public $param_value;
    public function getHello(){
       return "Hello : " . $this->param_name;
    }
}

$params = new OdaPrepareReqSql();
$params->sql = "SELECT *
    FROM `api_tab_parametres` a
    WHERE 1=1
    AND a.`param_name` = :param_name
;";
$params->bindsValue = [
    "param_name" => [ "value" => "nom_site", "type" => \PDO::PARAM_STR ]
];
$params->typeSQL = OdaLibBd::SQL_GET_ONE;
$params->className = "\Oda\objRetour";
$retour = $INTERFACE->BD_ENGINE->reqODASQL($params);

$params = new stdClass();
$params->label = "resultat_class";
$params->value = $retour->data->getHello();
$INTERFACE->addDataStr($params);

//--------------------------------------------------------------------------
//EXEMPLE EXEC
$params = new OdaPrepareReqSql();
$params->sql = "CREATE TEMPORARY TABLE coucou (
    `idElem` int(11) NOT NULL,
    `nature` varchar(100),
    PRIMARY KEY(`idElem`)
)
    SELECT a.`id` as 'idElem', a.`param_name` as 'nature' FROM `api_tab_parametres` a
;";
$params->typeSQL = OdaLibBd::SQL_SCRIPT;
$retour = $INTERFACE->BD_ENGINE->reqODASQL($params);

$params = new \stdClass();
$params->label = "resultat_exec";
$params->value = $retour->nombre;
$INTERFACE->addDataStr($params);

//--------------------------------------------------------------------------
//EXEMPLE INSERT 1 DATA
$params = new OdaPrepareReqSql();
$params->sql = "INSERT INTO  `coucou` (
        `idElem` ,
        `nature` 
    )
    VALUES (
        99 ,  :nature
    )
;";
$params->bindsValue = [
    "nature" => [ "value" => "coucou"]
];
$params->typeSQL = OdaLibBd::SQL_INSERT_ONE;
$retour = $INTERFACE->BD_ENGINE->reqODASQL($params);

$params = new stdClass();
$params->label = "resultat_insert";
$params->value = $retour->data;
$INTERFACE->addDataStr($params);

//--------------------------------------------------------------------------
//EXEMPLE UPDATE
$params = new OdaPrepareReqSql();
$params->sql = "UPDATE `coucou`
    SET `nature` = 'hello'
    WHERE 1=1
    AND `idElem` = 99
;";
$params->typeSQL = OdaLibBd::SQL_SCRIPT;
$params->debug = true;
$retour = $INTERFACE->BD_ENGINE->reqODASQL($params);

$params = new stdClass();
$params->label = "resultat_update";
$params->value = $retour->nombre;
$INTERFACE->addDataStr($params);