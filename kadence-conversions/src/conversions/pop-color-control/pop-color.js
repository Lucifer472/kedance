/**
 * Advanced Color Control.
 *
 */

/**
 * Import Icons
*/
import SinglePopColorControl from './single-pop-color';
/**
 * Import Css
 */
 import './pop-color-editor.scss';

/**
 * Internal block libraries
 */
const { __ } = wp.i18n;
const {
	Component,
} = wp.element;
const {
	Button,
	Dashicon,
} = wp.components;
/**
 * Build the Measure controls
 * @returns {object} Measure settings.
 */
class PopColorControl extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			reload: false,
		}
	}
	 render() {
		let showClear = false;
		if ( this.props.value && this.props.value !== this.props.default ) {
			showClear = true;
		}
		if ( this.props.value2 && this.props.value2 !== this.props.default2 ) {
			showClear = true;
		}
		if ( this.props.value3 && this.props.value3 !== this.props.default3 ) {
			showClear = true;
		}
		return (
			<div className="components-base-control kadence-pop-color-control">
				<div className="kadence-pop-color-container">
					{ this.props.label && (
						<h2 className="kadence-beside-label">{ this.props.label }</h2>
					) }
					{ showClear && (
						<Button
							className="kadence-pop-color-clear"
							type="button"
							onClick={ () => {
								this.props.onChange( this.props.default ? this.props.default : '' );
								if ( this.props.onClassChange ) {
									this.props.onClassChange( '' );
								}
								if ( this.props.onChange2 ) {
									this.props.onChange2( this.props.default2 ? this.props.default2 : '' );
									if ( this.props.onClassChange2 ) {
										this.props.onClassChange2( '' );
									}
								}
								if ( this.props.onChange3 ) {
									this.props.onChange3( this.props.default3 ? this.props.default3 : '' );
									if ( this.props.onClassChange3 ) {
										this.props.onClassChange3( '' );
									}
								}
								this.setState( { reload: true } );
							} }
							isSmall
						>
							<Dashicon icon="redo" />
						</Button>
					) }
					<div className="kadence-pop-color-popovers">
						<SinglePopColorControl
							label={ this.props.swatchLabel ? this.props.swatchLabel : __( 'Select Color' ) }
						 	onChange={ value => this.props.onChange( value ) }
							onClassChange={ this.props.onClassChange ? value => this.props.onClassChange( value ) : undefined }
							value={ this.props.value }
							default={ this.props.default ? this.props.default : '' }
							reload={ this.state.reload }
							reloaded={ value => this.setState( { reload: false } ) }
						/>
						{ this.props.onChange2 && (
							<SinglePopColorControl
								label={ this.props.swatchLabel2 ? this.props.swatchLabel2 : __( 'Select Color' ) }
								onChange={ value => this.props.onChange2( value ) }
								onClassChange={ this.props.onClassChange2 ? value => this.props.onClassChange2( value ) : undefined }
								value={ this.props.value2 }
								default={ this.props.default2 ? this.props.default2 : '' }
								reload={ this.state.reload }
								reloaded={ value => this.setState( { reload: false } ) }
							/>
						) }
						{ this.props.onChange3 && (
							<SinglePopColorControl
								label={ this.props.swatchLabel3 ? this.props.swatchLabel3 : __( 'Select Color' ) }
								onChange={ value => this.props.onChange3( value ) }
								onClassChange={ this.props.onClassChange3 ? value => this.props.onClassChange3( value ) : undefined }
								value={ this.props.value3 }
								default={ this.props.default3 ? this.props.default3 : '' }
								reload={ this.state.reload }
								reloaded={ value => this.setState( { reload: false } ) }
							/>
						) }
					</div>
				</div>
			</div>
		 );
	 }
 }
 export default PopColorControl;

 