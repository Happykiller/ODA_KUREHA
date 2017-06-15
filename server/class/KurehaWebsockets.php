<?php
namespace Kureha;

use \stdClass,
    \Oda\OdaWebsockets,
    \Oda\OdaLib,
    Ratchet\MessageComponentInterface,
    Ratchet\ConnectionInterface
;
/**
 * @author  Fabrice Rosito <rosito.fabrice@gmail.com>
 * @version 0.170612
 */

/**
 * protected var $this->clients
 * abstract public function onOpenPublic(ConnectionInterface $conn);
 * abstract public function onMessagePublic(ConnectionInterface $from, $msg);
 * abstract public function onClosePublic(ConnectionInterface $conn);
 * abstract public function onErrorPublic(ConnectionInterface $conn, Exception $e);
 */

class KurehaWebsockets extends OdaWebsockets {

    function __construct() {
        parent::__construct();
        $this->debug=true;
    }

    public function onOpenPublic(ConnectionInterface $conn) {
    }

    public function onMessagePublic(ConnectionInterface $from, $msg) {
        $jsonStr = str_replace("odaTagJson:", "", $msg);
        $json = json_decode($jsonStr);
        if($json->{'messageType'} === 'NEW_CONNECTION'){
            $from->userCode = $json->{'userCode'};
            $from->userId = $json->{'userId'};
        }
        $numRecv = count($this->clients) - 1;
    }

    public function onClosePublic(ConnectionInterface $conn) {
        $str = 'odaTagJson:{"messageType":"CLOSE_CONNECTION","userCode":"'.$conn->userCode.'","userId":"'.$conn->userId.'"}';
        foreach ($this->clients as $client) {
            if ($conn !== $client) {
                OdaLib::traceLog($str);
                // The sender is not the receiver, send to each client connected
                $client->send($str);
            }
        }
    }

    public function onErrorPublic(ConnectionInterface $conn, Exception $e) {
    }
}