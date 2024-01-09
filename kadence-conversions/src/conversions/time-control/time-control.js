/**
 * Time Control
 *
 */

/**
 * Internal block libraries
 */
 import classnames from 'classnames';
 import { isInteger } from 'lodash';
import { __ } from '@wordpress/i18n';
import {
	Button,
	ButtonGroup,
} from '@wordpress/components';
import { Fragment, Component } from '@wordpress/element';
import TimeZone from './time-zone';
/**
 * <UpdateOnBlurAsIntegerField>
 * A shared component to parse, validate, and handle remounting of the underlying form field element like <input> and <select>.
 *
 * @param {Object}        props          Component props.
 * @param {string}        props.as       Render the component as specific element tag, defaults to "input".
 * @param {number|string} props.value    The default value of the component which will be parsed to integer.
 * @param {Function}      props.onUpdate Call back when blurred and validated.
 */
 function UpdateOnBlurAsIntegerField( { as, value, onUpdate, ...props } ) {
	function handleBlur( event ) {
		const { target } = event;

		if ( value === target.value ) {
			return;
		}

		const parsedValue = parseInt( target.value, 10 );

		// Run basic number validation on the input.
		if (
			! isInteger( parsedValue ) ||
			( typeof props.max !== 'undefined' && parsedValue > props.max ) ||
			( typeof props.min !== 'undefined' && parsedValue < props.min )
		) {
			// If validation failed, reset the value to the previous valid value.
			target.value = value;
		} else {
			// Otherwise, it's valid, call onUpdate.
			onUpdate( target.name, parsedValue.toString() );
		}
	}

	return createElement( as || 'input', {
		// Re-mount the input value to accept the latest value as the defaultValue.
		key: value,
		defaultValue: value,
		onBlur: handleBlur,
		...props,
	} );
}
/**
 * Build the time control.
 */
class TimeControl extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			hour: '',
			minutes: '',
			ampm: '',
		}
	}
	componentDidMount() {
		let initAM = ( this.props.value && this.props.value.includes(' ') ? this.props.value.split(' ')[1] : '' );
		if ( this.props.is12Hour && ! initAM ) {
			initAM = 'AM';
		}
		const initHour = ( this.props.value && this.props.value.includes(':') ? this.props.value.split(':')[0] : '09' );
		const initMinutes = ( this.props.value && this.props.value.includes(':') ? this.props.value.split(':')[1].substring( 0,2 ) : '00' );
		this.setState( { hour: initHour, minutes: initMinutes, ampm: initAM });
	}
	render() {
		const { label, onChange, className, is12Hour } = this.props;
		const { hour, minutes, ampm } = this.state;
		const changeTime = ( { currentHour, currentMinutes, currentampm } ) => {
			const newTime = currentHour + ':' + currentMinutes + ( is12Hour ? ' ' + currentampm : '' );
			onChange( newTime );
		};
		return (
			<div className={ `components-base-control kadence-time-control${ className ? ' ' + className : '' }` }>
				{ label && (
					<span className="kadence-control-title">{ label }</span>
				) }
				<div className="kadence-time-control-inner components-datetime__time-wrapper">
					<div className="components-datetime__time-field components-datetime__time-field-time">
						<UpdateOnBlurAsIntegerField
							aria-label={ __( 'Hours', 'kadence-conversions' ) }
							className="components-datetime__time-field-hours-input"
							type="number"
							name="hours"
							step={ 1 }
							min={ is12Hour ? 1 : 0 }
							max={ is12Hour ? 12 : 23 }
							value={ hour }
							onUpdate={ ( name, value ) => {
								if ( value.length === 1 ) {
									value = '0' + value;
								}
								this.setState( { hour: value } );
								changeTime( { currentHour: value, currentMinutes: minutes, currentampm: ampm } );
							} }
						/>
						<span
							className="components-datetime__time-separator"
							aria-hidden="true"
						>
							:
						</span>
						<UpdateOnBlurAsIntegerField
							aria-label={ __( 'Minutes', 'kadence-conversions' ) }
							className="components-datetime__time-field-minutes-input"
							type="number"
							name="minutes"
							step={ 1 }
							min={ 0 }
							max={ 59 }
							value={ minutes }
							onUpdate={ ( name, value ) => {
								if ( value.length === 1 ) {
									value = '0' + value;
								}
								this.setState( { minutes: value } );
								changeTime( { currentHour: hour, currentMinutes: value, currentampm: ampm } );
							} }
						/>
					</div>
					{ is12Hour && (
						<ButtonGroup className="components-datetime__time-field components-datetime__time-field-am-pm">
							<Button
								isPrimary={ ampm === 'AM' ? true : false }
								isSecondary={ ampm === 'AM' ? false : true }
								onClick={ () => {
									this.setState( { ampm: 'AM' } );
									changeTime( { currentHour: hour, currentMinutes: minutes, currentampm: 'AM' } );
								} }
								className="components-datetime__time-am-button"
							>
								{ __( 'AM', 'kadence-conversions' ) }
							</Button>
							<Button
								isPrimary={ ampm === 'PM' ? true : false }
								isSecondary={ ampm === 'PM' ? false : true }
								onClick={ () => {
									this.setState( { ampm: 'PM' } );
									changeTime( { currentHour: hour, currentMinutes: minutes, currentampm: 'PM' } );
								} }
								className="components-datetime__time-pm-button"
							>
								{ __( 'PM', 'kadence-conversions' ) }
							</Button>
						</ButtonGroup>
					) }

					<TimeZone />
				</div>
			</div>
		);
	}
}
export default ( TimeControl );