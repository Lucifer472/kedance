<?php
/**
 * Class Kadence_Conversions\Post_Select_Controller
 *
 * @package Kadence Conversions
 */

namespace Kadence_Conversions;

use WP_Error;

/**
 * Class Analytics_Ajax
 */
class Setup {

	/**
	 * Instance Control
	 *
	 * @var null
	 */
	private static $instance = null;
	const PLUGIN_BUILD = 1001;
	const TABLES = [
		'kadence_conversions_events',
	];

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
		register_activation_hook( KADENCE_CONVERSIONS_FILE, array( $this, 'activate' ) );

		// Handle upgrade if needed.
		add_action( 'plugins_loaded', array( $this, 'handle_upgrade' ), 100 );
	}
	/**
	 * Dispatch a request to upgrade the data schema to another version.
	 */
	public function handle_upgrade() {
		if ( self::get_saved_plugin_build() >= self::PLUGIN_BUILD ) {
			return null;
		}

		self::create_database_tables();
	}
	/**
	 * Get the build the database is running.
	 *
	 * @return int
	 */
	public static function get_saved_plugin_build() {
		if ( is_multisite() ) {
			$build = get_site_option( 'kadence_conversions_build' );
		} else {
			$build = get_option( 'kadence_conversions_build' );
		}

		if ( ! $build ) {
			return 0;
		}

		return (int) $build;
	}
	/**
	 * Activate the plugin, build database.
	 */
	public function activate() {
		// Ensure that the database tables are present and updated to the current schema.
		$created = self::create_database_tables();
	}
	/**
	 * Creates appropriate database tables.
	 *
	 * Uses dbdelta to create database tables either on activation or in the event that one is missing.
	 *
	 * @return true|WP_Error
	 */
	public static function create_database_tables() {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();

		$tables = "
CREATE TABLE {$wpdb->base_prefix}kadence_conversions_events (
  event_id int(11) unsigned NOT NULL AUTO_INCREMENT,
  event_type varchar(128) NOT NULL DEFAULT '',
  event_post int(11) NOT NULL DEFAULT '0',
  event_time datetime NOT NULL,
  event_count int(11) unsigned NOT NULL DEFAULT '1',
  event_consolidated tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY  (`event_id`),
  UNIQUE KEY `event_type__post__time__consolidated` (event_type,event_post,event_time,event_consolidated)
) $charset_collate;
";

		$wp_error = self::db_delta_with_error_handling( $tables );
		foreach ( self::TABLES as $table ) {
			if ( ! count( $wpdb->get_results( "SHOW TABLES LIKE '{$wpdb->base_prefix}{$table}'" ) ) ) {
				$wp_error->add(
					'missing_table',
					sprintf( __( 'The %s table is not installed.', 'kadence-conversions' ), $table )
				);
			}
		}
		if ( $wp_error->has_errors() ) {
			return $wp_error;
		}
		if ( is_multisite() ) {
			update_site_option( 'kadence_conversions_build', self::PLUGIN_BUILD );
		} else {
			update_option( 'kadence_conversions_build', self::PLUGIN_BUILD );
		}

		return true;
	}
	/**
	 * Performs a {@see dbDelta()} but reports any errors encountered.
	 *
	 * @param string $delta
	 *
	 * @return WP_Error
	 */
	public static function db_delta_with_error_handling( $delta ) {
		global $wpdb, $EZSQL_ERROR;

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );

		$err_count     = is_array( $EZSQL_ERROR ) ? count( $EZSQL_ERROR ) : 0;
		$showed_errors = $wpdb->show_errors( false );

		dbDelta( $delta );

		if ( $showed_errors ) {
			$wpdb->show_errors();
		}

		$wp_error = new WP_Error();

		if ( is_array( $EZSQL_ERROR ) ) {
			for ( $i = $err_count, $i_max = count( $EZSQL_ERROR ); $i < $i_max; $i ++ ) {
				$error = $EZSQL_ERROR[ $i ];

				if ( empty( $error['error_str'] ) || empty( $error['query'] ) || 0 === strpos( $error['query'], 'DESCRIBE ' ) ) {
					continue;
				}

				$wp_error->add( 'db_delta_error', $error['error_str'] );
			}
		}

		return $wp_error;
	}
	/**
	 * Removes database tables.
	 *
	 */
	public static function remove_database_tables() {
		global $wpdb;

		foreach ( self::TABLES as $table ) {
			$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->base_prefix}{$table};" );
		}
	}
}
Setup::get_instance();
