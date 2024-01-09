<?php
/**
 * @license GPL-2.0-or-later
 *
 * Modified by kadencewp on 18-December-2023 using Strauss.
 * @see https://github.com/BrianHenryIE/strauss
 */

namespace KadenceWP\KadencePro\StellarWP\Uplink\Contracts;

use KadenceWP\KadencePro\StellarWP\ContainerContract\ContainerInterface;
use KadenceWP\KadencePro\StellarWP\Uplink\Config;

abstract class Abstract_Provider implements Provider_Interface {

	/**
	 * @var ContainerInterface
	 */
	protected $container;

	/**
	 * Constructor for the class.
	 *
	 * @param ContainerInterface $container
	 */
	public function __construct( $container = null ) {
		$this->container = $container ?: Config::get_container();
	}

}
