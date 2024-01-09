/**
 * External dependencies
 */
 import classnames from 'classnames';
/**
 * WordPress dependencies
 */
 import { __ } from '@wordpress/i18n';
 import { registerBlockType } from '@wordpress/blocks';
 import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import edit from './edit';
import closeIcons from './close-icons';
/**
 * Import Css
 */
import './editor.scss';
registerBlockType( 'kadence-conversions/conversion', {
    title: __( 'Conversion Item', 'kadence-conversions' ),
    icon: {
		src: <svg
		xmlns="http://www.w3.org/2000/svg"
		fillRule="evenodd"
		strokeLinejoin="round"
		strokeMiterlimit="2"
		clipRule="evenodd"
		viewBox="0 0 16 16"
	  >
		<path
		  fill="#0073e6"
		  d="M15.039 6.218v8.821H.961V.961h8.821v.534H1.496s0 13.01-.001 13.009c0 0 13.01 0 13.009.001V6.218h.535zm-2.68 5.16H8.213a.376.376 0 010-.752h1.251a.375.375 0 00-.026-.75H7.48a.376.376 0 010-.751h.587a.375.375 0 000-.75L5.33 8.374a.375.375 0 010-.75h1.853v-.001h.726a.375.375 0 000-.749h-.166l.001-.001h-.771a.375.375 0 010-.75h1.779l.027.001h.636a.375.375 0 000-.752H8.48a.376.376 0 01.027-.75h3.214L8.679 7.945l3.68 3.433zm-5.836-.752a.375.375 0 010 .749H5.149a.375.375 0 110-.749h1.374zm-.544-1.501a.375.375 0 110 .75.375.375 0 010-.75zM4.016 7.624a.376.376 0 110 .751.376.376 0 010-.751zm1.456-1.501a.375.375 0 110 .75.375.375 0 010-.75zm1.347-1.501a.375.375 0 010 .749H5.95a.375.375 0 010-.749h.869zm7.968-3.92H13v-.6h2.898V3h-.6V1.063l-2.652 2.652-.436-.436L14.787.702z"
		></path>
	  </svg>,
	},
	attributes: {
		uniqueID: {
			type: 'string',
		},
		campaignID: {
			type: 'string',
		},
		conversionType: {
			type: 'string',
			default: '',
		},
		templateSelected: {
			type: 'bool',
			default: false,
		},
		conversionTrigger: {
			type: 'string',
			default: '',
		},
		conversionGoal: {
			type: 'string',
			default: '',
		},
		conversionTracking: {
			type: 'string',
			default: true,
		},
		goalClass: {
			type: 'string',
			default: '',
		},
		goalClose: {
			type: 'bool',
			default: false,
		},
		delay: {
			type: 'number',
			default: 5000,
		},
		scroll: {
			type: 'number',
			default: 300,
		},
		repeatControl: {
			type: 'bool',
			default: true,
		},
		offset: {
			type: 'bool',
			default: true,
		},
		overlayClose: {
			type: 'bool',
			default: true,
		},
		closeRepeat: {
			type: 'number',
			default: 30,
		},
		convertRepeat: {
			type: 'number',
			default: 90,
		},
		postID: {
			type: 'number',
		},
		horizontalAlign: {
			type: 'string',
			default:'center',
		},
		verticalAlign: {
			type: 'string',
			default:'center',
		},
		height: {
			type: 'string',
			default: 'auto',
		},
		innerVAlign: {
			type: 'string',
			default: 'center',
		},
		minHeight: {
			type: 'array',
			default: [ 400, '', '' ],
		},
		minHeightUnit: {
			type: 'string',
			default: 'px',
		},
		width: {
			type: 'array',
			default: [ 100, '', '' ],
		},
		maxWidth: {
			type: 'array',
			default: [ 600, '', '' ],
		},
		maxWidthUnit: {
			type: 'string',
			default: 'px',
		},
		background: {
			type: 'array',
			default: [ {
				bgColor: '',
				bgImg: '',
				bgImgID: '',
				bgImgSize: 'cover',
				bgImgPosition: 'center center',
				bgImgAttachment: 'scroll',
				bgImgRepeat: 'no-repeat',
			} ],
		},
		backgroundTablet: {
			type: 'array',
			default: [ {
				enable: false,
				bgColor: '',
				bgImg: '',
				bgImgID: '',
				bgImgSize: 'cover',
				bgImgPosition: 'center center',
				bgImgAttachment: 'scroll',
				bgImgRepeat: 'no-repeat',
				forceOverDesk: false,
			} ],
		},
		backgroundMobile: {
			type: 'array',
			default: [ {
				enable: false,
				bgColor: '',
				bgImg: '',
				bgImgID: '',
				bgImgSize: 'cover',
				bgImgPosition: 'center center',
				bgImgAttachment: 'scroll',
				bgImgRepeat: 'no-repeat',
				forceOverDesk: false,
			} ],
		},
		overlayBackground: {
			type: 'array',
			default: [ {
				opacity: 0.5,
				bgColor: '',
				bgImg: '',
				bgImgID: '',
				bgImgSize: 'cover',
				bgImgPosition: 'center center',
				bgImgAttachment: 'scroll',
				bgImgRepeat: 'no-repeat',
			} ],
		},
		overlayBackgroundTablet: {
			type: 'array',
			default: [ {
				enable: false,
				opacity: 0.7,
				bgColor: '',
				bgImg: '',
				bgImgID: '',
				bgImgSize: 'cover',
				bgImgPosition: 'center center',
				bgImgAttachment: 'scroll',
				bgImgRepeat: 'no-repeat',
				forceOverDesk: false,
			} ],
		},
		overlayBackgroundMobile: {
			type: 'array',
			default: [ {
				enable: false,
				opacity: 0.7,
				bgColor: '',
				bgImg: '',
				bgImgID: '',
				bgImgSize: 'cover',
				bgImgPosition: 'center center',
				bgImgAttachment: 'scroll',
				bgImgRepeat: 'no-repeat',
				forceOverDesk: false,
			} ],
		},
		padding: {
			type: 'array',
			default: [ 20, 20, 20, 20 ],
		},
		paddingTablet: {
			type: 'array',
			default: [ '', '', '', '' ],
		},
		paddingMobile: {
			type: 'array',
			default: [ '', '', '', '' ],
		},
		paddingUnit: {
			type: 'string',
			default: 'px',
		},
		margin: {
			type: 'array',
			default: [ '', '', '', '' ],
		},
		marginTablet: {
			type: 'array',
			default: [ '', '', '', '' ],
		},
		marginMobile: {
			type: 'array',
			default: [ '', '', '', '' ],
		},
		marginUnit: {
			type: 'string',
			default: 'px',
		},
		border: {
			type: 'string',
			default: '',
		},
		borderWidth: {
			type: 'array',
			default: [ 0, 0, 0, 0 ],
		},
		borderWidthTablet: {
			type: 'array',
			default: [ '', '', '', '' ],
		},
		borderWidthMobile: {
			type: 'array',
			default: [ '', '', '', '' ],
		},
		borderRadius: {
			type: 'array',
			default: [ 0, 0, 0, 0 ],
		},
		borderRadiusTablet: {
			type: 'array',
			default: [ '', '', '', '' ],
		},
		borderRadiusMobile: {
			type: 'array',
			default: [ '', '', '', '' ],
		},
		borderRadiusUnit: {
			type: 'string',
			default: 'px',
		},
		shadow: {
			type: 'array',
			default: [ {
				enable: true,
				color: 'rgba(0,0,0,0.2)',
				spread: 0,
				blur: 14,
				hOffset: 0,
				vOffset: 0,
				inset: false,
			} ],
		},
		shadowTablet: {
			type: 'array',
			default: [ {
				enable: false,
				color: 'rgba(0,0,0,0.2)',
				opacity: 0.2,
				spread: 0,
				blur: 14,
				hOffset: 0,
				vOffset: 0,
				inset: false,
			} ],
		},
		shadowMobile: {
			type: 'array',
			default: [ {
				enable: false,
				color: 'rgba(0,0,0,0.2)',
				opacity: 0.2,
				spread: 0,
				blur: 14,
				hOffset: 0,
				vOffset: 0,
				inset: false,
			} ],
		},
		animateIn: {
			type: 'string',
			default: 'fadeup',
		},
		animateOut: {
			type: 'string',
			default: 'fadeout',
		},
		displayClose: {
			type: 'bool',
			default: true,
		},
		closePosition: {
			type: 'string',
			default: 'outside',
		},
		closeAlign: {
			type: 'string',
			default: 'right',
		},
		closeVAlign: {
			type: 'string',
			default: 'top',
		},
		closeContent: {
			type: 'string',
			default: 'icon',
		},
		closeIcon: {
			type: 'string',
			default: 'close2',
		},
		closeSize: {
			type: 'array',
			default: [ '24', '', '' ],
		},
		closeSizeUnit: {
			type: 'string',
			default: 'px',
		},
		closeLabel: {
			type: 'string',
			default: __( 'Close', 'kadence-conversions' ),
		},
		closeColor: {
			type: 'string',
			default: '',
		},
		closeHoverColor: {
			type: 'string',
			default: '',
		},
		closeBackground: {
			type: 'string',
			default: '',
		},
		closeHoverBackground: {
			type: 'string',
			default: '',
		},
		closePadding: {
			type: 'array',
			default: [ '', '', '', '' ],
		},
		closePaddingTablet: {
			type: 'array',
			default: [ '', '', '', '' ],
		},
		closePaddingMobile: {
			type: 'array',
			default: [ '', '', '', '' ],
		},
		closePaddingUnit: {
			type: 'string',
			default: 'px',
		},
		zIndex: {
			type: 'number',
			default: '',
		},
		overflow: {
			type: 'string',
			default: 'hidden',
		},
		referrer: {
			type: 'string',
			default: '',
		},
		queryStrings: {
			type: 'string',
			default: '',
		},
		cookieCheck: {
			type: 'string',
			default: '',
		},
		requirePageViews: {
			type: 'bool',
			default: false,
		},
		pageViewCount: {
			type: 'number',
			default: 4,
		},
		requireCartProducts: {
			type: 'bool',
			default: false,
		},
		cartProducts: {
			type: 'array',
		},
		preventCartProducts: {
			type: 'bool',
			default: false,
		},
		preventProducts: {
			type: 'array',
		},
		requireCartMinimum: {
			type: 'bool',
			default: false,
		},
		cartMinimum: {
			type: 'number',
		},
		requireCartMaximum: {
			type: 'bool',
			default: false,
		},
		cartMaximum: {
			type: 'number',
		},
		requireCartMinWeight: {
			type: 'bool',
			default: false,
		},
		cartMinWeight: {
			type: 'number',
		},
		requireCartMaxWeight: {
			type: 'bool',
			default: false,
		},
		cartMaxWeight: {
			type: 'number',
		},
		requireCartCategory: {
			type: 'bool',
			default: false,
		},
		cartCategory: {
			type: 'array',
		},
		zindex: {
			type: 'number',
		},
		scrollHide: {
			type: 'bool',
			default: false,
		},
	},
    category: 'layout',
    supports: {
        className: true,
		reusable: false,
        html: false,
		anchor: false,
		lock: false,
    },
   	edit,

    save: function( { attributes } ) {
		const { postID, uniqueID, displayClose, closePosition, closeAlign, closeContent, closeLabel, closeIcon, closeVAlign, conversionType, horizontalAlign, verticalAlign, height, animateIn, animateOut, innerVAlign } = attributes;
		const classes = classnames( {
			[ `kadence-conversion-wrap` ]: true,
			[ `kadence-conversion-${ postID }` ]: postID,
			[ `kadence-conversion-${ conversionType }` ]: conversionType,
			[ `kc-align-${ horizontalAlign }` ]: horizontalAlign,
			[ `kc-valign-${ verticalAlign }` ]: verticalAlign,
			[ `kc-${ uniqueID }` ]: uniqueID,
			[ `kc-height-${ height }` ]: height,
			[ `kc-animate-in-${ animateIn }` ]: conversionType !== 'banner' && animateIn,
			[ `kc-animate-out-${ animateOut }` ]: conversionType !== 'banner' && animateOut,
			[ `kc-close-align-${ closeAlign }` ]: closeAlign,
			[ `kc-close-v-align-${ closeVAlign }` ]: closeVAlign,
			[ `kc-close-position-${ closePosition }` ]: closePosition,
			[ `kc-inner-v-align-${ innerVAlign }`]: height !== 'auto' && innerVAlign,
		} );
        return  (
			<div id={ `kadence-conversion-${ postID }` } className={ classes }>
				{ conversionType === 'popup' && (
					<div className={ 'kadence-conversion-overlay' } />
				) }
				<div className={ 'kadence-conversion' }>
					<div className={ 'kadence-conversion-inner' }>
						<InnerBlocks.Content />
					</div>
					{ displayClose && 'screen' !== closePosition && (
						<button className={ 'kadence-conversions-close' } aria-label={ 'icon' === closeContent ? closeLabel : undefined }>
							{ 'icon' === closeContent && (
								closeIcons[closeIcon]
							) }
							{ 'text' === closeContent && (
								closeLabel
							) }
						</button>
					) }
				</div>
				{ displayClose && 'screen' === closePosition && (
					<button className={ 'kadence-conversions-close' } aria-label={ 'icon' === closeContent ? closeLabel : undefined }>
						{ 'icon' === closeContent && (
							closeIcons[closeIcon]
						) }
						{ 'text' === closeContent && (
							closeLabel
						) }
					</button>
				) }
			</div>
		);
    }
 } 
);