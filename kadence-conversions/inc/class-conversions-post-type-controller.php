<?php
/**
 * Class Kadence_Conversions\Popups_Post_Type_Controller
 *
 * @package Kadence Conversions
 */

namespace Kadence_Conversions;

use DateTime;
use Kadence_Blocks_Frontend;
use DOMDocument;
use WP_Error;
use Kadence_Conversions\Post_Select_Controller;
use Kadence_Conversions\Minified_CSS;
use Kadence_Conversions\Duplicate_Post;
use function Kadence\kadence;
use function get_editable_roles;
use function do_shortcode;
use function extension_loaded;
use function libxml_use_internal_errors;
/**
 * Class managing the template areas post type.
 */
class Conversion_Post_Type_Controller {

	const SLUG = 'kadence_conversions';
	const TYPE_SLUG = 'conversion_type';
	const TYPE_META_KEY = '_kad_conversion_type';

	/**
	 * Instance Control
	 *
	 * @var null
	 */
	private static $instance = null;

	/**
	 * Current condition
	 *
	 * @var null
	 */
	public static $current_condition = null;

	/**
	 * Current user
	 *
	 * @var null
	 */
	public static $current_user = null;

	/**
	 * Gather placeholders for inline
	 *
	 * @var array $placeholders_for_inline
	 */
	private static $placeholders_for_inline = array();

	/**
	 * Holds post types.
	 *
	 * @var values of all the post types.
	 */
	protected static $post_types = null;

	/**
	 * Holds post types.
	 *
	 * @var values of all the post types.
	 */
	protected static $post_types_objects = null;

	/**
	 * Holds ignore post types.
	 *
	 * @var values of all the post types.
	 */
	protected static $ignore_post_types = null;

	/**
	 * Holds ignore post types.
	 *
	 * @var values of all the post types.
	 */
	protected static $public_ignore_post_types = null;

