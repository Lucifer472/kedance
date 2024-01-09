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
use function Kadence\kadence;
use function get_editable_roles;
use function do_shortcode;
use function extension_loaded;
use function libxml_use_internal_errors;
/**
 * Class managing the template areas post type.
 */
class Conversions_Frontend {

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
	 * Holds products in cart data array.
	 *
	 * @var Data for products in cart.
	 */
	protected static $cart_products = null;

	/**
	 * Holds categories in cart data array.
	 *
	 * @var Data for product categories in cart.
	 */
	protected static $cart_categories = null;

	/**
	 * Holds cart total price.
	 *
	 * @var number of cart total in active currency.
	 */
	protected static $cart_total = null;

	/**
	 * Holds cart total weight.
	 *
	 * @var number of cart total weight.
	 */
	protected static $cart_total_weight = null;

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
		add_action( 'init', array( $this, 'setup_content_filter' ), 9 );
		add_action( 'wp', array( $this, 'init_frontend_hooks' ), 99 );
		// Add conversion block.
		add_action( 'init', array( $this, 'register_conversion_script_block' ) );
		add_action( 'init', array( $this, 'register_scripts' ) );
		add_action( 'wp_footer', array( $this, 'conversions_data_enqueue' ), 9 );
		add_action( 'get_footer', array( $this, 'add_end_of_content_element' ), 1 );
		add_action( 'wp_ajax_kadence_conversions_get_updated_cart', array( $this, 'get_updated_cart' ) );
		add_action( 'wp_ajax_nopriv_kadence_conversions_get_updated_cart', array( $this, 'get_updated_cart' ) );
	}
	/**
	 * Enqueue scripts and styles.
	 */
	public function add_end_of_content_element() {
		echo '<span id="kadence-conversion-end-of-content"></span>';
	}
	/**
	 * Enqueue scripts and styles.
	 */
	public function register_scripts() {
		wp_register_style( 'kadence-conversions', KADENCE_CONVERSIONS_URL . 'assets/kadence-conversions.css', array(), KADENCE_CONVERSIONS_VERSION );
		wp_register_script( 'kadence-conversions', KADENCE_CONVERSIONS_URL . 'assets/kadence-conversions.min.js', array(), KADENCE_CONVERSIONS_VERSION, true );
	}
	/**
	 * Uses ajax to get the updated cart info.
	 */
	public function get_updated_cart() {
		check_ajax_referer( 'kadence_conversions', 'nonce' );
		$data = array();
		if ( class_exists( 'woocommerce' ) && isset( WC()->cart ) ) {
			$active_cart_products = array();
			foreach ( WC()->cart->get_cart() as $cart_item_key => $values ) {
				$_product = $values['data'];
				if ( isset( $_product->variation_id ) ) {
					$active_cart_products[] = $_product->get_parent_id();
				} else {
					$active_cart_products[] = $_product->get_id();
				}
			}
			$data['cartProducts'] = $active_cart_products;
			$data['cartTotal']    = WC()->cart->subtotal_ex_tax;
		}
		wp_send_json_success( $data );
	}
	/**
	 * Enqueue script data.
	 */
	public function conversions_data_enqueue() {
		$settings  = json_decode( get_option( 'kadence_conversions' ), true );
		$gtag      = 'false';
		$analytics = 'true';
		if ( isset( $settings ) && is_array( $settings ) && isset( $settings['google_analytics'] ) && $settings['google_analytics'] ) {
			$gtag = 'true';
		}
		if ( isset( $settings ) && is_array( $settings ) && isset( $settings['enable_analytics'] ) && ! $settings['enable_analytics'] ) {
			$analytics = 'false';
		}
		wp_localize_script(
			'kadence-conversions',
			'kadenceConversionsConfig',
			array(
				'ajax_url'     => admin_url( 'admin-ajax.php' ),
				'ajax_nonce'   => wp_create_nonce( 'kadence_conversions' ),
				'site_slug'    => apply_filters( 'kadence_conversions_site_slug', sanitize_title( get_bloginfo( 'name' ) ) ),
				'gtag'         => $gtag,
				'analytics'    => $analytics,
				'items'        => wp_json_encode( self::$conversions ),
				'woocommerce'  => ( class_exists( 'woocommerce' ) ? true : false ),
				'cartTotal'    => self::$cart_total,
				'cartProducts' => self::$cart_products,
			)
		);
	}
	/**
	 * Add conversion block.
	 */
	public function register_conversion_script_block() {
		// Check if this is the intended custom post type.
		if ( is_admin() ) {
			global $pagenow;
			$typenow = '';
			if ( 'post-new.php' === $pagenow ) {
				if ( isset( $_REQUEST['post_type'] ) && post_type_exists( $_REQUEST['post_type'] ) ) {
					$typenow = $_REQUEST['post_type'];
				};
			} elseif ( 'post.php' === $pagenow ) {
				if ( isset( $_GET['post'] ) && isset( $_POST['post_ID'] ) && (int) $_GET['post'] !== (int) $_POST['post_ID'] ) {
					// Do nothing
				} elseif ( isset( $_GET['post'] ) ) {
					$post_id = (int) $_GET['post'];
				} elseif ( isset( $_POST['post_ID'] ) ) {
					$post_id = (int) $_POST['post_ID'];
				}

				if ( $post_id ) {
					$post = get_post( $post_id );
					$typenow = $post->post_type;
				}
			}
			if ( $typenow != self::SLUG ) {
				return;
			}
		}

		$plugin_asset_meta = $this->get_asset_file( 'build/conversions' );
		// Register the block.
		wp_register_script(
			'kadence-conversions-block',
			KADENCE_CONVERSIONS_URL . 'build/conversions.js',
			$plugin_asset_meta['dependencies'],
			$plugin_asset_meta['version']
		);
		wp_register_style(
			'kadence-conversions-block',
			KADENCE_CONVERSIONS_URL . 'build/conversions.css',
			array(),
			$plugin_asset_meta['version']
		);
		register_block_type(
			'kadence-conversions/conversion',
			array(
				'editor_script' => 'kadence-conversions-block',
				'editor_style' => 'kadence-conversions-block',
				'render_callback' => array( $this, 'render_conversion' ),
			)
		);
	}
	/**
	 * Render Conversion Block
	 *
	 * @param array    $attributes Blocks attribtues.
	 * @param string   $content    Block content.
     * @param WP_Block $block      Block instance.
	 */
	public function render_conversion( $attributes, $content, $block ) {
		if ( ! is_array( $attributes ) ) {
			return '';
		}
		if ( isset( $attributes['uniqueID'] ) ) {
			$unique_id      = $attributes['uniqueID'];
			$post_id        = ( isset( $attributes['postID'] ) ? $attributes['postID'] : 'unset-' . $unique_id );
			$campaign_id    = ( isset( $attributes['campaignID'] ) && ! empty( $attributes['campaignID'] ) ? $attributes['campaignID'] : $unique_id );
			$type           = ( isset( $attributes['conversionType'] ) ? $attributes['conversionType'] : 'popup' );
			$valign         = ( isset( $attributes['verticalAlign'] ) ? $attributes['verticalAlign'] : 'top' );
			$view_count     = ( isset( $attributes['pageViewCount'] ) ? $attributes['pageViewCount'] : 5 );
			$enable_offset  = ( isset( $attributes['offset'] ) ? $attributes['offset'] : true );
			$cart_products  = false;
			$cart_total     = false;
			if ( class_exists( 'woocommerce' ) ) {
				if ( ( isset( $attributes['requireCartProducts'] ) && $attributes['requireCartProducts'] ) || ( isset( $attributes['preventCartProducts'] ) && $attributes['preventCartProducts'] ) ) {
					if ( is_null( self::$cart_products ) && isset( WC()->cart ) ) {
						$active_cart_products = array();
						foreach ( WC()->cart->get_cart() as $cart_item_key => $values ) {
							$_product = $values['data'];
							if ( isset( $_product->variation_id ) ) {
								$active_cart_products[] = $_product->get_parent_id();
							} else {
								$active_cart_products[] = $_product->get_id();
							}
						}
						self::$cart_products = $active_cart_products;
					}
					$cart_products = self::$cart_products;
				}
				if ( ( isset( $attributes['requireCartMinimum'] ) && $attributes['requireCartMinimum'] ) || ( isset( $attributes['requireCartMaximum'] ) && $attributes['requireCartMaximum'] ) ) {
					if ( is_null( self::$cart_total ) && isset( WC()->cart ) ) {
						self::$cart_total = WC()->cart->subtotal_ex_tax;
					}
					$cart_total = self::$cart_total;
				}
			}
			if ( ! isset( self::$conversions[ $post_id ] ) ) {
				self::$conversions[ $post_id ] = array();
			}
			$conversion_settings = array(
				'type'           => $type,
				'trigger'        => ( isset( $attributes['conversionTrigger'] ) ? $attributes['conversionTrigger'] : '' ),
				'goal'           => ( isset( $attributes['conversionGoal'] ) ? $attributes['conversionGoal'] : 'form' ),
				'goal_class'     => ( isset( $attributes['goalClass'] ) ? $attributes['goalClass'] : '' ),
				'goal_close'     => ( isset( $attributes['goalClose'] ) ? $attributes['goalClose'] : false ),
				'overlay_close'  => ( isset( $attributes['overlayClose'] ) ? $attributes['overlayClose'] : true ),
				'campaign_id'    => $campaign_id,
				'unique_id'      => $unique_id,
				'post_id'        => $post_id,
				'delay'          => ( isset( $attributes['delay'] ) ? $attributes['delay'] : 5000 ),
				'scroll'         => ( isset( $attributes['scroll'] ) ? $attributes['scroll'] : 300 ),
				'scrollHide'     => ( isset( $attributes['scrollHide'] ) && $attributes['scrollHide'] && 'banner' === $type ? true : false ),
				'repeat_control' => ( isset( $attributes['repeatControl'] ) ? $attributes['repeatControl'] : true ),
				'tracking'       => ( isset( $attributes['conversionTracking'] ) ? $attributes['conversionTracking'] : true ),
				'close_repeat'   => ( isset( $attributes['closeRepeat'] ) ? $attributes['closeRepeat'] : 30 ),
				'convert_repeat' => ( isset( $attributes['convertRepeat'] ) ? $attributes['convertRepeat'] : 90 ),
				'offset'         => ( 'banner' === $type && $enable_offset ? $valign : '' ),
				'referrer'       => ( ! empty( $attributes['referrer'] ) ? array_map( 'trim', explode( ',', $attributes['referrer'] ) ) : '' ),
				'cookieCheck'    => ( ! empty( $attributes['cookieCheck'] ) ? $attributes['cookieCheck'] : '' ),
				'queryStrings'   => ( ! empty( $attributes['queryStrings'] ) ? array_map( 'trim', explode( PHP_EOL, $attributes['queryStrings'] ) ) : '' ),
				'pageViews'      => ( isset( $attributes['requirePageViews'] ) && $attributes['requirePageViews'] ? $view_count : '' ),
				'cartProducts'   => $cart_products,
				'cartTotal'      => $cart_total,
				'products'       => ( isset( $attributes['requireCartProducts'] ) && $attributes['requireCartProducts'] && isset( $attributes['cartProducts'] ) && $attributes['cartProducts'] ? $attributes['cartProducts'] : false ),
				'preventProducts'       => ( isset( $attributes['preventCartProducts'] ) && $attributes['preventCartProducts'] && isset( $attributes['preventProducts'] ) && $attributes['preventProducts'] ? $attributes['preventProducts'] : false ),
				'cartMin'        => ( isset( $attributes['requireCartMinimum'] ) && $attributes['requireCartMinimum'] && isset( $attributes['cartMinimum'] ) ? $attributes['cartMinimum'] : false ),
				'cartMax'        => ( isset( $attributes['requireCartMaximum'] ) && $attributes['requireCartMaximum'] && isset( $attributes['cartMaximum'] ) ? $attributes['cartMaximum'] : false ),
			);
			self::$conversions[ $post_id ] = array_merge( self::$conversions[ $post_id ], $conversion_settings );
			$style_id = 'kadence-conversions-' . esc_attr( $post_id );
			if ( ! wp_style_is( $style_id, 'enqueued' ) ) {
				$attributes = apply_filters( 'kadence_conversions_render_block_attributes', $attributes );
				$css        = $this->output_css( $attributes, $post_id );
				if ( ! empty( $css ) ) {
					if ( doing_filter( 'the_content' ) ) {
						$content = '<style id="' . $style_id . '">' . $css . '</style>' . $content;
					} else {
						$this->render_inline_css( $css, $style_id, true );
					}
				}
			}
		}
		return $content;
	}
	/**
	 * Render Inline CSS helper function
	 *
	 * @param array  $css the css for each rendered block.
	 * @param string $style_id the unique id for the rendered style.
	 * @param bool   $in_content the bool for whether or not it should run in content.
	 */
	public function render_inline_css( $css, $style_id, $in_content = false ) {
		if ( ! is_admin() ) {
			wp_register_style( $style_id, false );
			wp_enqueue_style( $style_id );
			wp_add_inline_style( $style_id, $css );
			if ( 1 === did_action( 'wp_head' ) && $in_content ) {
				wp_print_styles( $style_id );
			}
		}
	}
	/**
	 * Output CSS styling for countdown Block
	 *
	 * @param array  $attr the block attributes.
	 * @param string $post_id the block post id.
	 */
	public function output_css( $attr, $post_id ) {
		$css                          = new Minified_CSS();
		$media_query                  = array();
		$media_query['mobile']        = apply_filters( 'kadence_mobile_media_query', '(max-width: 767px)' );
		$media_query['mobileReverse'] = apply_filters( 'kadence_mobile_reverse_media_query', '(min-width: 768px)' );
		$media_query['tablet']        = apply_filters( 'kadence_tablet_media_query', '(max-width: 1024px)' );
		$media_query['tabletOnly']    = apply_filters( 'kadence_tablet_only_media_query', '@media (min-width: 768px) and (max-width: 1024px)' );
		$media_query['desktop']       = apply_filters( 'kadence_tablet_media_query', '(min-width: 1025px)' );

		if ( isset( $attr['closeColor'] ) || isset( $attr['closeHoverColor'] ) || isset( $attr['closeBackground'] ) || isset( $attr['closeHoverBackground'] ) || ( isset( $attr['closePadding'] ) && is_array( $attr['closePadding'] ) ) || ( isset( $attr['closeSize'] ) && is_array( $attr['closeSize'] ) && isset( $attr['closeSize'][0] ) && is_numeric( $attr['closeSize'][0] ) ) ) {
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversions-close' );
			if ( isset( $attr['closeColor'] ) && ! empty( $attr['closeColor'] ) ) {
				$css->add_property( 'color', $css->render_color( $attr['closeColor'] ) );
			}
			if ( isset( $attr['closeBackground'] ) && ! empty( $attr['closeBackground'] ) ) {
				$css->add_property( 'background', $css->render_color( $attr['closeBackground'] ) );
			}
			if ( isset( $attr['closeSize'] ) && is_array( $attr['closeSize'] ) && isset( $attr['closeSize'][0] ) && is_numeric( $attr['closeSize'][0] ) ) {
				$font_unit = 'px';
				if ( isset( $attr['closeSizeUnit'] ) && ! empty( $attr['closeSizeUnit'] ) ) {
					$font_unit = $attr['closeSizeUnit'];
				}
				$css->add_property( 'font-size', $attr['closeSize'][0] . $font_unit );
			}
			if ( isset( $attr['closePadding'] ) && is_array( $attr['closePadding'] ) ) {
				$padding_unit = 'px';
				if ( isset( $attr['closePaddingUnit'] ) && ! empty( $attr['closePaddingUnit'] ) ) {
					$padding_unit = $attr['closePaddingUnit'];
				}
				if ( isset( $attr['closePadding'][0] ) && is_numeric( $attr['closePadding'][0] ) ) {
					$css->add_property( 'padding-top', $attr['closePadding'][0] . $padding_unit );
				}
				if ( isset( $attr['closePadding'][1] ) && is_numeric( $attr['closePadding'][1] ) ) {
					$css->add_property( 'padding-right', $attr['closePadding'][1] . $padding_unit );
				}
				if ( isset( $attr['closePadding'][2] ) && is_numeric( $attr['closePadding'][2] ) ) {
					$css->add_property( 'padding-bottom', $attr['closePadding'][2] . $padding_unit );
				}
				if ( isset( $attr['closePadding'][3] ) && is_numeric( $attr['closePadding'][3] ) ) {
					$css->add_property( 'padding-left', $attr['closePadding'][3] . $padding_unit );
				}
			}
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversions-close:hover' );
			if ( isset( $attr['closeHoverColor'] ) && ! empty( $attr['closeHoverColor'] ) ) {
				$css->add_property( 'color', $css->render_color( $attr['closeHoverColor'] ) );
			}
			if ( isset( $attr['closeHoverBackground'] ) && ! empty( $attr['closeHoverBackground'] ) ) {
				$css->add_property( 'background', $css->render_color( $attr['closeHoverBackground'] ) );
			}
		}
		if ( isset( $attr['closePaddingTablet'] ) && is_array( $attr['closePaddingTablet'] ) || ( isset( $attr['closeSize'] ) && is_array( $attr['closeSize'] ) && isset( $attr['closeSize'][1] ) && is_numeric( $attr['closeSize'][1] ) ) ) {
			$css->start_media_query( $media_query['tablet'] );
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversions-close' );
			if ( isset( $attr['closeSize'] ) && is_array( $attr['closeSize'] ) && isset( $attr['closeSize'][1] ) && is_numeric( $attr['closeSize'][1] ) ) {
				$font_unit = 'px';
				if ( isset( $attr['closeSizeUnit'] ) && ! empty( $attr['closeSizeUnit'] ) ) {
					$font_unit = $attr['closeSizeUnit'];
				}
				$css->add_property( 'font-size', $attr['closeSize'][1] . $font_unit );
			}
			if ( isset( $attr['closePaddingTablet'] ) && is_array( $attr['closePaddingTablet'] ) ) {
				$padding_unit = 'px';
				if ( isset( $attr['closePaddingUnit'] ) && ! empty( $attr['closePaddingUnit'] ) ) {
					$padding_unit = $attr['closePaddingUnit'];
				}
				if ( isset( $attr['closePaddingTablet'][0] ) && is_numeric( $attr['closePaddingTablet'][0] ) ) {
					$css->add_property( 'padding-top', $attr['closePaddingTablet'][0] . $padding_unit );
				}
				if ( isset( $attr['closePaddingTablet'][1] ) && is_numeric( $attr['closePaddingTablet'][1] ) ) {
					$css->add_property( 'padding-right', $attr['closePaddingTablet'][1] . $padding_unit );
				}
				if ( isset( $attr['closePaddingTablet'][2] ) && is_numeric( $attr['closePaddingTablet'][2] ) ) {
					$css->add_property( 'padding-bottom', $attr['closePaddingTablet'][2] . $padding_unit );
				}
				if ( isset( $attr['closePaddingTablet'][3] ) && is_numeric( $attr['closePaddingTablet'][3] ) ) {
					$css->add_property( 'padding-left', $attr['closePaddingTablet'][3] . $padding_unit );
				}
			}
			$css->stop_media_query();
		}
		if ( isset( $attr['closePaddingMobile'] ) && is_array( $attr['closePaddingMobile'] ) || ( isset( $attr['closeSize'] ) && is_array( $attr['closeSize'] ) && isset( $attr['closeSize'][2] ) && is_numeric( $attr['closeSize'][2] ) ) ) {
			$css->start_media_query( $media_query['mobile'] );
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversions-close' );
			if ( isset( $attr['closeSize'] ) && is_array( $attr['closeSize'] ) && isset( $attr['closeSize'][2] ) && is_numeric( $attr['closeSize'][2] ) ) {
				$font_unit = 'px';
				if ( isset( $attr['closeSizeUnit'] ) && ! empty( $attr['closeSizeUnit'] ) ) {
					$font_unit = $attr['closeSizeUnit'];
				}
				$css->add_property( 'font-size', $attr['closeSize'][2] . $font_unit );
			}
			if ( isset( $attr['closePaddingMobile'] ) && is_array( $attr['closePaddingMobile'] ) ) {
				$padding_unit = 'px';
				if ( isset( $attr['closePaddingUnit'] ) && ! empty( $attr['closePaddingUnit'] ) ) {
					$padding_unit = $attr['closePaddingUnit'];
				}
				if ( isset( $attr['closePaddingMobile'][0] ) && is_numeric( $attr['closePaddingMobile'][0] ) ) {
					$css->add_property( 'padding-top', $attr['closePaddingMobile'][0] . $padding_unit );
				}
				if ( isset( $attr['closePaddingMobile'][1] ) && is_numeric( $attr['closePaddingMobile'][1] ) ) {
					$css->add_property( 'padding-right', $attr['closePaddingMobile'][1] . $padding_unit );
				}
				if ( isset( $attr['closePaddingMobile'][2] ) && is_numeric( $attr['closePaddingMobile'][2] ) ) {
					$css->add_property( 'padding-bottom', $attr['closePaddingMobile'][2] . $padding_unit );
				}
				if ( isset( $attr['closePaddingMobile'][3] ) && is_numeric( $attr['closePaddingMobile'][3] ) ) {
					$css->add_property( 'padding-left', $attr['closePaddingMobile'][3] . $padding_unit );
				}
			}
			$css->stop_media_query();
		}
		if ( isset( $attr['overlayBackground'][0] ) && is_array( $attr['overlayBackground'][0] ) ) {
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversion-overlay' );
			$overlay = $attr['overlayBackground'][0];
			if ( isset( $overlay['opacity'] ) && is_numeric( $overlay['opacity'] ) ) {
				$css->add_property( 'opacity', $overlay['opacity'] );
			}
			if ( ! empty( $overlay['bgColor'] ) ) {
				$css->add_property( 'background-color', $css->render_color( $overlay['bgColor'] ) );
			}
			if ( ! empty( $overlay['bgImg'] ) ) {
				$css->add_property( 'background-image', sprintf( "url('%s')", $overlay['bgImg'] ) );
				$css->add_property( 'background-size', ( isset( $overlay['bgImgSize'] ) ? $overlay['bgImgSize'] : 'cover' ) );
				$css->add_property( 'background-position', ( isset( $overlay['bgImgPosition'] ) ? $overlay['bgImgPosition'] : 'center center' ) );
				$css->add_property( 'background-attachment', ( isset( $overlay['bgImgAttachment'] ) ? $overlay['bgImgAttachment'] : 'scroll' ) );
				$css->add_property( 'background-repeat', ( isset( $overlay['bgImgRepeat'] ) ? $overlay['bgImgRepeat'] : 'no-repeat' ) );
			}
		}
		if ( ( isset( $attr['background'] ) && is_array( $attr['background'] ) ) || ( isset( $attr['margin'] ) && is_array( $attr['margin'] ) ) || isset( $attr['border'] ) || ( isset( $attr['borderRadius'] ) && is_array( $attr['borderRadius'] ) ) || ( isset( $attr['borderWidth'] ) && is_array( $attr['borderWidth'] ) ) ) {
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversion' );
			if ( isset( $attr['margin'][0] ) && is_numeric( $attr['margin'][0] ) ) {
				$css->add_property( 'margin-top', $attr['margin'][0] . ( isset( $attr['marginUnit'] ) ? $attr['marginUnit'] : 'px' ) );
			}
			if ( isset( $attr['margin'][1] ) && is_numeric( $attr['margin'][1] ) ) {
				$css->add_property( 'margin-right', $attr['margin'][1] . ( isset( $attr['marginUnit'] ) ? $attr['marginUnit'] : 'px' ) );
			}
			if ( isset( $attr['margin'][2] ) && is_numeric( $attr['margin'][2] ) ) {
				$css->add_property( 'margin-bottom', $attr['margin'][2] . ( isset( $attr['marginUnit'] ) ? $attr['marginUnit'] : 'px' ) );
			}
			if ( isset( $attr['margin'][3] ) && is_numeric( $attr['margin'][3] ) ) {
				$css->add_property( 'margin-left', $attr['margin'][3] . ( isset( $attr['marginUnit'] ) ? $attr['marginUnit'] : 'px' ) );
			}
			if ( isset( $attr['background'][0] ) && is_array( $attr['background'][0] ) ) {
				$background = $attr['background'][0];
				if ( ! empty( $background['bgColor'] ) ) {
					$css->add_property( 'background-color', $css->render_color( $background['bgColor'] ) );
				}
				if ( ! empty( $background['bgImg'] ) ) {
					$css->add_property( 'background-image', sprintf( "url('%s')", $background['bgImg'] ) );
					$css->add_property( 'background-size', ( isset( $background['bgImgSize'] ) ? $background['bgImgSize'] : 'cover' ) );
					$css->add_property( 'background-position', ( isset( $background['bgImgPosition'] ) ? $background['bgImgPosition'] : 'center center' ) );
					$css->add_property( 'background-attachment', ( isset( $background['bgImgAttachment'] ) ? $background['bgImgAttachment'] : 'scroll' ) );
					$css->add_property( 'background-repeat', ( isset( $background['bgImgRepeat'] ) ? $background['bgImgRepeat'] : 'no-repeat' ) );
				}
			}
			if ( isset( $attr['border'] ) && ! empty( $attr['border'] ) ) {
				$css->add_property( 'border-color', $css->render_color( $attr['border'] ) );
			}
			if ( isset( $attr['borderRadius'] ) && is_array( $attr['borderRadius'] ) ) {
				if ( isset( $attr['borderRadius'][0] ) && is_numeric( $attr['borderRadius'][0] ) ) {
					$css->add_property( 'border-top-left-radius', $attr['borderRadius'][0] . ( isset( $attr['borderRadiusUnit'] ) ? $attr['borderRadiusUnit'] : 'px' ) );
				}
				if ( isset( $attr['borderRadius'][1] ) && is_numeric( $attr['borderRadius'][1] ) ) {
					$css->add_property( 'border-top-right-radius', $attr['borderRadius'][1] . ( isset( $attr['borderRadiusUnit'] ) ? $attr['borderRadiusUnit'] : 'px' ) );
				}
				if ( isset( $attr['borderRadius'][2] ) && is_numeric( $attr['borderRadius'][2] ) ) {
					$css->add_property( 'border-bottom-right-radius', $attr['borderRadius'][2] . ( isset( $attr['borderRadiusUnit'] ) ? $attr['borderRadiusUnit'] : 'px' ) );
				}
				if ( isset( $attr['borderRadius'][3] ) && is_numeric( $attr['borderRadius'][3] ) ) {
					$css->add_property( 'border-bottom-left-radius', $attr['borderRadius'][3] . ( isset( $attr['borderRadiusUnit'] ) ? $attr['borderRadiusUnit'] : 'px' ) );
				}
			}
			if ( isset( $attr['borderWidth'] ) && is_array( $attr['borderWidth'] ) ) {
				if ( isset( $attr['borderWidth'][0] ) && is_numeric( $attr['borderWidth'][0] ) ) {
					$css->add_property( 'border-top-width', $attr['borderWidth'][0] . 'px' );
				}
				if ( isset( $attr['borderWidth'][1] ) && is_numeric( $attr['borderWidth'][1] ) ) {
					$css->add_property( 'border-right-width', $attr['borderWidth'][1] . 'px' );
				}
				if ( isset( $attr['borderWidth'][2] ) && is_numeric( $attr['borderWidth'][2] ) ) {
					$css->add_property( 'border-bottom-width', $attr['borderWidth'][2] . 'px' );
				}
				if ( isset( $attr['borderWidth'][3] ) && is_numeric( $attr['borderWidth'][3] ) ) {
					$css->add_property( 'border-left-width', $attr['borderWidth'][3] . 'px' );
				}
			}
		}
		if ( isset( $attr['shadow'] ) && is_array( $attr['shadow'] ) && isset( $attr['shadow'][0] ) && is_array( $attr['shadow'][0] ) && isset( $attr['shadow'][0]['enable'] ) && $attr['shadow'][0]['enable'] ) {
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversion' );
			$css->add_property( 'box-shadow', ( isset( $attr['shadow'][0]['inset'] ) && true === $attr['shadow'][0]['inset'] ? 'inset ' : '' ) . ( isset( $attr['shadow'][0]['hOffset'] ) && is_numeric( $attr['shadow'][0]['hOffset'] ) ? $attr['shadow'][0]['hOffset'] : '0' ) . 'px ' . ( isset( $attr['shadow'][0]['vOffset'] ) && is_numeric( $attr['shadow'][0]['vOffset'] ) ? $attr['shadow'][0]['vOffset'] : '0' ) . 'px ' . ( isset( $attr['shadow'][0]['blur'] ) && is_numeric( $attr['shadow'][0]['blur'] ) ? $attr['shadow'][0]['blur'] : '14' ) . 'px ' . ( isset( $attr['shadow'][0]['spread'] ) && is_numeric( $attr['shadow'][0]['spread'] ) ? $attr['shadow'][0]['spread'] : '0' ) . 'px ' . $css->render_color( ( isset( $attr['shadow'][0]['color'] ) && ! empty( $attr['shadow'][0]['color'] ) ? $attr['shadow'][0]['color'] : 'rgba(0,0,0,0.2)' ) ) );
		} else if ( ! isset( $attr['shadow'] ) ) {
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversion' );
			$css->add_property( 'box-shadow', '0 0 14px 0 rgba(0,0,0,0.2)' );
		}
		if ( ( isset( $attr['marginTablet'] ) && is_array( $attr['marginTablet'] ) ) || ( isset( $attr['borderRadiusTablet'] ) && is_array( $attr['borderRadiusTablet'] ) ) || ( isset( $attr['borderWidthTablet'] ) && is_array( $attr['borderWidthTablet'] ) ) ) {
			$css->start_media_query( $media_query['tablet'] );
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversion' );
			if ( isset( $attr['marginTablet'][0] ) && is_numeric( $attr['marginTablet'][0] ) ) {
				$css->add_property( 'margin-top', $attr['marginTablet'][0] . ( isset( $attr['marginUnit'] ) ? $attr['marginUnit'] : 'px' ) );
			}
			if ( isset( $attr['marginTablet'][1] ) && is_numeric( $attr['marginTablet'][1] ) ) {
				$css->add_property( 'margin-right', $attr['marginTablet'][1] . ( isset( $attr['marginUnit'] ) ? $attr['marginUnit'] : 'px' ) );
			}
			if ( isset( $attr['marginTablet'][2] ) && is_numeric( $attr['marginTablet'][2] ) ) {
				$css->add_property( 'margin-bottom', $attr['marginTablet'][2] . ( isset( $attr['marginUnit'] ) ? $attr['marginUnit'] : 'px' ) );
			}
			if ( isset( $attr['marginTablet'][3] ) && is_numeric( $attr['marginTablet'][3] ) ) {
				$css->add_property( 'margin-left', $attr['marginTablet'][3] . ( isset( $attr['marginUnit'] ) ? $attr['marginUnit'] : 'px' ) );
			}
			if ( isset( $attr['borderRadiusTablet'] ) && is_array( $attr['borderRadiusTablet'] ) ) {
				if ( isset( $attr['borderRadiusTablet'][0] ) && is_numeric( $attr['borderRadiusTablet'][0] ) ) {
					$css->add_property( 'border-top-left-radius', $attr['borderRadiusTablet'][0] . ( isset( $attr['borderRadiusUnit'] ) ? $attr['borderRadiusUnit'] : 'px' ) );
				}
				if ( isset( $attr['borderRadiusTablet'][1] ) && is_numeric( $attr['borderRadiusTablet'][1] ) ) {
					$css->add_property( 'border-top-right-radius', $attr['borderRadiusTablet'][1] . ( isset( $attr['borderRadiusUnit'] ) ? $attr['borderRadiusUnit'] : 'px' ) );
				}
				if ( isset( $attr['borderRadiusTablet'][2] ) && is_numeric( $attr['borderRadiusTablet'][2] ) ) {
					$css->add_property( 'border-bottom-right-radius', $attr['borderRadiusTablet'][2] . ( isset( $attr['borderRadiusUnit'] ) ? $attr['borderRadiusUnit'] : 'px' ) );
				}
				if ( isset( $attr['borderRadiusTablet'][3] ) && is_numeric( $attr['borderRadiusTablet'][3] ) ) {
					$css->add_property( 'border-bottom-left-radius', $attr['borderRadiusTablet'][3] . ( isset( $attr['borderRadiusUnit'] ) ? $attr['borderRadiusUnit'] : 'px' ) );
				}
			}
			if ( isset( $attr['borderWidthTablet'] ) && is_array( $attr['borderWidthTablet'] ) ) {
				if ( isset( $attr['borderWidthTablet'][0] ) && is_numeric( $attr['borderWidthTablet'][0] ) ) {
					$css->add_property( 'border-top-width', $attr['borderWidthTablet'][0] . 'px' );
				}
				if ( isset( $attr['borderWidthTablet'][1] ) && is_numeric( $attr['borderWidthTablet'][1] ) ) {
					$css->add_property( 'border-right-width', $attr['borderWidthTablet'][1] . 'px' );
				}
				if ( isset( $attr['borderWidthTablet'][2] ) && is_numeric( $attr['borderWidthTablet'][2] ) ) {
					$css->add_property( 'border-bottom-width', $attr['borderWidthTablet'][2] . 'px' );
				}
				if ( isset( $attr['borderWidthTablet'][3] ) && is_numeric( $attr['borderWidthTablet'][3] ) ) {
					$css->add_property( 'border-left-width', $attr['borderWidthTablet'][3] . 'px' );
				}
			}
			$css->stop_media_query();
		}
		if ( ( isset( $attr['marginMobile'] ) && is_array( $attr['marginMobile'] ) ) || ( isset( $attr['borderRadiusMobile'] ) && is_array( $attr['borderRadiusMobile'] ) ) || ( isset( $attr['borderWidthMobile'] ) && is_array( $attr['borderWidthMobile'] ) ) ) {
			$css->start_media_query( $media_query['mobile'] );
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversion' );
			if ( isset( $attr['marginMobile'][0] ) && is_numeric( $attr['marginMobile'][0] ) ) {
				$css->add_property( 'margin-top', $attr['marginMobile'][0] . ( isset( $attr['marginUnit'] ) ? $attr['marginUnit'] : 'px' ) );
			}
			if ( isset( $attr['marginMobile'][1] ) && is_numeric( $attr['marginMobile'][1] ) ) {
				$css->add_property( 'margin-right', $attr['marginMobile'][1] . ( isset( $attr['marginUnit'] ) ? $attr['marginUnit'] : 'px' ) );
			}
			if ( isset( $attr['marginMobile'][2] ) && is_numeric( $attr['marginMobile'][2] ) ) {
				$css->add_property( 'margin-bottom', $attr['marginMobile'][2] . ( isset( $attr['marginUnit'] ) ? $attr['marginUnit'] : 'px' ) );
			}
			if ( isset( $attr['marginMobile'][3] ) && is_numeric( $attr['marginMobile'][3] ) ) {
				$css->add_property( 'margin-left', $attr['marginMobile'][3] . ( isset( $attr['marginUnit'] ) ? $attr['marginUnit'] : 'px' ) );
			}
			if ( isset( $attr['borderRadiusMobile'] ) && is_array( $attr['borderRadiusMobile'] ) ) {
				if ( isset( $attr['borderRadiusMobile'][0] ) && is_numeric( $attr['borderRadiusMobile'][0] ) ) {
					$css->add_property( 'border-top-left-radius', $attr['borderRadiusMobile'][0] . ( isset( $attr['borderRadiusUnit'] ) ? $attr['borderRadiusUnit'] : 'px' ) );
				}
				if ( isset( $attr['borderRadiusMobile'][1] ) && is_numeric( $attr['borderRadiusMobile'][1] ) ) {
					$css->add_property( 'border-top-right-radius', $attr['borderRadiusMobile'][1] . ( isset( $attr['borderRadiusUnit'] ) ? $attr['borderRadiusUnit'] : 'px' ) );
				}
				if ( isset( $attr['borderRadiusMobile'][2] ) && is_numeric( $attr['borderRadiusMobile'][2] ) ) {
					$css->add_property( 'border-bottom-right-radius', $attr['borderRadiusMobile'][2] . ( isset( $attr['borderRadiusUnit'] ) ? $attr['borderRadiusUnit'] : 'px' ) );
				}
				if ( isset( $attr['borderRadiusMobile'][3] ) && is_numeric( $attr['borderRadiusMobile'][3] ) ) {
					$css->add_property( 'border-bottom-left-radius', $attr['borderRadiusMobile'][3] . ( isset( $attr['borderRadiusUnit'] ) ? $attr['borderRadiusUnit'] : 'px' ) );
				}
			}
			if ( isset( $attr['borderWidthMobile'] ) && is_array( $attr['borderWidthMobile'] ) ) {
				if ( isset( $attr['borderWidthMobile'][0] ) && is_numeric( $attr['borderWidthMobile'][0] ) ) {
					$css->add_property( 'border-top-width', $attr['borderWidthMobile'][0] . 'px' );
				}
				if ( isset( $attr['borderWidthMobile'][1] ) && is_numeric( $attr['borderWidthMobile'][1] ) ) {
					$css->add_property( 'border-right-width', $attr['borderWidthMobile'][1] . 'px' );
				}
				if ( isset( $attr['borderWidthMobile'][2] ) && is_numeric( $attr['borderWidthMobile'][2] ) ) {
					$css->add_property( 'border-bottom-width', $attr['borderWidthMobile'][2] . 'px' );
				}
				if ( isset( $attr['borderWidthMobile'][3] ) && is_numeric( $attr['borderWidthMobile'][3] ) ) {
					$css->add_property( 'border-left-width', $attr['borderWidthMobile'][3] . 'px' );
				}
			}
			$css->stop_media_query();
		}
		if ( ( isset( $attr['maxWidth'][0] ) && is_numeric( $attr['maxWidth'][0] ) ) ) {
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ':not(.kadence-conversion-banner) .kadence-conversion' );
			$css->add_property( 'max-width', $attr['maxWidth'][0] . ( ! empty( $attr['maxWidthUnit'] ) ? $attr['maxWidthUnit'] : 'px' ) );
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . '.kadence-conversion-banner .kadence-conversion-inner' );
			$css->add_property( 'max-width', $attr['maxWidth'][0] . ( ! empty( $attr['maxWidthUnit'] ) ? $attr['maxWidthUnit'] : 'px' ) );
		}
		if ( ( isset( $attr['maxWidth'][1] ) && is_numeric( $attr['maxWidth'][1] ) ) ) {
			$css->start_media_query( $media_query['tablet'] );
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ':not(.kadence-conversion-banner) .kadence-conversion' );
			$css->add_property( 'max-width', $attr['maxWidth'][1] . ( ! empty( $attr['maxWidthUnit'] ) ? $attr['maxWidthUnit'] : 'px' ) );
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . '.kadence-conversion-banner .kadence-conversion-inner' );
			$css->add_property( 'max-width', $attr['maxWidth'][1] . ( ! empty( $attr['maxWidthUnit'] ) ? $attr['maxWidthUnit'] : 'px' ) );
			$css->stop_media_query();
		}
		if ( ( isset( $attr['maxWidth'][2] ) && is_numeric( $attr['maxWidth'][2] ) ) ) {
			$css->start_media_query( $media_query['mobile'] );
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ':not(.kadence-conversion-banner) .kadence-conversion' );
			$css->add_property( 'max-width', $attr['maxWidth'][2] . ( ! empty( $attr['maxWidthUnit'] ) ? $attr['maxWidthUnit'] : 'px' ) );
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . '.kadence-conversion-banner .kadence-conversion-inner' );
			$css->add_property( 'max-width', $attr['maxWidth'][2] . ( ! empty( $attr['maxWidthUnit'] ) ? $attr['maxWidthUnit'] : 'px' ) );
			$css->stop_media_query();
		}
		if ( ( isset( $attr['padding'] ) && is_array( $attr['padding'] ) ) || ( isset( $attr['minHeight'] ) && is_array( $attr['minHeight'] ) && isset( $attr['height'] ) && 'fixed' === $attr['height'] ) ) {
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversion-inner' );
			if ( isset( $attr['height'] ) && 'fixed' === $attr['height'] && isset( $attr['minHeight'][0] ) && is_numeric( $attr['minHeight'][0] ) ) {
				$css->add_property( 'min-height', $attr['minHeight'][0] . ( isset( $attr['minHeightUnit'] ) ? $attr['minHeightUnit'] : 'px' ) );
			}
			if ( isset( $attr['padding'][0] ) && is_numeric( $attr['padding'][0] ) ) {
				$css->add_property( 'padding-top', $attr['padding'][0] . ( isset( $attr['paddingUnit'] ) ? $attr['paddingUnit'] : 'px' ) );
			}
			if ( isset( $attr['padding'][1] ) && is_numeric( $attr['padding'][1] ) ) {
				$css->add_property( 'padding-right', $attr['padding'][1] . ( isset( $attr['paddingUnit'] ) ? $attr['paddingUnit'] : 'px' ) );
			}
			if ( isset( $attr['padding'][2] ) && is_numeric( $attr['padding'][2] ) ) {
				$css->add_property( 'padding-bottom', $attr['padding'][2] . ( isset( $attr['paddingUnit'] ) ? $attr['paddingUnit'] : 'px' ) );
			}
			if ( isset( $attr['padding'][3] ) && is_numeric( $attr['padding'][3] ) ) {
				$css->add_property( 'padding-left', $attr['padding'][3] . ( isset( $attr['paddingUnit'] ) ? $attr['paddingUnit'] : 'px' ) );
			}
		}
		if ( ( isset( $attr['paddingTablet'] ) && is_array( $attr['paddingTablet'] ) ) || ( isset( $attr['minHeight'] ) && is_array( $attr['minHeight'] ) && isset( $attr['height'] ) && 'fixed' === $attr['height'] ) ) {
			$css->start_media_query( $media_query['tablet'] );
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversion-inner' );
			if ( isset( $attr['height'] ) && 'fixed' === $attr['height'] && isset( $attr['minHeight'][1] ) && is_numeric( $attr['minHeight'][1] ) ) {
				$css->add_property( 'min-height', $attr['minHeight'][1] . ( isset( $attr['minHeightUnit'] ) ? $attr['minHeightUnit'] : 'px' ) );
			}
			if ( isset( $attr['paddingTablet'][0] ) && is_numeric( $attr['paddingTablet'][0] ) ) {
				$css->add_property( 'padding-top', $attr['paddingTablet'][0] . ( isset( $attr['paddingUnit'] ) ? $attr['paddingUnit'] : 'px' ) );
			}
			if ( isset( $attr['paddingTablet'][1] ) && is_numeric( $attr['paddingTablet'][1] ) ) {
				$css->add_property( 'padding-right', $attr['paddingTablet'][1] . ( isset( $attr['paddingUnit'] ) ? $attr['paddingUnit'] : 'px' ) );
			}
			if ( isset( $attr['paddingTablet'][2] ) && is_numeric( $attr['paddingTablet'][2] ) ) {
				$css->add_property( 'padding-bottom', $attr['paddingTablet'][2] . ( isset( $attr['paddingUnit'] ) ? $attr['paddingUnit'] : 'px' ) );
			}
			if ( isset( $attr['paddingTablet'][3] ) && is_numeric( $attr['paddingTablet'][3] ) ) {
				$css->add_property( 'padding-left', $attr['paddingTablet'][3] . ( isset( $attr['paddingUnit'] ) ? $attr['paddingUnit'] : 'px' ) );
			}
			$css->stop_media_query();
		}
		if ( ( isset( $attr['paddingMobile'] ) && is_array( $attr['paddingMobile'] ) ) || ( isset( $attr['minHeight'] ) && is_array( $attr['minHeight'] ) && isset( $attr['height'] ) && 'fixed' === $attr['height'] ) ) {
			$css->start_media_query( $media_query['mobile'] );
			$css->set_selector( '.kadence-conversion-wrap.kadence-conversion-' . $post_id . ' .kadence-conversion-inner' );
			if ( isset( $attr['height'] ) && 'fixed' === $attr['height'] && isset( $attr['minHeight'][2] ) && is_numeric( $attr['minHeight'][2] ) ) {
				$css->add_property( 'min-height', $attr['minHeight'][2] . ( isset( $attr['minHeightUnit'] ) ? $attr['minHeightUnit'] : 'px' ) );
			}
			if ( isset( $attr['paddingMobile'][0] ) && is_numeric( $attr['paddingMobile'][0] ) ) {
				$css->add_property( 'padding-top', $attr['paddingMobile'][0] . ( isset( $attr['paddingUnit'] ) ? $attr['paddingUnit'] : 'px' ) );
			}
			if ( isset( $attr['paddingMobile'][1] ) && is_numeric( $attr['paddingMobile'][1] ) ) {
				$css->add_property( 'padding-right', $attr['paddingMobile'][1] . ( isset( $attr['paddingUnit'] ) ? $attr['paddingUnit'] : 'px' ) );
			}
			if ( isset( $attr['paddingMobile'][2] ) && is_numeric( $attr['paddingMobile'][2] ) ) {
				$css->add_property( 'padding-bottom', $attr['paddingMobile'][2] . ( isset( $attr['paddingUnit'] ) ? $attr['paddingUnit'] : 'px' ) );
			}
			if ( isset( $attr['paddingMobile'][3] ) && is_numeric( $attr['paddingMobile'][3] ) ) {
				$css->add_property( 'padding-left', $attr['paddingMobile'][3] . ( isset( $attr['paddingUnit'] ) ? $attr['paddingUnit'] : 'px' ) );
			}
			$css->stop_media_query();
		}
		if ( ( isset( $attr['zindex'] ) && is_numeric( $attr['zindex'] ) ) ) {
			$css->set_selector( '.kadence-conversion-wrap.kc-' . $post_id );
			$css->add_property( 'z-index', $attr['zindex'] );
		}
		return $css->css_output();
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
	 * Add filters for element content output.
	 */
	public function setup_content_filter() {
		global $wp_embed;
		add_filter( 'kadence_conversions_the_content', array( $wp_embed, 'run_shortcode' ), 8 );
		add_filter( 'kadence_conversions_the_content', array( $wp_embed, 'autoembed'     ), 8 );
		add_filter( 'kadence_conversions_the_content', 'do_blocks' );
		add_filter( 'kadence_conversions_the_content', 'wptexturize' );
		add_filter( 'kadence_conversions_the_content', 'convert_chars' );
		add_filter( 'kadence_conversions_the_content', 'shortcode_unautop' );
		add_filter( 'kadence_conversions_the_content', 'do_shortcode', 11 );
		add_filter( 'kadence_conversions_the_content', 'convert_smilies', 20 );
	}
	/**
	 * Loop through elements and hook items in where needed.
	 */
	public function init_frontend_hooks() {
		if ( is_admin() || is_singular( self::SLUG ) ) {
			return;
		}
		$args = array(
			'post_type'              => self::SLUG,
			'no_found_rows'          => true,
			'update_post_term_cache' => false,
			'post_status'            => 'publish',
			'numberposts'            => 333,
			'order'                  => 'ASC',
			'orderby'                => 'menu_order',
			'suppress_filters'       => false,
		);
		$posts = get_posts( $args );
		foreach ( $posts as $post ) {
			$meta = $this->get_post_meta_array( $post );
			if ( apply_filters( 'kadence_conversion_display', $this->check_conversion_conditionals( $post, $meta ), $post, $meta ) ) {
				if ( ! isset( self::$conversions[ $post->ID ] ) ) {
					self::$conversions[ $post->ID ] = array();
				}
				self::$conversions[ $post->ID ]['time_offset'] = get_option('gmt_offset');
				self::$conversions[ $post->ID ]['post_title'] = esc_attr( strip_tags( get_the_title( $post ) ) );
				if ( isset( $meta['device'] ) && ! empty( $meta['device'] ) && is_array( $meta['device'] ) ) {
					$devices = array();
					foreach ( $meta['device'] as $key => $setting ) {
						$devices[] = $setting['value'];
					}
					self::$conversions[ $post->ID ]['device'] = $devices;
				}
				if ( isset( $meta ) && isset( $meta['enable_expires'] ) && true == $meta['enable_expires'] && isset( $meta['expires'] ) && ! empty( $meta['expires'] ) ) {
					self::$conversions[ $post->ID ]['expires'] = $meta['expires'];
					if ( isset( $meta['starts'] ) && ! empty( $meta['starts'] ) ) {
						self::$conversions[ $post->ID ]['starts'] = $meta['starts'];
					}
				}
				if ( isset( $meta ) && isset( $meta['enable_recurring'] ) && true == $meta['enable_recurring'] ) {
					$start = ( isset( $meta['recurring_start'] ) && ! empty( $meta['recurring_start'] ) ? $meta['recurring_start'] : '09:00 AM' );
					if ( strpos( $start, 'AM' ) !== false ) {
						$start = str_replace( 'AM', '', $start );
						$start = str_replace( ' ', '', $start );
					} else if ( strpos( $start, 'PM' ) !== false ) {
						$start = str_replace( 'PM', '', $start );
						$start = str_replace( ' ', '', $start );
						$start_array = explode( ':', $start );
						$hour = absint( $start_array[0] ) + 12;
						$start = $hour . ':' . $start_array[1];
					}
					self::$conversions[ $post->ID ]['recurring_start'] = $start;
					$stop = ( isset( $meta['recurring_stop'] ) && ! empty( $meta['recurring_stop'] ) ? $meta['recurring_stop'] : '09:00 AM' );
					if ( strpos( $stop, 'AM' ) !== false ) {
						$stop = str_replace( 'AM', '', $stop );
						$stop = str_replace( ' ', '', $stop );
					} else if ( strpos( $stop, 'PM' ) !== false ) {
						$stop = str_replace( 'PM', '', $stop );
						$stop = str_replace( ' ', '', $stop );
						$stop_array = explode( ':', $stop );
						$hour = absint( $stop_array[0] ) + 12;
						$stop = $hour . ':' . $stop_array[1];
					}
					self::$conversions[ $post->ID ]['recurring_stop'] = $stop;
					if ( isset( $meta['recurring_days'] ) && ! empty( $meta['recurring_days'] ) ) {
						self::$conversions[ $post->ID ]['recurring_days'] = $meta['recurring_days'];
					}
				}
				wp_enqueue_style( 'kadence-conversions' );
				wp_enqueue_script( 'kadence-conversions' );
				add_action(
					'wp_footer',
					function() use( $post, $meta ) {
						$this->output_conversion( $post, $meta );
					},
					0
				);
				$this->enqueue_conversion_styles( $post, $meta );
			}
		}
	}
	/**
	 * Find the calls to `the_content` inside functions hooked to `the_content`.
	 *
	 * @return bool
	 */
	public function has_many_the_content() {
		global $wp_current_filter;
		if ( count( array_keys( $wp_current_filter, 'the_content', true ) ) > 1 ) {
			// More then one `the_content` in the stack.
			return true;
		}
		return false;
	}
	/**
	 * Determines if the in content filters should run.
	 *
	 * @param string $insertion the element content.
	 * @param integer $paragraph_id the paragraph id.
	 * @param string $content the post content.
	 */
	public function insert_inside_content( $content, $insertion = null, $element = '</h2>', $placement_id = 1, $after_element = true, $min_elements = 1 ) {
		if ( doing_filter( 'get_the_excerpt' ) ) {
			return $content;
		}
		// Do not inject on admin pages.
		if ( is_admin() && ! defined( 'DOING_AJAX' ) ) {
			return $content;
		}
		// do not inject elements multiple times, e.g., when the_content is applied multiple times.
		if ( $this->has_many_the_content() ) {
			return $content;
		}
		// make sure that no element is injected into another.
		if ( get_post_type() === self::SLUG ) {
			return $content;
		}
		if ( ! extension_loaded( 'dom' ) || apply_filters( 'kadence_pro_inject_content_simple_method', false ) ) {

			// Split content.
			$parts = explode( $element, $content );

			// Count element ocurrencies.
			$count = count( $parts );

			// check if the minimum required elements are found.
			if ( ( $count - 1 ) < $min_elements ) {
				return $content;
			}

			$output = '';
			for ( $i = 1; $i < $count; $i++ ) {
				// this is the core part that puts all the content together.
				if ( $after_element ) {
					$output .= $parts[ $i - 1 ] . $element . ( ( $i === $placement_id ) ? $insertion : '' ); // this insert after.
				} else {
					$output .= ( $i === 1 ? $parts[ 0 ] : '' ) . ( ( $i === $placement_id ) ? $insertion : '' ) . $element . $parts[ $i ]; //this insert before.
				}
			}
		} else {
			$wp_charset = get_bloginfo( 'charset' );
			$element_placeholder_data = false;
			$content_dom = new DOMDocument( '1.0', $wp_charset );
			libxml_use_internal_errors( true ); // avoid notices and warnings - html is most likely malformed.
			// Prevent removing closing tags in scripts.
			$content_to_load = preg_replace( '/<script.*?<\/script>/si', '<!--\0-->', $content );
			$content_to_load = mb_convert_encoding( $content_to_load, 'HTML-ENTITIES', 'UTF-8' );
			$success = $content_dom->loadHTML(
				// loadHTML expects ISO-8859-1, so we need to convert the post content to
				// that format. We use htmlentities to encode Unicode characters not
				// supported by ISO-8859-1 as HTML entities. However, this function also
				// converts all special characters like < or > to HTML entities, so we use
				// htmlspecialchars_decode to decode them.
				htmlspecialchars_decode(
					utf8_decode(
						htmlentities(
							'<!DOCTYPE html><html><head><body>' .
							$content_to_load .
								'</body></html>',
							ENT_COMPAT,
							'UTF-8',
							false
						)
					),
					ENT_COMPAT
				)
			);
			libxml_use_internal_errors( false );
			if ( true !== $success ) {
				// -TODO handle cases were dom-parsing failed (at least inform user)
				return $content;
			}
			$tag = preg_replace( '/[^a-z0-9]/i', '', $element ); // simplify tag.
			$tag_option = $tag;
			switch ( $tag_option ) {
				case 'p':
					// exclude paragraphs within blockquote tags.
					$tag = 'p[not(parent::blockquote)]';
				break;
				case 'h1':
				case 'h2':
				case 'h3':
				case 'h4':
				case 'h5':
				case 'h6':
					$headlines = apply_filters( 'kadence-headlines-for-element-in-content', array( 'h1', 'h2', 'h3', 'h4' ) );
					foreach ( $headlines as &$headline ) {
						$headline = 'self::' . $headline;
					}
					$tag = '*[' . implode( ' or ', $headlines ) . ']'; // /html/body/*[self::h1 or self::h2 or self::h3]
				break;
			}

			// select positions.
			$xpath = new \DOMXPath( $content_dom );
			$items = $xpath->query( '/html/body/' . $tag );
			if ( $items->length < $min_elements ) {
				$items = $xpath->query( '/html/body/*/' . $tag );
			}
			// try third level.
			if ( $items->length < $min_elements ) {
				$items = $xpath->query( '/html/body/*/*/' . $tag );
			}
			// try all levels as last resort.
			if ( $items->length < $min_elements ) {
				$items = $xpath->query( '//' . $tag );
			}
			$processed_items  = array();
			foreach ( $items as $item ) {
				$processed_items[] = $item;
			}
			// Count element ocurrencies.
			$count = count( $processed_items );
			// check if the minimum required elements are found.
			if ( ( $count ) < $min_elements ) {
				return $content;
			}
			$did_inject = false;
			$loop_through = array( $placement_id - 1 );
			foreach ( $loop_through as $loop_item ) {
				$node = $processed_items[ $loop_item ];
				// Prevent injection into image caption and gallery.
				$parent = $node;
				for ( $i = 0; $i < 4; $i++ ) {
					$parent = $parent->parentNode;
					if ( ! $parent instanceof DOMElement ) {
						break;
					}
					if ( preg_match( '/\b(wp-caption|gallery-size)\b/', $parent->getAttribute( 'class' ) ) ) {
						$node = $parent;
						break;
					}
				}
				// make sure that the ad is injected outside the link
				if ( 'img' === $tag_option && 'a' === $node->parentNode->tagName ) {
					if ( $options['before'] ) {
						$node->parentNode;
					} else {
						// go one level deeper if inserted after to not insert the ad into the link; probably after the paragraph
						$node->parentNode->parentNode;
					}
				}

				// convert HTML to XML!
				$element_placeholder_data = array(
					'tag'     => $node->tagName,
					'after'   => $after_element,
					'content' => $insertion,
				);
				$insertion = '%conversion_placeholder%';
				$insert_dom = new DOMDocument( '1.0', $wp_charset );
				libxml_use_internal_errors( true );
				$insert_dom->loadHtml( '<!DOCTYPE html><html><meta http-equiv="Content-Type" content="text/html; charset=' . $wp_charset . '" /><body>' . $insertion );
				if ( ! $after_element ) {
					$ref_node = $node;

					foreach ( $insert_dom->getElementsByTagName( 'body' )->item( 0 )->childNodes as $importedNode ) {
						$importedNode = $content_dom->importNode( $importedNode, true );
						$ref_node->parentNode->insertBefore( $importedNode, $ref_node );
					}
				} else {
					// append before next node or as last child to body.
					$ref_node = $node->nextSibling;
					if ( isset( $ref_node ) ) {
						foreach ( $insert_dom->getElementsByTagName( 'body' )->item( 0 )->childNodes as $importedNode ) {
							$importedNode = $content_dom->importNode( $importedNode, true );
							$ref_node->parentNode->insertBefore( $importedNode, $ref_node );
						}
					} else {
						// append to body; -TODO using here that we only select direct children of the body tag.
						foreach ( $insert_dom->getElementsByTagName( 'body' )->item( 0 )->childNodes as $importedNode ) {
							$importedNode = $content_dom->importNode( $importedNode, true );
							$node->parentNode->appendChild( $importedNode );
						}
					}
				}
				libxml_use_internal_errors( false );
				$did_inject = true;
			}
			if ( ! $did_inject ) {
				return $content;
			}
			// convert to text-representation.
			$output = $content_dom->saveHTML();
			if ( ! $output ) {
				return $content;
			}
			return self::inject_into_content( $output, $content, $element_placeholder_data );
		}
		return $output;
	}
	/**
	 * Filter ad content.
	 *
	 * @param string $ad_content Ad content.
	 * @param string $tag_name tar before/after the content.
	 * @param array  $options Injection options.
	 *
	 * @return string ad content.
	 */
	private static function filter_element_for_content( $conversion_content, $tag_name, $after_element ) {
		// Inject placeholder.
		$id                           = count( self::$placeholders_for_inline );
		self::$placeholders_for_inline[] = array(
			'id'      => $id,
			'tag'     => $tag_name,
			'after'   => $after_element,
			'content' => $conversion_content,
		);
		$conversion_content                   = '%conversion_placeholder_' . $id . '%';

		return $conversion_content;
	}
	/**
	 * Search for ad placeholders in the `$content` to determine positions at which to inject ads.
	 * Given the positions, inject ads into `$content_orig.
	 *
	 * @param string $content Post content with injected ad placeholders.
	 * @param string $content_orig Unmodified post content.
	 * @param array  $options Injection options.
	 * @param array  $ads_for_placeholders Array of ads.
	 *  Each ad contains placeholder id, before or after which tag to inject the ad, the ad content.
	 *
	 * @return string $content
	 */
	private static function inject_into_content( $content, $content_orig, $element_placeholder_data ) {
		$tag = $element_placeholder_data['tag'];
		if ( ! $element_placeholder_data['after'] ) {
			$alts[] = "<${tag}[^>]*>";
		} else {
			$alts[] = "</${tag}>";
		}
		$tag_regexp = implode( '|', $alts );
		$alts[] = '%conversion_placeholder%';
		$tag_and_placeholder_regexp = implode( '|', $alts );
		preg_match_all( "#{$tag_and_placeholder_regexp}#i", $content, $tag_matches );

		$count = 0;

		// For each tag located before/after an ad placeholder, find its offset among the same tags.
		foreach ( $tag_matches[0] as $r ) {
			if ( preg_match( '/%conversion_placeholder%/', $r, $result ) ) {
				if ( ! $element_placeholder_data['after'] ) {
					$element_placeholder_data['offset'] = $count;
				} else {
					$element_placeholder_data['offset'] = $count - 1;
				}
			} else {
				$count ++;
			}
		}

		// Find tags before/after which we need to inject ads.
		preg_match_all( "#{$tag_regexp}#i", $content_orig, $orig_tag_matches, PREG_OFFSET_CAPTURE );
		$new_content = '';
		$pos         = 0;

		foreach ( $orig_tag_matches[0] as $n => $r ) {
			if ( isset( $element_placeholder_data['offset'] ) && $element_placeholder_data['offset'] === $n ) {
				if ( ! $element_placeholder_data['after'] ) {
					$found_pos = $r[1];
				} else {
					$found_pos = $r[1] + strlen( $r[0] );
				}
				$new_content .= substr( $content_orig, $pos, $found_pos - $pos );
				$pos          = $found_pos;
				$new_content .= $element_placeholder_data['content'];
			}
		}
		$new_content .= substr( $content_orig, $pos );

		return $new_content;
	}
	/**
	 * Adds content to the $content based on the paragraph count.
	 *
	 * @param string $insertion the element content.
	 * @param integer $paragraph_id the paragraph id.
	 * @param string $content the post content.
	 */
	public function insert_after_paragraph( $insertion, $paragraph_id, $content ) {
		$closing_p  = '</p>';
		$paragraphs = explode( $closing_p, $content );
		foreach ( $paragraphs as $index => $paragraph ) {

			if ( trim( $paragraph ) ) {
				$paragraphs[ $index ] .= $closing_p;
			}
			if ( $paragraph_id == $index + 1 ) {
				$paragraphs[ $index ] .= $insertion;
			}
		}
		return implode( '', $paragraphs );
	}
	/**
	 * Determines if the in content filters should run.
	 *
	 * @param object $post the element post.
	 */
	public static function apply_in_content_filter( $post ) {
		$run = true;
		if ( is_admin() ) {
			return false;
		}
		global $wp_current_filter;
		if ( is_array( $wp_current_filter ) && in_array( $wp_current_filter[0], array( 'get_the_excerpt', 'init', 'wp_head' ), true ) ) {
			$run = false;
		}
		if ( is_feed() || is_search() || is_archive() ) {
			$run = false;
		}
		if ( empty( $post ) || ! $post instanceof WP_Post ) {
			$run = false;
		}
		return apply_filters( 'kadence_conversions_run_in_the_content_filter', $run );
	}
	/**
	 * Outputs the content of the element.
	 *
	 * @param object $post the post object.
	 * @param array  $meta the post meta.
	 * @param bool   $shortcode if the render is from a shortcode.
	 */
	public function output_conversion( $post, $meta ) {
		$content = $post->post_content;
		if ( ! $content ) {
			return;
		}
		$content = apply_filters( 'kadence_conversions_the_content', $content );
		if ( $content ) {
			echo '<!-- [conversion-' . esc_attr( $post->ID ) . '] -->';
			echo $content;
			echo '<!-- [/conversion-' . esc_attr( $post->ID ) . '] -->';
		}
	}
	/**
	 * Outputs the content of the element.
	 *
	 * @param object $post the post object.
	 * @param array  $meta the post meta.
	 * @param bool   $shortcode if the render is from a shortcode.
	 */
	public function enqueue_conversion_styles( $post, $meta, $shortcode = false ) {

		$content = $post->post_content;
		if ( ! $content ) {
			return;
		}
		if ( has_blocks( $content ) ) {
			if ( class_exists( 'Kadence_Blocks_Frontend' ) ) {
				$kadence_blocks = \Kadence_Blocks_Frontend::get_instance();
				if ( method_exists( $kadence_blocks, 'frontend_build_css' ) ) {
					$kadence_blocks->frontend_build_css( $post );
				}
				if ( class_exists( 'Kadence_Blocks_Pro_Frontend' ) ) {
					$kadence_blocks_pro = \Kadence_Blocks_Pro_Frontend::get_instance();
					if ( method_exists( $kadence_blocks_pro, 'frontend_build_css' ) ) {
						$kadence_blocks_pro->frontend_build_css( $post );
					}
				}
			}
			return;
		}
	}
	/**
	 * Gets and returns page conditions.
	 */
	public static function get_current_page_conditions() {
		if ( is_null( self::$current_condition ) ) {
			$condition   = array( 'general|site' );
			if ( is_front_page() ) {
				$condition[] = 'general|front_page';
			}
			if ( is_home() ) {
				$condition[] = 'general|archive';
				$condition[] = 'post_type_archive|post';
				$condition[] = 'general|home';
			} elseif ( is_search() ) {
				$condition[] = 'general|search';
				if ( class_exists( 'woocommerce' ) && function_exists( 'is_woocommerce' ) && is_woocommerce() ) {
					$condition[] = 'general|product_search';
				}
			} elseif ( is_404() ) {
				$condition[] = 'general|404';
			} elseif ( is_singular() ) {
				$condition[] = 'general|singular';
				$condition[] = 'singular|' . get_post_type();
				if ( class_exists( 'TUTOR\Tutor' ) && function_exists( 'tutor' ) ) {
					// Add lesson post type.
					if ( is_singular( tutor()->lesson_post_type ) ) {
						$condition[] = 'tutor|' . get_post_type();
					}
				}
			} elseif ( is_archive() ) {
				$queried_obj = get_queried_object();
				$condition[] = 'general|archive';
				if ( is_post_type_archive() && is_object( $queried_obj ) ) {
					$condition[] = 'post_type_archive|' . $queried_obj->name;
				} elseif ( is_tax() || is_category() || is_tag() ) {
					if ( is_object( $queried_obj ) ) {
						$condition[] = 'tax_archive|' . $queried_obj->taxonomy;
					}
				} elseif ( is_date() ) {
					$condition[] = 'general|date';
				} elseif ( is_author() ) {
					$condition[] = 'general|author';
				}
			}
			if ( is_paged() ) {
				$condition[] = 'general|paged';
			}
			if ( class_exists( 'woocommerce' ) ) {
				if ( function_exists( 'is_woocommerce' ) && is_woocommerce() ) {
					$condition[] = 'general|woocommerce';
				}
			}
			self::$current_condition = $condition;
		}
		return self::$current_condition;
	}
	/**
	 * Tests if any of a post's assigned term are descendants of target term
	 *
	 * @param string $term_id The term id.
	 * @param string $tax The target taxonomy slug.
	 * @return bool True if at least 1 of the post's categories is a descendant of any of the target categories
	 */
	public function post_is_in_descendant_term( $term_id, $tax ) {
		$descendants = get_term_children( (int)$term_id, $tax );
		if ( ! is_wp_error( $descendants ) && is_array( $descendants ) ) {
			foreach ( $descendants as $child_id ) {
				if ( has_term( $child_id, $tax ) ) {
					return true;
				}
			}
		}
		return false;
	}
	/**
	 * Check if element should show in current page.
	 *
	 * @param object $post the current element to check.
	 * @return bool
	 */
	public function check_conversion_conditionals( $post, $meta ) {
		$current_condition      = self::get_current_page_conditions();
		$rules_with_sub_rules   = array( 'singular', 'tax_archive' );
		$show = false;
		$all_must_be_true = ( isset( $meta ) && isset( $meta['all_show'] ) ? $meta['all_show'] : false );
		if ( isset( $meta ) && isset( $meta['show'] ) && is_array( $meta['show'] ) && ! empty( $meta['show'] ) ) {
			foreach ( $meta['show'] as $key => $rule ) {
				$rule_show = false;
				if ( isset( $rule['rule'] ) && in_array( $rule['rule'], $current_condition ) ) {
					$rule_split = explode( '|', $rule['rule'], 2 );
					if ( in_array( $rule_split[0], $rules_with_sub_rules ) ) {
						if ( ! isset( $rule['select'] ) || isset( $rule['select'] ) && 'all' === $rule['select'] ) {
							$show      = true;
							$rule_show = true;
						} else if ( isset( $rule['select'] ) && 'author' === $rule['select'] ) {
							if ( isset( $rule['subRule'] ) && $rule['subRule'] == get_post_field( 'post_author', get_queried_object_id() ) ) {
								$show      = true;
								$rule_show = true;
							}
						} else if ( isset( $rule['select'] ) && 'tax' === $rule['select'] ) {
							if ( isset( $rule['subRule'] ) && isset( $rule['subSelection'] ) && is_array( $rule['subSelection'] ) ) {
								foreach ( $rule['subSelection'] as $sub_key => $selection ) {
									if ( 'assigned_course' === $rule['subRule'] ) {
										$course_id = get_post_meta( get_queried_object_id(), 'course_id', true );
										if ( $selection['value'] == $course_id ) {
											$show      = true;
											$rule_show = true;
										} elseif ( isset( $rule['mustMatch'] ) && $rule['mustMatch'] ) {
											return false;
										}
									} elseif ( has_term( $selection['value'], $rule['subRule'] ) ) {
										$show      = true;
										$rule_show = true;
									} elseif ( $this->post_is_in_descendant_term( $selection['value'], $rule['subRule'] ) ) {
										$show      = true;
										$rule_show = true;
									} elseif ( isset( $rule['mustMatch'] ) && $rule['mustMatch'] ) {
										return false;
									}
								}
							}
						} else if ( isset( $rule['select'] ) && 'ids' === $rule['select'] ) {
							if ( isset( $rule['ids'] ) && is_array( $rule['ids'] ) ) {
								$current_id = get_the_ID();
								foreach ( $rule['ids'] as $sub_key => $sub_id ) {
									if ( $current_id === $sub_id ) {
										$show      = true;
										$rule_show = true;
									}
								}
							}
						} else if ( isset( $rule['select'] ) && 'individual' === $rule['select'] ) {
							if ( isset( $rule['subSelection'] ) && is_array( $rule['subSelection'] ) ) {
								$queried_obj = get_queried_object();
								$show_taxs   = array();
								foreach ( $rule['subSelection'] as $sub_key => $selection ) {
									if ( isset( $selection['value'] ) && ! empty( $selection['value'] ) ) {
										$show_taxs[] = $selection['value'];
									}
								}
								if ( in_array( $queried_obj->term_id, $show_taxs ) ) {
									$show      = true;
									$rule_show = true;
								}
							}
						}
					} else {
						$show      = true;
						$rule_show = true;
					}
				}
				if ( ! $rule_show && $all_must_be_true ) {
					return false;
				}
			}
		}
		// Exclude Rules.
		if ( $show ) {
			if ( isset( $meta ) && isset( $meta['hide'] ) && is_array( $meta['hide'] ) && ! empty( $meta['hide'] ) ) {
				foreach ( $meta['hide'] as $key => $rule ) {
					if ( isset( $rule['rule'] ) && in_array( $rule['rule'], $current_condition ) ) {
						$rule_split = explode( '|', $rule['rule'], 2 );
						if ( in_array( $rule_split[0], $rules_with_sub_rules ) ) {
							if ( ! isset( $rule['select'] ) || isset( $rule['select'] ) && 'all' === $rule['select'] ) {
								$show = false;
							} else if ( isset( $rule['select'] ) && 'author' === $rule['select'] ) {
								if ( isset( $rule['subRule'] ) && $rule['subRule'] == get_post_field( 'post_author', get_queried_object_id() ) ) {
									$show = false;
								}
							} else if ( isset( $rule['select'] ) && 'tax' === $rule['select'] ) {
								if ( isset( $rule['subRule'] ) && isset( $rule['subSelection'] ) && is_array( $rule['subSelection'] ) ) {
									foreach ( $rule['subSelection'] as $sub_key => $selection ) {
										if ( 'assigned_course' === $rule['subRule'] ) {
											$course_id = get_post_meta( get_queried_object_id(), 'course_id', true );
											if ( $selection['value'] == $course_id ) {
												$show = false;
											} elseif ( isset( $rule['mustMatch'] ) && $rule['mustMatch'] ) {
												$show = true;
												continue;
											}
										} elseif ( has_term( $selection['value'], $rule['subRule'] ) ) {
											$show = false;
										} elseif ( isset( $rule['mustMatch'] ) && $rule['mustMatch'] ) {
											$show = true;
											continue;
										}
									}
								}
							} else if ( isset( $rule['select'] ) && 'ids' === $rule['select'] ) {
								if ( isset( $rule['ids'] ) && is_array( $rule['ids'] ) ) {
									$current_id = get_the_ID();
									foreach ( $rule['ids'] as $sub_key => $sub_id ) {
										if ( $current_id === $sub_id ) {
											$show = false;
										}
									}
								}
							} else if ( isset( $rule['select'] ) && 'individual' === $rule['select'] ) {
								if ( isset( $rule['subSelection'] ) && is_array( $rule['subSelection'] ) ) {
									$queried_obj = get_queried_object();
									$show_taxs   = array();
									foreach ( $rule['subSelection'] as $sub_key => $selection ) {
										if ( isset( $selection['value'] ) && ! empty( $selection['value'] ) ) {
											$show_taxs[] = $selection['value'];
										}
									}
									if ( in_array( $queried_obj->term_id, $show_taxs ) ) {
										$show = false;
									}
								}
							}
						} else {
							$show = false;
						}
					}
				}
			}
		}
		if ( $show ) {
			if ( isset( $meta ) && isset( $meta['user'] ) && is_array( $meta['user'] ) && ! empty( $meta['user'] ) ) {
				$user_info  = self::get_current_user_info();
				$show_roles = array();
				foreach ( $meta['user'] as $key => $user_rule ) {
					if ( isset( $user_rule['role'] ) && ! empty( $user_rule['role'] ) ) {
						$show_roles[] = $user_rule['role'];
					}
				}
				$match = array_intersect( $show_roles, $user_info );
				if ( count( $match ) === 0 ) {
					$show = false;
				}
			}
		}
		// Expires.
		if ( $show ) {
			if ( isset( $meta ) && isset( $meta['enable_expires'] ) && true == $meta['enable_expires'] && isset( $meta['expires'] ) && ! empty( $meta['expires'] ) ) {
				$expires = strtotime( get_date_from_gmt( $meta['expires'] ) );
				$now     = strtotime( get_date_from_gmt( current_time( 'Y-m-d H:i:s' ) ) );
				if ( $expires < $now ) {
					$show = false;
				}
			}
		}
		// Language.
		if ( $show ) {
			if ( ! empty( $meta['language'] ) ) {
				if ( function_exists( 'pll_current_language' ) ) {
					$language_slug = pll_current_language( 'slug' );
					if ( $meta['language'] !== $language_slug ) {
						$show = false;
					}
				}
				if ( $current_lang = apply_filters( 'wpml_current_language', NULL ) ) {
					if ( $meta['language'] !== $current_lang ) {
						$show = false;
					}
				}
			}
		}
		return $show;
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
			'starts'         => '',
			'enable_recurring' => false,
			'language'       => '',
			'recurring_start'=> '',
			'recurring_stop' => '',
			'recurring_days' => '',
			'type'           => '',
			'fixed_width'    => '',
			'width'          => 300,
			'fixed_position' => 'left',
			'xposition'      => 0,
			'yposition'      => 0,
		);
		if ( get_post_meta( $post->ID, '_kad_conversion_type', true ) ) {
			$meta['type'] = get_post_meta( $post->ID, '_kad_conversion_type', true );
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
		if ( get_post_meta( $post->ID, '_kad_conversion_expires', true ) ) {
			$meta['expires'] = get_post_meta( $post->ID, '_kad_conversion_expires', true );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_starts', true ) ) {
			$meta['starts'] = get_post_meta( $post->ID, '_kad_conversion_starts', true );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_enable_recurring', true ) ) {
			$meta['enable_recurring'] = get_post_meta( $post->ID, '_kad_conversion_enable_recurring', true );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_recurring_start', true ) ) {
			$meta['recurring_start'] = get_post_meta( $post->ID, '_kad_conversion_recurring_start', true );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_recurring_stop', true ) ) {
			$meta['recurring_stop'] = get_post_meta( $post->ID, '_kad_conversion_recurring_stop', true );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_recurring_days', true ) ) {
			$meta['recurring_days'] = json_decode( get_post_meta( $post->ID, '_kad_conversion_recurring_days', true ) );
		}
		if ( get_post_meta( $post->ID, '_kad_conversion_language', true ) ) {
			$meta['language'] = get_post_meta( $post->ID, '_kad_conversion_language', true );
		}
		return $meta;
	}
}
Conversions_Frontend::get_instance();
