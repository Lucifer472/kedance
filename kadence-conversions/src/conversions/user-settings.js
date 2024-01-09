/* jshint esversion: 6 */
import Select from 'react-select';
import times from 'lodash/times';
import filter from 'lodash/filter';
const { __ } = wp.i18n;

const { ButtonGroup, Dashicon, IconButton, Tooltip, Button, SelectControl } = wp.components;

const { Component, Fragment } = wp.element;
class UserSettings extends Component {
	constructor() {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.onRemoveRule = this.onRemoveRule.bind( this );
		this.defaultValue = [ {
			role: '',
		} ];
		this.state = {
			rolesOptions: [].concat.apply( [], this.props.roles.map( option => option.options ) ),
			value: this.props.value,
		};
	}
	onRemoveRule( index ) {
		return () => {
			const roles = this.props.value ? JSON.parse( this.props.value ) : this.defaultValue;
			const newRoles = filter( roles, ( item, i ) => index !== i );
			this.props.onChange( JSON.stringify( newRoles ) );
		};
	}
	onChange( value, index ) {
		const roles = this.props.value ? JSON.parse( this.props.value ) : this.defaultValue;
		const newRoles = roles.map( ( item, thisIndex ) => {
			if ( index === thisIndex ) {
				item = { ...item, ...value };
			}

			return item;
		} );
		this.props.onChange( JSON.stringify( newRoles ) );
	}
	render() {
		const roles = this.props.value ? JSON.parse( this.props.value ) : this.defaultValue;
		//console.log( rules );
		const roleOutput = ( index ) => {
			return (
				<div className="kt-meta-display-row">
					<div className="kt-meta-display-top-wrap">
						<div className="kt-meta-select-wrap">
							<Select
								options={ this.props.roles }
								className="kt-meta-select"
								classNamePrefix="ktp"
								value={ ( undefined !== roles[ index ] && undefined !== roles[ index ].role && '' !== roles[ index ].role ? this.state.rolesOptions.filter( ( { value } ) => value === roles[ index ].role ) : '' ) }
								isMulti={ false }
								isSearchable={ true }
								isClearable={ true }
								maxMenuHeight={ 200 }
								placeholder={ this.props.placeholder }
								onChange={ ( val ) => {
									if ( ! val ) {
										this.onChange( { role: '' }, index );
									} else {
										this.onChange( { role: val.value }, index );
									}
								} }
							/>
						</div>
						{ index !== 0 && (
							<div className="kt-meta-display-remove">
								<Button
									icon="no-alt"
									onClick={ this.onRemoveRule( index ) }
									className="kt-remove-display-rule"
									label={ __( 'Remove Role', 'kadence-conversions' ) }
									disabled={ 1 === roles.length }
								/>
							</div>
						) }
					</div>
				</div>
			);
		}
		return (
			<div className={ `kadence-control-field kadence-display-settings${ ( this.props.customClass ? ' ' + this.props.customClass : '' ) }` }>
				{ this.props.label && (
					<h2 className="kt-meta-title">{ this.props.label }</h2>
				) }
				{ times( roles.length, n => roleOutput( n ) ) }
				<Button
					className="kb-add-rule"
					isPrimary={ true }
					onClick={ () => {
						const newRoles = roles;
						newRoles.push( {
							role: '',
						} );
						this.props.onChange( JSON.stringify( newRoles ) );
						//this.onChange( { select: rules[0].select }, 0 );
					} }
				>
					<Dashicon icon="plus" />
					{ __( 'Add Rule', 'kadence-conversions' ) }
				</Button>
			</div>
		);
	}
}

export default UserSettings;
