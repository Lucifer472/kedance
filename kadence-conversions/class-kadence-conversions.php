<?php
/**
 * Class Kadence_Conversions\Plugin
 *
 * @package Kadence Conversions
 */

namespace Kadence_Conversions;

use Kadence_Conversions\Analytics_Dashboard_Util;
use get_the_title;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Kadence Conversions Main Class
 */
class Plugin {
	const SLUG = 'kadence_conversions';
	/**
	 * Action on init.
	 */
	public function __construct() {
		if ( is_admin() ) {
			add_action( 'admin_menu', array( $this, 'add_menu' ) );
			add_filter( 'plugin_action_links_kadence-conversions/kadence-conversions.php', array( $this, 'add_settings_link' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'add_dash_scripts' ) );
		}
		add_action( 'wp_ajax_kadence_conversions_get_analytics_data', array( $this, 'get_conversion_data' ) );
		add_action( 'admin_init', array( $this, 'include_admin' ) );
	}
	/**
	 * AJAX callback to install a plugin.
	 */
	public function get_conversion_data() {
		check_ajax_referer( 'kadence-conversion-ajax-verification', 'security' );

		if ( ! current_user_can( 'edit_kadence_conversions' ) || ! isset( $_POST['post_id'] ) ) {
			wp_send_json_error( 'Permissions Issue' );
		}

		$selected_conversion = sanitize_text_field( wp_unslash( $_POST['post_id'] ) );
		$period              = sanitize_text_field( wp_unslash( $_POST['period'] ) );
		if ( empty( $period ) ) {
			$period = 7;
		}
		switch ( $period ) {
			case '30':
				$the_period = 'month';
				break;
			case '90':
				$the_period = 'quarter';
				break;
			default:
				$the_period = 'week';
				break;
		}
		if ( 'all' === $selected_conversion ) {
			$selected_conversion = false;
		}
		$data = array(
			'graphViews'   => Analytics_Dashboard_Util::query_events( 'viewed', $selected_conversion, $the_period ),
			'graphConvert' => Analytics_Dashboard_Util::query_events( 'converted', $selected_conversion, $the_period ),
		);
		wp_send_json( $data );
	}
	/**
	 * Enqueue Script for localize options.
	 */
	public function add_dash_scripts() {
		$current_page = get_current_screen()->base;
		if ( 'conversions_page_kadence-conversion-settings' === $current_page ) {
			$settings  = json_decode( get_option( 'kadence_conversions' ), true );
			$analytics = 'true';
			if ( isset( $settings ) && is_array( $settings ) && isset( $settings['enable_analytics'] ) && ! $settings['enable_analytics'] ) {
				$analytics = 'false';
			}
			$args = array(
				'post_type'              => self::SLUG,
				'no_found_rows'          => true,
				'update_post_term_cache' => false,
				'post_status'            => array( 'draft', 'publish' ),
				'numberposts'            => 333,
				'order'                  => 'ASC',
				'orderby'                => 'menu_order',
				'suppress_filters'       => false,
			);
			$items = array( 'all' => __( 'All Conversion Items', 'kadence-conversions' ) );
			$conversions_posts = get_posts( $args );
			//$all_items = array( 'all' => __( 'All Conversion Items', 'kadence-conversions' ) );
			foreach ( $conversions_posts as $conversion_post ) {
				$items[ strval( $conversion_post->ID ) ] = esc_attr( wp_strip_all_tags( get_the_title( $conversion_post ) ) );
			}
			//$items = array_merge( $all_items, $items );
			$plugin_asset_meta = $this->get_asset_file( 'build/dashboard' );
			// Register the script.
			wp_enqueue_script(
				'kadence-conversion-dashboard',
				KADENCE_CONVERSIONS_URL . 'build/dashboard.js',
				$plugin_asset_meta['dependencies'],
				$plugin_asset_meta['version'],
				true
			);
			wp_enqueue_style(
				'kadence-conversion-dashboard',
				KADENCE_CONVERSIONS_URL . 'build/dashboard.css',
				array(),
				$plugin_asset_meta['version']
			);
			wp_localize_script(
				'kadence-conversion-dashboard',
				'kadenceDashboardParams',
				array(
					'ajax_url'     => admin_url( 'admin-ajax.php' ),
					'ajax_nonce'   => wp_create_nonce( 'kadence-conversion-ajax-verification' ),
					'analytics'    => $analytics,
					'items'        => $items,
					'period'       => 7,
					'graphViews'   => Analytics_Dashboard_Util::query_events( 'viewed', false, 'week' ),
					'graphConvert' => Analytics_Dashboard_Util::query_events( 'converted', false, 'week' ),
				)
			);
			if ( function_exists( 'wp_set_script_translations' ) ) {
				wp_set_script_translations( 'kadence-conversion-dashboard', 'kadence-conversions' );
			}
		}
	}
	/**
	 * Get the asset file produced by wp scripts.
	 *
	 * @param string $filepath the file path.
	 * @return array
	 */
	public function get_asset_file( $filepath ) {
		$asset_path = KADENCE_CONVERSIONS_PATH . $filepath . '.asset.php';

		return file_exists( $asset_path )
			? include $asset_path
			: array(
				'dependencies' => array( 'lodash', 'react', 'react-dom', 'wp-block-editor', 'wp-blocks', 'wp-data', 'wp-element', 'wp-i18n', 'wp-polyfill', 'wp-primitives', 'wp-api' ),
				'version'      => KADENCE_CONVERSIONS_VERSION,
			);
	}
	/**
	 * Add settings link
	 */
	public function settings_link() {
		return apply_filters( 'kadence-conversions-settings-url', admin_url( 'admin.php?page=kadence-conversion-settings' ) );
	}
	/**
	 * Add settings link
	 *
	 * @param array $links plugin activate/deactivate links array.
	 */
	public function add_settings_link( $links ) {
		$settings_link = '<a href="' . esc_url( $this->settings_link() ) . '">' . __( 'Settings', 'kadence-conversions' ) . '</a>';
		array_push( $links, $settings_link );
		return $links;
	}
	/**
	 * Allow settings visibility to be changed.
	 */
	public function settings_user_capabilities() {
		$cap = apply_filters( 'kadence_conversions_admin_settings_capability', 'edit_kadence_conversions' );
		return $cap;
	}
	/**
	 * Add option page menu
	 */
	public function add_menu() {
		add_menu_page( __( 'Kadence Conversions - Popups, Slid-ins, Embed', 'kadence-conversions' ), __( 'Conversions', 'kadence-conversions' ), $this->settings_user_capabilities(), 'kadence-conversions', null, $this->get_icon_svg() );
	}
	/**
	 * Returns a base64 URL for the SVG for use in the menu.
	 *
	 * @param  bool $base64 Whether or not to return base64-encoded SVG.
	 * @return string
	 */
	private function get_icon_svg( $base64 = true ) {
		$svg = '<svg viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg"><path fill="#a7aaad" d="M15.039,6.218l0,8.821l-14.078,0l0,-14.078l8.821,0l0,0.534l-8.286,0c0,0 0,13.01 -0.001,13.009c0,0 13.01,0 13.009,0.001l0,-8.287l0.535,0Zm-2.68,5.16l-4.146,0c-0.208,0 -0.376,-0.169 -0.376,-0.376c0,-0.207 0.168,-0.376 0.376,-0.376l1.251,0c0.195,-0.013 0.349,-0.176 0.349,-0.375c0,-0.207 -0.168,-0.375 -0.375,-0.375l-1.958,0c-0.207,0 -0.375,-0.169 -0.375,-0.376c-0,-0.207 0.168,-0.375 0.375,-0.375l0.587,0c0.207,0 0.375,-0.168 0.375,-0.375c0,-0.207 -0.168,-0.375 -0.375,-0.375l-2.737,-0.001c-0.207,0 -0.375,-0.168 -0.375,-0.375c0,-0.207 0.168,-0.375 0.375,-0.375l1.853,0l0,-0.001l0.726,0c0.207,0 0.375,-0.168 0.375,-0.375c0,-0.207 -0.168,-0.374 -0.375,-0.374l-0.166,0l0.001,-0.001l-0.771,0c-0.207,0 -0.375,-0.168 -0.375,-0.375c0,-0.207 0.168,-0.375 0.375,-0.375l1.779,0c0.009,0 0.018,0 0.027,0.001l0.636,0c0.207,0 0.375,-0.168 0.375,-0.376c0,-0.207 -0.168,-0.376 -0.375,-0.376l-0.935,0c-0.195,-0.014 -0.349,-0.176 -0.349,-0.374c0,-0.208 0.169,-0.376 0.376,-0.376l3.214,0l-3.042,3.323l3.68,3.433Zm-5.836,-0.752c0.206,0 0.374,0.168 0.374,0.375c0,0.206 -0.168,0.374 -0.374,0.374l-1.374,0c-0.207,0 -0.375,-0.168 -0.375,-0.374c0,-0.207 0.168,-0.375 0.375,-0.375l1.374,0Zm-0.544,-1.501c0.207,0 0.375,0.168 0.375,0.376c0,0.207 -0.168,0.375 -0.375,0.375c-0.208,0 -0.376,-0.168 -0.376,-0.375c0,-0.208 0.168,-0.376 0.376,-0.376Zm-1.963,-1.501c0.208,0 0.376,0.168 0.376,0.376c0,0.207 -0.168,0.375 -0.376,0.375c-0.207,0 -0.375,-0.168 -0.375,-0.375c0,-0.208 0.168,-0.376 0.375,-0.376Zm1.456,-1.501c0.207,0 0.375,0.168 0.375,0.376c0,0.207 -0.168,0.375 -0.375,0.375c-0.207,0 -0.376,-0.168 -0.376,-0.375c0,-0.208 0.169,-0.376 0.376,-0.376Zm1.347,-1.501c0.206,0 0.374,0.168 0.374,0.374c0,0.207 -0.168,0.375 -0.374,0.375l-0.869,0c-0.206,0 -0.374,-0.168 -0.374,-0.375c0,-0.206 0.167,-0.374 0.374,-0.374l0.869,0Zm7.968,-3.92l-1.787,0l0,-0.6l2.898,0l0,2.898l-0.6,0l0,-1.937l-2.652,2.652l-0.436,-0.436l2.577,-2.577Z"/></svg>';
		if ( $base64 ) {
			return 'data:image/svg+xml;base64,' . base64_encode( $svg );
		}

		return $svg;
	}
	/**
	 * On Load
	 */
	public function include_admin() {
		if ( ! defined( 'KADENCE_BLOCKS_VERSION' ) ) {
			add_action( 'admin_notices', array( $this, 'admin_notice_need_kadence_blocks' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'admin_scripts' ) );
		}
	}
	/**
	 * Admin Notice
	 */
	public function admin_notice_need_kadence_blocks() {
		if ( get_transient( 'kadence_conversions_free_plugin_notice' ) || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$installed_plugins = get_plugins();
		if ( ! isset( $installed_plugins['kadence-blocks/kadence-blocks.php'] ) ) {
			$button_label = esc_html__( 'Install Kadence Blocks', 'kadence-conversions' );
			$data_action  = 'install';
		} else {
			$button_label = esc_html__( 'Activate Kadence Blocks', 'kadence-conversions' );
			$data_action  = 'activate';
		}
		$install_link    = wp_nonce_url(
			add_query_arg(
				array(
					'action' => 'install-plugin',
					'plugin' => 'kadence-blocks',
				),
				network_admin_url( 'update.php' )
			),
			'install-plugin_kadence-blocks'
		);
		$activate_nonce  = wp_create_nonce( 'activate-plugin_kadence-blocks/kadence-blocks.php' );
		$activation_link = self_admin_url( 'plugins.php?_wpnonce=' . $activate_nonce . '&action=activate&plugin=kadence-blocks%2Fkadence-blocks.php' );
		echo '<div class="notice notice-error is-dismissible kc-blocks-notice-wrapper">';
		// translators: %s is a link to kadence block plugin.
		echo '<p>' . sprintf( esc_html__( 'Kadence Conversions requires %s to be active for all functions to work.', 'kadence-conversions' ) . '</p>', '<a target="_blank" href="https://wordpress.org/plugins/kadence-blocks/">Kadence Blocks</a>' );
		echo '<p class="submit">';
		echo '<a class="button button-primary kc-install-blocks-btn" data-redirect-url="' . esc_url( admin_url( 'options-general.php?page=kadence_blocks' ) ) . '" data-activating-label="' . esc_attr__( 'Activating...', 'kadence-conversions' ) . '" data-activated-label="' . esc_attr__( 'Activated', 'kadence-conversions' ) . '" data-installing-label="' . esc_attr__( 'Installing...', 'kadence-conversions' ) . '" data-installed-label="' . esc_attr__( 'Installed', 'kadence-conversions' ) . '" data-action="' . esc_attr( $data_action ) . '" data-install-url="' . esc_attr( $install_link ) . '" data-activate-url="' . esc_attr( $activation_link ) . '">' . esc_html( $button_label ) . '</a>';
		echo '</p>';
		echo '</div>';
		wp_enqueue_script( 'kc-blocks-install' );
	}
	/**
	 * Function to output admin scripts.
	 *
	 * @param object $hook page hook.
	 */
	public function admin_scripts( $hook ) {
		wp_register_script( 'kc-blocks-install', KADENCE_CONVERSIONS_URL . 'assets/admin-activate.min.js', false, KADENCE_CONVERSIONS_VERSION );
		wp_enqueue_style( 'kc-blocks-install', KADENCE_CONVERSIONS_URL . 'assets/admin-activate.css', false, KADENCE_CONVERSIONS_VERSION );
	}
}
new Plugin();
