/**
 * Handle Template Library.
 */

/**
 * Globals.
 */
 const {
	localStorage,
} = window;

/**
 * External dependencies
 */
import Masonry from 'react-masonry-component';
import debounce from 'lodash/debounce';
/**
 * WordPress dependencies
 */
const {
	applyFilters,
} = wp.hooks;

import {
	withSelect,
	withDispatch,
} from '@wordpress/data';
import { rawHandler } from '@wordpress/blocks';
import { 
	Component,
	Fragment,
} from '@wordpress/element';
import { compose } from '@wordpress/compose';
import {
	Button,
	TextControl,
	Modal,
	SelectControl,
	VisuallyHidden,
	ExternalLink,
	Spinner,
} from '@wordpress/components';
import {
	arrowLeft,
	download,
	previous,
	update,
	next,
	chevronLeft,
	chevronDown,
} from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
 import TryParseJSON from './../common/try-parse-json';

/**
 * Prebuilt Sections.
 */
class TemplateSelect extends Component {
	constructor() {
		super( ...arguments );
		this.loadTemplateData = this.loadTemplateData.bind( this );
		this.onInsertContent = this.onInsertContent.bind( this );
		this.importProcess = this.importProcess.bind( this );
		this.reloadTemplateData = this.reloadTemplateData.bind( this );
		this.state = {
			category: 'all',
			starting: true,
			search: null,
			tab: 'section',
			items: kadenceConversionsParams.prebuilt ? TryParseJSON( kadenceConversionsParams.prebuilt, false ) : false,
			errorItems: false,
			isImporting: false,
			isLoading: false,
			sidebar: false,
			gridSize: 'normal',
			categories: {
				'category': __( 'Category', 'kadence-blocks' ),
				'pro': __( 'Pro', 'kadence-blocks' ),
				'new': __( 'New', 'kadence-blocks' ),
				'feature': __( 'Feature', 'kadence-blocks' ),
				'hero': __( 'Hero', 'kadence-blocks' ),
				'form': __( 'Form', 'kadence-blocks' ),
				'pricing-table': __( 'Pricing Table', 'kadence-blocks' ),
				'tabs': __( 'Tabs', 'kadence-blocks' ),
				'accordion': __( 'Accordion', 'kadence-blocks' ),
				'testimonials': __( 'Testimonials', 'kadence-blocks' ),
			},
		};
		this.debouncedReloadTemplateData = debounce( this.reloadTemplateData.bind( this ), 200 );
	}
	onInsertContent( blockcode, conversion ) {
		if ( blockcode !== "" ) {
			this.importProcess( blockcode, conversion );
		} else {
			this.props.onImport( conversion );
		}
	}
	importProcess( blockcode, conversion ) {
		this.setState( { isImporting: true } );
		var data = new FormData();
		data.append( 'action', 'kadence_import_process_data' );
		data.append( 'security', kadence_blocks_params.ajax_nonce );
		data.append( 'import_content', blockcode );
		var control = this;
		jQuery.ajax( {
			method:      'POST',
			url:         kadence_blocks_params.ajax_url,
			data:        data,
			contentType: false,
			processData: false,
		} )
		.done( function( response, status, stately ) {
			if ( response ) {
				control.props.insert( response, control.props.clientId );
				control.setState( { isImporting: false } );
				control.props.onImport( conversion );
			}
		})
		.fail( function( error ) {
			console.log( error );
			control.setState( { isImporting: false } );
		});
	}
	reloadTemplateData() {
		this.setState( { errorItems: false, isLoading: true, items: 'loading' } );
		var data_key = ( kadenceConversionsParams.proData &&  kadenceConversionsParams.proData.api_key ?  kadenceConversionsParams.proData.api_key : '' );
		var data_email = ( kadenceConversionsParams.proData &&  kadenceConversionsParams.proData.api_email ?  kadenceConversionsParams.proData.api_email : '' );
		var product_id = ( kadenceConversionsParams.proData &&  kadenceConversionsParams.proData.product_id ?  kadenceConversionsParams.proData.product_id : '' );
		if ( ! data_key ) {
			data_key = (  kadenceConversionsParams.proData &&  kadenceConversionsParams.proData.ithemes_key ?  kadenceConversionsParams.proData.ithemes_key : '' );
			if ( data_key ) {
				data_email = 'iThemes';
			}
		}
		var data = new FormData();
		data.append( 'action', 'kadence_import_reload_prebuilt_data' );
		data.append( 'security', kadenceConversionsParams.ajax_nonce );
		data.append( 'api_key', data_key );
		data.append( 'api_email', data_email );
		data.append( 'product_id', product_id );
		data.append( 'package', 'section' );
		var control = this;
		jQuery.ajax( {
			method:      'POST',
			url:         kadenceConversionsParams.ajax_url,
			data:        data,
			contentType: false,
			processData: false,
		} )
		.done( function( response, status, stately ) {
			if ( response ) {
				const o = TryParseJSON( response, false );
				if ( o ) {
					const filteredLibraryItems = applyFilters( 'kadence.prebuilt_object', o );
					kadenceConversionsParams.library_sections = filteredLibraryItems;
					control.setState( { items: filteredLibraryItems, errorItems: false, isLoading: false } );
				} else {
					control.setState( { items: 'error', errorItems: true, isLoading: false } );
				}
			}
		})
		.fail( function( error ) {
			console.log(error);
			control.setState( { items: 'error', errorItems: true, isLoading: false } );
		});
	}
	loadTemplateData() {
		this.setState( { errorItems: false, isLoading: true, items: 'loading' } );
		var data_key = ( kadenceConversionsParams.proData &&  kadenceConversionsParams.proData.api_key ?  kadenceConversionsParams.proData.api_key : '' );
		var data_email = ( kadenceConversionsParams.proData &&  kadenceConversionsParams.proData.api_email ?  kadenceConversionsParams.proData.api_email : '' );
		var product_id = ( kadenceConversionsParams.proData &&  kadenceConversionsParams.proData.product_id ?  kadenceConversionsParams.proData.product_id : '' );
		if ( ! data_key ) {
			data_key = (  kadenceConversionsParams.proData &&  kadenceConversionsParams.proData.ithemes_key ?  kadenceConversionsParams.proData.ithemes_key : '' );
			if ( data_key ) {
				data_email = 'iThemes';
			}
		}
		var data = new FormData();
		data.append( 'action', 'kadence_import_get_prebuilt_data' );
		data.append( 'security', kadenceConversionsParams.ajax_nonce );
		data.append( 'api_key', data_key );
		data.append( 'api_email', data_email );
		data.append( 'product_id', product_id );
		data.append( 'package', 'section' );
		var control = this;
		jQuery.ajax( {
			method:      'POST',
			url:         kadenceConversionsParams.ajax_url,
			data:        data,
			contentType: false,
			processData: false,
		} )
		.done( function( response, status, stately ) {
			if ( response ) {
				const o = TryParseJSON( response, false );
				if ( o ) {
					const filteredLibraryItems = applyFilters( 'kadence.prebuilt_object', o );
					kadenceConversionsParams.library_sections = filteredLibraryItems;
					control.setState( { items: filteredLibraryItems, errorItems: false, isLoading: false } );
				} else {
					control.setState( { items: 'error', errorItems: true, isLoading: false } );
				}
			}
		})
		.fail( function( error ) {
			console.log(error);
			control.setState( { items: 'error', errorItems: true, isLoading: false } );
		});
	}
	render() {
		if ( this.props.reload ) {
			this.props.onReload();
			this.debouncedReloadTemplateData();
		}
		let blankImg = 'https://cpl.kadencewp.com/wp-content/uploads/2021/10/blank-pop.jpg';
		let blankWidth =  1000;
		let blankHeight = 560;
		if ( this.props.type === 'slide_in' ) {
			blankImg = 'https://cpl.kadencewp.com/wp-content/uploads/2021/10/slide_in_blank.jpg';
			blankWidth =  1000;
			blankHeight = 400;
		} else if ( this.props.type === 'banner' ) {
			blankImg = 'https://cpl.kadencewp.com/wp-content/uploads/2021/10/banner_blank.jpg';
			blankWidth =  1000;
			blankHeight = 400;
		}
		const activePanel = TryParseJSON( localStorage.getItem( 'kadenceConversionsPrebuilt' ), true );
		const savedGridSize = ( activePanel && activePanel['grid'] ? activePanel['grid'] : 'normal' );
		const gridSize = ( this.state.gridSize ? this.state.gridSize : savedGridSize );
		const control = this;
		const roundAccurately = (number, decimalPlaces) => Number(Math.round(Number(number + "e" + decimalPlaces)) + "e" + decimalPlaces * -1);
		const libraryItems = this.state.items;
		const categoryItems = this.state.categories;
		return (
			<Modal
				className={ this.props.className }
				title={ this.props.title }
				onRequestClose={ this.props.onRequestClose }
			>
				<div className={ `kc-prebuilt-content` }>
					{ this.props.label && (
						<div className="kadence-title-control-bar">
							<span className="customize-control-title">{ this.props.label }</span>
						</div>
					) }
					{ ( this.state.isImporting || this.state.isLoading || false === libraryItems || this.state.errorItems ) ? (
						<Fragment>
							{ ! this.state.errorItems && this.state.isLoading && (
								<Spinner />
							) }
							{ ! this.state.errorItems && this.state.isImporting &&  (
								<div className="preparing-importing-images">
									<Spinner />
									<h2>{ __( 'Preparing Content...', 'kadence-blocks' ) }</h2>
								</div>
							) }
							{ this.state.errorItems && (
								<div>
									<h2 style={ { textAlign:'center' } }>
										{ __( 'Error, Unable to access library database, please try re-syncing', 'kadence-blocks' ) }
									</h2>
									<div style={ { textAlign:'center' } }>
										<Button 
											className="kt-reload-templates"
											icon={ update }
											onClick={ () => this.reloadTemplateData() }
										>
											{ __( ' Sync with Cloud', 'kadence-blocks' ) }
										</Button>
									</div>
								</div>
							) }
							{ false === libraryItems && (
								<Fragment>{ this.loadTemplateData() }</Fragment>
							) }
						</Fragment>
					) : (
						<Masonry
							className={ `kadence-conversions-prebuilt kb-core-section-library${gridSize && gridSize !== 'normal' ? 'kb-grid-size-'  + gridSize : '' }` }
							elementType={ 'div' }
							options={ {
								transitionDuration: 0,
							} }
							disableImagesLoaded={ false }
							enableResizableChildren={ true }
							updateOnEachImageLoad={ false }
						>
							{ Object.keys( this.state.items ).map( function( key, index ) {
								const name = libraryItems[key].name;
								const slug = libraryItems[key].slug;
								const content = libraryItems[key].content;
								const image = libraryItems[key].image;
								const imageWidth = libraryItems[key].imageW;
								const imageHeight = libraryItems[key].imageH;
								const categories = libraryItems[key].categories;
								const description = control.state.items[key].description;
								const pro = libraryItems[key].pro;
								const conversion = libraryItems[key].conversion;
								const locked = libraryItems[key].locked;
								const descriptionId = `${ slug }_kb_cloud__item-description`;
								if ( Object.keys( categories ).includes( control.props.type ) ) {
									return (
										<div className="kt-prebuilt-item">
											<Button
												key={ key }
												className="kt-import-btn"
												isSmall
												aria-label={
													sprintf(
														/* translators: %s is Prebuilt Name */
														__( 'Add %s', 'kadence-blocks' ),
														name
													)
												}
												aria-describedby={ description ? descriptionId : undefined }
												isDisabled={ locked }
												onClick={ () => ! locked ? control.onInsertContent( content, conversion ) : '' }
											>
												<div
													className="kt-import-btn-inner"
													style={ {
														paddingBottom: ( imageWidth && imageHeight ? roundAccurately( ( imageHeight/imageWidth * 100), 2 ) + '%' : undefined ),
													} }
												>
													<img src={ image } alt={ name } />
													<span className="kb-import-conversion-title">{ name }</span>
												</div>
											</Button>
											{ !! description && (
												<VisuallyHidden id={ descriptionId }>
													{ description }
												</VisuallyHidden>
											) }
											{ undefined !== pro && pro && (
												<Fragment>
													<span className="kb-pro-template">{ __( 'Pro', 'kadence-blocks' ) }</span>
													{ locked && (
														<div className="kt-popover-pro-notice">
															<h2>{ __( 'Kadence Blocks Pro required for this item' ) } </h2>
															<ExternalLink href={ 'https://www.kadencewp.com/kadence-blocks/pro/' }>{ __( 'Upgrade to Pro', 'kadence-blocks' ) }</ExternalLink>
														</div>
													) }
												</Fragment>
											) }
										</div>
									);
								}
							} ) }
							<div className="kt-prebuilt-item">
								<Button
									className={ `kt-import-btn conversion-blank-item blank-${control.props.type}` }
									isSmall
									aria-label={ __( 'Add Blank Start', 'kadence-blocks' ) }
									aria-describedby={ undefined }
									isDisabled={ false }
									onClick={ () => control.onInsertContent( '', control.props.type ) }
								>
									<div
										className="kt-import-btn-inner"
										style={ {
											paddingBottom: roundAccurately( ( blankHeight/blankWidth * 100), 2 ) + '%',
										} }
									>
										<img src={ blankImg } alt={ __( 'Start Blank', 'kadence-blocks' ) } />
										<span className="kb-import-conversion-title">{ __( 'Start Blank', 'kadence-blocks' ) }</span>
									</div>
								</Button>
							</div>
						</Masonry>
					) }
				</div>
			</Modal>
		);
	}
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const { canUserUseUnfilteredHTML } = select( 'core/editor' );
		return {
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
		};
	} ),
	withDispatch( ( dispatch, { canUserUseUnfilteredHTML } ) => ( {
		insert: ( blockcode, clientId ) => dispatch( 'core/block-editor' ).replaceInnerBlocks(
			clientId,
			rawHandler( {
				HTML: blockcode,
				mode: 'BLOCKS',
				canUserUseUnfilteredHTML,
			} ),
		),
	} ) ),
] )( TemplateSelect );
