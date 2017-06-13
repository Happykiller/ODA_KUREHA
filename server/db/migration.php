<?php
namespace Oda;

require '../vendor/autoload.php';
require '../config/config.php';

use \stdClass;

// php migration.php --auto
// php migration.php --target=000-install --partial=001-migration --option=do
// php migration.php --target=001-reworkModel

$shortopts  = "";

$longopts  = array(
    "auto::",
    "target::",
    "partial::",
    "option::",
    "checkDb::"
);
$options = getopt($shortopts, $longopts);

$OdaMigration = new OdaMigration($options);

$OdaMigration->migrate();