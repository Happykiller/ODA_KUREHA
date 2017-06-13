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
    public function onOpenPublic(ConnectionInterface $conn) {
        OdaLib::traceLog("New Kureha connection! ({$conn->resourceId})");
    }

    public function onMessagePublic(ConnectionInterface $from, $msg) {
        $numRecv = count($this->clients) - 1;
        OdaLib::traceLog(sprintf('Connection Kureha %d sending message "%s" to %d other connection%s', $from->resourceId, $msg, $numRecv, $numRecv == 1 ? '' : 's'));
    }

    public function onClosePublic(ConnectionInterface $conn) {
        OdaLib::traceLog("Connection Kureha {$conn->resourceId} has disconnected");
    }

    public function onErrorPublic(ConnectionInterface $conn, Exception $e) {
        OdaLib::traceLog("An error has occurred: id={$conn->resourceId}, {$e->getMessage()}");
    }
}