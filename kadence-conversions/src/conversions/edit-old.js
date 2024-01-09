/* Global kadenceConversionsParams */
import Select from 'react-select';
import debounce from 'lodash/debounce';
import times from 'lodash/times';
import classnames from 'classnames';
import DisplaySettings from './display-settings.js';
import UserSettings from './user-settings.js';
import PopColorControl from './pop-color-control/pop-color.js';
import ColorOutput from './pop-color-control/color-output.js';
import ResponsiveMeasurementControls from './measure-control/responsive-measurement-control.js';
import ResponsiveRangeControls from './range-control/responsive-range-control';
import SingleRangeControl from './range-control/single-range-control';
import RadioButtonControl from './radio-button-control/radio-button-control';
import BackgroundControl from './background-control/background-control.js';
import ShadowControl from './shadow-control/shadow-control.js';
import TemplateSelect from './template-select/template-select.js';
import TimeControl from './time-control/time-control.js';
import TryParseJSON from './common/try-parse-json.js';
import icons from './common/icons';
import closeIcons from './close-icons';
import PostSelectButton from './post-select';

import { TextControl, TextareaControl, SelectControl, PanelBody, ToggleControl, DateTimePicker, CheckboxControl, Modal, RangeControl } from '@wordpress/components';
import { Fragment, Component } from '@wordpress/element';
import { withSelect, useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import {
	InspectorControls,
	InnerBlocks,
	InspectorAdvancedControls,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { __experimentalGetSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
const ANCHOR_REGEX = /[\s#]/g;
/**
 * Build the conversion edit.
 */
class KadenceConversionBlock extends Component {
	constructor() {
		super( ...arguments );
		this.getID = this.getID.bind( this );
		this.getPreviewSize = this.getPreviewSize.bind( this );
		this.state = {
			is12HourTime: true,
			closePaddingControl: 'individual',
			paddingControl: 'individual',
			marginControl: 'individual',
			borderWidthControl: 'individual',
			borderRadiusControl: 'individual',
		}
		console.log( 'test' );
		this.debouncedGetID = debounce( this.getID.bind( this ), 200 );
	}
	componentDidMount() {
		if ( ! this.props.attributes.uniqueID ) {
			this.props.setAttributes( {
				uniqueID: this.props.clientId.substr( 2, 10 ),
			} );
		}
		console.log( 'testing' );
		const settings = __experimentalGetSettings();
		// To know if the current timezone is a 12 hour time with look for an "a" in the time format.
		// We also make sure this a is not escaped by a "/".
		const is12HourTime = /a(?!\\)/i.test(
			settings.formats.time
				.toLowerCase() // Test only the lower case a
				.replace( /\\\\/g, '' ) // Replace "//" with empty strings
				.split( '' ).reverse().join( '' ) // Reverse the string and test for "a" not followed by a slash
		);
		this.setState( { is12HourTime: is12HourTime } );
		// Lame workaround for gutenberg to prevent showing the block.
		window.wp.data.dispatch( 'core/block-editor' ).setTemplateValidity( true );
		window.wp.data.dispatch( 'core/edit-post' ).hideBlockTypes( [ 'kadence-conversions/conversion' ] );
		this.debouncedGetID();
	}
	getID() {
		if ( wp.data.select( 'core/editor' ) ) {
			const { getCurrentPostId } = wp.data.select( 'core/editor' );
			if ( ! this.props.attributes.postID && getCurrentPostId() ) {
				this.props.setAttributes( {
					postID: getCurrentPostId(),
				} );
			} else if ( getCurrentPostId() && getCurrentPostId() !== this.props.attributes.postID ) {
				this.props.setAttributes( {
					postID: getCurrentPostId(),
				} );
			}
		}
	}
	getPreviewSize( device, desktopSize, tabletSize, mobileSize ) {
		if ( device === 'Mobile' ) {
			if ( undefined !== mobileSize && '' !== mobileSize ) {
				return mobileSize;
			} else if ( undefined !== tabletSize && '' !== tabletSize ) {
				return tabletSize;
			}
		} else if ( device === 'Tablet' ) {
			if ( undefined !== tabletSize && '' !== tabletSize ) {
				return tabletSize;
			}
		}
		return desktopSize;
	}
	render() {
		const { attributes: { uniqueID, postID, campaignID, conversionType, conversionTrigger, conversionGoal, delay, scroll, displayClose, closePosition, closeAlign, closeVAlign, closeContent, closeSize, closeSizeUnit, closeLabel, closeColor, closeHoverBackground, closeHoverColor, closeBackground, closeIcon, closePadding, closePaddingTablet, closePaddingMobile, closePaddingUnit, padding, paddingTablet, paddingMobile, paddingUnit, margin, marginTablet, marginMobile, marginUnit, templateSelected, animateOut, animateIn, goalClass, goalClose, horizontalAlign, verticalAlign, height, minHeight, minHeightUnit, maxWidth, maxWidthUnit, repeatControl, convertRepeat, closeRepeat, overlayClose, background, overlayBackground, borderRadius, borderRadiusMobile, borderRadiusTablet, borderRadiusUnit, borderWidth, borderWidthMobile, borderWidthTablet, border, shadow, innerVAlign, conversionTracking, referrer, queryStrings, cookieCheck, requirePageViews, pageViewCount, cartProducts, requireCartProducts, requireCartCategory, cartCategory, requireCartMinimum, requireCartMaximum, cartMaximum, cartMinimum, preventCartProducts, preventProducts, zindex, scrollHide }, className, isSelected, clientId, setAttributes, setMeta, meta } = this.props;
		const { is12HourTime, closePaddingControl, paddingControl, marginControl, borderRadiusControl, borderWidthControl } = this.state;
		const updateMetaValue = ( newValue, key ) => {
			setMeta( { ...meta, [key]: newValue } );
		}
		console.log( 'testing here' );
		// const renderCSS = (
		// 	<style>
		// 		{ ( closeHoverColor ? `.kadence-conversion-wrap.kadence-conversion-${ uniqueID } .kadence-conversions-close:hover { color: ${ ColorOutput( closeHoverColor ) } !important; }` : '' ) }
		// 		{ ( closeHoverBackground ? `.kadence-conversion-wrap.kadence-conversion-${ uniqueID } .kadence-conversions-close:hover { background: ${ ColorOutput( closeHoverBackground ) } !important; }` : '' ) }
		// 	</style>
		// );
		const deviceOptions = [
			{
				'value' : 'desktop',
				'label': __( 'Desktop', 'kadence-conversions' ),
			},
			{
				'value' : 'tablet',
				'label': __( 'Tablet', 'kadence-conversions' ),
			},
			{
				'value' : 'mobile',
				'label': __( 'Mobile', 'kadence-conversions' ),
			},
		];
		const conversionTypeOptions = [
			{
				label: __( 'Popup', 'kadence-conversions' ),
				value: 'popup',
				icon: 'popup',
			},
			{
				label: __( 'Slide-In', 'kadence-conversions' ),
				value: 'slide_in',
				icon: 'slide_in',
			},
			{
				label: __( 'Banner', 'kadence-conversions' ),
				value: 'banner',
				icon: 'banner',
			},
		];
		const check_show_rules = ( undefined !== meta[ '_kad_conversion_show' ] && '' !== meta[ '_kad_conversion_show' ] ? JSON.parse( meta[ '_kad_conversion_show' ] ) : [] );
		const recurringDays = ( undefined !== meta[ '_kad_conversion_recurring_days' ] && '' !== meta[ '_kad_conversion_recurring_days' ] ? JSON.parse( meta[ '_kad_conversion_recurring_days' ] ) : [] );
		const saveBackground = ( value ) => {
			const newUpdate = background.map( ( item, index ) => {
				if ( 0 === index ) {
					item = { ...item, ...value };
				}
				return item;
			} );
			setAttributes( {
				background: newUpdate,
			} );
		};
		const onRemoveBackgroundImage = () => {
			saveBackground( {
				bgImgID: '',
				bgImg: '',
			} );
		};
		const hasBackgroundImage = ( background && background[ 0 ] && background[ 0 ].bgImg ? true : false );
		const saveOverlayBackground = ( value ) => {
			const newUpdate = overlayBackground.map( ( item, index ) => {
				if ( 0 === index ) {
					item = { ...item, ...value };
				}
				return item;
			} );
			setAttributes( {
				overlayBackground: newUpdate,
			} );
		};
		const onRemoveOverlayBackgroundImage = () => {
			saveOverlayBackground( {
				bgImgID: '',
				bgImg: '',
			} );
		};
		const saveShadow = ( value ) => {
			const newUpdate = shadow.map( ( item, index ) => {
				if ( 0 === index ) {
					item = { ...item, ...value };
				}
				return item;
			} );
			setAttributes( {
				shadow: newUpdate,
			} );
		};
		const hasOverlayBackgroundImage = ( overlayBackground && overlayBackground[ 0 ] && overlayBackground[ 0 ].bgImg ? true : false );
		const dayOptions = [
			{
				'value' : 'monday',
				'label': __( 'Monday', 'kadence-conversions' ),
			},
			{
				'value' : 'tuesday',
				'label': __( 'Tuesday', 'kadence-conversions' ),
			},
			{
				'value' : 'wednesday',
				'label': __( 'Wednesday', 'kadence-conversions' ),
			},
			{
				'value' : 'thursday',
				'label': __( 'Thursday', 'kadence-conversions' ),
			},
			{
				'value' : 'friday',
				'label': __( 'Friday', 'kadence-conversions' ),
			},
			{
				'value' : 'saturday',
				'label': __( 'Saturday', 'kadence-conversions' ),
			},
			{
				'value' : 'sunday',
				'label': __( 'Sunday', 'kadence-conversions' ),
			},
		];
		const addDay = ( value ) => {
			const newItems = recurringDays.map( ( item, thisIndex ) => {
				return item;
			} );
			newItems.push( value );
			updateMetaValue( JSON.stringify( newItems ), '_kad_conversion_recurring_days' );
		}
		const removeDay = ( value ) => {
			const newItems = recurringDays.filter( item => item !== value );
			updateMetaValue( JSON.stringify( newItems ), '_kad_conversion_recurring_days' );
		}
		const daysOfTheWeekControls = ( index ) => {
			return (
				<CheckboxControl
					key={ 'day-controls-' + index.toString() }
					label={ dayOptions[ index ].label }
					checked={ recurringDays.includes( dayOptions[ index ].value ) }
					onChange={ ( isChecked ) => {
						if ( isChecked ) {
							addDay( dayOptions[ index ].value );
						} else {
							removeDay( dayOptions[ index ].value );
						}
					} }
				/>
			);
		};
		const realClosePosition = ( conversionType !== 'popup' && closePosition === 'screen' ? 'inside' : closePosition );
		const classes = classnames( {
			[ `kadence-conversion-wrap` ]: true,
			[ `kadence-conversion-${ postID }` ]: postID,
			[ `kadence-conversion-${ conversionType }` ]: conversionType,
			[ `kc-align-${ horizontalAlign }` ]: horizontalAlign,
			[ `kc-valign-${ verticalAlign }` ]: verticalAlign,
			[ `kc-${ uniqueID }` ]: uniqueID,
			[ `kc-height-${ height }` ]: height,
			[ `kc-animate-in-${ animateIn }` ]: animateIn,
			[ `kc-animate-out-${ animateOut }` ]: animateOut,
			[ `kc-close-align-${ closeAlign }` ]: closeAlign,
			[ `kc-close-v-align-${ closeVAlign }` ]: closeVAlign,
			[ `kc-close-position-${ realClosePosition }` ]: realClosePosition,
			[ `kc-inner-v-align-${ innerVAlign }`]: height !== 'auto' && innerVAlign,
		} );
		const previewPaddingTop = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== padding ? padding[ 0 ] : '' ), ( undefined !== paddingTablet ? paddingTablet[ 0 ] : '' ), ( undefined !== paddingMobile ? paddingMobile[ 0 ] : '' ) );
		const previewPaddingRight = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== padding ? padding[ 1 ] : '' ), ( undefined !== paddingTablet ? paddingTablet[ 1 ] : '' ), ( undefined !== paddingMobile ? paddingMobile[ 1 ] : '' ) );
		const previewPaddingBottom = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== padding ? padding[ 2 ] : '' ), ( undefined !== paddingTablet ? paddingTablet[ 2 ] : '' ), ( undefined !== paddingMobile ? paddingMobile[ 2 ] : '' ) );
		const previewPaddingLeft = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== padding ? padding[ 3 ] : '' ), ( undefined !== paddingTablet ? paddingTablet[ 3 ] : '' ), ( undefined !== paddingMobile ? paddingMobile[ 3 ] : '' ) );
		const previewMarginTop = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== margin ? margin[ 0 ] : '' ), ( undefined !== marginTablet ? marginTablet[ 0 ] : '' ), ( undefined !== marginMobile ? marginMobile[ 0 ] : '' ) );
		const previewMarginRight = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== margin ? margin[ 1 ] : '' ), ( undefined !== marginTablet ? marginTablet[ 1 ] : '' ), ( undefined !== marginMobile ? marginMobile[ 1 ] : '' ) );
		const previewMarginBottom = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== margin ? margin[ 2 ] : '' ), ( undefined !== marginTablet ? marginTablet[ 2 ] : '' ), ( undefined !== marginMobile ? marginMobile[ 2 ] : '' ) );
		const previewMarginLeft = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== margin ? margin[ 3 ] : '' ), ( undefined !== marginTablet ? marginTablet[ 3 ] : '' ), ( undefined !== marginMobile ? marginMobile[ 3 ] : '' ) );
		// Max width.
		const previewMaxWidth = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== maxWidth ? maxWidth[ 0 ] : '' ), ( undefined !== maxWidth ? maxWidth[ 1 ] : '' ), ( undefined !== maxWidth ? maxWidth[ 2 ] : '' ) );
		// MinHeight.
		const previewMinHeight = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== minHeight ?  minHeight[ 0 ] : '' ), ( undefined !==  minHeight ?  minHeight[ 1 ] : '' ), ( undefined !== minHeight ?  minHeight[ 2 ] : '' ) );
		// Border Width.
		const previewBorderTop = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== borderWidth ? borderWidth[ 0 ] : '' ), ( undefined !== borderWidthTablet ? borderWidthTablet[ 0 ] : '' ), ( undefined !== borderWidthMobile ? borderWidthMobile[ 0 ] : '' ) );
		const previewBorderRight = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== borderWidth ? borderWidth[ 1 ] : '' ), ( undefined !== borderWidthTablet ? borderWidthTablet[ 1 ] : '' ), ( undefined !== borderWidthMobile ? borderWidthMobile[ 1 ] : '' ) );
		const previewBorderBottom = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== borderWidth ? borderWidth[ 2 ] : '' ), ( undefined !== borderWidthTablet ? borderWidthTablet[ 2 ] : '' ), ( undefined !== borderWidthMobile ? borderWidthMobile[ 2 ] : '' ) );
		const previewBorderLeft = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== borderWidth ? borderWidth[ 3 ] : '' ), ( undefined !== borderWidthTablet ? borderWidthTablet[ 3 ] : '' ), ( undefined !== borderWidthMobile ? borderWidthMobile[ 3 ] : '' ) );
		// Border Radius.
		const previewRadiusTop = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== borderRadius ? borderRadius[ 0 ] : '' ), ( undefined !== borderRadiusTablet ? borderRadiusTablet[ 0 ] : '' ), ( undefined !== borderRadiusMobile ? borderRadiusMobile[ 0 ] : '' ) );
		const previewRadiusRight = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== borderRadius ? borderRadius[ 1 ] : '' ), ( undefined !== borderRadiusTablet ? borderRadiusTablet[ 1 ] : '' ), ( undefined !== borderRadiusMobile ? borderRadiusMobile[ 1 ] : '' ) );
		const previewRadiusBottom = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== borderRadius ? borderRadius[ 2 ] : '' ), ( undefined !== borderRadiusTablet ? borderRadiusTablet[ 2 ] : '' ), ( undefined !== borderRadiusMobile ? borderRadiusMobile[ 2 ] : '' ) );
		const previewRadiusLeft = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== borderRadius ? borderRadius[ 3 ] : '' ), ( undefined !== borderRadiusTablet ? borderRadiusTablet[ 3 ] : '' ), ( undefined !== borderRadiusMobile ? borderRadiusMobile[ 3 ] : '' ) );
		// Width
		//const previewWidth = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== width ? width[ 0 ] : '' ), ( undefined !== width ? width[ 1 ] : '' ), ( undefined !== width ? width[ 2 ] : '' ) );
		// Close button
		const previewClosePaddingTop = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== closePadding ? closePadding[ 0 ] : '' ), ( undefined !== closePaddingTablet ? closePaddingTablet[ 0 ] : '' ), ( undefined !== closePaddingMobile ? closePaddingMobile[ 0 ] : '' ) );
		const previewClosePaddingRight = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== closePadding ? closePadding[ 1 ] : '' ), ( undefined !== closePaddingTablet ? closePaddingTablet[ 1 ] : '' ), ( undefined !== closePaddingMobile ? closePaddingMobile[ 1 ] : '' ) );
		const previewClosePaddingBottom = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== closePadding ? closePadding[ 2 ] : '' ), ( undefined !== closePaddingTablet ? closePaddingTablet[ 2 ] : '' ), ( undefined !== closePaddingMobile ? closePaddingMobile[ 2 ] : '' ) );
		const previewClosePaddingLeft = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== closePadding ? closePadding[ 3 ] : '' ), ( undefined !== closePaddingTablet ? closePaddingTablet[ 3 ] : '' ), ( undefined !== closePaddingMobile ? closePaddingMobile[ 3 ] : '' ) );
		const previewCloseSize = this.getPreviewSize( this.props.getPreviewDevice, ( undefined !== closeSize ? closeSize[ 0 ] : '' ), ( undefined !== closeSize ? closeSize[ 1 ] : '' ), ( undefined !== closeSize ? closeSize[ 2 ] : '' ) );
		// const blockProps = useBlockProps( {
		// 	className: classes,
		// } );
		// const innerBlocksProps = useInnerBlocksProps( blockProps, {
		// 	templateLock: false,
		// 	template: [
		// 		[ 'core/paragraph', { placeholder: __( 'Placeholder', 'kadence-conversions' ) } ],
		// 	],
		// } );
		const hasLanguageSettings = ( kadenceConversionsParams.languageSettings && kadenceConversionsParams.languageSettings.length > 0 ? true : false );
		if ( ! conversionType ) {
			return (
				<Modal
					className="kadence-conversions-type-modal"
					title={ __( 'Conversion Type', 'kadence-conversions' ) }
					onRequestClose={ () => {
						updateMetaValue( 'popup', '_kad_conversion_type' );
						setAttributes( { conversionType: 'popup' } );
					} }
				>
					{/* <RadioButtonControl
						label={ __( 'Choose Conversion Type', 'kadence-conversions' ) }
						value={ '' }
						options={ conversionTypeOptions }
						onChange={ value => {
							if ( 'slide_in' === value ) {
								setAttributes( { horizontalAlign: 'right', verticalAlign: 'bottom', repeatControl: false, conversionType: value} );
								updateMetaValue( value, '_kad_conversion_type' );
								saveShadow( { hOffset: -2, vOffset: -6, blur: 12 } );
							} else if ( 'banner' === value ) {
								setAttributes( { verticalAlign: 'bottom', repeatControl: false, conversionType: value } );
								updateMetaValue( value, '_kad_conversion_type' );
								saveShadow( { enable: false } );
							} else {
								updateMetaValue( value, '_kad_conversion_type' );
								setAttributes( { conversionType: value } );
							}
						} }
					/> */}
				</Modal>
			);
		}
		// if ( ! templateSelected ) {
		// 	return (
		// 		<TemplateSelect
		// 			className="kadence-conversions-template-modal kadence-conversions-type-modal"
		// 			label={ __( 'Conversion Template Select', 'kadence-conversions' ) }
		// 			reload={ false }
		// 			clientId={ clientId }
		// 			type={ conversionType }
		// 			onImport={ ( templateName ) => {
		// 				if ( templateName === 'slide_in' ) {
		// 					setAttributes( { templateSelected: templateName, horizontalAlign: 'right', maxWidth: [ 400, '', '' ] } );
		// 				} else if ( 'slide_in_right' === templateName ) {
		// 					setAttributes( { templateSelected: templateName, horizontalAlign: 'right', maxWidth: [ 400, '', '' ], padding: [0,0,0,0] } );
		// 				} else if ( 'slide_in_cookie_right' === templateName ) {
		// 					setAttributes( { templateSelected: templateName, repeatControl: true, conversionGoal: 'button', goalClass: 'conversion-button', goalClose:true, horizontalAlign: 'right', maxWidth: [ 400, '', '' ], padding: [0,0,0,0] } );
		// 				} else if ( 'slide_in_left' === templateName ) {
		// 					setAttributes( { templateSelected: templateName, horizontalAlign: 'left', maxWidth: [ 400, '', '' ], padding: [0,0,0,0] } );
		// 				} else if ( 'slide_in_cookie_left' === templateName ) {
		// 					setAttributes( { templateSelected: templateName, repeatControl: true, conversionGoal: 'button', goalClass: 'conversion-button', goalClose:true, horizontalAlign: 'left', maxWidth: [ 400, '', '' ], padding: [0,0,0,0] } );
		// 				} else if ( 'banner' === templateName ) {
		// 					setAttributes( { templateSelected: templateName, displayClose: false, closePosition: 'outside', closeVAlign: 'top', verticalAlign:'bottom', conversionGoal: 'button', goalClass: 'conversion-button', maxWidth: [ '', '', '' ] } );
		// 					saveShadow( { enable: false } );
		// 				} else if ( 'banner_bottom' === templateName ) {
		// 					setAttributes( { templateSelected: templateName, displayClose: false, closePosition: 'outside', closeVAlign: 'top', verticalAlign:'bottom', conversionGoal: 'button', goalClass: 'conversion-button', maxWidth: [ '', '', '' ], padding: [0,0,0,0] } );
		// 					saveBackground( { bgColor: 'rgba(255,255,255,0)' } );
		// 					saveShadow( { enable: false } );
		// 				} else if ( 'banner_cookie_bottom' === templateName ) {
		// 					setAttributes( { templateSelected: templateName, displayClose: false, repeatControl: true, conversionGoal: 'button', goalClass: 'conversion-button', goalClose:true, closePosition: 'outside', closeVAlign: 'top', verticalAlign:'bottom', conversionGoal: 'button', goalClass: 'conversion-button', maxWidth: [ '', '', '' ], padding: [0,0,0,0] } );
		// 					saveBackground( { bgColor: 'rgba(255,255,255,0)' } );
		// 					saveShadow( { enable: false } );
		// 				} else if ( 'banner_top' === templateName ) {
		// 					setAttributes( { templateSelected: templateName, displayClose: false, closePosition: 'outside', closeVAlign: 'bottom', verticalAlign:'top', conversionGoal: 'button', goalClass: 'conversion-button', maxWidth: [ '', '', '' ], padding: [0,0,0,0] } );
		// 					saveBackground( { bgColor: 'rgba(255,255,255,0)' } );
		// 					saveShadow( { enable: false } );
		// 				} else if ( 'banner_cookie_top' === templateName ) {
		// 					setAttributes( { templateSelected: templateName, displayClose: false, repeatControl: true, conversionGoal: 'button', goalClass: 'conversion-button', goalClose:true, closePosition: 'outside', closeVAlign: 'bottom', verticalAlign:'top', conversionGoal: 'button', goalClass: 'conversion-button', maxWidth: [ '', '', '' ], padding: [0,0,0,0] } );
		// 					saveBackground( { bgColor: 'rgba(255,255,255,0)' } );
		// 					saveShadow( { enable: false } );
		// 				} else if ( 'pop_button' === templateName ) {
		// 					// Popup Button Goal
		// 					setAttributes( { templateSelected: templateName, padding: [0,0,0,0], conversionGoal: 'button', goalClass: 'conversion-button', maxWidth: [ 700, '', '' ] } );
		// 				} else if ( 'full_pop' === templateName ) {
		// 					// Popup Button Goal
		// 					setAttributes( { templateSelected: templateName, padding: [20,20,20,20], maxWidth: [ 1000, '', '' ], closeColor: '#ffffff', closeHoverColor: '#ffffff', closePosition:'screen' } );
		// 					saveOverlayBackground( { opacity: 1, bgColor: '#0093E9' } );
		// 					saveBackground( { bgColor: 'rgba(255,255,255,0)' } );
		// 					saveShadow( { enable: false } );
		// 				} else if ( 'popup_standard' === templateName ) {
		// 					// Popup Standard.
		// 					setAttributes( { templateSelected: templateName, padding: [0,0,0,0], maxWidth: [ 700, '', '' ]} );
		// 				} else if ( 'popup_white' === templateName ) {
		// 					// Popup Standard.
		// 					setAttributes( { templateSelected: templateName, padding: [0,0,0,0], maxWidth: [ 700, '', '' ], closePosition: 'inside', } );
		// 					saveOverlayBackground( { opacity: 0.9, bgColor: '#ffffff' } );
		// 				} else {
		// 					// Popup empty.
		// 					setAttributes( { templateSelected: templateName, maxWidth: [ 700, '', '' ] } );
		// 				}
		// 			} }
		// 			onRequestClose={ () => {
		// 				setAttributes( { templateSelected: 'none' } );
		// 			} }
		// 		/>
		// 	);
		// }
		return (
			<Fragment>
				<InspectorControls>
					{/* <PanelBody
						title={ __( 'Launch Triggers', 'kadence-conversions' ) }
						initialOpen={ false }
					>
						<SelectControl
							label={ __( 'Launch Triggers' ) }
							options={ [
								{
									label: __( 'None', 'kadence-conversions' ),
									value: '',
								},
								{
									label: __( 'Time Delay', 'kadence-conversions' ),
									value: 'time',
								},
								{
									label: __( 'Exit Intent', 'kadence-conversions' ),
									value: 'exit_intent',
								},
								{
									label: __( 'Scroll Distance', 'kadence-conversions' ),
									value: 'scroll',
								},
								{
									label: __( 'End of Content', 'kadence-conversions' ),
									value: 'content_end',
								},
								{
									label: __( 'On Load', 'kadence-conversions' ),
									value: 'load',
								},
								{
									label: __( 'Custom Link', 'kadence-conversions' ),
									value: 'link',
								},
							] }
							value={ undefined !== meta[ '_kad_conversion_trigger' ] ? meta[ '_kad_conversion_trigger' ] : '' }
							onChange={ ( value ) => {
								if ( ! value ) {
									updateMetaValue( '', '_kad_conversion_trigger' );
									setAttributes( { conversionTrigger: '' } );
								} else {
									updateMetaValue( value, '_kad_conversion_trigger' );
									setAttributes( { conversionTrigger: value } );
								}
							} }
						/>
						{ conversionTrigger === 'time' && (
							<SingleRangeControl
								label={ __( 'Delay in milliseconds', 'kadence-conversions' ) }
								className="conversions-millaseconds"
								value={ delay }
								onChange={ ( value ) => setAttributes( { delay: value } ) }
								min={ 0 }
								max={ 200000 }
								step={ 10 }
							/>
						) }
						{ conversionTrigger === 'scroll' && (
							<Fragment>
								<SingleRangeControl
									label={ __( 'Scroll down distance', 'kadence-conversions' ) }
									value={ scroll }
									onChange={ ( value ) => setAttributes( { scroll: value } ) }
									min={ 0 }
									max={ 30000 }
									step={ 1 }
								/>
								{ conversionType === 'banner' && (
									<ToggleControl
										label={ __( 'Hide again if scroll up?', 'kadence-conversions' ) }
										checked={ scrollHide }
										onChange={ value => setAttributes( { scrollHide: value } ) }
									/>
								) }
							</Fragment>
						) }
						{ conversionTrigger === 'link' && (
							<>
								<TextControl
									label={ __( 'The Custom Trigger Link' ) }
									help={ __( 'Use this in the link field to trigger opening conversion item', 'kadence-conversions' ) }
									value={ uniqueID}
									onChange={ ( nextValue ) => {
										nextValue = nextValue.replace( ANCHOR_REGEX, '-' );
										setAttributes( {
											uniqueID: nextValue,
										} );
									} }
								/>
								<TextControl
									label={ __( 'Copy Trigger Link' ) }
									value={ '#' + uniqueID }
									readOnly={ true }
								/>
							</>
						) }
					</PanelBody> */}
					{/* <PanelBody
						title={ __( 'Conversion Settings', 'kadence-conversions' ) }
						initialOpen={ false }
					>
						<SelectControl
							label={ __( 'Conversion Type' ) }
							options={ conversionTypeOptions }
							value={ undefined !== meta[ '_kad_conversion_type' ] ? meta[ '_kad_conversion_type' ] : '' }
							onChange={ ( value ) => {
								updateMetaValue( value, '_kad_conversion_type' );
								setAttributes( { conversionType: value } );
							} }
						/>
						<ToggleControl
							label={ __( 'Enable Analytics Tracking', 'kadence-conversions' ) }
							checked={ conversionTracking }
							onChange={ value => setAttributes( { conversionTracking: value } ) }
						/>
						<SelectControl
							label={ __( 'Conversion Goal', 'kadence-conversions' ) }
							value={ conversionGoal }
							options={ [
								{ value: 'form', label: __( 'Submit Form', 'kadence-conversions' ) },
								{ value: 'button', label: __( 'Click Button', 'kadence-conversions' ) },
							] }
							onChange={ value => setAttributes( { conversionGoal: value } ) }
						/>
						{ conversionGoal === 'button' && (
							<TextControl
								label={ __( 'Goal specific button class (Optional)' ) }
								help={ __( 'Here define a specific class which will be the only class that converts the Conversion.', 'kadence-conversions' ) }
								value={ goalClass || '' }
								onChange={ ( nextValue ) => {
									nextValue = nextValue.replace( ANCHOR_REGEX, '-' );
									setAttributes( {
										goalClass: nextValue,
									} );
								} }
							/>
						) }
						<ToggleControl
							label={ __( 'Close Conversion on Goal Event?', 'kadence-conversions' ) }
							checked={ goalClose }
							onChange={ value => setAttributes( { goalClose: value } ) }
						/>
					</PanelBody> */}
					{/* <PanelBody
						title={ __( 'Repeat Control', 'kadence-conversions' ) }
						initialOpen={ false }
					>
						<ToggleControl
							label={ __( 'Enable Repeat Control', 'kadence-conversions' ) }
							checked={ repeatControl }
							help={ __( 'Uses Cookies to prevent conversions from appearing if a user has closed one out.', 'kadence-conversions' ) }
							onChange={ value => setAttributes( { repeatControl: value } ) }
						/>
						<RangeControl
							label={ __( 'On Close, Cookie Expires ( Days )', 'kadence-conversions' ) }
							value={ closeRepeat }
							onChange={ ( value ) => setAttributes( { closeRepeat: value } ) }
							min={ 1 }
							max={ 1000 }
							step={ 1 }
						/>
						<RangeControl
							label={ __( 'On Goal Event, Cookie Expires ( Days )', 'kadence-conversions' ) }
							value={ convertRepeat }
							onChange={ ( value ) => setAttributes( { convertRepeat: value } ) }
							min={ 1 }
							max={ 1000 }
							step={ 1 }
						/>
						<TextControl
							label={ __( 'Campaign ID' ) }
							help={ __( 'This defines the cookie used for repeat control.', 'kadence-conversions' ) }
							value={ campaignID || '' }
							onChange={ ( nextValue ) => {
								nextValue = nextValue.replace( ANCHOR_REGEX, '-' );
								setAttributes( {
									campaignID: nextValue,
								} );
							} }
						/>
					</PanelBody>
					<PanelBody
						title={ __( 'Position Settings', 'kadence-conversions' ) }
						initialOpen={ false }
					>
						{ conversionType !== 'banner' && (
							<SelectControl
								label={ __( 'Horizontal Align', 'kadence-conversions' ) }
								value={ horizontalAlign }
								options={ [
									{ value: 'center', label: __( 'Center', 'kadence-conversions' ) },
									{ value: 'left', label: __( 'Left', 'kadence-conversions' ) },
									{ value: 'right', label: __( 'Right', 'kadence-conversions' ) },
								] }
								onChange={ value => setAttributes( { horizontalAlign: value } ) }
							/>
						) }
						<SelectControl
							label={ __( 'Vertical Align', 'kadence-conversions' ) }
							value={ verticalAlign }
							options={ [
								{ value: 'top', label: __( 'Top', 'kadence-conversions' ) },
								{ value: 'middle', label: __( 'Middle', 'kadence-conversions' ) },
								{ value: 'bottom', label: __( 'Bottom', 'kadence-conversions' ) }
							] }
							onChange={ value => setAttributes( { verticalAlign: value } ) }
						/>
					</PanelBody>
					<PanelBody
						title={ __( 'Size Settings', 'kadence-conversions' ) }
						initialOpen={ false }
					>
						<SelectControl
							label={ __( 'Height', 'kadence-conversions' ) }
							value={ height }
							options={ conversionType === 'popup' ? [
								{ value: 'auto', label: __( 'Auto', 'kadence-conversions' ) },
								{ value: 'fixed', label: __( 'Set Minimum Height', 'kadence-conversions' ) },
								{ value: 'full', label: __( 'Full Screen Height', 'kadence-conversions' ) },
							] : [
								{ value: 'auto', label: __( 'Auto', 'kadence-conversions' ) },
								{ value: 'fixed', label: __( 'Set Minimum Height', 'kadence-conversions' ) },
							] }
							onChange={ value => setAttributes( { height: value } ) }
						/>
						{ height === 'fixed' && (
							<ResponsiveRangeControls
								label={ __( 'Minimum Height', 'kadence-conversions' ) }
								value={ ( minHeight && '' !== minHeight[ 0 ] ? minHeight[ 0 ] : '' ) }
								onChange={ value => setAttributes( { minHeight: [ value, ( minHeight && minHeight[ 1 ] ? minHeight[ 1 ] : '' ), ( minHeight && minHeight[ 2 ] ? minHeight[ 2 ] : '' ) ] } ) }
								tabletValue={ ( minHeight && '' !== minHeight[ 1 ] ? minHeight[ 1 ] : '' ) }
								onChangeTablet={ value => setAttributes( { minHeight: [ ( minHeight && minHeight[ 0 ] ? minHeight[ 0 ] : '' ), value, ( minHeight && minHeight[ 2 ] ? minHeight[ 2 ] : '' ) ] } ) }
								mobileValue={ ( minHeight && '' !== minHeight[ 2 ] ? minHeight[ 2 ] : '' ) }
								onChangeMobile={ value => setAttributes( { minHeight: [ ( minHeight && minHeight[ 0 ] ? minHeight[ 0 ] : '' ), ( minHeight && minHeight[ 2 ] ? minHeight[ 2 ] : '' ), value ] } ) }
								min={ 0 }
								max={ ( minHeightUnit !== 'px' && minHeightUnit !== 'vh' ? 12 : 1200 ) }
								step={ ( minHeightUnit !== 'px' && minHeightUnit !== 'vh' ? 0.1 : 1 ) }
								unit={ minHeightUnit }
								onUnit={ ( value ) => setAttributes( { minHeightUnit: value } ) }
								units={ [ 'px', 'em', 'rem', 'vh' ] }
							/>
						) }
						{ height !== 'auto' && (
							<SelectControl
								label={ __( 'Inner Vertical Alignment', 'kadence-conversions' ) }
								value={ innerVAlign }
								options={ [
									{ value: 'top', label: __( 'Top', 'kadence-conversions' ) },
									{ value: 'center', label: __( 'Middle', 'kadence-conversions' ) },
									{ value: 'bottom', label: __( 'Bottom', 'kadence-conversions' ) },
								] }
								onChange={ value => setAttributes( { innerVAlign: value } ) }
							/>
						) }
						{ conversionType !== 'banner' && (
							<Fragment>
								<ResponsiveRangeControls
									label={ __( 'Maximum Width', 'kadence-conversions' ) }
									value={ ( maxWidth && '' !== maxWidth[ 0 ] ? maxWidth[ 0 ] : '' ) }
									onChange={ value => setAttributes( { maxWidth: [ value, ( maxWidth && maxWidth[ 1 ] ? maxWidth[ 1 ] : '' ), ( maxWidth && maxWidth[ 2 ] ? maxWidth[ 2 ] : '' ) ] } ) }
									tabletValue={ ( maxWidth && '' !== maxWidth[ 1 ] ? maxWidth[ 1 ] : '' ) }
									onChangeTablet={ value => setAttributes( { maxWidth: [ ( maxWidth && maxWidth[ 0 ] ? maxWidth[ 0 ] : '' ), value, ( maxWidth && maxWidth[ 2 ] ? maxWidth[ 2 ] : '' ) ] } ) }
									mobileValue={ ( maxWidth && '' !== maxWidth[ 2 ] ? maxWidth[ 2 ] : '' ) }
									onChangeMobile={ value => setAttributes( { maxWidth: [ ( maxWidth && maxWidth[ 0 ] ? maxWidth[ 0 ] : '' ), ( maxWidth && maxWidth[ 2 ] ? maxWidth[ 2 ] : '' ), value ] } ) }
									min={ 0 }
									max={ ( maxWidthUnit !== 'px' ? 100 : 2000 ) }
									step={ 1 }
									unit={ maxWidthUnit }
									onUnit={ ( value ) => setAttributes( { maxWidthUnit: value } ) }
									units={ [ 'px', 'vw' ] }
								/>
							</Fragment>
						) }
						{ conversionType === 'banner' && (
							<ResponsiveRangeControls
								label={ __( 'Inner Content Max Width', 'kadence-conversions' ) }
								value={ ( maxWidth && '' !== maxWidth[ 0 ] ? maxWidth[ 0 ] : '' ) }
								onChange={ value => setAttributes( { maxWidth: [ value, ( maxWidth && maxWidth[ 1 ] ? maxWidth[ 1 ] : '' ), ( maxWidth && maxWidth[ 2 ] ? maxWidth[ 2 ] : '' ) ] } ) }
								tabletValue={ ( maxWidth && '' !== maxWidth[ 1 ] ? maxWidth[ 1 ] : '' ) }
								onChangeTablet={ value => setAttributes( { maxWidth: [ ( maxWidth && maxWidth[ 0 ] ? maxWidth[ 0 ] : '' ), value, ( maxWidth && maxWidth[ 2 ] ? maxWidth[ 2 ] : '' ) ] } ) }
								mobileValue={ ( maxWidth && '' !== maxWidth[ 2 ] ? maxWidth[ 2 ] : '' ) }
								onChangeMobile={ value => setAttributes( { maxWidth: [ ( maxWidth && maxWidth[ 0 ] ? maxWidth[ 0 ] : '' ), ( maxWidth && maxWidth[ 2 ] ? maxWidth[ 2 ] : '' ), value ] } ) }
								min={ 0 }
								max={ ( maxWidthUnit !== 'px' ? 100 : 2000 ) }
								step={ 1 }
								unit={ maxWidthUnit }
								onUnit={ ( value ) => setAttributes( { maxWidthUnit: value } ) }
								units={ [ 'px', 'vw' ] }
							/>
						) }
					</PanelBody> */}
					{/* <PanelBody
						title={ __( 'Container Styling', 'kadence-conversions' ) }
						initialOpen={ false }
					>
						<PopColorControl
							label={ __( 'Background Color', 'kadence-conversions' ) }
							value={ ( background && background[ 0 ] ? background[ 0 ].bgColor : '' ) }
							onChange={ value => saveBackground( { bgColor: value } ) }
							default={ '#fff' }
						/>
						<BackgroundControl
							label={ __( 'Background Image', 'kadence-conversions' ) }
							hasImage={ hasBackgroundImage }
							imageURL={ ( background && background[ 0 ] && background[ 0 ].bgImg ? background[ 0 ].bgImg : '' ) }
							imageID={ ( background && background[ 0 ] && background[ 0 ].bgImgID ? background[ 0 ].bgImgID : '' ) }
							imagePosition={ ( background && background[ 0 ] && background[ 0 ].bgImgPosition ? background[ 0 ].bgImgPosition : 'center center' ) }
							imageSize={ ( background && background[ 0 ] && background[ 0 ].bgImgSize ? background[ 0 ].bgImgSize : 'cover' ) }
							imageRepeat={ ( background && background[ 0 ] && background[ 0 ].bgImgRepeat ? background[ 0 ].bgImgRepeat : 'no-repeat' ) }
							imageAttachment={ ( background && background[ 0 ] && background[ 0 ].bgImgAttachment ? background[ 0 ].bgImgAttachment : 'scroll' ) }
							onRemoveImage={ onRemoveBackgroundImage }
							onSaveImage={ ( img ) => {
								saveBackground( {
									bgImgID: img.id,
									bgImg: img.url,
								} );
							} }
							onSaveURL={ ( newURL ) => {
								if ( newURL !== ( background && background[ 0 ] && background[ 0 ].bgImg ? background[ 0 ].bgImg : '' ) ) {
									saveBackground( {
										bgImgID: undefined,
										bgImg: newURL,
									} );
								}
							} }
							onSavePosition={ value => saveBackground( { bgImgPosition: value } ) }
							onSaveSize={ value => saveBackground( { bgImgSize: value } ) }
							onSaveRepeat={ value => saveBackground( { bgImgRepeat: value } ) }
							onSaveAttachment={ value => saveBackground( { bgImgAttachment: value } ) }
							disableMediaButtons={ ( background && background[ 0 ] && background[ 0 ].bgImg ? background[ 0 ].bgImg : '' ) }
						/>
						<PopColorControl
							label={ __( 'Border Color', 'kadence-conversions' ) }
							value={ ( border ? border : '' ) }
							onChange={ value => setAttributes( { border: value } ) }
							default={ '' }
						/>
						<ResponsiveMeasurementControls
							label={ __( 'Border Width', 'kadence-conversions' ) }
							value={ borderWidth }
							control={ borderWidthControl }
							tabletValue={ borderWidthTablet }
							mobileValue={ borderWidthMobile }
							onChange={ ( value ) => setAttributes( { borderWidth: value } ) }
							onChangeTablet={ ( value ) => setAttributes( { borderWidthTablet: value } ) }
							onChangeMobile={ ( value ) => setAttributes( { borderWidthMobile: value } ) }
							onChangeControl={ ( value ) => this.setState( { borderWidthControl: value } ) }
							min={ 0 }
							max={ 100 }
							step={ 1 }
							unit={ 'px' }
							showUnit={ true }
							units={ [ 'px' ] }
						/>
						<ResponsiveMeasurementControls
							label={ __( 'Border Radius', 'kadence-conversions' ) }
							value={ borderRadius }
							control={ borderRadiusControl }
							tabletValue={ borderRadiusTablet }
							mobileValue={ borderRadiusMobile }
							onChange={ ( value ) => setAttributes( { borderRadius: value } ) }
							onChangeTablet={ ( value ) => setAttributes( { borderRadiusTablet: value } ) }
							onChangeMobile={ ( value ) => setAttributes( { borderRadiusMobile: value } ) }
							onChangeControl={ ( value ) => this.setState( { borderRadiusControl: value } ) }
							min={ 0 }
							max={ 100 }
							step={ 1 }
							unit={ borderRadiusUnit }
							onUnit={ ( value ) => setAttributes( { borderRadiusUnit: value } ) }
							linkedIcon= { icons.radiuslinked }
							individualIcon= { icons.radiusindividual }
							units={ [ 'px', '%' ] }
							firstIcon={ icons.topleft }
							secondIcon={ icons.topright }
							thirdIcon={ icons.bottomright }
							fourthIcon={ icons.bottomleft }
						/>
						<ResponsiveMeasurementControls
							label={ __( 'Padding', 'kadence-conversions' ) }
							value={ padding }
							control={ paddingControl }
							tabletValue={ paddingTablet }
							mobileValue={ paddingMobile }
							onChange={ ( value ) => setAttributes( { padding: value } ) }
							onChangeTablet={ ( value ) => setAttributes( { paddingTablet: value } ) }
							onChangeMobile={ ( value ) => setAttributes( { paddingMobile: value } ) }
							onChangeControl={ ( value ) => this.setState( { paddingControl: value } ) }
							min={ 0 }
							max={ ( paddingUnit === 'em' || paddingUnit === 'rem' ? 6 : 100 ) }
							step={ ( paddingUnit === 'em' || paddingUnit === 'rem' ? 0.1 : 1 ) }
							unit={ paddingUnit }
							units={ [ 'px', 'em', 'rem' ] }
							onUnit={ ( value ) => setAttributes( { paddingUnit: value } ) }
						/>
						<ResponsiveMeasurementControls
							label={ __( 'Margin', 'kadence-conversions' ) }
							value={ margin }
							control={ marginControl }
							tabletValue={ marginTablet }
							mobileValue={ marginMobile }
							onChange={ ( value ) => setAttributes( { margin: value } ) }
							onChangeTablet={ ( value ) => setAttributes( { marginTablet: value } ) }
							onChangeMobile={ ( value ) => setAttributes( { marginMobile: value } ) }
							onChangeControl={ ( value ) => this.setState( { marginControl: value } ) }
							min={ 0 }
							max={ ( marginUnit === 'em' || marginUnit === 'rem' ? 6 : 100 ) }
							step={ ( marginUnit === 'em' || marginUnit === 'rem' ? 0.1 : 1 ) }
							unit={ marginUnit }
							units={ [ 'px', 'em', 'rem' ] }
							onUnit={ ( value ) => setAttributes( { marginUnit: value } ) }
						/>
						<ShadowControl
							label={ __( 'Box Shadow', 'kadence-conversions' ) }
							enable={ ( undefined !== shadow && undefined !== shadow[ 0 ] && undefined !== shadow[ 0 ].enable ? shadow[ 0 ].enable : true ) }
							color={ ( undefined !== shadow && undefined !== shadow[ 0 ] && undefined !== shadow[ 0 ].color ? shadow[ 0 ].color : 'rgba(0,0,0,0.2)' ) }
							colorDefault={ 'rgba(0,0,0,0.2)' }
							opacity={ ( undefined !== shadow && undefined !== shadow[ 0 ] && undefined !== shadow[ 0 ].opacity ? shadow[ 0 ].opacity : 0.2 ) }
							hOffset={ ( undefined !== shadow && undefined !== shadow[ 0 ] && undefined !== shadow[ 0 ].hOffset ? shadow[ 0 ].hOffset : 0 ) }
							vOffset={ ( undefined !== shadow && undefined !== shadow[ 0 ] && undefined !== shadow[ 0 ].vOffset ? shadow[ 0 ].vOffset : 0 ) }
							blur={ ( undefined !== shadow && undefined !== shadow[ 0 ] && undefined !== shadow[ 0 ].blur ? shadow[ 0 ].blur : 14 ) }
							spread={ ( undefined !== shadow && undefined !== shadow[ 0 ] && undefined !== shadow[ 0 ].spread ? shadow[ 0 ].spread : 0 ) }
							inset={ ( undefined !== shadow && undefined !== shadow[ 0 ] && undefined !== shadow[ 0 ].inset ? shadow[ 0 ].inset : false ) }
							onEnableChange={ value => {
								saveShadow( { enable: value } );
							} }
							onColorChange={ value => {
								saveShadow( { color: value } );
							} }
							onHOffsetChange={ value => {
								saveShadow( { hOffset: value } );
							} }
							onVOffsetChange={ value => {
								saveShadow( { vOffset: value } );
							} }
							onBlurChange={ value => {
								saveShadow( { blur: value } );
							} }
							onSpreadChange={ value => {
								saveShadow( { spread: value } );
							} }
							onInsetChange={ value => {
								saveShadow( { inset: value } );
							} }
						/>
					</PanelBody> */}
					{/* { conversionType === 'popup' && (
						<PanelBody
							title={ __( 'Overlay Settings', 'kadence-conversions' ) }
							initialOpen={ false }
						>
							<SingleRangeControl
								label={ __( 'Overlay Opacity', 'kadence-conversions' ) }
								value={ ( overlayBackground && overlayBackground[ 0 ] ? overlayBackground[ 0 ].opacity : '' ) }
								onChange={ ( value ) => saveOverlayBackground( { opacity: value } ) }
								min={ 0 }
								max={ 1 }
								step={ 0.01 }
							/>
							<PopColorControl
								label={ __( 'Background Color', 'kadence-conversions' ) }
								value={ ( overlayBackground && overlayBackground[ 0 ] && overlayBackground[ 0 ].bgColor ? overlayBackground[ 0 ].bgColor : '' ) }
								onChange={ value => saveOverlayBackground( { bgColor: value } ) }
								default={ '#000' }
							/>
							<BackgroundControl
								label={ __( 'Background Image', 'kadence-conversions' ) }
								hasImage={ hasOverlayBackgroundImage }
								imageURL={ ( overlayBackground && overlayBackground[ 0 ] && overlayBackground[ 0 ].bgImg ? overlayBackground[ 0 ].bgImg : '' ) }
								imageID={ ( overlayBackground && overlayBackground[ 0 ] && overlayBackground[ 0 ].bgImgID ? overlayBackground[ 0 ].bgImgID : '' ) }
								imagePosition={ ( overlayBackground && overlayBackground[ 0 ] && overlayBackground[ 0 ].bgImgPosition ? overlayBackground[ 0 ].bgImgPosition : 'center center' ) }
								imageSize={ ( overlayBackground && overlayBackground[ 0 ] && overlayBackground[ 0 ].bgImgSize ? overlayBackground[ 0 ].bgImgSize : 'cover' ) }
								imageRepeat={ ( overlayBackground && overlayBackground[ 0 ] && overlayBackground[ 0 ].bgImgRepeat ? overlayBackground[ 0 ].bgImgRepeat : 'no-repeat' ) }
								imageAttachment={ ( overlayBackground && overlayBackground[ 0 ] && overlayBackground[ 0 ].bgImgAttachment ? overlayBackground[ 0 ].bgImgAttachment : 'scroll' ) }
								onRemoveImage={ onRemoveOverlayBackgroundImage }
								onSaveImage={ ( img ) => {
									saveOverlayBackground( {
										bgImgID: img.id,
										bgImg: img.url,
									} );
								} }
								onSaveURL={ ( newURL ) => {
									if ( newURL !== ( overlayBackground && overlayBackground[ 0 ] && overlayBackground[ 0 ].bgImg ? overlayBackground[ 0 ].bgImg : '' ) ) {
										saveOverlayBackground( {
											bgImgID: undefined,
											bgImg: newURL,
										} );
									}
								} }
								onSavePosition={ value => saveOverlayBackground( { bgImgPosition: value } ) }
								onSaveSize={ value => saveOverlayBackground( { bgImgSize: value } ) }
								onSaveRepeat={ value => saveOverlayBackground( { bgImgRepeat: value } ) }
								onSaveAttachment={ value => saveOverlayBackground( { bgImgAttachment: value } ) }
								disableMediaButtons={ ( overlayBackground && overlayBackground[ 0 ] && overlayBackground[ 0 ].bgImg ? overlayBackground[ 0 ].bgImg : '' ) }
							/>
						</PanelBody>
					) } */}
					{/* <PanelBody
						title={ __( 'Target Pages', 'kadence-conversions' ) }
						initialOpen={ false }
					>
						<DisplaySettings
							label={ __( 'Show On', 'kadence-conversions' ) }
							rules={ kadenceConversionsParams.display }
							value={ undefined !== meta[ '_kad_conversion_show' ] ? meta[ '_kad_conversion_show' ] : '' }
							id={ 'kad_popup_show_conditionals' }
							placeholder={ ( undefined === meta[ '_kad_conversion_show' ] || '' === meta[ '_kad_conversion_show' ] ) ? __( 'Entire Site', 'kadence-conversions' ) : __( 'None', 'kadence-conversions' ) }
							onChange={ ( value ) => {
								if ( ! value ) {
									updateMetaValue( '', '_kad_conversion_show' );
								} else {
									updateMetaValue( value, '_kad_conversion_show' );
								}
							} }
						/>
						{ check_show_rules && check_show_rules.length > 1 && (
							<div className={ 'all-show-rules' } style={ {
									marginTop:'20px',
								} }
							>
								<ToggleControl
									label={ __( 'All show rules must be true?', 'kadence-conversions' ) }
									checked={ ( undefined !== meta[ '_kad_conversion_all_show' ] && '' !== meta[ '_kad_conversion_all_show' ] ? meta[ '_kad_conversion_all_show' ] : false ) }
									onChange={ ( value ) => updateMetaValue( value, '_kad_conversion_all_show' ) }
								/>
							</div>
						) }
						<div style={ {
								height: '30px',
							} }
						>
						</div>
						<PanelBody
							title={ __( 'Exclude Settings', 'kadence-conversions' ) }
							initialOpen={ false }
						>
							<DisplaySettings
								label={ __( 'Hide On', 'kadence-conversions' ) }
								rules={ kadenceConversionsParams.display }
								id={ 'kad_popup_hide_conditionals' }
								placeholder={ __( 'None', 'kadence-conversions' ) }
								value={ undefined !== meta[ '_kad_conversion_hide' ] ? meta[ '_kad_conversion_hide' ] : '' }
								setMetaFieldValue={ ( value, meta_field ) => updateMetaValue( value, meta_field ) }
								onChange={ ( value ) => {
									if ( ! value ) {
										updateMetaValue( '', '_kad_conversion_hide' );
									} else {
										updateMetaValue( value, '_kad_conversion_hide' );
									}
								} }
							/>
						</PanelBody>
					</PanelBody>
					<PanelBody
						title={ __( 'Target Visitors', 'kadence-conversions' ) }
						initialOpen={ false }
					>
						<UserSettings
							label={ __( 'Visible to', 'kadence-conversions' ) }
							roles={ kadenceConversionsParams.user }
							placeholder={ __( 'All Users', 'kadence-conversions' ) }
							value={ undefined !== meta[ '_kad_conversion_user' ] ? meta[ '_kad_conversion_user' ] : '' }
							onChange={ ( value ) => {
								if ( ! value ) {
									updateMetaValue( '', '_kad_conversion_user' );
								} else {
									updateMetaValue( value, '_kad_conversion_user' );
								}
							} }
						/>
						<UserSettings
							label={ __( 'Hidden to', 'kadence-conversions' ) }
							roles={ kadenceConversionsParams.user }
							placeholder={ __( 'None', 'kadence-conversions' ) }
							value={ undefined !== meta[ '_kad_conversion_user_hidden' ] ? meta[ '_kad_conversion_user_hidden' ] : '' }
							onChange={ ( value ) => {
								if ( ! value ) {
									updateMetaValue( '', '_kad_conversion_user_hidden' );
								} else {
									updateMetaValue( value, '_kad_conversion_user_hidden' );
								}
							} }
						/>
					</PanelBody>
					{ hasLanguageSettings && (
						<PanelBody
							title={ __( 'Target Language', 'kadence-conversions' ) }
							initialOpen={ false }
						>
							<h2 className="kt-meta-title">{ __( 'Display on language:', 'kadence-conversions' ) }</h2>
							<Select
								options={ kadenceConversionsParams.languageSettings }
								className="kt-meta-select"
								classNamePrefix="ktp"
								value={ kadenceConversionsParams.languageSettings.filter( ( { value } ) => value === ( undefined !== meta[ '_kad_conversion_language' ] ? meta[ '_kad_conversion_language' ] : '' ) ) }
								isMulti={ false }
								isSearchable={ false }
								isClearable={ true }
								maxMenuHeight={ 200 }
								placeholder={ __( 'All Languages', 'kadence-conversions' ) }
								onChange={ ( select ) => {
									if ( ! select ) {
										updateMetaValue( '', '_kad_conversion_language' );
									} else {
										updateMetaValue( select.value, '_kad_conversion_language' );
									}
								} }
							/>
						</PanelBody>
					) }
					{ kadenceConversionsParams.woocommerce && (
						<PanelBody
							title={ __( 'Target Woocommerce Cart', 'kadence-conversions' ) }
							initialOpen={ false }
						>
							<ToggleControl
								label={ __( 'Only show when cart currency total value is more than.', 'kadence-conversions' ) }
								checked={ requireCartMinimum }
								onChange={ ( value ) => setAttributes( { requireCartMinimum: value } ) }
							/>
							{ requireCartMinimum && (
								<SingleRangeControl
									label={ __( 'Cart total more than currency value', 'kadence-conversions' ) }
									value={ cartMinimum }
									onChange={ ( value ) => setAttributes( { cartMinimum: value } ) }
									min={ 1 }
									max={ 3000 }
									step={ 1 }
								/>
							) }
							<ToggleControl
								label={ __( 'Only show when cart currency total value is less than.', 'kadence-conversions' ) }
								checked={ requireCartMaximum }
								onChange={ ( value ) => setAttributes( { requireCartMaximum: value } ) }
							/>
							{ requireCartMaximum && (
								<SingleRangeControl
									label={ __( 'Cart Total less than currency value', 'kadence-conversions' ) }
									value={ cartMaximum }
									onChange={ ( value ) => setAttributes( { cartMaximum: value } ) }
									min={ 1 }
									max={ 3000 }
									step={ 1 }
								/>
							) }
							<ToggleControl
								label={ __( 'Only show if specific products in cart.', 'kadence-conversions' ) }
								checked={ requireCartProducts }
								onChange={ ( value ) => setAttributes( { requireCartProducts: value } ) }
							/>
							{ requireCartProducts && (
								<Fragment>
									<PostSelectButton
										value={ ( cartProducts ? cartProducts : [] ) }
										onSelect={ ( value ) => {
											setAttributes( { cartProducts: value.map( p => p.id ) } );
										} }
										postType={ 'product' }
										modalTitle={ __( 'Select Products', 'kadence-conversions' ) }
										minPosts={ 1 }
										contentState="selection"
										btnProps={ { isLarge: true, isSecondary: true } }
									>
										{ __( 'Select Products', 'kadence-conversions' ) }
									</PostSelectButton>
									{ cartProducts && (
										<div className="kcp-single-selected">
											{ ( cartProducts.length ) + ' ' + __( 'Selected', 'kadence-conversions' ) }
										</div>
									) }
								</Fragment>
							) }
							<ToggleControl
								label={ __( 'Hide if specific products in cart.', 'kadence-conversions' ) }
								checked={ preventCartProducts }
								onChange={ ( value ) => setAttributes( { preventCartProducts: value } ) }
							/>
							{ preventCartProducts && (
								<Fragment>
									<PostSelectButton
										value={ ( preventProducts ? preventProducts : [] ) }
										onSelect={ ( value ) => {
											setAttributes( { preventProducts: value.map( p => p.id ) } );
										} }
										postType={ 'product' }
										modalTitle={ __( 'Select Products', 'kadence-conversions' ) }
										minPosts={ 1 }
										contentState="selection"
										btnProps={ { isLarge: true, isSecondary: true } }
									>
										{ __( 'Select Products', 'kadence-conversions' ) }
									</PostSelectButton>
									{ preventProducts && (
										<div className="kcp-single-selected">
											{ ( preventProducts.length ) + ' ' + __( 'Selected', 'kadence-conversions' ) }
										</div>
									) }
								</Fragment>
							) }
						</PanelBody>
					) }
					<PanelBody
						title={ __( 'Target Devices' ) }
						initialOpen={ false }
					>
						<h2 className="kt-meta-title">{ __( 'Show on Device', 'kadence-conversions' ) }</h2>
						<Select
							options={ deviceOptions }
							className="kt-meta-select"
							classNamePrefix="ktp"
							value={ undefined !== meta[ '_kad_conversion_device' ] && TryParseJSON( meta[ '_kad_conversion_device' ], false ) ? TryParseJSON( meta[ '_kad_conversion_device' ] ) : '' }
							isMulti={ true }
							isSearchable={ false }
							isClearable={ true }
							maxMenuHeight={ 200 }
							placeholder={ __( 'All' ) }
							onChange={ ( value ) => {
								if ( ! value ) {
									updateMetaValue( '', '_kad_conversion_device' );
								} else {
									updateMetaValue( JSON.stringify( value ), '_kad_conversion_device' );
								}
							} }
						/>
					</PanelBody>
					<PanelBody
							title={ __( 'Target Requests', 'kadence-conversions' ) }
							initialOpen={ false }
						>
						<TextareaControl
							label={ __( 'Show if Query Strings in url' ) }
							help={ __( 'Add one pattern per line.', 'kadence-conversions' ) }
							value={ queryStrings || '' }
							placeholder={ __( 'example=true', 'kadence-conversions' ) }
							onChange={ ( value ) => {
								setAttributes( {
									queryStrings: value,
								} );
							} }
						/>
						<TextControl
							label={ __( 'Show based on Referer Domain' ) }
							help={ __( 'Do not include https:// or www. For multiple domains separate with common. Please note, some sites do not pass referrer information.', 'kadence-conversions' ) }
							value={ referrer || '' }
							placeholder={ __( 'example.com', 'kadence-conversions' ) }
							onChange={ ( value ) => {
								setAttributes( {
									referrer: value,
								} );
							} }
						/>
						<TextControl
							label={ __( 'Show if Cookie is present' ) }
							help={ __( 'Cookie name must match exactly.', 'kadence-conversions' ) }
							value={ cookieCheck || '' }
							placeholder={ __( 'cookie_name', 'kadence-conversions' ) }
							onChange={ ( value ) => {
								setAttributes( {
									cookieCheck: value,
								} );
							} }
						/>
						<ToggleControl
							label={ __( 'Only show after a specific amount of page views?', 'kadence-conversions' ) }
							checked={ requirePageViews }
							onChange={ ( value ) => setAttributes( { requirePageViews: value } ) }
						/>
						{ requirePageViews && (
							<SingleRangeControl
								label={ __( 'Page Views Amount', 'kadence-conversions' ) }
								value={ pageViewCount }
								onChange={ ( value ) => setAttributes( { pageViewCount: value } ) }
								min={ 1 }
								max={ 30 }
								step={ 1 }
							/>
						) }
					</PanelBody>
					<PanelBody
						title={ __( 'Scheduling', 'kadence-conversions' ) }
						initialOpen={ false }
					>
						<ToggleControl
							label={ __( 'Enable Range Scheduling', 'kadence-conversions' ) }
							checked={ undefined !== meta[ '_kad_conversion_enable_expires' ] ? meta[ '_kad_conversion_enable_expires' ] : false }
							onChange={ ( value ) => updateMetaValue( value, '_kad_conversion_enable_expires' ) }
						/>
						{ undefined !== meta[ '_kad_conversion_enable_expires' ] && meta[ '_kad_conversion_enable_expires' ] && (
							<Fragment>
								<h2 className="kt-meta-title">{ __( 'Starts', 'kadence-conversions' ) }</h2>
								<DateTimePicker
									currentDate={ undefined !== meta[ '_kad_conversion_starts' ] ? meta[ '_kad_conversion_starts' ] : new Date() }
									onChange={ ( date ) => {
										updateMetaValue( date, '_kad_conversion_starts' );
									} }
									is12Hour={ is12HourTime }
								/>
								<h2 className="kt-meta-title">{ __( 'Expires', 'kadence-conversions' ) }</h2>
								<DateTimePicker
									currentDate={ undefined !== meta[ '_kad_conversion_expires' ] ? meta[ '_kad_conversion_expires' ] : new Date() }
									onChange={ ( date ) => {
										updateMetaValue( date, '_kad_conversion_expires' );
									} }
									is12Hour={ is12HourTime }
								/>
							</Fragment>
						) }
						<ToggleControl
							label={ __( 'Enable Recurring Scheduling', 'kadence-conversions' ) }
							checked={ undefined !== meta[ '_kad_conversion_enable_recurring' ] ? meta[ '_kad_conversion_enable_recurring' ] : false }
							onChange={ ( value ) => updateMetaValue( value, '_kad_conversion_enable_recurring' ) }
						/>
						{ undefined !== meta[ '_kad_conversion_enable_recurring' ] && meta[ '_kad_conversion_enable_recurring' ] && (
							<Fragment>
								<TimeControl
									label={ __( 'Start Time', 'kadence-conversions' ) }
									value={ undefined !== meta[ '_kad_conversion_recurring_start' ] ? meta[ '_kad_conversion_recurring_start' ] : '9:00 AM' }
									onChange={ ( value ) => {
										updateMetaValue( value, '_kad_conversion_recurring_start' );
									} }
									is12Hour={ is12HourTime }
								/>
								<TimeControl
									label={ __( 'Stop Time', 'kadence-conversions' ) }
									value={ undefined !== meta[ '_kad_conversion_recurring_stop' ] ? meta[ '_kad_conversion_recurring_stop' ] : '5:00 PM' }
									onChange={ ( value ) => {
										updateMetaValue( value, '_kad_conversion_recurring_stop' );
									} }
									is12Hour={ is12HourTime }
								/>
								<h2 className="kt-meta-title">{ __( 'Recurring Days', 'kadence-conversions' ) }</h2>
								{ times( dayOptions.length, n => daysOfTheWeekControls( n ) ) }
							</Fragment>
						) }
					</PanelBody>
					{ conversionType !== 'banner' && (
						<PanelBody
							title={ __( 'Animation Settings', 'kadence-conversions' ) }
							initialOpen={ false }
						>
							<SelectControl
								label={ __( 'Open Animation', 'kadence-conversions' ) }
								value={ animateIn }
								options={ [
									{ value: 'fade', label: __( 'Fade In', 'kadence-conversions' ) },
									{ value: 'fadeup', label: __( 'Fade In Up', 'kadence-conversions' ) },
									{ value: 'fadedown', label: __( 'Fade In Down', 'kadence-conversions' ) },
									{ value: 'fadeleft', label: __( 'Fade In Left', 'kadence-conversions' ) },
									{ value: 'faderight', label: __( 'Fade In Right', 'kadence-conversions' ) },
									{ value: 'slideup', label: __( 'Slide In Up', 'kadence-conversions' ) },
									{ value: 'slidedown', label: __( 'Slide In Down', 'kadence-conversions' ) },
									{ value: 'slideleft', label: __( 'Slide In Left', 'kadence-conversions' ) },
									{ value: 'slideright', label: __( 'Slide In Right', 'kadence-conversions' ) },
									{ value: 'zoomin', label: __( 'Zoom In', 'kadence-conversions' ) },
								] }
								onChange={ value => setAttributes( { animateIn: value } ) }
							/>
							<SelectControl
								label={ __( 'Close Animation', 'kadence-conversions' ) }
								value={ animateOut }
								options={ [
									{ value: 'fadeout', label: __( 'Fade Out', 'kadence-conversions' ) },
									{ value: 'fadeoutup', label: __( 'Fade Out Up', 'kadence-conversions' ) },
									{ value: 'fadeoutdown', label: __( 'Fade Out Down', 'kadence-conversions' ) },
									{ value: 'fadeoutleft', label: __( 'Fade Out Left', 'kadence-conversions' ) },
									{ value: 'fadeoutright', label: __( 'Fade Out Right', 'kadence-conversions' ) },
									{ value: 'slideoutup', label: __( 'Slide Out Up', 'kadence-conversions' ) },
									{ value: 'slideoutdown', label: __( 'Slide Out Down', 'kadence-conversions' ) },
									{ value: 'slideoutleft', label: __( 'Slide Out Left', 'kadence-conversions' ) },
									{ value: 'slideoutright', label: __( 'Slide Out Right', 'kadence-conversions' ) },
									{ value: 'zoomout', label: __( 'Zoom Out', 'kadence-conversions' ) },
								] }
								onChange={ value => setAttributes( { animateOut: value } ) }
							/>
						</PanelBody>
					) }
					<PanelBody
						title={ __( 'Close Settings', 'kadence-conversions' ) }
						initialOpen={ false }
					>
						{ conversionType === 'popup' && (
							<ToggleControl
								label={ __( 'Enable Close on outside click', 'kadence-conversions' ) }
								checked={ overlayClose }
								onChange={ value => setAttributes( { overlayClose: value } ) }
							/>
						) }
						<ToggleControl
							label={ __( 'Enable Close Button', 'kadence-conversions' ) }
							checked={ displayClose }
							onChange={ value => setAttributes( { displayClose: value } ) }
						/>
						{ displayClose && (
							<Fragment>
								<SelectControl
									label={ __( 'Position', 'kadence-conversions' ) }
									value={ closePosition }
									options={ conversionType === 'popup' ? [
										{ value: 'inside', label: __( 'Inside Box', 'kadence-conversions' ) },
										{ value: 'outside', label: __( 'Outside Box', 'kadence-conversions' ) },
										{ value: 'screen', label: __( 'Edge of Screen', 'kadence-conversions' ) },
									] : [
										{ value: 'inside', label: __( 'Inside Box', 'kadence-conversions' ) },
										{ value: 'outside', label: __( 'Outside Box', 'kadence-conversions' ) },
									] }
									onChange={ value => setAttributes( { closePosition: value } ) }
								/>
								<SelectControl
									label={ __( 'Alignment', 'kadence-conversions' ) }
									value={ closeAlign }
									options={ [
										{ value: 'left', label: __( 'Left', 'kadence-conversions' ) },
										{ value: 'center', label: __( 'Center', 'kadence-conversions' ) },
										{ value: 'right', label: __( 'Right', 'kadence-conversions' ) },
									] }
									onChange={ value => setAttributes( { closeAlign: value } ) }
								/>
								<SelectControl
									label={ __( 'Vertical Alignment', 'kadence-conversions' ) }
									value={ closeVAlign }
									options={ [
										{ value: 'top', label: __( 'Top', 'kadence-conversions' ) },
										{ value: 'bottom', label: __( 'Bottom', 'kadence-conversions' ) },
									] }
									onChange={ value => setAttributes( { closeVAlign: value } ) }
								/>
								<SelectControl
									label={ __( 'Close Button Content', 'kadence-conversions' ) }
									value={ closeContent }
									options={ [
										{ value: 'icon', label: __( 'Icon', 'kadence-conversions' ) },
										{ value: 'text', label: __( 'Text', 'kadence-conversions' ) },
									] }
									onChange={ value => setAttributes( { closeContent: value } ) }
								/>
								<ResponsiveRangeControls
									label={ 'text' == closeContent ? __( 'Close Font Size', 'kadence-conversions' ) : __( 'Close Icon Size', 'kadence-conversions' ) }
									value={ ( closeSize && '' !== closeSize[ 0 ] ? closeSize[ 0 ] : '' ) }
									onChange={ value => setAttributes( { closeSize: [ value, ( closeSize && closeSize[ 1 ] ? closeSize[ 1 ] : '' ), ( closeSize && closeSize[ 2 ] ? closeSize[ 2 ] : '' ) ] } ) }
									tabletValue={ ( closeSize && '' !== closeSize[ 1 ] ? closeSize[ 1 ] : '' ) }
									onChangeTablet={ value => setAttributes( { closeSize: [ ( closeSize && closeSize[ 0 ] ? closeSize[ 0 ] : '' ), value, ( closeSize && closeSize[ 2 ] ? closeSize[ 2 ] : '' ) ] } ) }
									mobileValue={ ( closeSize && '' !== closeSize[ 2 ] ? closeSize[ 2 ] : '' ) }
									onChangeMobile={ value => setAttributes( { closeSize: [ ( closeSize && closeSize[ 0 ] ? closeSize[ 0 ] : '' ), ( closeSize && closeSize[ 2 ] ? closeSize[ 2 ] : '' ), value ] } ) }
									min={ 0 }
									max={ ( closeSizeUnit !== 'px' ? 6 : 100 ) }
									step={ ( closeSizeUnit !== 'px' ? 0.1 : 1 ) }
									unit={ closeSizeUnit }
									onUnit={ ( value ) => setAttributes( { closeSizeUnit: value } ) }
									units={ [ 'px', 'em', 'rem' ] }
								/>
								<TextControl
									label={ __( 'Close Button Label', 'kadence-conversions' ) }
									value={ closeLabel || '' }
									onChange={ value => setAttributes( { closeLabel: value } ) }
								/>
								<PopColorControl
									label={ __( 'Close Color', 'kadence-conversions' ) }
									value={ closeColor }
									swatchLabel={ __( 'Color', 'kadence-conversions' ) }
									onChange={ value => setAttributes( { closeColor: value } ) }
									value2={ closeHoverColor }
									swatchLabel2={ __( 'Hover', 'kadence-conversions' ) }
									onChange2={ value => setAttributes( { closeHoverColor: value } ) }
								/>
								<PopColorControl
									label={ __( 'Close Background', 'kadence-conversions' ) }
									value={ closeBackground }
									swatchLabel={ __( 'Background', 'kadence-conversions' ) }
									onChange={ value => setAttributes( { closeBackground: value } ) }
									value2={ closeHoverBackground }
									swatchLabel2={ __( 'Hover', 'kadence-conversions' ) }
									onChange2={ value => setAttributes( { closeHoverBackground: value } ) }
								/>
								<ResponsiveMeasurementControls
									label={ __( 'Padding', 'kadence-conversions' ) }
									value={ closePadding }
									control={ closePaddingControl }
									tabletValue={ closePaddingTablet }
									mobileValue={ closePaddingMobile }
									onChange={ ( value ) => setAttributes( { closePadding: value } ) }
									onChangeTablet={ ( value ) => setAttributes( { closePaddingTablet: value } ) }
									onChangeMobile={ ( value ) => setAttributes( { closePaddingMobile: value } ) }
									onChangeControl={ ( value ) => this.setState( { closePaddingControl: value } ) }
									min={ 1 }
									max={ ( closePaddingUnit === 'em' || closePaddingUnit === 'rem' ? 6 : 100 ) }
									step={ ( closePaddingUnit === 'em' || closePaddingUnit === 'rem' ? 0.1 : 1 ) }
									unit={ closePaddingUnit }
									units={ [ 'px', 'em', 'rem' ] }
									onUnit={ ( value ) => setAttributes( { closePaddingUnit: value } ) }
								/>
							</Fragment>
						) }
					</PanelBody> */}
				</InspectorControls>
				<InspectorAdvancedControls>
					{/* <SingleRangeControl
						label={ __( 'Z-Index Control', 'kadence-conversions' ) }
						className="conversions-z-index"
						value={ zindex }
						onChange={ ( value ) => setAttributes( { zindex: value } ) }
						min={ -10 }
						max={ 2000000 }
						step={ 10 }
					/> */}
				</InspectorAdvancedControls>
				{ renderCSS }
				<div className={ classes }>
					<div
						className={ 'kadence-conversion-overlay' }
						style={ {
							opacity: ( conversionType === 'popup' && overlayBackground && overlayBackground[ 0 ] && overlayBackground[ 0 ].opacity ? overlayBackground[ 0 ].opacity : undefined ),
							backgroundColor: ( conversionType === 'popup' && overlayBackground && overlayBackground[ 0 ] && overlayBackground[ 0 ].bgColor ? ColorOutput( overlayBackground[ 0 ].bgColor ) : undefined ),
							backgroundImage: ( conversionType === 'popup' && hasOverlayBackgroundImage ? `url( ${ overlayBackground[ 0 ].bgImg} )` : undefined ),
							backgroundSize: ( conversionType === 'popup' && hasOverlayBackgroundImage && overlayBackground[ 0 ].bgImgSize ? overlayBackground[ 0 ].bgImgSize : undefined ),
							backgroundPosition: ( conversionType === 'popup' && hasOverlayBackgroundImage && overlayBackground[ 0 ].bgImgPosition ? overlayBackground[ 0 ].bgImgPosition : undefined ),
							backgroundRepeat: ( conversionType === 'popup' && hasOverlayBackgroundImage && overlayBackground[ 0 ].bgImgRepeat ? overlayBackground[ 0 ].bgImgRepeat : undefined ),
							backgroundAttachment: ( conversionType === 'popup' && hasOverlayBackgroundImage && overlayBackground[ 0 ].bgImgAttachment ? overlayBackground[ 0 ].bgImgAttachment : undefined ),
						} }
					/>
					<div className={ 'kadence-conversion' } style={ {
						marginTop: ( undefined !== previewMarginTop ? previewMarginTop + marginUnit : undefined ),
						marginRight: ( undefined !== previewMarginRight ? previewMarginRight + marginUnit : undefined ),
						marginBottom: ( undefined !== previewMarginBottom ? previewMarginBottom + marginUnit : undefined ),
						marginLeft: ( undefined !== previewMarginLeft ? previewMarginLeft + marginUnit : undefined ),
						maxWidth: ( conversionType !== 'banner' && undefined !== previewMaxWidth ? previewMaxWidth + maxWidthUnit : undefined ),
						backgroundColor: ( background && background[ 0 ] && background[ 0 ].bgColor ? ColorOutput( background[ 0 ].bgColor ) : undefined ),
						backgroundImage: ( hasBackgroundImage ? `url( ${ background[ 0 ].bgImg} )` : undefined ),
						backgroundSize: ( hasBackgroundImage && background[ 0 ].bgImgSize ? background[ 0 ].bgImgSize : undefined ),
						backgroundPosition: ( hasBackgroundImage && background[ 0 ].bgImgPosition ? background[ 0 ].bgImgPosition : undefined ),
						backgroundRepeat: ( hasBackgroundImage && background[ 0 ].bgImgRepeat ? background[ 0 ].bgImgRepeat : undefined ),
						backgroundAttachment: ( hasBackgroundImage && background[ 0 ].bgImgAttachment ? background[ 0 ].bgImgAttachment : undefined ),
						borderColor: ( border ? ColorOutput( border ) : undefined ),
						borderTopWidth: ( previewBorderTop ? previewBorderTop + 'px' : undefined ),
						borderRightWidth: ( previewBorderRight ? previewBorderRight + 'px' : undefined ),
						borderBottomWidth: ( previewBorderBottom ? previewBorderBottom + 'px' : undefined ),
						borderLeftWidth: ( previewBorderLeft ? previewBorderLeft + 'px' : undefined ),
						borderTopLeftRadius: ( previewRadiusTop ? previewRadiusTop + borderRadiusUnit : undefined ),
						borderTopRightRadius: ( previewRadiusRight ? previewRadiusRight + borderRadiusUnit : undefined ),
						borderBottomRightRadius: ( previewRadiusBottom ? previewRadiusBottom + borderRadiusUnit : undefined ),
						borderBottomLeftRadius: ( previewRadiusLeft ? previewRadiusLeft + borderRadiusUnit : undefined ),
						boxShadow: ( undefined !== shadow && undefined !== shadow[ 0 ] && undefined !== shadow[ 0 ].enable && shadow[ 0 ].enable ? ( undefined !== shadow[ 0 ].inset && shadow[ 0 ].inset ? 'inset ' : '' ) + ( undefined !== shadow[ 0 ].hOffset ? shadow[ 0 ].hOffset : 0 ) + 'px ' + ( undefined !== shadow[ 0 ].vOffset ? shadow[ 0 ].vOffset : 0 ) + 'px ' + ( undefined !== shadow[ 0 ].blur ? shadow[ 0 ].blur : 14 ) + 'px ' + ( undefined !== shadow[ 0 ].spread ? shadow[ 0 ].spread : 0 ) + 'px ' + ColorOutput( ( undefined !== shadow[ 0 ].color ? shadow[ 0 ].color : 'rgba(0,0,0,0.2' ) ) : undefined ),
					} }>
						<div className={ 'kadence-conversion-inner' } style={ {
							paddingTop: ( undefined !== previewPaddingTop ? previewPaddingTop + paddingUnit : undefined ),
							paddingRight: ( undefined !== previewPaddingRight ? previewPaddingRight + paddingUnit : undefined ),
							paddingBottom: ( undefined !== previewPaddingBottom ? previewPaddingBottom + paddingUnit : undefined ),
							paddingLeft: ( undefined !== previewPaddingLeft ? previewPaddingLeft + paddingUnit : undefined ),
							maxWidth: ( conversionType === 'banner' && undefined !== previewMaxWidth ? previewMaxWidth + maxWidthUnit : undefined ),
							minHeight: ( height === 'fixed' && previewMinHeight ? previewMinHeight + minHeightUnit : undefined ),
						} }>
							<InnerBlocks
								templateLock={ false }
								template={ [
									[ 'core/paragraph', { placeholder: __( 'Add Blocks...', 'kadence-conversions' ) } ],
								] }
							/>
						</div>
						{ displayClose && 'screen' !== realClosePosition && (
							<button
								className={ 'kadence-conversions-close' }
								aria-label={ 'icon' === closeContent ? closeLabel : undefined }
								style={ {
									fontSize: ( previewCloseSize ? previewCloseSize + ( undefined !== closeSizeUnit ? closeSizeUnit : 'px' ) : undefined ),
									color: closeColor ? ColorOutput( closeColor ) : undefined,
									background: closeBackground ? ColorOutput( closeBackground ) : undefined,
									paddingTop: ( undefined !== previewClosePaddingTop ? previewClosePaddingTop + closePaddingUnit : undefined ),
									paddingRight: ( undefined !== previewClosePaddingRight ? previewClosePaddingRight + closePaddingUnit : undefined ),
									paddingBottom: ( undefined !== previewClosePaddingBottom ? previewClosePaddingBottom + closePaddingUnit : undefined ),
									paddingLeft: ( undefined !== previewClosePaddingLeft ? previewClosePaddingLeft + closePaddingUnit : undefined ),
								} }
							>
								{ 'icon' === closeContent && (
									closeIcons[closeIcon]
								) }
								{ 'text' === closeContent && (
									closeLabel
								) }
							</button>
						) }
					</div>
					{ displayClose && 'screen' === realClosePosition && (
						<button
							className={ 'kadence-conversions-close' }
							aria-label={ 'icon' === closeContent ? closeLabel : undefined }
							style={ {
								fontSize: ( previewCloseSize ? previewCloseSize + ( undefined !== closeSizeUnit ? closeSizeUnit : 'px' ) : undefined ),
								color: closeColor ? ColorOutput( closeColor ) : undefined,
								background: closeBackground ? ColorOutput( closeBackground ) : undefined,
								paddingTop: ( undefined !== previewClosePaddingTop ? previewClosePaddingTop + closePaddingUnit : undefined ),
								paddingRight: ( undefined !== previewClosePaddingRight ? previewClosePaddingRight + closePaddingUnit : undefined ),
								paddingBottom: ( undefined !== previewClosePaddingBottom ? previewClosePaddingBottom + closePaddingUnit : undefined ),
								paddingLeft: ( undefined !== previewClosePaddingLeft ? previewClosePaddingLeft + closePaddingUnit : undefined ),
							} }
						>
							{ 'icon' === closeContent && (
								closeIcons[closeIcon]
							) }
							{ 'text' === closeContent && (
								closeLabel
							) }
						</button>
					) }
				</div>
			</Fragment>
		);
	}
}
export default compose( [
	withSelect( ( select, ownProps ) => {
		let __experimentalGetPreviewDeviceType = false;
		if ( select( 'core/edit-post' ) ) {
			__experimentalGetPreviewDeviceType = select( 'core/edit-post' ).__experimentalGetPreviewDeviceType;
		}
		const postType = select( 'core/editor' ).getCurrentPostType();
		const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );
		return {
			getPreviewDevice: __experimentalGetPreviewDeviceType ? __experimentalGetPreviewDeviceType() : 'Desktop',
			postType: postType,
			meta: meta,
			setMeta: setMeta,
		};
	} ),
] )( KadenceConversionBlock );