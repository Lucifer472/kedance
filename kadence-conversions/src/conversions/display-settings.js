/* jshint esversion: 6 */
import Icons from './icons.js';
import PostSelectButton from './post-select';
import Select from 'react-select';
import times from 'lodash/times';
import capitalizeFirstLetter from './capitalize-first.js';
import filter from 'lodash/filter';
const { __ } = wp.i18n;
const { taxonomies } = window.kadenceConversionsParams;

const { ButtonGroup, Dashicon, ToggleControl, IconButton, Tooltip, Button, SelectControl } = wp.components;

const { Component, Fragment } = wp.element;
class DisplaySettings extends Component {
	constructor() {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.onRemoveRule = this.onRemoveRule.bind( this );
		this.defaultValue = [ {
			rule: '',
			select: 'all',
			ids: [],
			subRule: '',
			subSelection: [],
		} ];
		this.state = {
			rulesOptions: [].concat.apply( [], this.props.rules.map( option => option.options ) ),
			value: this.props.value,
		};
	}
	onRemoveRule( index ) {
		return () => {
			const rules = this.props.value ? JSON.parse( this.props.value ) : this.defaultValue;
			const newRules = filter( rules, ( item, i ) => index !== i );
			this.props.onChange( JSON.stringify( newRules ) );
		};
	}
	onChange( value, index ) {
		const rules = this.props.value ? JSON.parse( this.props.value ) : this.defaultValue;
		const newRules = rules.map( ( item, thisIndex ) => {
			if ( index === thisIndex ) {
				item = { ...item, ...value };
			}

			return item;
		} );
		this.props.onChange( JSON.stringify( newRules ) );
	}
	render() {
		const rules = this.props.value ? JSON.parse( this.props.value ) : this.defaultValue;
		const ruleOutput = ( index ) => {
			const taxonomyList = [];
			const taxonomyOptions = [];
			const taxsOptions = [];
			if ( rules[ index ].rule && rules[ index ].rule.startsWith('singular|') && rules[ index ].rule.split('|')[1] && undefined !== taxonomies[ rules[ index ].rule.split('|')[1] ] && taxonomies[ rules[ index ].rule.split('|')[1] ].taxonomy && 0 !== Object.keys( taxonomies[ rules[ index ].rule.split('|')[1] ].taxonomy ).length ) {
				Object.keys( taxonomies[ rules[ index ].rule.split('|')[1] ].taxonomy ).map( ( item, theindex ) => {
					return taxonomyList.push( { value: taxonomies[ rules[ index ].rule.split('|')[1] ].taxonomy[ item ].name, label: taxonomies[ rules[ index ].rule.split('|')[1] ].taxonomy[ item ].label } );
				} );
			}
			if ( rules[ index ].rule && rules[ index ].rule.startsWith('singular|') && rules[ index ].rule.split('|')[1] && rules[ index ].subRule && taxonomies[ rules[ index ].rule.split('|')[1] ] && taxonomies[ rules[ index ].rule.split('|')[1] ].terms && taxonomies[ rules[ index ].rule.split('|')[1] ].terms[ rules[ index ].subRule ] && Object.keys( taxonomies[ rules[ index ].rule.split('|')[1] ].terms[ rules[ index ].subRule ] ).length ) {
				Object.keys( taxonomies[ rules[ index ].rule.split('|')[1] ].terms[ rules[ index ].subRule ] ).map( ( item, theindex ) => {
					return taxonomyOptions.push( { value: taxonomies[ rules[ index ].rule.split('|')[1] ].terms[ rules[ index ].subRule ][ item ].value, label: taxonomies[ rules[ index ].rule.split('|')[1] ].terms[ rules[ index ].subRule ][ item ].label } );
				} );
			}
			if ( rules[ index ].rule && rules[ index ].rule.startsWith('tax_archive|') && rules[ index ].rule.split('|')[1] && taxonomies.taxs && taxonomies.taxs[ rules[ index ].rule.split('|')[1] ] && Object.keys( taxonomies.taxs[ rules[ index ].rule.split('|')[1] ] ).length ) {
				Object.keys( taxonomies.taxs[ rules[ index ].rule.split('|')[1] ] ).map( ( item, theindex ) => {
					return taxsOptions.push( { value: taxonomies.taxs[ rules[ index ].rule.split('|')[1] ][ item ].value, label: taxonomies.taxs[ rules[ index ].rule.split('|')[1] ][ item ].label } );
				} );
			}
			return (
				<div className="kt-meta-display-row">
					<div className="kt-meta-display-top-wrap">
						<div className="kt-meta-select-wrap">
							<Select
								options={ this.props.rules }
								className="kt-meta-select"
								classNamePrefix="ktp"
								value={ ( undefined !== rules[ index ] && undefined !== rules[ index ].rule && '' !== rules[ index ].rule ? this.state.rulesOptions.filter( ( { value } ) => value === rules[ index ].rule ) : '' ) }
								isMulti={ false }
								isSearchable={ true }
								isClearable={ true }
								maxMenuHeight={ 240 }
								placeholder={ this.props.placeholder }
								onChange={ ( val ) => {
									if ( ! val ) {
										this.onChange( { rule: '' }, index );
									} else {
										this.onChange( { rule: val.value, select: 'all', ids: [], subRule: '', subSelection: [], mustMatch: false }, index );
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
									label={ __( 'Remove Rule', 'kadence-conversions' ) }
									disabled={ 1 === rules.length }
								/>
							</div>
						) }
					</div>
					{ rules[ index ].rule && rules[ index ].rule.startsWith('singular|') && (
						<div className="kt-sub-rules">
							<SelectControl
								label={ __( 'Select', 'kadence-conversions' ) + ' ' + capitalizeFirstLetter( rules[ index ].rule.split('|')[1] ) + ' ' + __( 'By:', 'kadence-conversions' ) }
								options={ [
									{
										label: __( 'All', 'kadence-conversions' ),
										value: 'all',
									},
									{
										label: __( 'Group', 'kadence-conversions' ),
										value: 'tax',
									},
									{
										label: __( 'Author', 'kadence-conversions' ),
										value: 'author',
									},
									{
										label: __( 'Individually', 'kadence-conversions' ),
										value: 'ids',
									},
								] }
								value={ ( rules[ index ].select ? rules[ index ].select : '' ) }
								onChange={ ( val ) => {
									this.onChange( { subRule: '' }, index );
									this.onChange( { select: val }, index );
								} }
							/>
							{ rules[ index ].select && 'ids' == rules[ index ].select && (
								<Fragment>
									<PostSelectButton
										value={ ( rules[ index ].ids ? rules[ index ].ids : [] ) }
										onSelect={ ( value ) => {
											this.onChange( { ids: value.map( p => p.id ) }, index );
										} }
										postType={ rules[ index ].rule.split('|')[1] }
										modalTitle={ __( 'Select Items', 'kadence-conversions' ) }
										minPosts={ 1 }
										contentState="selection"
										btnProps={ { isLarge: true, isSecondary: true } }
									>
										{ __( 'Select Items', 'kadence-conversions' ) }
									</PostSelectButton>
									{ rules[ index ].ids && (
										<div className="ktp-single-selected">
											{ ( rules[ index ].ids.length ) + ' ' + __( 'Selected', 'kadence-conversions' ) }
										</div>
									) }
								</Fragment>
							) }
							{ rules[ index ].select && 'author' == rules[ index ].select && (
								<Fragment>
									{ ( undefined !== taxonomyList && 0 !== taxonomyList.length ) && (
										<div className="kt-meta-select-wrap">
											<label htmlFor={ 'tax-selection' } className="screen-reader-text">
												{ __( 'Select Author', 'kadence-conversions' ) }
											</label>
											<Select
												value={ ( undefined !== rules[ index ] && undefined !== rules[ index ].subRule && '' !== rules[ index ].subRule ? kadenceConversionsParams.authors.filter( ( { value } ) => value === rules[ index ].subRule ) : '' ) }
												onChange={ ( select ) => {
													if ( select.value !== ( rules[ index ].subRule ? rules[ index ].subRule : '' ) ) {
														this.onChange( { subSelection: [] }, index );
													}
													this.onChange( { subRule: select.value }, index );
												} }
												className="kt-meta-select"
												classNamePrefix="ktp"
												id={ 'tax-selection' }
												options={ kadenceConversionsParams.authors }
												isMulti={ false }
												maxMenuHeight={ 240 }
												placeholder={ __( 'Select Author', 'kadence-conversions' ) }
											/>
										</div>
									) }
								</Fragment>
							) }
							{ rules[ index ].select && 'tax' == rules[ index ].select && (
								<Fragment>
									{ ( undefined !== taxonomyList && 0 === taxonomyList.length ) &&
										__( 'No Groups for this post type.', 'kadence-conversions' )
									}
									{ ( undefined !== taxonomyList && 0 !== taxonomyList.length ) && (
										<div className="kt-meta-select-wrap">
											<label htmlFor={ 'tax-selection' } className="screen-reader-text">
												{ __( 'Select Taxonomy', 'kadence-conversions' ) }
											</label>
											<Select
												value={ taxonomyList.filter( ( { value } ) => value === ( rules[ index ].subRule ? rules[ index ].subRule : '' ) ) }
												onChange={ ( select ) => {
													if ( select.value !== ( rules[ index ].subRule ? rules[ index ].subRule : '' ) ) {
														this.onChange( { subSelection: [] }, index );
													}
													this.onChange( { subRule: select.value }, index );
												} }
												className="kt-meta-select"
												classNamePrefix="ktp"
												id={ 'tax-selection' }
												options={ taxonomyList }
												isMulti={ false }
												maxMenuHeight={ 240 }
												placeholder={ __( 'Select Taxonomy', 'kadence-conversions' ) }
											/>
										</div>
									) }
									{ ( undefined !== taxonomyOptions && 0 !== taxonomyOptions.length ) && (
										<Fragment>
											<div className="kt-meta-select-wrap">
												<label htmlFor={ 'terms-selection' } className="screen-reader-text">
													{ __( 'Select Terms', 'kadence-conversions' ) }
												</label>
												<Select
													value={ ( rules[ index ].subSelection ? rules[ index ].subSelection : [] ) }
													onChange={ ( value ) => {
														this.onChange( { subSelection: ( value ? value : [] ) }, index );
													} }
													className="kt-meta-select"
													classNamePrefix="ktp"
													id={ 'terms-selection' }
													options={ taxonomyOptions }
													isMulti={ true }
													maxMenuHeight={ 240 }
													placeholder={ __( 'All', 'kadence-conversions' ) }
												/>
											</div>
											{ rules[ index ].subSelection && rules[ index ].subSelection.length > 1 && (
												<ToggleControl
													label={ __( 'Must Match all Groups', 'kadence-conversions' ) }
													checked={ ( undefined !== rules[ index ].mustMatch ? rules[ index ].mustMatch : false ) }
													onChange={ ( value ) => {
														this.onChange( { mustMatch: value }, index );
													} }
												/>
											) }
										</Fragment>
									) }
								</Fragment>
							) }
						</div>
					) }
					{ rules[ index ].rule && rules[ index ].rule.startsWith('tax_archive|') && (
						<div className="kt-sub-rules">
							<SelectControl
								label={ __( 'Select', 'kadence-conversions' ) + ' ' + capitalizeFirstLetter( rules[ index ].rule.split('|')[1] ) + ' ' + __( ' Archive By:', 'kadence-conversions' ) }
								options={ [
									{
										label: __( 'All', 'kadence-conversions' ),
										value: 'all',
									},
									{
										label: __( 'Individually', 'kadence-conversions' ),
										value: 'individual',
									},
								] }
								value={ ( rules[ index ].select ? rules[ index ].select : '' ) }
								onChange={ ( val ) => {
									this.onChange( { select: val }, index );
								} }
							/>
							{ rules[ index ].select && 'individual' == rules[ index ].select && (
								<Fragment>
									{ ( undefined !== taxsOptions && 0 === taxsOptions.length ) &&
										__( 'No terms for this archive.', 'kadence-conversions' )
									}
									{ ( undefined !== taxsOptions && 0 !== taxsOptions.length ) && (
										<Fragment>
											<div className="kt-meta-select-wrap">
												<label htmlFor={ 'terms-selection' } className="screen-reader-text">
													{ __( 'Select Terms', 'kadence-conversions' ) }
												</label>
												<Select
													value={ ( rules[ index ].subSelection ? rules[ index ].subSelection : [] ) }
													onChange={ ( value ) => {
														this.onChange( { subSelection: ( value ? value : [] ) }, index );
													} }
													className="kt-meta-select"
													classNamePrefix="ktp"
													id={ 'terms-selection' }
													options={ taxsOptions }
													isMulti={ true }
													maxMenuHeight={ 240 }
													placeholder={ __( 'All', 'kadence-conversions' ) }
												/>
											</div>
										</Fragment>
									) }
								</Fragment>
							) }
						</div>
					) }
				</div>
			);
		}
		return (
			<Fragment>
				<div className={ `kadence-control-field kadence-display-settings${ ( this.props.customClass ? ' ' + this.props.customClass : '' ) }` }>
					{ this.props.label && (
						<h2 className="kt-meta-title">{ this.props.label }</h2>
					) }
					{ times( rules.length, n => ruleOutput( n ) ) }
					<Button
						className="kb-add-rule"
						isPrimary={ true }
						onClick={ () => {
							const newRules = rules;
							newRules.push( {
								rule: '',
								select: 'all',
								ids: [],
								subRule: '',
							} );
							this.props.onChange( JSON.stringify( newRules ) );
							//this.onChange( { select: rules[0].select }, 0 );
						} }
					>
						<Dashicon icon="plus" />
						{ __( 'Add Rule', 'kadence-conversions' ) }
					</Button>
				</div>
			</Fragment>
		);
	}
}

export default DisplaySettings;
