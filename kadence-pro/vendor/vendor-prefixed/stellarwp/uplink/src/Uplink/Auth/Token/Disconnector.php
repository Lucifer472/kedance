<?php
/**
 * @license GPL-2.0-or-later
 *
 * Modified by kadencewp on 18-December-2023 using Strauss.
 * @see https://github.com/BrianHenryIE/strauss
 */ declare( strict_types=1 );

namespace KadenceWP\KadencePro\StellarWP\Uplink\Auth\Token;

use KadenceWP\KadencePro\StellarWP\Uplink\Resources\Collection;

final class Disconnector {

	/**
	 * @var Token_Factory
	 */
	private $token_manager_factory;

	/**
	 * @var Collection
	 */
	private $resources;

	/**
	 * @param  Token_Factory  $token_manager_factory  The Token Manager Factory.
	 * @param  Collection  $resources  The resources collection.
	 */
	public function __construct(
		Token_Factory $token_manager_factory,
		Collection $resources
	) {
		$this->token_manager_factory = $token_manager_factory;
		$this->resources             = $resources;
	}

	/**
	 * Delete a token if the current user is allowed to.
	 *
	 * @param  string  $slug  The plugin or service slug.
	 */
	public function disconnect( string $slug ): bool {
		$plugin = $this->resources->offsetGet( $slug );

		if ( ! $plugin ) {
			return false;
		}

		return $this->token_manager_factory->make( $plugin )->delete();
	}

}
