<?php
/**
 * Class file to check for active license
 *
 * @package Kadence Plugins
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Load activation API.
require_once KADENCE_CONVERSIONS_PATH . 'kadence-classes/kadence-activation/class-kadence-plugin-api-manager.php';
if ( class_exists( 'Kadence_Plugin_API_Manager' ) ) {
	$kt_plugin_api = Kadence_Plugin_API_Manager::get_instance();
	$kt_plugin_api->add_product( 'kadence_conversions_activation', 'kt_api_manager_kadence_conversions_data', 'kadence_conversions', 'Kadence Conversions', KADENCE_CONVERSIONS_VERSION );
	if ( is_multisite() ) {
		$show_local_activation = apply_filters( 'kadence_activation_individual_multisites', true );
		if ( $show_local_activation ) {
			if ( 'Activated' === get_option( 'kadence_conversions_activation' ) ) {
				$kadence_conversions_updater = Kadence_Update_Checker::buildUpdateChecker(
					'https://kernl.us/api/v1/updates/617c232fba0ed4ff4cd30279/',
					KADENCE_CONVERSIONS_PATH . 'kadence-conversions.php',
					'kadence-conversions'
				);
			}
		} else {
			if ( 'Activated' === get_site_option( 'kadence_conversions_activation' ) ) {
				$kadence_conversions_updater = Kadence_Update_Checker::buildUpdateChecker(
					'https://kernl.us/api/v1/updates/617c232fba0ed4ff4cd30279/',
					KADENCE_CONVERSIONS_PATH . 'kadence-conversions.php',
					'kadence-conversions'
				);
			}
		}
	} elseif ( 'Activated' === get_option( 'kadence_conversions_activation' ) ) {
		$kadence_conversions_updater = Kadence_Update_Checker::buildUpdateChecker(
			'https://kernl.us/api/v1/updates/617c232fba0ed4ff4cd30279/',
			KADENCE_CONVERSIONS_PATH . 'kadence-conversions.php',
			'kadence-conversions'
		);
	}
}
