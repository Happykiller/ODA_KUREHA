<?php
/**
 * Created by PhpStorm.
 * User: HAPPYBONITA
 * Date: 26/04/2016
 * Time: 13:34
 */

class EntityInterfaceTest extends \PHPUnit_Framework_TestCase {
    public function testGetStringBetween() {
        $v_test = Oda\OdaLib::get_string_between("01234", "1", "3");
        $this->assertEquals($v_test, "2");
    }
}