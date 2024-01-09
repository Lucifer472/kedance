/**
 * Responsive Range Component
*
*/
/**
 * Import Icons
 */
 import icons from './../common/icons';

/**
 * Internal block libraries
 */
import { useSelect, useDispatch } from '@wordpress/data';
const { __ } = wp.i18n;
import map from 'lodash/map';
import MeasurementControls from './measurement-control.js';
import capitalizeFirstLetter from './../common/capital-first';
const {
	Dashicon,
	Button,
	ButtonGroup,
} = wp.components;

/**
 * Build the Measure controls
 * @returns {object} Measure settings.
 */
export default function ResponsiveMeasurementControls( {
	label,
	subLabel,
	onChange,
	onChangeTablet,
	onChangeMobile,
	mobileValue,
	tabletValue,
	value,
	onChangeMobileControl,
	mobileControl,
	onChangeTabletControl,
	tabletControl,
	onChangeControl,
	control,
	step = 1,
	max = 100,
	min = 0,
	unit = '',
	onUnit,
	showUnit = false,
	units = [ 'px', 'em', 'rem' ],
	allowEmpty = true,
	preset = '',
	firstIcon = icons.outlinetop,
	secondIcon = icons.outlineright,
	thirdIcon = icons.outlinebottom,
	fourthIcon = icons.outlineleft,
	linkedIcon = icons.linked,
	individualIcon = icons.individual,
} ) {
	const realMobileControl = mobileControl ? mobileControl : control;
	const realTabletControl = tabletControl ? tabletControl : control;
	const realOnChangeTabletControl = onChangeTabletControl ? onChangeTabletControl : onChangeControl;
	const realOnChangeMobileControl = onChangeMobileControl ? onChangeMobileControl : onChangeControl;
	const zero = ( allowEmpty ? true : false );
	const deviceType = useSelect( ( select ) => {
		return select( 'core/edit-post' ).__experimentalGetPreviewDeviceType();
	}, [] );
	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
	} = useDispatch( 'core/edit-post' );
	const customSetPreviewDeviceType = ( device ) => {
		setPreviewDeviceType( capitalizeFirstLetter( device ) );
	};
	const devices = [
		{
			name: 'Desktop',
			title: <Dashicon icon="desktop" />,
			itemClass: 'kb-desk-tab',
		},
		{
			name: 'Tablet',
			title: <Dashicon icon="tablet" />,
			itemClass: 'kb-tablet-tab',
		},
		{
			name: 'Mobile',
			key: 'mobile',
			title: <Dashicon icon="smartphone" />,
			itemClass: 'kb-mobile-tab',
		},
	];
	const output = {};
	output.Mobile = (
		<MeasurementControls
			key={ 2 }
			className="measure-mobile-size"
			label={ ( subLabel ? __( 'Mobile:', 'kadence-blocks' ) + subLabel : undefined ) }
			measurement={ ( mobileValue ? mobileValue : [ '', '', '', '' ] ) }
			control={ ( realMobileControl ? realMobileControl : 'individual' ) }
			onChange={ ( size ) => onChangeMobile( size ) }
			onControl={ ( sizeControl ) => realOnChangeMobileControl( sizeControl ) }
			min={ min }
			max={ max }
			step={ step }
			allowEmpty={ zero }
			unit={ unit }
			showUnit={ true }
			units={ [ unit ] }
			preset={ preset }
			firstIcon={ firstIcon }
			secondIcon={ secondIcon }
			thirdIcon={ thirdIcon }
			fourthIcon={ fourthIcon }
			linkedIcon={ linkedIcon }
			individualIcon={ individualIcon }
		/>
	);
	output.Tablet = (
		<MeasurementControls
			key={ 1 }
			className="measure-tablet-size"
			label={ ( subLabel ? __( 'Tablet:', 'kadence-blocks' ) + subLabel : undefined ) }
			measurement={ ( tabletValue ? tabletValue : [ '', '', '', '' ] ) }
			control={ ( realTabletControl ? realTabletControl : 'individual' ) }
			onChange={ ( size ) => onChangeTablet( size ) }
			onControl={ ( sizeControl ) => realOnChangeTabletControl( sizeControl ) }
			min={ min }
			max={ max }
			step={ step }
			allowEmpty={ zero }
			unit={ unit }
			showUnit={ true }
			units={ [ unit ] }
			preset={ preset }
			firstIcon={ firstIcon }
			secondIcon={ secondIcon }
			thirdIcon={ thirdIcon }
			fourthIcon={ fourthIcon }
			linkedIcon={ linkedIcon }
			individualIcon={ individualIcon }
		/>
	);
	output.Desktop = (
		<MeasurementControls
			key={ 0 }
			className="measure-desktop-size"
			label={ ( subLabel ? subLabel : undefined ) }
			measurement={ ( value ? value : [ '', '', '', '' ] ) }
			control={ ( control ? control : 'individual' ) }
			onChange={ ( size ) => onChange( size ) }
			onControl={ ( sizeControl ) => onChangeControl( sizeControl ) }
			min={ min }
			max={ max }
			step={ step }
			allowEmpty={ zero }
			unit={ unit }
			onUnit={ ( onUnit ? onUnit : undefined ) }
			showUnit={ showUnit }
			units={ units }
			preset={ preset }
			firstIcon={ firstIcon }
			secondIcon={ secondIcon }
			thirdIcon={ thirdIcon }
			fourthIcon={ fourthIcon }
			linkedIcon={ linkedIcon }
			individualIcon={ individualIcon }
		/>
	);
	return [
		onChange && onChangeTablet && onChangeMobile && (
			<div className={ 'components-base-control kb-responsive-measure-control' }>
				<div className="kadence-title-bar">
					{ label && (
						<span className="kadence-control-title">{ label }</span>
					) }
					<ButtonGroup className="kb-measure-responsive-options" aria-label={ __( 'Device', 'kadence-blocks' ) }>
						{ map( devices, ( { name, key, title, itemClass } ) => (
							<Button
								key={ key }
								className={ `kb-responsive-btn ${ itemClass }${ name === deviceType ? ' is-active' : '' }` }
								isSmall
								aria-pressed={ deviceType === name }
								onClick={ () => customSetPreviewDeviceType( name ) }
							>
								{ title }
							</Button>
						) ) }
					</ButtonGroup>
				</div>
				<div className="kb-responsive-measure-control-inner">
					{ ( output[ deviceType ] ? output[ deviceType ] : output.Desktop ) }
				</div>
			</div>
		),
	];
}
 