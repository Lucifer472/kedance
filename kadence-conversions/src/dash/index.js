/**
 * Internal dependencies
 */
import ConversionDashControl from './dashboard';
 
/**
 * Import Css
 */
 import './editor.scss';
 /**
  * WordPress dependencies
  */
 import { addFilter } from '@wordpress/hooks';
 import { createHigherOrderComponent } from '@wordpress/compose';
 
 const conversionsDash = createHigherOrderComponent( ( DashControl ) => {
	return ( props ) => {
		return <ConversionDashControl { ...props } />;
	};
}, 'conversionsDash' );
addFilter( 'kadence_settings_dash', 'kadence/conversions', conversionsDash );