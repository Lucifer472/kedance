<?php
/**
 * Kadence Conversions Settings Class
 *
 * @package Kadence Conversions
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Main Kadence_Conversions_Settings class
 */
class Kadence_Conversions_Settings {
	const OPT_NAME = 'kadence_conversions';

	/**
	 * Action on init.
	 */
	public function __construct() {
		require_once KADENCE_CONVERSIONS_PATH . 'inc/settings/load.php';
		// Need to load this with priority higher then 10 so class is loaded.
		add_action( 'after_setup_theme', array( $this, 'add_sections' ), 20 );
	}
	/**
	 * Add sections to settings.
	 */
	public function add_sections() {
		if ( ! class_exists( 'Kadence_Settings_Engine' ) ) {
			return;
		}
		$args = array(
			'opt_name'                         => self::OPT_NAME,
			'menu_icon'                        => '',
			'menu_title'                       => __( 'Dashboard', 'kadence-conversions' ),
			'page_title'                       => __( 'Kadence Conversions', 'kadence-conversions' ),
			'page_slug'                        => 'kadence-conversion-settings',
			'page_permissions'                 => 'manage_options',
			'menu_type'                        => 'submenu',
			'page_parent'                      => 'kadence-conversions',
			'page_priority'                    => null,
			'footer_credit'                    => '',
			'class'                            => '',
			'admin_bar'                        => false,
			'admin_bar_priority'               => 999,
			'admin_bar_icon'                   => '',
			'show_import_export'               => false,
			'version'                          => KADENCE_CONVERSIONS_VERSION,
			'logo'                             => KADENCE_CONVERSIONS_URL . 'assets/kadence-conversions.png',
			'changelog'                        => KADENCE_CONVERSIONS_PATH . 'changelog.txt',
		);
		$args['tabs'] = array(
			'dash' => array(
				'id' => 'dash',
				'title' => __( 'Dashboard', 'kadence-conversions' ),
			),
			'settings' => array(
				'id' => 'settings',
				'title' => __( 'Settings', 'kadence-conversions' ),
			),
			'started' => array(
				'id' => 'started',
				'title' => __( 'Getting Started', 'kadence-conversions' ),
			),
			'changelog' => array(
				'id' => 'changelog',
				'title' => __( 'Changelog', 'kadence-conversions' ),
			),
		);
		$args['started'] = array(
			'title' => __( 'Welcome to Kadence Conversions', 'kadence-conversions' ),
			'description' => __( 'We are working on a getting started video to be added below here, it\'s coming soon.', 'kadence-conversions' ),
			'video_url' => '',
			'link_url' => 'https://kadencewp.com/kadence-conversions/docs/',
			'link_text' => __( 'View Knowledge Base', 'kadence-conversions' ),
		);
		$args['sidebar'] = array(
			'facebook' => array(
				'title' => __( 'Web Creators Community', 'kadence-conversions' ),
				'description' => __( 'Join our community of fellow kadence users creating effective websites! Share your site, ask a question and help others.', 'kadence-conversions' ),
				'link' => 'https://www.facebook.com/groups/webcreatorcommunity',
				'link_text' => __( 'Join our Facebook Group', 'kadence-conversions' ),
			),
			'docs' => array(
				'title' => __( 'Documentation', 'kadence-conversions' ),
				'description' => __( 'Need help? We have a knowledge base full of articles to get you started.', 'kadence-conversions' ),
				'link' => 'https://kadencewp.com/kadence-conversions/docs/',
				'link_text' => __( 'Browse Docs', 'kadence-conversions' ),
			),
			'support' => array(
				'title' => __( 'Support', 'kadence-conversions' ),
				'description' => __( 'Have a question, we are happy to help! Get in touch with our support team.', 'kadence-conversions' ),
				'link' => 'https://www.kadencewp.com/premium-support-tickets/',
				'link_text' => __( 'Submit a Ticket', 'kadence-conversions' ),
			),
		);
		Kadence_Settings_Engine::set_args( self::OPT_NAME, $args );
		Kadence_Settings_Engine::set_section(
			self::OPT_NAME,
			array(
				'id'     => 'kc_general',
				'title'  => __( 'General', 'kadence-conversions' ),
				'long_title'  => __( 'General Settings', 'kadence-conversions' ),
				'desc'   => '',
				'fields' => array(
					array(
						'id'       => 'enable_analytics',
						'type'     => 'switch',
						'title'    => __( 'Enable Local Analytics.', 'kadence-conversions' ),
						'help'     => __( 'This will keep a record of conversion views and conversion goal events.', 'kadence-conversions' ),
						'default'  => 1,
					),
					array(
						'id'       => 'google_analytics',
						'type'     => 'switch',
						'title'    => __( 'Enable Google Analytics Events Tracking.', 'kadence-conversions' ),
						'help'     => __( 'Optional, if you want conversions to trigger events in google analytics.', 'kadence-conversions' ),
						'default'  => 0,
					),
				),
			)
		);
	}
}
new Kadence_Conversions_Settings();