	/**
	 * Holds conversions data array.
	 *
	 * @var Data for all the conversions.
	 */
	protected static $conversions = array();

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
		// Register the post type.
		add_action( 'init', array( $this, 'register_post_type' ), 2 );
		// Build user permissions settings.
		add_filter( 'user_has_cap', array( $this, 'filter_post_type_user_caps' ) );
		// Register the meta settings for conversion post.
		add_action( 'init', array( $this, 'register_meta' ), 20 );
		// Register the script for the conversion block.
		add_action( 'enqueue_block_editor_assets', array( $this, 'block_script_config_enqueue' ) );
		// Define the conversion post gutenberg template.
		add_action( 'init', array( $this, 'conversion_gutenberg_template' ) );
		// Add endpoints for post select options in conversion block.
		add_action( 'rest_api_init', array( $this, 'register_api_endpoints' ) );;
		// No longer a public facing post type so don't need next line. Keep in case we change this later.
		// add_action( 'wp', array( $this, 'popup_single_only_logged_in_editors' ) );
		if ( is_admin() ) {
			// Filter Kadence Theme to give the correct admin editor layout.
			add_filter( 'kadence_post_layout', array( $this, 'popup_single_layout' ), 99 );
		}
		$slug = self::SLUG;
		// Manage editor columns.
		add_filter(
			"manage_{$slug}_posts_columns",
			function( array $columns ) : array {
				return $this->filter_post_type_columns( $columns );
			}
		);
		add_action(
			"manage_{$slug}_posts_custom_column",
			function( string $column_name, int $post_id ) {
				$this->render_post_type_column( $column_name, $post_id );
			},
			10,
			2
		);
		if ( class_exists( 'Kadence_Conversions\Duplicate_Post' ) ) {
			new \Kadence_Conversions\Duplicate_Post( self::SLUG );
		}
		// If we ever want to add tabs for conversion "types" here is where we can do that.
		//add_filter( 'views_edit-' . self::SLUG, array( $this, 'admin_print_tabs' ) );
		//add_action( 'pre_get_posts', array( $this, 'admin_filter_results' ) );
		add_action( 'wp_ajax_kadence_conversion_change_status', array( $this, 'ajax_change_status' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'action_enqueue_admin_scripts' ) );
	}
	/**
	 * Enqueues a script that adds sticky for single products
	 */
	public function action_enqueue_admin_scripts() {
		$current_page = get_current_screen();
		if ( 'edit-' . self::SLUG === $current_page->id ) {
			// Enqueue the post styles.
			wp_enqueue_style( 'kadence-conversions-admin', KADENCE_CONVERSIONS_URL . 'assets/conversions-post-list-admin.css', false, KADENCE_CONVERSIONS_VERSION );
			wp_enqueue_script( 'kadence_conversions-admin', KADENCE_CONVERSIONS_URL . 'assets/conversions-post-list-admin.min.js', array( 'jquery' ), KADENCE_CONVERSIONS_VERSION, true );
			wp_localize_script(
				'kadence_conversions-admin',
				'kadence_conversions_params',
				array(
					'ajax_url'   => admin_url( 'admin-ajax.php' ),
					'ajax_nonce' => wp_create_nonce( 'kadence_conversion-ajax-verification' ),
					'draft' => esc_attr__( 'Draft', 'kadence-conversions' ),
					'publish' => esc_attr__( 'Published', 'kadence-conversions' ),
				)
			);
		}
	}
	/**
	 * Change the post status
	 * @param number $post_id - The ID of the post you'd like to change.
	 * @param string $status -  The post status publish|pending|draft|private|static|object|attachment|inherit|future|trash.
	 */
	public function change_post_status( $post_id, $status ) {
		if ( 'publish' === $status || 'draft' === $status ) {
			$current_post = get_post( $post_id, 'ARRAY_A' );
			$current_post['post_status'] = $status;
			return wp_update_post( $current_post );
		} else {
			return false;
		}
	}
	/**
	 * Ajax callback function.
	 */
	public function ajax_change_status() {
		check_ajax_referer( 'kadence_conversion-ajax-verification', 'security' );

		if ( ! isset ( $_POST['post_id'] ) || ! isset( $_POST['post_status'] ) ) {
			wp_send_json_error( __( 'Error: No post information was retrieved.', 'kadence-cloud' ) );
		}
		$post_id = empty( $_POST['post_id'] ) ? '' : sanitize_text_field( wp_unslash( $_POST['post_id'] ) );
		$post_status = empty( $_POST['post_status'] ) ? '' : sanitize_text_field( wp_unslash( $_POST['post_status'] ) );
		$response = false;
		if ( 'publish' === $post_status ) {
			$response = $this->change_post_status( $post_id, 'draft' );
		} else if ( 'draft' === $post_status ) {
			$response = $this->change_post_status( $post_id, 'publish' );
		}
		if ( ! $response ) {
			$error = new WP_Error( '001', 'Post Status invalid.' );
			wp_send_json_error( $error );
		}
		wp_send_json_success();
	}
	/**
	 * Filter the post results if tabs selected.
	 *
	 * @param object $query An array of available list table views.
	 */
	public function admin_filter_results( $query ) {
		if ( ! ( is_admin() && $query->is_main_query() ) ) {
			return $query;
		}
		if ( ! ( isset( $query->query['post_type'] ) && 'kadence_conversions' === $query->query['post_type'] && isset( $_REQUEST[ self::TYPE_SLUG ] ) ) ) {
			return $query;
		}
		$screen = get_current_screen();
		if ( $screen->id == 'edit-kadence_conversions' ) {
			if ( isset( $_REQUEST[ self::TYPE_SLUG ] ) ) {
				$type_slug = sanitize_text_field( $_REQUEST[ self::TYPE_SLUG ] );
				if ( ! empty( $type_slug ) ) {
					$query->query_vars['meta_query'] = array(
						array(
							'key'   => self::TYPE_META_KEY,
							'value' => $type_slug,
						),
					);
				}
			}
		}
		return $query;
	}
	/**
	 * Print admin tabs.
	 *
	 * Used to output the conversion tabs with their labels.
	 *
	 *
	 * @param array $views An array of available list table views.
	 *
	 * @return array An updated array of available list table views.
	 */
	public function admin_print_tabs( $views ) {
		$current_type = '';
		$active_class = ' nav-tab-active';

		if ( ! empty( $_REQUEST[ self::TYPE_SLUG ] ) ) {
			$current_type = $_REQUEST[ self::TYPE_SLUG ];
			$active_class = '';
		}

		$url_args = [
			'post_type' => self::SLUG,
		];

		$baseurl = add_query_arg( $url_args, admin_url( 'edit.php' ) );
		?>
		<div id="kadence-conversions-tabs-wrapper" class="nav-tab-wrapper">
			<a class="nav-tab<?php echo esc_attr( $active_class ); ?>" href="<?php echo esc_url( $baseurl ); ?>">
				<?php echo esc_html__( 'All Conversion Items', 'kadence_conversions' ); ?>
			</a>
			<?php
			$types = array(
				'popup' => array( 
					'label' => __( 'Popups', 'kadence-conversions' ),
				),
				'slide_in' => array( 
					'label' => __( 'Slide-ins', 'kadence-conversions' ),
				),
				'banner' => array( 
					'label' => __( 'Banner', 'kadence-conversions' ),
				),
			);
			foreach ( $types as $key => $type ) :
				$active_class = '';

				if ( $current_type === $key ) {
					$active_class = ' nav-tab-active';
				}

				$type_url = esc_url( add_query_arg( self::TYPE_SLUG, $key, $baseurl ) );
				$type_label = $type['label'];
				echo "<a class='nav-tab{$active_class}' href='{$type_url}'>{$type_label}</a>";
			endforeach;
			?>
		</div>
		<?php
		return $views;
	}
	/**
	 * Make sure popups can't be accessed directly from none logged in users.
	 */
	public function popup_single_only_logged_in_editors() {
		if ( is_singular( self::SLUG ) && ! current_user_can( 'edit_kadence_conversions' ) ) {
			wp_redirect( site_url(), 301 );
			die;
		}
	}
	/**
	 * Setup the post select API endpoint.
	 *
	 * @return void
	 */
	public function register_api_endpoints() {
		$controller = new Post_Select_Controller();
		$controller->register_routes();
	}
	/**
	 * Add filters for element content output.
	 */
	public function conversion_gutenberg_template() {		
		$post_type_object = get_post_type_object( self::SLUG );
		$post_type_object->template = array(
			array(
				'kadence-conversions/conversion',
			),
		);
		$post_type_object->template_lock = 'all';
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
	 * Get current user information.
	 */
	public static function get_current_user_info() {
		if ( is_null( self::$current_user ) ) {
			$user_info = array( 'public' );
			if ( is_user_logged_in() ) {
				$user_info[] = 'logged_in';
				$user = wp_get_current_user();
				$user_info = array_merge( $user_info, $user->roles );
			} else {
				$user_info[] = 'logged_out';
			}

			self::$current_user = $user_info;
		}
		return self::$current_user;
	}
	/**
	 * Get an array of post meta.
	 *
	 * @param object $post the current element to check.
	 * @return array
	 */
	public function get_post_meta_array( $post ) {
		$meta = array(
			'scroll'         => '300',
			'type'           => 'popup',
			'show'           => array(
				array(
					'rule'         => 'general|site',
					'select'       => 'all',
					'ids'          => array(),
					'subRule'      => '',
					'subSelection' => array(),
					'mustMatch'    => '',
				),
			),
			'all_show'       => false,
			'hide'           => array(),
			'user'           => array(
				array(
					'role' => 'public',
				),
			),
			'user_hide'      => array(),
			'device'         => array(),
			'enable_expires' => false,
			'expires'        => '',
			'language'       => '',
			'trigger'        => '',
			'fixed_width'    => '',
			'width'          => 300,
			'fixed_position' => 'left',
			'xposition'      => 0,
			'yposition'      => 0,
		);
		if ( get_post_meta( $post->ID, '_kad_conversion_type', true ) ) {
			$meta['type'] = get_post_meta( $post->ID, '_kad_conversion_type', true );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_trigger', true ) ) {
			$meta['trigger'] = get_post_meta( $post->ID, '_kad_conversion_trigger', true );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_show', true ) ) {
			$meta['show'] = json_decode( get_post_meta( $post->ID, '_kad_conversion_show', true ), true );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_all_show', true ) ) {
			$meta['all_show'] = boolval( get_post_meta( $post->ID, '_kad_conversion_all_show', true ) );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_hide', true ) ) {
			$meta['hide'] = json_decode( get_post_meta( $post->ID, '_kad_conversion_hide', true ), true );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_user', true ) ) {
			$meta['user'] = json_decode( get_post_meta( $post->ID, '_kad_conversion_user', true ), true );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_user_hidden', true ) ) {
			$meta['user_hide'] = json_decode( get_post_meta( $post->ID, '_kad_conversion_user_hidden', true ), true );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_device', true ) ) {
			$meta['device'] = json_decode( get_post_meta( $post->ID, '_kad_conversion_device', true ), true );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_enable_expires', true ) ) {
			$meta['enable_expires'] = get_post_meta( $post->ID, '_kad_conversion_enable_expires', true );
		}
		if ( get_post_meta( $post->ID, '__kad_conversion_expires', true ) ) {
			$meta['expires'] = get_post_meta( $post->ID, '__kad_conversion_expires', true );
		}
		if ( get_post_meta( $post->ID, '__kad_conversion_language', true ) ) {
			$meta['language'] = get_post_meta( $post->ID, '__kad_conversion_language', true );
		}
		return $meta;
	}
	/**
	 * Enqueue Script for localize options.
	 */
	public function block_script_config_enqueue() {
		$post_type = get_post_type();
		if ( self::SLUG !== $post_type ) {
			return;
		}
		ob_start();
		include KADENCE_CONVERSIONS_PATH . 'assets/kadence-conversions.json';
		$prebuilt_data = ob_get_clean();
		wp_localize_script(
			'kadence-conversions-block',
			'kadenceConversionsParams',
			array(
				'post_type'          => $post_type,
				'actions'            => $this->get_action_options(),
				'authors'            => $this->get_author_options(),
				'display'            => $this->get_display_options(),
				'user'               => $this->get_user_options(),
				'restBase'           => esc_url_raw( get_rest_url() ),
				'postSelectEndpoint' => '/kconversions/v1/post-select',
				'taxonomies'         => $this->get_taxonomies(),
				'prebuilt'           => $prebuilt_data,
				'languageSettings'   => $this->get_language_options(),
				'woocommerce'        => class_exists( 'woocommerce' ),
			)
		);
		if ( function_exists( 'wp_set_script_translations' ) ) {
			wp_set_script_translations( 'kadence-conversions-block', 'kadence-conversions' );
		}
	}
	/**
	 * Get all language Options
	 */
	public function get_language_options() {
		$languages_options = array();
		// Check for Polylang.
		if ( function_exists( 'pll_the_languages' ) ) {
			$languages = pll_the_languages( array( 'raw' => 1 ) );
			foreach ( $languages as $lang ) {
				$languages_options[] = array(
					'value' => $lang['slug'],
					'label' => $lang['name'],
				);
			}
		}
		// Check for WPML.
		if ( defined( 'WPML_PLUGIN_FILE' ) ) {
			$languages = apply_filters( 'wpml_active_languages', array() );
			foreach ( $languages as $lang ) {
				$languages_options[] = array(
					'value' => $lang['code'],
					'label' => $lang['native_name'],
				);
			}
		}
		return apply_filters( 'kadence_conversions_display_languages', $languages_options );
	}
	/**
	 * Get all Display Options
	 */
	public function get_user_options() {
		$user_basic = array(
			array(
				'label' => esc_attr__( 'Basic', 'kadence-conversions' ),
				'options' => array(
					array(
						'value' => 'public',
						'label' => esc_attr__( 'All Users', 'kadence-conversions' ),
					),
					array(
						'value' => 'logged_out',
						'label' => esc_attr__( 'Logged out Users', 'kadence-conversions' ),
					),
					array(
						'value' => 'logged_in',
						'label' => esc_attr__( 'Logged in Users', 'kadence-conversions' ),
					),
				),
			),
		);
		$user_roles = array();
		$specific_roles = array();
		foreach ( get_editable_roles() as $role_slug => $role_info ) {
			$specific_roles[] = array(
				'value' => $role_slug,
				'label' => $role_info['name'],
			);
		}
		$user_roles[] = array(
			'label' => esc_attr__( 'Specific Role', 'kadence-conversions' ),
			'options' => $specific_roles,
		);
		$roles = array_merge( $user_basic, $user_roles );
		return apply_filters( 'kadence_conversions_user_options', $roles );
	}

	/**
	 * Get all Display Options
	 */
	public function get_display_options() {
		$display_general = array(
			array(
				'label' => esc_attr__( 'General', 'kadence-conversions' ),
				'options' => array(
					array(
						'value' => 'general|site',
						'label' => esc_attr__( 'Entire Site', 'kadence-conversions' ),
					),
					array(
						'value' => 'general|front_page',
						'label' => esc_attr__( 'Front Page', 'kadence-conversions' ),
					),
					array(
						'value' => 'general|home',
						'label' => esc_attr__( 'Blog Page', 'kadence-conversions' ),
					),
					array(
						'value' => 'general|search',
						'label' => esc_attr__( 'Search Results', 'kadence-conversions' ),
					),
					array(
						'value' => 'general|404',
						'label' => esc_attr__( 'Not Found (404)', 'kadence-conversions' ),
					),
					array(
						'value' => 'general|singular',
						'label' => esc_attr__( 'All Singular', 'kadence-conversions' ),
					),
					array(
						'value' => 'general|archive',
						'label' => esc_attr__( 'All Archives', 'kadence-conversions' ),
					),
					array(
						'value' => 'general|author',
						'label' => esc_attr__( 'Author Archives', 'kadence-conversions' ),
					),
					array(
						'value' => 'general|date',
						'label' => esc_attr__( 'Date Archives', 'kadence-conversions' ),
					),
					array(
						'value' => 'general|paged',
						'label' => esc_attr__( 'Paged', 'kadence-conversions' ),
					),
				),
			),
		);
		$kadence_public_post_types = $this->get_post_types();
		if ( defined( 'TRIBE_EVENTS_FILE' ) ) {
			$kadence_public_post_types = array_merge( $kadence_public_post_types, array( 'tribe_events' ) );
		}
		$ignore_types              = $this->get_public_post_types_to_ignore();
		$display_singular = array();
		foreach ( $kadence_public_post_types as $post_type ) {
			$post_type_item  = get_post_type_object( $post_type );
			$post_type_name  = $post_type_item->name;
			$post_type_label = $post_type_item->label;
			$post_type_label_plural = $post_type_item->labels->name;
			if ( ! in_array( $post_type_name, $ignore_types, true ) ) {
				$post_type_options = array(
					array(
						'value' => 'singular|' . $post_type_name,
						'label' => esc_attr__( 'Single', 'kadence-conversions' ) . ' ' . $post_type_label_plural,
					),
				);
				$post_type_tax_objects = get_object_taxonomies( $post_type, 'objects' );
				foreach ( $post_type_tax_objects as $TYPE_slug => $taxonomy ) {
					if ( $taxonomy->public && $taxonomy->show_ui && 'post_format' !== $TYPE_slug ) {
						$post_type_options[] = array(
							'value' => 'tax_archive|' . $TYPE_slug,
							/* translators: %1$s: taxonomy singular label.  */
							'label' => sprintf( esc_attr__( '%1$s Archives', 'kadence-conversions' ), $taxonomy->labels->singular_name ),
						);
					}
				}
				if ( ! empty( $post_type_item->has_archive ) ) {
					$post_type_options[] = array(
						'value' => 'post_type_archive|' . $post_type_name,
						/* translators: %1$s: post type plural label  */
						'label' => sprintf( esc_attr__( '%1$s Archive', 'kadence-conversions' ), $post_type_label_plural ),
					);
				}
				if ( class_exists( 'woocommerce' ) && 'product' === $post_type_name ) {
					$post_type_options[] = array(
						'value' => 'general|product_search',
						/* translators: %1$s: post type plural label  */
						'label' => sprintf( esc_attr__( '%1$s Search', 'kadence-conversions' ), $post_type_label_plural ),
					);
				}
				$display_singular[] = array(
					'label' => $post_type_label,
					'options' => $post_type_options,
				);
			}
		}
		if ( class_exists( 'TUTOR\Tutor' ) && function_exists( 'tutor' ) ) {
			// Add lesson post type.
			$post_type_item  = get_post_type_object( tutor()->lesson_post_type );
			if ( $post_type_item ) {
				$post_type_name  = $post_type_item->name;
				$post_type_label = $post_type_item->label;
				$post_type_label_plural = $post_type_item->labels->name;
				$post_type_options = array(
					array(
						'value' => 'tutor|' . $post_type_name,
						'label' => esc_attr__( 'Single', 'kadence-conversions' ) . ' ' . $post_type_label_plural,
					),
				);
				$display_singular[] = array(
					'label' => $post_type_label,
					'options' => $post_type_options,
				);
			}
		}
		$display = array_merge( $display_general, $display_singular );
		return apply_filters( 'kadence_conversions_popup_display_options', $display );
	}
	/**
	 * Get all Fixed Hook Options
	 */
	public function get_action_options() {
		$actions = array(
			array(
				'label' => esc_attr__( 'Action Triggers', 'kadence-conversions' ),
				'options' => array(
					array(
						'value' => 'fixed_above_header',
						'label' => __( 'Fixed On Top', 'kadence-conversions' ),
					),
					array(
						'value' => 'fixed_above_trans_header',
						'label' => __( 'Fixed Above Transparent Header', 'kadence-conversions' ),
					),
					array(
						'value' => 'fixed_on_header',
						'label' => __( 'Fixed Top After Scroll', 'kadence-conversions' ),
					),
					array(
						'value' => 'fixed_on_footer_scroll',
						'label' => __( 'Fixed Bottom After Scroll (no space below footer)', 'kadence-conversions' ),
					),
					array(
						'value' => 'fixed_on_footer_scroll_space',
						'label' => __( 'Fixed Bottom After Scroll', 'kadence-conversions' ),
					),
					array(
						'value' => 'fixed_below_footer',
						'label' => __( 'Fixed On Bottom', 'kadence-conversions' ),
					),
					array(
						'value' => 'fixed_on_footer',
						'label' => __( 'Fixed Bottom (no space below footer)', 'kadence-conversions' ),
					),
				),
			),
		);
		return apply_filters( 'kadence_conversions_popup_action_options', $actions );
	}
	/**
	 * Get all public post types.
	 *
	 * @return array of post types.
	 */
	public static function get_post_types() {
		if ( is_null( self::$post_types ) ) {
			$args             = array(
				'public' => true,
				'show_in_rest' => true,
				'_builtin' => false,
			);
			$builtin = array(
				'post',
				'page',
			);
			$output           = 'names'; // names or objects, note names is the default.
			$operator         = 'and';
			$post_types       = get_post_types( $args, $output, $operator );
			self::$post_types = apply_filters( 'kadence_public_post_type_array', array_merge( $builtin, $post_types ) );
		}

		return self::$post_types;
	}

	/**
	 * Get all public post types.
	 *
	 * @return array of post types.
	 */
	public static function get_post_types_objects() {
		if ( is_null( self::$post_types_objects ) ) {
			$args             = array(
				'public' => true,
				'_builtin' => false,
			);
			$output           = 'objects'; // names or objects, note names is the default.
			$operator         = 'and';
			$post_types       = get_post_types( $args, $output, $operator );
			self::$post_types_objects = apply_filters( 'kadence_public_post_type_objects', $post_types );
		}

		return self::$post_types_objects;
	}
	/**
	 * Get array of post types we want to exclude from use in non public areas.
	 *
	 * @return array of post types.
	 */
	public static function get_public_post_types_to_ignore() {
		if ( is_null( self::$public_ignore_post_types ) ) {
			$public_ignore_post_types = array(
				'elementor_library',
				'fl-theme-layout',
				'kt_size_chart',
				'kt_reviews',
				'shop_order',
				'kadence_element',
				'kadence_conversions',
				'kadence_cloud',
				'ele-product-template',
				'ele-p-arch-template',
				'ele-p-loop-template',
				'ele-check-template',
				'jet-menu',
				'jet-popup',
				'jet-smart-filters',
				'jet-theme-core',
				'jet-woo-builder',
				'jet-engine',
				'llms_certificate',
				'llms_my_certificate',
				'sfwd-certificates',
				'sfwd-transactions',
				'reply',
			);
			self::$public_ignore_post_types = apply_filters( 'kadence_public_post_type_ignore_array', $public_ignore_post_types );
		}

		return self::$public_ignore_post_types;
	}
	/**
	 * Get all Author Options
	 */
	public function get_author_options() {
		$roles__in = array();
		foreach ( wp_roles()->roles as $role_slug => $role ) {
			if ( ! empty( $role['capabilities']['edit_posts'] ) ) {
				$roles__in[] = $role_slug;
			}
		}
		$authors = get_users( array( 'roles__in' => $roles__in, 'fields' => array( 'ID', 'display_name' ) ) );
		$output = array();
		foreach ( $authors as $key => $author ) {
			$output[] = array(
				'value' => $author->ID,
				'label' => $author->display_name,
			);
		}
		return apply_filters( 'kadence_pro_element_display_authors', $output );
	}
	/**
	 * Get all taxonomies
	 */
	public function get_taxonomies() {
		$output = array();
		$kadence_public_post_types = $this->get_post_types();
		$ignore_types              = $this->get_public_post_types_to_ignore();
		foreach ( $kadence_public_post_types as $post_type ) {
			$post_type_item  = get_post_type_object( $post_type );
			$post_type_name  = $post_type_item->name;
			if ( ! in_array( $post_type_name, $ignore_types, true ) ) {
				$taxonomies = get_object_taxonomies( $post_type, 'objects' );
				$taxs = array();
				$taxs_archive = array();
				foreach ( $taxonomies as $term_slug => $term ) {
					if ( ! $term->public || ! $term->show_ui ) {
						continue;
					}
					//$taxs[ $term_slug ] = $term;
					$taxs[ $term_slug ] = array(
						'name' => $term->name,
						'label' => $term->label,
					);
					$terms = get_terms( $term_slug );
					$term_items = array();
					if ( ! empty( $terms ) ) {
						foreach ( $terms as $term_key => $term_item ) {
							$term_items[] = array(
								'value' => $term_item->term_id,
								'label' => $term_item->name,
							);
						}
						$output[ $post_type ]['terms'][ $term_slug ] = $term_items;
						$output['taxs'][ $term_slug ] = $term_items;
					}
				}
				if ( 'sfwd-lessons' === $post_type ) {
					$taxs['assigned_course'] = array(
						'name' => 'assigned_course',
						'label' => __( 'Assigned Course', 'kadence-conversions' ),
					);
					$args = array(
						'post_type'              => 'sfwd-courses',
						'no_found_rows'          => true,
						'update_post_term_cache' => false,
						'post_status'            => 'publish',
						'numberposts'            => 333,
						'order'                  => 'ASC',
						'orderby'                => 'menu_order',
						'suppress_filters'       => false,
					);
					$course_posts = get_posts( $args );
					if ( $course_posts && ! empty( $course_posts ) ) {
						foreach ( $course_posts as $course_post ) {
							$term_items[] = array(
								'value' => $course_post->ID,
								'label' => get_the_title( $course_post->ID ),
							);
						}
						$output[ $post_type ]['terms']['assigned_course'] = $term_items;
						$output['taxs']['assigned_course'] = $term_items;
					}
				}
				$output[ $post_type ]['taxonomy'] = $taxs;
			}
		}
		return apply_filters( 'kadence_pro_element_display_taxonomies', $output );
	}
	/**
	 * Register Post Meta options
	 */
	public function register_meta() {
		register_post_meta(
			self::SLUG,
			'_kad_conversion_type',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_trigger',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_show',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_all_show',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'boolean',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_hide',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_user',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_user_hidden',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_device',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_enable_expires',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'boolean',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_expires',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_starts',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_enable_recurring',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'boolean',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_recurring_start',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_recurring_stop',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_recurring_days',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
		register_post_meta(
			self::SLUG,
			'_kad_conversion_language',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => function() {
					return current_user_can( 'edit_kadence_conversions' );
				},
			)
		);
	}

	/**
	 * Registers the Conversion post type.
	 */
	public function register_post_type() {
		$labels = array(
			'name'                  => __( 'Conversion Items', 'kadence_conversions' ),
			'singular_name'         => __( 'Conversion Item', 'kadence_conversions' ),
			'menu_name'             => _x( 'Conversions', 'Admin Menu text', 'kadence_conversions' ),
			'add_new'               => _x( 'Add New', 'Conversion Item', 'kadence_conversions' ),
			'add_new_item'          => __( 'Add New Conversion Item', 'kadence_conversions' ),
			'new_item'              => __( 'New Conversion Item', 'kadence_conversions' ),
			'edit_item'             => __( 'Edit Conversion Item', 'kadence_conversions' ),
			'view_item'             => __( 'View Conversion Item', 'kadence_conversions' ),
			'all_items'             => __( 'All Conversion Items', 'kadence_conversions' ),
			'search_items'          => __( 'Search Conversion Items', 'kadence_conversions' ),
			'parent_item_colon'     => __( 'Parent Conversion Item:', 'kadence_conversions' ),
			'not_found'             => __( 'No Conversion Items found.', 'kadence_conversions' ),
			'not_found_in_trash'    => __( 'No Conversion Items found in Trash.', 'kadence_conversions' ),
			'archives'              => __( 'Conversion Item archives', 'kadence_conversions' ),
			'insert_into_item'      => __( 'Insert into Conversion Item', 'kadence_conversions' ),
			'uploaded_to_this_item' => __( 'Uploaded to this Conversion Item', 'kadence_conversions' ),
			'filter_items_list'     => __( 'Filter Conversion Items list', 'kadence_conversions' ),
			'items_list_navigation' => __( 'Conversion Items list navigation', 'kadence_conversions' ),
			'items_list'            => __( 'Conversion Items list', 'kadence_conversions' ),
		);
		$rewrite = apply_filters( 'kadence_conversions_post_type_url_rewrite', array( 'slug' => 'kadence-conversions' ) );
		$args = array(
			'labels'             => $labels,
			'description'        => __( 'Popups and slide-ins to include in your site.', 'kadence_conversions' ),
			'public'             => false,
			'publicly_queryable' => false,
			'has_archive'        => false,
			'exclude_from_search'=> true,
			'show_ui'            => true,
			'show_in_menu'       => 'kadence-conversions',
			'menu_icon'          => $this->get_icon_svg(),
			'show_in_nav_menus'  => false,
			'show_in_admin_bar'  => false,
			'can_export'         => true,
			'show_in_rest'       => true,
			'rewrite'            => $rewrite,
			'rest_base'          => 'kadence_conversions',
			'capability_type'    => array( 'kadence_conversion', 'kadence_conversions' ),
			'map_meta_cap'       => true,
			'supports'           => array(
				'title',
				'editor',
				'author',
				'custom-fields',
				'revisions',
			),
		);
		register_post_type( self::SLUG, $args );

		// $type_args = array(
		// 	'hierarchical' => false,
		// 	'show_ui' => false,
		// 	'show_in_nav_menus' => false,
		// 	'show_admin_column' => true,
		// 	'query_var' => is_admin(),
		// 	'rewrite' => false,
		// 	'public' => false,
		// 	'label' => _x( 'Type', 'Kadence Conversions', 'kadence-conversions' ),
		// );

		// register_taxonomy( self::TYPE_SLUG, self::SLUG, $type_args );
	}
	/**
	 * Filters the capabilities of a user to conditionally grant them capabilities for managing Popups.
	 *
	 * Any user who can 'edit_theme_options' will have access to manage Popups.
	 *
	 * @param array $allcaps A user's capabilities.
	 * @return array Filtered $allcaps.
	 */
	public function filter_post_type_user_caps( $allcaps ) {
		if ( isset( $allcaps['edit_theme_options'] ) ) {
			$allcaps['edit_kadence_conversions']             = $allcaps['edit_theme_options'];
			$allcaps['edit_others_kadence_conversions']      = $allcaps['edit_theme_options'];
			$allcaps['edit_published_kadence_conversions']   = $allcaps['edit_theme_options'];
			$allcaps['edit_private_kadence_conversions']     = $allcaps['edit_theme_options'];
			$allcaps['delete_kadence_conversions']           = $allcaps['edit_theme_options'];
			$allcaps['delete_others_kadence_conversions']    = $allcaps['edit_theme_options'];
			$allcaps['delete_published_kadence_conversions'] = $allcaps['edit_theme_options'];
			$allcaps['delete_private_kadence_conversions']   = $allcaps['edit_theme_options'];
			$allcaps['publish_kadence_conversions']          = $allcaps['edit_theme_options'];
			$allcaps['read_private_kadence_conversions']     = $allcaps['edit_theme_options'];
		}

		return $allcaps;
	}

	/**
	 * Filters the block area post type columns in the admin list table.
	 *
	 * @since 0.1.0
	 *
	 * @param array $columns Columns to display.
	 * @return array Filtered $columns.
	 */
	private function filter_post_type_columns( array $columns ) : array {

		$add = array(
			'status'          => esc_html__( 'Status', 'kadence-conversions' ),
			'type'            => esc_html__( 'Type', 'kadence-conversions' ),
			'trigger'         => esc_html__( 'Trigger', 'kadence-conversions' ),
			'display'         => esc_html__( 'Display', 'kadence-conversions' ),
			'user_visibility' => esc_html__( 'Visibility', 'kadence-conversions' ),
		);

		$new_columns = array();
		foreach ( $columns as $key => $label ) {
			$new_columns[ $key ] = $label;
			if ( 'title' == $key ) {
				$new_columns = array_merge( $new_columns, $add );
			}
		}

		return $new_columns;
	}
	/**
	 * Finds the label in an array.
	 *
	 * @param array  $data the array data.
	 * @param string $value the value field.
	 */
	public function get_item_label_in_array( $data, $value ) {
		foreach ( $data as $key => $item ) {
			foreach ( $item['options'] as $sub_key => $sub_item ) {
				if ( $sub_item['value'] === $value ) {
					return $sub_item['label'];
				}
			}
		}
		return false;
	}
	/**
	 * Finds the label in an array.
	 *
	 * @param string $slug the value of the meta type.
	 */
	public function get_type_label( $slug ) {
		switch ( $slug ) {
			case 'slide_in':
				$label = __( 'Slide-in', 'kadence-conversions' );
				break;
			case 'banner':
				$label = __( 'Banner', 'kadence-conversions' );
				break;
			default:
				$label = __( 'Popup', 'kadence-conversions' );
				break;
		}
		return $label;
	}
	/**
	 * Finds the label in an array.
	 *
	 * @param string $slug the value of the meta type.
	 */
	public function get_trigger_label( $slug ) {
		switch ( $slug ) {
			case 'time':
				$label = __( 'Time Delay', 'kadence-conversions' );
				break;
			case 'exit_intent':
				$label = __( 'Exit Intent', 'kadence-conversions' );
				break;
			case 'scroll':
				$label = __( 'Scroll Distance', 'kadence-conversions' );
				break;
			case 'content_end':
				$label = __( 'End of Content', 'kadence-conversions' );
				break;
			case 'load':
				$label = __( 'On Load', 'kadence-conversions' );
				break;
			case 'link':
				$label = __( 'Custom Link', 'kadence-conversions' );
				break;
			default:
				$label = __( 'None', 'kadence-conversions' );
				break;
		}
		return $label;
	}

	/**
	 * Renders column content for the block area post type list table.
	 *
	 * @param string $column_name Column name to render.
	 * @param int    $post_id     Post ID.
	 */
	private function render_post_type_column( string $column_name, int $post_id ) {
		if ( 'status' !== $column_name && 'trigger' !== $column_name && 'type' !== $column_name && 'display' !== $column_name && 'user_visibility' !== $column_name ) {
			return;
		}
		$post = get_post( $post_id );
		$meta = $this->get_post_meta_array( $post );
		if ( 'status' === $column_name ) {
			if ( 'publish' === $post->post_status || 'draft' === $post->post_status ) {
				$title = ( 'publish' === $post->post_status ? __( 'Published', 'kadence-conversions' ) : __( 'Draft', 'kadence-conversions' ) );
				echo '<button class="kadence-status-toggle kadence-conversions-status kadence-status-' . esc_attr( $post->post_status ) . '" data-post-status="' . esc_attr( $post->post_status ) . '" data-post-id="' . esc_attr( $post_id ) . '"><span class="kadence-toggle"></span><span class="kadence-status-label">' . esc_html( $title ) . '</span><span class="spinner"></span></button>';
			} else {
				echo '<div class="kadence-static-status-toggle">' . esc_html( $post->post_status ) . '</div>';
			}
		}
		if ( 'trigger' === $column_name ) {
			echo esc_html( $this->get_trigger_label( $meta['trigger'] ) );
		}
		if ( 'type' === $column_name ) {
			$type = $this->get_type_label( $meta['type'] );
			echo '<span class="conversions-type conversions-type-' . esc_attr( $meta['type'] ) . '">';
			echo esc_html( $type );
			echo '</span>';
		}
		if ( 'display' === $column_name ) {
			echo '<strong>' . esc_html__( 'Show on:', 'kadence-conversions' ) . '</strong><br>';
			if ( isset( $meta ) && isset( $meta['show'] ) && is_array( $meta['show'] ) && ! empty( $meta['show'] ) ) {
				foreach ( $meta['show'] as $key => $rule ) {
					$rule_split = explode( '|', $rule['rule'], 2 );
					if ( in_array( $rule_split[0], array( 'singular', 'tax_archive' ) ) ) {
						if ( ! isset( $rule['select'] ) || isset( $rule['select'] ) && 'all' === $rule['select'] ) {
							echo esc_html( 'All ' . $rule['rule'] );
							echo '<br>';
						} elseif ( isset( $rule['select'] ) && 'author' === $rule['select'] ) {
							$label = $this->get_item_label_in_array( $this->get_display_options(), $rule['rule'] );
							echo esc_html( $label . ' Author: ' );
							if ( isset( $rule['subRule'] ) ) {
								$user = get_userdata( $rule['subRule'] );
								if ( isset( $user ) && is_object( $user ) && $user->display_name ) {
									echo esc_html( $user->display_name );
								}
							}
							echo '<br>';
						} elseif ( isset( $rule['select'] ) && 'tax' === $rule['select'] ) {
							$label = $this->get_item_label_in_array( $this->get_display_options(), $rule['rule'] );
							echo esc_html( $label . ' Terms: ' );
							if ( isset( $rule['subRule'] ) && isset( $rule['subSelection'] ) && is_array( $rule['subSelection'] ) ) {
								foreach ( $rule['subSelection'] as $sub_key => $selection ) {
									echo esc_html( $selection['value'] . ', ' );
								}
							}
							echo '<br>';
						} elseif ( isset( $rule['select'] ) && 'ids' === $rule['select'] ) {
							$label = $this->get_item_label_in_array( $this->get_display_options(), $rule['rule'] );
							echo esc_html( $label . ' Items: ' );
							if ( isset( $rule['ids'] ) && is_array( $rule['ids'] ) ) {
								foreach ( $rule['ids'] as $sub_key => $sub_id ) {
									echo esc_html( $sub_id . ', ' );
								}
							}
							echo '<br>';
						} elseif ( isset( $rule['select'] ) && 'individual' === $rule['select'] ) {
							$label = $this->get_item_label_in_array( $this->get_display_options(), $rule['rule'] );
							echo esc_html( $label . ' Terms: ' );
							if ( isset( $rule['subSelection'] ) && is_array( $rule['subSelection'] ) ) {
								$show_taxs   = array();
								foreach ( $rule['subSelection'] as $sub_key => $selection ) {
									if ( isset( $selection['value'] ) && ! empty( $selection['value'] ) ) {
										$show_taxs[] = $selection['value'];
									}
								}
								echo implode( ', ', $show_taxs );
							}
							echo '<br>';
						}
					} else {
						$label = $this->get_item_label_in_array( $this->get_display_options(), $rule['rule'] );
						echo esc_html( $label ) . '<br>';
					}
				}
			} else {
				echo esc_html__( 'Entire Site', 'kadence-conversions' );
			}
		}
		if ( 'user_visibility' === $column_name ) {
			echo '<strong>' . esc_html__( 'Visible to:', 'kadence-conversions' ) . '</strong><br>';
			if ( isset( $meta ) && isset( $meta['user'] ) && is_array( $meta['user'] ) && ! empty( $meta['user'] ) ) {
				$show_roles = array();
				foreach ( $meta['user'] as $key => $user_rule ) {
					if ( isset( $user_rule['role'] ) && ! empty( $user_rule['role'] ) ) {
						$show_roles[] = $this->get_item_label_in_array( $this->get_user_options(), $user_rule['role'] );
					}
				}
				if ( count( $show_roles ) !== 0 ) {
					echo implode( ', ', $show_roles );
				} else {
					echo esc_html__( 'All Users', 'kadence-conversions' );
				}
			} else {
				echo esc_html__( 'All Users', 'kadence-conversions' );
			}
			echo '<br><strong>' . esc_html__( 'Hidden to:', 'kadence-conversions' ) . '</strong><br>';
			if ( isset( $meta ) && isset( $meta['user_hide'] ) && is_array( $meta['user_hide'] ) && ! empty( $meta['user_hide'] ) ) {
				$show_roles = array();
				foreach ( $meta['user_hide'] as $key => $user_rule ) {
					if ( isset( $user_rule['role'] ) && ! empty( $user_rule['role'] ) ) {
						$show_roles[] = $this->get_item_label_in_array( $this->get_user_options(), $user_rule['role'] );
					}
				}
				if ( count( $show_roles ) !== 0 ) {
					echo implode( ', ', $show_roles );
				} else {
					echo esc_html__( 'None', 'kadence-conversions' );
				}
			} else {
				echo esc_html__( 'None', 'kadence-conversions' );
			}
		}
	}

	/**
	 * Renders the popup single template on the front end.
	 *
	 * @param array $layout the layout array.
	 */
	public function popup_single_layout( $layout ) {
		global $post;
		if ( is_singular( self::SLUG ) || ( is_admin() && is_object( $post ) && self::SLUG === $post->post_type ) ) {
			$layout = wp_parse_args(
				array(
					'layout'           => 'fullwidth',
					'boxed'            => 'unboxed',
					'feature'          => 'hide',
					'feature_position' => 'above',
					'comments'         => 'hide',
					'navigation'       => 'hide',
					'title'            => 'hide',
					'transparent'      => 'disable',
					'sidebar'          => 'disable',
					'vpadding'         => 'hide',
					'footer'           => 'disable',
					'header'           => 'disable',
					'content'          => 'enable',
				),
				$layout
			);
		}

		return $layout;
	}
}
Conversion_Post_Type_Controller::get_instance();
