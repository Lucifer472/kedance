<?php
/**
 * Class Kadence_Conversions\Post_Select_Controller
 *
 * @package Kadence Conversions
 */

namespace Kadence_Conversions;

use Kadence_Conversions\Analytics_Dashboard_Util;
/**
 * Class Analytics_Ajax
 */
class Analytics_Ajax {

	/**
	 * Instance Control
	 *
	 * @var null
	 */
	private static $instance = null;

	/**
	 * Throw error on object clone.
	 *
	 * The whole idea of the singleton design pattern is that there is a single
	 * object therefore, we don't want the object to be cloned.
	 *
	 * @return void
	 */
	public function __clone() {
		// Cloning instances of the class is forbidden.
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Cloning instances of the class is Forbidden', 'kadence-conversions' ), '1.0' );
	}

	/**
	 * Disable un-serializing of the class.
	 *
	 * @return void
	 */
	public function __wakeup() {
		// Unserializing instances of the class is forbidden.
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Unserializing instances of the class is forbidden', 'kadence-conversions' ), '1.0' );
	}

	/**
	 * Instance Control.
	 */
	public static function get_instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor function.
	 */
	public function __construct() {
		// Log conversion view.
		add_action( 'wp_ajax_kadence_conversion_triggered', array( $this, 'log_conversion_viewed' ) );
		add_action( 'wp_ajax_nopriv_kadence_conversion_triggered', array( $this, 'log_conversion_viewed' ) );
		// Log conversion converted.
		add_action( 'wp_ajax_kadence_conversion_converted', array( $this, 'log_conversion_converted' ) );
		add_action( 'wp_ajax_nopriv_kadence_conversion_converted', array( $this, 'log_conversion_converted' ) );
	}
	/**
	 * Uses ajax to save end time for the given visitor.
	 * This used to bypass cookie cache.
	 */
	public function log_conversion_viewed() {
		check_ajax_referer( 'kadence_conversions', 'nonce' );
		if ( ! isset( $_POST['post_id'] ) || ! isset( $_POST['campaign_id'] ) || ! isset( $_POST['goal'] ) || ! isset( $_POST['type'] ) ) {
			wp_send_json_error( 'missing_data' );
		}
		$data = array(
			'event'       => 'viewed',
			'type'        => sanitize_text_field( wp_unslash( $_POST['type'] ) ),
			'post_id'     => absint( wp_unslash( $_POST['post_id'] ) ),
			'campaign_id' => sanitize_text_field( wp_unslash( $_POST['campaign_id'] ) ),
			'goal'        => sanitize_text_field( wp_unslash( $_POST['goal'] ) ),
		);
		do_action( 'kadence_conversions_view_event', $data );
		Analytics_Dashboard_Util::record_event( $data );

		wp_send_json( $data );
	}
	/**
	 * Uses ajax to save end time for the given visitor.
	 * This used to bypass cookie cache.
	 */
	public function log_conversion_converted() {
		check_ajax_referer( 'kadence_conversions', 'nonce' );
		if ( ! isset( $_POST['post_id'] ) || ! isset( $_POST['campaign_id'] ) || ! isset( $_POST['goal'] ) || ! isset( $_POST['type'] ) ) {
			wp_send_json_error( 'missing_data' );
		}
		$data = array(
			'event'       => 'converted',
			'type'        => sanitize_text_field( wp_unslash( $_POST['type'] ) ),
			'post_id'     => absint( wp_unslash( $_POST['post_id'] ) ),
			'campaign_id' => sanitize_text_field( wp_unslash( $_POST['campaign_id'] ) ),
			'goal'        => sanitize_text_field( wp_unslash( $_POST['goal'] ) ),
		);
		do_action( 'kadence_conversions_convert_event', $data );
		Analytics_Dashboard_Util::record_event( $data );
		wp_send_json( $data );
	}
}
Analytics_Ajax::get_instance();
