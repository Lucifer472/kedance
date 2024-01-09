import { Line } from 'react-chartjs-2';
import { Component, Fragment } from '@wordpress/element';
import { TextControl, SelectControl, PanelBody, ToggleControl, DateTimePicker, CheckboxControl, Modal, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Try Parsing
 */
function TryParseJSON( jsonString, forceJson = true ) {
    try {
        var o = JSON.parse( jsonString );

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object", 
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }
	if ( jsonString && typeof jsonString === "object" ) {
		return jsonString;
	}
	if ( forceJson ) {
		return {};
	}
    return false;
};


class ConversionDashControl extends Component {
	constructor() {
		super( ...arguments );
		this.loadAnalyticsData = this.loadAnalyticsData.bind( this );
		this.state = {
			labels: '',
			viewed: '',
			converted: '',
			rate: '',
			itemSelect: 'all',
			period: 7,
		}
	}
	loadAnalyticsData( postID, period ) {
		this.setState( { isLoading: true } );
		var data = new FormData();
		data.append( 'action', 'kadence_conversions_get_analytics_data' );
		data.append( 'security', kadenceDashboardParams.ajax_nonce );
		data.append( 'post_id', postID );
		data.append( 'period', period );
		var control = this;
		jQuery.ajax( {
			method:      'POST',
			url:         kadenceDashboardParams.ajax_url,
			data:        data,
			contentType: false,
			processData: false,
		} )
		.done( function( response, status, stately ) {
			if ( response ) {
				const o = TryParseJSON( response );
				if ( o ) {
					const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
					const viewedArray = o.graphViews.viewed;
					const convertArray = o.graphConvert.converted;
					// Build labels.
					const dates = []
					viewedArray.map( view => (
						dates.push( new Date( view.time + ' 00:00:00' ) )
					) );
					dates.reverse();
					let i = 0;
					const labels = [];
					while (i < parseInt( control.state.period, 10 ) ) {
						labels.push( monthNames[dates[i].getMonth()] + ' ' + dates[i].getDate() )
						i += 1;
					}
					labels.reverse();
					// Build views.
					viewedArray.reverse();
					const viewed = [];
					i = 0;
					while (i < parseInt( control.state.period, 10 ) ) {
						viewed.push( viewedArray[i].count )
						i += 1;
					}
					viewed.reverse();

					// Build Conversions.
					convertArray.reverse();
					const converted = [];
					i = 0;
					while (i < parseInt( control.state.period, 10 ) ) {
						converted.push( convertArray[i].count )
						i += 1;
					}
					converted.reverse();
					control.setState( { labels: labels, viewed: viewed, converted: converted, error: false, isLoading: false } );
				} else {
					control.setState( { error: true, isLoading: false } );
				}
			}
		})
		.fail( function( error ) {
			console.log(error);
			control.setState( { error: true, isLoading: false } );
		});
	}
	componentDidMount() {
		const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
		const viewedArray = kadenceDashboardParams.graphViews.viewed;
		const convertArray = kadenceDashboardParams.graphConvert.converted;
		// Build labels.
		const dates = []
		viewedArray.map( view => (
			dates.push( new Date( view.time + ' 00:00:00' ) )
		) );
		dates.reverse();
		let i = 0;
		const labels = [];
		while (i < parseInt( kadenceDashboardParams.period, 10 ) ) {
			labels.push( monthNames[dates[i].getMonth()] + ' ' + dates[i].getDate() )
			i += 1;
		}
		labels.reverse();
		// Build views.
		viewedArray.reverse();
		const viewed = [];
		i = 0;
		while (i < parseInt( kadenceDashboardParams.period, 10 ) ) {
			viewed.push( viewedArray[i].count )
			i += 1;
		}
		viewed.reverse();

		// Build Conversions.
		convertArray.reverse();
		const converted = [];
		i = 0;
		while (i < parseInt( kadenceDashboardParams.period, 10 ) ) {
			converted.push( convertArray[i].count )
			i += 1;
		}
		converted.reverse();
		this.setState( { labels: labels, viewed: viewed, converted: converted, period: parseInt( kadenceDashboardParams.period, 10 ) } );
	}
	render() {
		const data = {
			labels: this.state.labels,
			datasets: [
			  {
				label: 'Views',
				data: this.state.viewed,
				fill: false,
				backgroundColor: 'rgb(52, 152, 219)',
				borderColor: 'rgba(52, 152, 219, 0.6)',
			  },
			  {
				label: 'Converted',
				data: this.state.converted,
				fill: true,
				backgroundColor: 'rgba(92, 196, 136, 0.4)',
				borderColor: 'rgba(92, 196, 136, 0.4)',
			  },
			],
		  };
		  
		  const options = {
			scales: {
			  y: {
				beginAtZero: true
			  }
			}
		  };
		const items = Object.keys( kadenceDashboardParams.items ).map( function( key, index ) {
			return { value: key, label: ( kadenceDashboardParams.items[ key ] ? kadenceDashboardParams.items[ key ] : __( 'Empty Title -', 'kadence-conversions' ) + ' ' + key ) }
		} );
		return (
			<Fragment>
				<div className="kc-analytics-header">
					<h2>{ __( 'Recent Performance', 'kadence-conversions' ) }</h2>
					<SelectControl
						label={ __( 'Conversion Item', 'kadence-conversions' ) }
						value={ this.state.itemSelect }
						className={ 'kc-analytics-item-select' }
						options={ items }
						onChange={ ( value ) => {
							this.setState( { itemSelect: value } );
							this.loadAnalyticsData( value, this.state.period );
						} }
					/>
					<SelectControl
						label={ __( 'Period', 'kadence-conversions' ) }
						value={ this.state.period }
						className={ 'kc-period-item-select' }
						options={ [
							{ value: 7, label: __( 'Last 7 Days', 'kadence-conversions' ) },
							{ value: 30, label: __( 'Last 30 Days', 'kadence-conversions' ) },
							{ value: 90, label: __( 'Last 90 Days', 'kadence-conversions' ) }
						] }
						onChange={ ( value ) => {
							this.setState( { period: value } );
							this.loadAnalyticsData( this.state.itemSelect, value );
						} }
					/>
				</div>
				<Line data={data} options={options} />
			</Fragment>
		);
	}
};
export default ConversionDashControl;
