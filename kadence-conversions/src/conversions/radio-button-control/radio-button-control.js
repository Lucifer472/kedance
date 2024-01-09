/* jshint esversion: 6 */
import radioIcons from './radio-icons.js';

const { __ } = wp.i18n;

const { ButtonGroup, Dashicon, Tooltip, Button } = wp.components;

const { Component, Fragment } = wp.element;
class RadioButtonControl extends Component {
	constructor() {
		super( ...arguments );
		let baseDefault = 'default';
		this.defaultValue = this.props.default ? this.props.default : baseDefault;
		this.state = {
			value: this.props.value,
		};
	}
	render() {
		return (
			<div className={ `kadence-control-field kadence-radio-button-control${ ( this.props.customClass ? ' ' + this.props.customClass : '' ) }` }>
				{ this.props.label && (
					<div className="kadence-title-control-bar">
						<span className="customize-control-title">{ this.props.label }</span>
					</div>
				) }
				<ButtonGroup className="kadence-radio-button-container-control">
					{ this.props.options.map( ( item, index ) => {
						const key =
						item.id ||
						`${ item.label }-${ item.value }-${ index }`;
						return (
							<Button
								key={ key }
								isTertiary
								showTooltip={ item.tooltip ? true : false }
								label={ item.tooltip ? item.tooltip : '' }
								className={ ( item.value === this.state.value ?
										'active-radio ' :
										'' ) + 'radio-item-' + item.value + ( item.icon && item.label ? ' btn-flex-col' : '' ) }
								onClick={ () => {
									let value = this.state.value;
									value = item.value;
									this.setState( { value: item.value });
									this.props.onChange( value );
								} }
							>
								{ item.icon && (
									<span className="kadence-radio-button-icon">
										{ radioIcons[ item.icon ] }
									</span>
								) }
								{ item.label && (
										item.label
								) }
							</Button>
						);
					} ) }
				</ButtonGroup>
			</div>
		);
	}
}
export default RadioButtonControl;
