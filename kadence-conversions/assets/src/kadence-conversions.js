/* global kadenceConversionsConfig */
/**
 * File kadence-conversions.js.
 * Gets conversions working.
 */

(function() {
	'use strict';
	window.kadenceConversions = {
		cache: {},
		items: JSON.parse( kadenceConversionsConfig.items ),
		wooLiveItems: {},
		focusableElements: ['a[href]', 'area[href]', 'input:not([disabled]):not([type="hidden"]):not([aria-hidden])', 'select:not([disabled]):not([aria-hidden])', 'textarea:not([disabled]):not([aria-hidden])', 'button:not([disabled]):not([aria-hidden])', 'iframe', 'object', 'embed', '[contenteditable]', '[tabindex]:not([tabindex^="-"])'],
		/**
		 * Get element's offset.
		 */
		getOffset: function( el ) {
			if ( el instanceof HTMLElement ) {
				var rect = el.getBoundingClientRect();

				return {
					top: rect.top + window.pageYOffset,
					left: rect.left + window.pageXOffset
				}
			}

			return {
				top: null,
				left: null
			};
		},
		createCookie: function( name, value, length, unit ) {
			var expires = '';
			if ( length ) {
				var date = new Date();
				if ( 'minutes' == unit ) {
					date.setTime( date.getTime() + ( length * 60 * 1000 ) );
				} else if ( 'hours' == unit ) {
					date.setTime( date.getTime() + ( length * 60 * 60 * 1000 ) );
				} else {
					date.setTime( date.getTime()+(length*24*60*60*1000));
				}
				expires = "; expires="+date.toGMTString();
			}
			document.cookie = name+"="+value+expires+"; path=/";
		},
		getCookie( name ) {
			var value = "; " + document.cookie;
			var parts = value.split("; " + name + "=");
			if ( parts.length == 2 ) {
				return parts.pop().split(";").shift();
			}
			return '';
		},
		findOne( haystack, arr ) {
			return arr.some( function (v) {
				return haystack.indexOf(v) >= 0;
			} );
		},
		/**
		 * Exit Conversion.
		 */
		conversionExit: function( itemData ) {
			var element = document.getElementById( 'kadence-conversion-' + itemData.post_id );
			// Clear Popup Active.
			if ( 'popup' === itemData.type ) {
				window.kadenceConversions.cache.active = null;
			}
			if ( element ) {
				//console.log( 'Conversion Exit' );
				// Clear Listeners.
				if ( 'popup' === itemData.type ) {
					document.removeEventListener( 'keydown', window.kadenceConversions.cache[itemData.post_id].exitKeyListener, false );
					document.removeEventListener( 'keydown', window.kadenceConversions.cache[itemData.post_id].trapFocus, false );
				}
				if ( 'banner' === itemData.type && itemData.scrollHide ) {
					window.removeEventListener( 'resize', window.kadenceConversions.cache[itemData.post_id].scrollHideListener, false );
					window.removeEventListener( 'scroll', window.kadenceConversions.cache[itemData.post_id].scrollHideListener, false );
					window.removeEventListener( 'load', window.kadenceConversions.cache[itemData.post_id].scrollHideListener, false );
				}
				element.removeEventListener( 'click', window.kadenceConversions.cache[itemData.post_id].exitListener, false );
				// clear added listeners for Goal Event.
				switch ( itemData.goal ) {
					case 'button':
						var buttons = element.querySelectorAll( 'a' );
						if ( buttons.length ) {
							buttons.forEach( function( inner_link ) {
								inner_link.removeEventListener( 'click', window.kadenceConversions.cache[itemData.post_id].goalListener, false );
							} );
						}
						break;
					default:
						window.document.body.removeEventListener( 'kb-form-success', window.kadenceConversions.cache[itemData.post_id].goalListener, false );
						break;
				}
				// Trigger animate out.
				element.classList.add('kc-closing-visible');
				// Trigger cookie.
				if ( itemData.repeat_control && ! window.kadenceConversions.cache[ itemData.post_id ].goal && itemData.close_repeat ) {
					window.kadenceConversions.createCookie( itemData.campaign_id, true, itemData.close_repeat, 'days' );
				}
				if ( 'banner' === itemData.type ) {
					if ( itemData.offset && 'top' === itemData.offset && ! itemData.scrollHide ) {
						document.documentElement.style.paddingTop = 0 + 'px';
						setTimeout(function(){
							document.documentElement.classList.remove('kc-banner-top-offset');
							window.dispatchEvent(new Event('scroll'));
						}, 350);
						// add top margin to offset header.
					} else if ( itemData.offset && 'bottom' === itemData.offset ) {
						document.documentElement.style.paddingBottom = 0 + 'px';
						// Add bottom margin to offset footer.
					}
					setTimeout(function(){
						element.classList.remove('kc-visible');
						element.classList.remove('kc-closing-visible');
					}, 350);
				} else {
					setTimeout(function(){
						element.classList.remove('kc-visible');
					}, 350);
					setTimeout(function(){
						element.classList.remove('kc-closing-visible');
					}, 400);
				}
			}
		},
		/**
		 * Track Conversion Converted.
		 */
		trackConversionConverted: function( itemData ) {
			if ( 'true' === kadenceConversionsConfig.gtag && typeof gtag === 'function' && itemData.tracking ) {
				gtag('event', 'Conversion Goal', {
					'event_category': 'KadenceConversions',
					'event_label': itemData.post_title,
					'conversion_id': itemData.post_id
				});
			}
			if ( 'true' === kadenceConversionsConfig.analytics && itemData.tracking ) {
				window.kadenceConversions.cache[ itemData.post_id ].request = new XMLHttpRequest();
				window.kadenceConversions.cache[ itemData.post_id ].request.open( 'POST', kadenceConversionsConfig.ajax_url, true );
				window.kadenceConversions.cache[ itemData.post_id ].request.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
				window.kadenceConversions.cache[ itemData.post_id ].request.onload = function () {
					if ( this.status >= 200 && this.status < 400 ) {
						// If successful.
						//console.log( 'Conversion Converted Tracked' );
						//console.log( this.response );
					} else {
						// If fail
						console.log( 'Converted Tracking Event, status error' );
						console.log( this.response );
					}
				};
				window.kadenceConversions.cache[ itemData.post_id ].request.onerror = function() {
					// Connection error
					console.log( 'Converted Tracking Event, connection error' );
				};
				window.kadenceConversions.cache[ itemData.post_id ].request.send( 'action=kadence_conversion_converted&nonce=' + kadenceConversionsConfig.ajax_nonce + '&campaign_id=' + itemData.campaign_id + '&post_id=' + itemData.post_id + '&type=' + itemData.type + '&goal=' + itemData.goal );
			}
		},
		/**
		 * Conversion Goal listener.
		 */
		 goalListener: function( itemData ) {
			return function curried_func( e ) {
				var converted = false;
				if ( itemData.goal === 'button' ) {
					if ( itemData.goal_class && e.target.classList.contains( itemData.goal_class ) ) {
						converted = true;
					} else if ( e.currentTarget.classList.contains( 'button' ) || e.currentTarget.classList.contains( 'kt-button' )  ) {
						converted = true;
					}
				} else if ( e.type === 'kb-form-success' ) {
					converted = true;
				} else if ( e.type === 'fluentform_submission_success' ) {
					converted = true;
				} else if ( e.type === 'gform_confirmation_loaded' ) {
					converted = true;
				}
				if ( converted ) {
					window.kadenceConversions.trackConversionConverted( itemData );
					window.kadenceConversions.cache[ itemData.post_id ].goal = true;
					if ( itemData.repeat_control ) {
						window.kadenceConversions.createCookie( itemData.campaign_id, true, itemData.convert_repeat, 'days' );
					}
					if ( itemData.goal_close ) {
						window.kadenceConversions.conversionExit( itemData );
					}
				}
			}
		},
		/**
		 * Soft Exit Conversion Listener.
		 */
		 exitKeyListener: function( itemData ) {
			return function curried_func( e ) {
				if ( e.keyCode === 27 ) {
					e.preventDefault();
					window.kadenceConversions.conversionExit( itemData );
				}
			}
		},
		/**
		 * Soft Exit Conversion Listener.
		 */
		 exitListener: function( itemData ) {
			return function curried_func( e ) {
				if ( e.target.classList.contains( 'kadence-conversions-close' ) || e.target.className === 'kadence-conversions-close' || ( itemData.overlay_close && e.target.className === 'kadence-conversion-overlay' ) ) {
					e.preventDefault();
					window.kadenceConversions.conversionExit( itemData );
				}
			}
		},
		/**
		 * Trap Focus Conversion Listener.
		 */
		 trapFocus: function( itemData ) {
			return function curried_func( e ) {
				var isTabPressed = e.key === 'Tab' || e.keyCode === 9;
				if ( ! isTabPressed ) {
					return;
				}
				var element = document.getElementById( 'kadence-conversion-' + itemData.post_id );
				var firstFocusableElement = element.querySelectorAll( window.kadenceConversions.focusableElements )[0]; // get first element to be focused inside element
				var focusableContent = element.querySelectorAll( window.kadenceConversions.focusableElements );
				var lastFocusableElement = focusableContent[focusableContent.length - 1];
				if ( e.shiftKey ) { // if shift key pressed for shift + tab combination
					if ( document.activeElement === firstFocusableElement ) {
						lastFocusableElement.focus(); // add focus for the last focusable element
						e.preventDefault();
					}
				} else { // if tab key is pressed
					if ( document.activeElement === lastFocusableElement ) { // if focused has reached to last focusable element then focus first focusable element after pressing tab
						firstFocusableElement.focus(); // add focus for the first focusable element
						e.preventDefault();
					}
				}
			}
		},
		/**
		 * Track Showing Conversion.
		 */
		trackConversionTriggered: function( itemData ) {
			if ( 'true' === kadenceConversionsConfig.gtag && typeof gtag === 'function' && itemData.tracking ) {
				gtag('event', 'Conversion Viewed', {
					'event_category': 'KadenceConversions',
					'event_label': itemData.post_title,
					'conversion_id': itemData.post_id
				});
			}
			if ( 'true' === kadenceConversionsConfig.analytics && itemData.tracking ) {
				window.kadenceConversions.cache[ itemData.post_id ].request = new XMLHttpRequest();
				window.kadenceConversions.cache[ itemData.post_id ].request.open( 'POST', kadenceConversionsConfig.ajax_url, true );
				window.kadenceConversions.cache[ itemData.post_id ].request.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
				window.kadenceConversions.cache[ itemData.post_id ].request.onload = function () {
					if ( this.status >= 200 && this.status < 400 ) {
						// If successful.
						//console.log( 'Show Conversion Tracked' );
					} else {
						// If fail
						console.log( 'Show Tracking Event, status error' );
						console.log( this.response );
					}
				};
				window.kadenceConversions.cache[ itemData.post_id ].request.onerror = function() {
					// Connection error
					//console.log( 'Show Tracking Event, connection error' );
				};
				window.kadenceConversions.cache[ itemData.post_id ].request.send( 'action=kadence_conversion_triggered&nonce=' + kadenceConversionsConfig.ajax_nonce + '&campaign_id=' + itemData.campaign_id + '&post_id=' + itemData.post_id + '&type=' + itemData.type + '&goal=' + itemData.goal );
			}
		},
		/**
		 * Init Conversion.
		 */
		triggerConversion: function( itemData ) {
			// Don't let two popups trigger at once.
			if ( 'popup' === itemData.type ) {
				if ( window.kadenceConversions.cache.active ) {
					return;
				}
				window.kadenceConversions.cache.active = itemData.post_id;
			}
			var element = document.getElementById( 'kadence-conversion-' + itemData.post_id );
			if ( 'banner' === itemData.type ) {
				if ( itemData.offset && 'top' === itemData.offset && ! itemData.scrollHide ) {
					document.documentElement.classList.add('kc-banner-top-offset');
					document.documentElement.style.paddingTop = element.offsetHeight + 'px';
					// add top margin to offset header.
				} else if ( itemData.offset && 'bottom' === itemData.offset ) {
					document.documentElement.style.paddingBottom = element.offsetHeight + 'px';
					// Add bottom margin to offset footer.
				}
			}
			if ( element ) {
				// Trigger animate in.
				element.classList.add('kc-visible');
				// Trigger tracking event.
				window.kadenceConversions.trackConversionTriggered( itemData );
				window.kadenceConversions.cache[itemData.post_id].exitListener = window.kadenceConversions.exitListener( itemData );
				window.kadenceConversions.cache[itemData.post_id].goalListener = window.kadenceConversions.goalListener( itemData );
				// Adding listeners for Close Event.
				element.addEventListener( 'click', window.kadenceConversions.cache[itemData.post_id].exitListener, false );
				// Add escape key listener for popups.
				if ( 'popup' === itemData.type ) {
					window.kadenceConversions.cache[itemData.post_id].exitKeyListener = window.kadenceConversions.exitKeyListener( itemData );
					document.addEventListener( 'keydown', window.kadenceConversions.cache[itemData.post_id].exitKeyListener, false );
				}
				// Trap focus for popups.
				if ( 'popup' === itemData.type ) {
					// set focus after animation.
					var firstFocusableElement = element.querySelectorAll( window.kadenceConversions.focusableElements )[0];
					if ( firstFocusableElement ) {
						if ( firstFocusableElement.classList.contains('button' ) ) {
							var convertInner = element.querySelectorAll( '.kadence-conversion-inner' )[0];
							convertInner.setAttribute( 'tabIndex', 0 );
							setTimeout( function(){
								convertInner.focus();
							}, 600 );
						} else {
							setTimeout( function(){
								firstFocusableElement.focus();
							}, 600 );
						}
					}
					window.kadenceConversions.cache[itemData.post_id].trapFocus = window.kadenceConversions.trapFocus( itemData );
					document.addEventListener( 'keydown', window.kadenceConversions.cache[itemData.post_id].trapFocus, false );
				}
				// Adding listeners for Goal Event.
				switch ( itemData.goal ) {
					case 'button':
						if ( itemData.goal_class ) {
							var buttons = element.querySelectorAll( '.' + itemData.goal_class );
						} else {
							var buttons = element.querySelectorAll( 'a' );
						}
						if ( ! buttons.length ) {
							return;
						}
						buttons.forEach( function( inner_link ) {
							inner_link.addEventListener( 'click', window.kadenceConversions.cache[itemData.post_id].goalListener, false );
						} );
						break;
					case 'none':
						// We do nothing.
						break;
					default:
						// Form submit.
						// Check for fluent form
						if ( element.querySelector( 'form.frm-fluent-form' ) && window.jQuery ) {
							jQuery( element ).find( 'form.frm-fluent-form' ).on( 'fluentform_submission_success', function(e) {
								window.kadenceConversions.cache[itemData.post_id].goalListener( e );
							});
						}
						// Check for GravityForms Form.
						if ( element.querySelector( '.gform_anchor' ) && window.jQuery ) {
							var form_id = element.querySelector( '.gform_anchor' ).id;
							form_id = parseInt( form_id.replace(/\D/g,'') );
							jQuery( document ).on( 'gform_confirmation_loaded', function( event, formId ) {
								if ( form_id === formId ) {
									window.kadenceConversions.cache[itemData.post_id].goalListener( event );
								}
							});
						}
						// Check for Kadence Form.
						window.document.body.addEventListener( 'kb-form-success', window.kadenceConversions.cache[itemData.post_id].goalListener, false );
						break;
				}
			}
		},
		/**
		 * Init Conversion.
		 */
		initConversion: function( itemData ) {
			// 1. Check if cookie is disabling.
			if ( itemData.repeat_control ) {
				var cookie = window.kadenceConversions.getCookie( itemData.campaign_id );
				if ( cookie ) {
					return;
				}
			}
			//console.log( itemData );
			// 2. Check page views via cookie.
			if ( itemData.pageViews ) {
				var viewCookie = parseInt( window.kadenceConversions.getCookie( 'page-views-' + itemData.campaign_id ), 10 );
				if ( ! viewCookie ) {
					// One because this is the first page.
					viewCookie = 1;
				}
				if ( itemData.pageViews > viewCookie ) {
					viewCookie ++;
					window.kadenceConversions.createCookie( 'page-views-' + itemData.campaign_id, viewCookie, 1, 'days' );
					return;
				}
			}
			// 3. Check expired or not started.
			if ( itemData.expires ) {
				var userTimezoneOffset = -1 * ( new Date().getTimezoneOffset() / 60 );
				var currentTimeStamp = new Date();
				if ( Number( itemData.time_offset ) === userTimezoneOffset ) {
					var expiresTimeStamp = new Date( itemData.expires );
				} else {
					// Get the difference in offset from the sites set timezone.
					var shiftDiff = ( userTimezoneOffset - itemData.time_offset );
					// Get the date in the timezone of the user.
					var expiresTime = new Date( itemData.expires );
					// Shift that date the difference in timezones from the user to the site.
					var expiresTimeStamp = new Date( expiresTime.getTime() + ( shiftDiff * 60 * 60 * 1000 ) );
				}
				var total = expiresTimeStamp.getTime() - currentTimeStamp.getTime();
				// Check if expired.
				if ( total && total < 0  ) {
					return;
				}
			}
			if ( itemData.starts ) {
				var userTimezoneOffset = -1 * ( new Date().getTimezoneOffset() / 60 );
				var currentTimeStamp = new Date();
				if ( Number( itemData.time_offset ) === userTimezoneOffset ) {
					var startsTimeStamp = new Date( itemData.starts );
				} else {
					// Get the difference in offset from the sites set timezone.
					var shiftDiff = ( userTimezoneOffset - itemData.time_offset );
					// Get the date in the timezone of the user.
					var startsTime = new Date( itemData.starts );
					// Shift that date the difference in timezones from the user to the site.
					var startsTimeStamp = new Date( startsTime.getTime() + ( shiftDiff * 60 * 60 * 1000 ) );
				}
				var total = currentTimeStamp.getTime() - startsTimeStamp.getTime();
				// Check if has started.
				if ( total && total < 0  ) {
					return;
				}
			}
			// 4. Check within scheduled time.
			if ( itemData.recurring_days && itemData.recurring_start && itemData.recurring_stop ) {
				var arrayOfWeekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
				var currentTimeStamp = new Date;
				var weekdayNumber = currentTimeStamp.getDay()
				var weekdayName = arrayOfWeekdays[weekdayNumber]
				if ( ! itemData.recurring_days.includes( weekdayName ) ) {
					return;
				}
				var dd = String(currentTimeStamp.getDate()).padStart(2, '0');
				var mm = String(currentTimeStamp.getMonth() + 1).padStart(2, '0'); //January is 0!
				var yyyy = currentTimeStamp.getFullYear();
				var today = yyyy + '-' + mm + '-' + dd;
				var userTimezoneOffset = -1 * ( new Date().getTimezoneOffset() / 60 );
				if ( Number( itemData.time_offset ) === userTimezoneOffset ) {
					var startsTimeStamp = new Date( today + ' ' + itemData.recurring_start );
					var stopsTimeStamp = new Date( today + ' ' + itemData.recurring_stop );
				} else {
					// Get the difference in offset from the sites set timezone.
					var shiftDiff = ( userTimezoneOffset - itemData.time_offset );
					// Get the date in the timezone of the user.
					var startsTime = new Date( today + ' ' + itemData.recurring_start );
					var stopsTime = new Date( today + ' ' + itemData.recurring_stop );
					// Shift that date the difference in timezones from the user to the site.
					var startsTimeStamp = new Date( startsTime.getTime() + ( shiftDiff * 60 * 60 * 1000 ) );
					var stopsTimeStamp = new Date( stopsTime.getTime() + ( shiftDiff * 60 * 60 * 1000 ) );
				}

				var timeTill = currentTimeStamp.getTime() - startsTimeStamp.getTime();
				// Check if has started.
				if ( timeTill && timeTill < 0  ) {
					return;
				}
				var timeLeft = stopsTimeStamp.getTime() - currentTimeStamp.getTime();
				// Check if expired.
				if ( timeLeft && timeLeft < 0  ) {
					return;
				}
			}
			// 5. Check device.
			if ( itemData.device && itemData.device.length ) {
				var screenWidth = window.innerWidth
				|| document.documentElement.clientWidth
				|| document.body.clientWidth;
				if ( ! itemData.device.includes( 'mobile' ) ) {
					if ( screenWidth < 767 ) {
						return;
					}
				}
				if ( ! itemData.device.includes( 'tablet' ) ) {
					if ( screenWidth >= 768 && screenWidth <= 1024 ) {
						return;
					}
				}
				if ( ! itemData.device.includes( 'desktop' ) ) {
					if ( screenWidth > 1025 ) {
						return;
					}
				}
			}
			// 6. Check Query Var
			if ( itemData.queryStrings && itemData.queryStrings.length ) {
				var proceed = false;
				var urlParams = new URLSearchParams( window.location.search );
				Object.keys( itemData.queryStrings ).forEach( function( key ) {
					var queryParameters = itemData.queryStrings[key].split('=');
					if ( 2 === queryParameters.length ) {
						if ( queryParameters[1] === urlParams.get( queryParameters[0] ) ) {
							proceed = true;
						}
					}
				} );
				if ( ! proceed ) {
					return;
				}
			}
			// 7. Check referrer
			if ( itemData.referrer && itemData.referrer.length ) {
				if ( ! document.referrer.split('/')[2] ) {
					return;
				}
				var referrerURL = document.referrer.split('/')[2].replace( 'www.', '' );
				var proceed = false;
				Object.keys( itemData.referrer ).forEach( function( key ) {
					if ( itemData.referrer[key] === referrerURL ) {
						proceed = true;
					}
				} );
				if ( ! proceed ) {
					return;
				}
			}
			// 8. Check for custom Cookie
			if ( itemData.cookieCheck ) {
				if ( ! window.kadenceConversions.getCookie( itemData.cookieCheck ) ) {
					return;
				}
			}
			// 9. In future add option to check for ad blocker
			// 10. Woocommerce Products.
			if ( kadenceConversionsConfig.woocommerce && itemData.products ) {
				if ( ! window.kadenceConversions.findOne( kadenceConversionsConfig.cartProducts, itemData.products ) ) {
					if ( undefined === window.kadenceConversions.wooLiveItems[itemData.post_id] ) {
						window.kadenceConversions.wooLiveItems[itemData.post_id] = itemData;
					}
					return;
				}
				if ( undefined !== window.kadenceConversions.wooLiveItems[itemData.post_id] ) {
					delete window.kadenceConversions.wooLiveItems[itemData.post_id];
				}
			}
			// 11. Woocommerce Exclude Products.
			if ( kadenceConversionsConfig.woocommerce && itemData.preventProducts ) {
				if ( window.kadenceConversions.findOne( kadenceConversionsConfig.cartProducts, itemData.preventProducts ) ) {
					if ( undefined === window.kadenceConversions.wooLiveItems[itemData.post_id] ) {
						window.kadenceConversions.wooLiveItems[itemData.post_id] = itemData;
					}
					return;
				}
				if ( undefined !== window.kadenceConversions.wooLiveItems[itemData.post_id] ) {
					delete window.kadenceConversions.wooLiveItems[itemData.post_id];
				}
			}
			// 12. Woocommerce Cart Min.
			if ( kadenceConversionsConfig.woocommerce && itemData.cartMin ) {
				if ( undefined === window.kadenceConversions.wooLiveItems[itemData.post_id] ) {
					window.kadenceConversions.wooLiveItems[itemData.post_id] = itemData;
				}
				if ( parseInt( itemData.cartMin, 10 ) > parseInt( kadenceConversionsConfig.cartTotal, 10 ) ) {
					return;
				}
				if ( undefined !== window.kadenceConversions.wooLiveItems[itemData.post_id] ) {
					delete window.kadenceConversions.wooLiveItems[itemData.post_id];
				}
			}
			// 13. Woocommerce Cart Max.
			if ( kadenceConversionsConfig.woocommerce && itemData.cartMax ) {
				if ( undefined === window.kadenceConversions.wooLiveItems[itemData.post_id] ) {
					window.kadenceConversions.wooLiveItems[itemData.post_id] = itemData;
				}
				if ( parseInt( itemData.cartMax, 10 ) < parseInt( kadenceConversionsConfig.cartTotal, 10 ) ) {
					return;
				}
				if ( undefined !== window.kadenceConversions.wooLiveItems[itemData.post_id] ) {
					delete window.kadenceConversions.wooLiveItems[itemData.post_id];
				}
			}
			// Assign to event.
			window.kadenceConversions.cache[itemData.post_id] = {};
			switch ( itemData.trigger ) {
				case 'exit_intent':
					window.kadenceConversions.cache[itemData.post_id].mouseListener = function( e ) {
						var shouldShowExitIntent = 
							!e.toElement && 
							!e.relatedTarget &&
							e.clientY < 10;

						if (shouldShowExitIntent) {
							window.kadenceConversions.triggerConversion( itemData );
							window.removeEventListener( 'mouseout', window.kadenceConversions.cache[itemData.post_id].mouseListener, false );
						}
					}
					window.addEventListener( 'mouseout', window.kadenceConversions.cache[itemData.post_id].mouseListener, false );
					break;
				case 'time':
					setTimeout( function() {
						window.kadenceConversions.triggerConversion( itemData );
					}, itemData.delay, itemData );
					break;
				case 'scroll':
					window.kadenceConversions.cache[itemData.post_id].scrollListener = function( e ) {
						if ( window.scrollY >= itemData.scroll ) {
							window.kadenceConversions.triggerConversion( itemData );
							window.removeEventListener( 'resize', window.kadenceConversions.cache[itemData.post_id].scrollListener, false );
							window.removeEventListener( 'scroll', window.kadenceConversions.cache[itemData.post_id].scrollListener, false );
							window.removeEventListener( 'load', window.kadenceConversions.cache[itemData.post_id].scrollListener, false );
							if ( itemData.scrollHide ) {
								var element = document.getElementById( 'kadence-conversion-' + itemData.post_id );
								window.kadenceConversions.cache[itemData.post_id].scrollHideListener = function( e ) {
									if ( window.scrollY >= itemData.scroll ) {
										element.classList.add('kc-visible');
									} else if ( window.scrollY < itemData.scroll && element.classList.contains( 'kc-visible' ) ) {
										// Trigger animate out.
										element.classList.add('kc-closing-visible');
										setTimeout(function(){
											element.classList.remove('kc-visible');
											element.classList.remove('kc-closing-visible');
										}, 350);
									}
								}
								window.addEventListener( 'resize', window.kadenceConversions.cache[itemData.post_id].scrollHideListener, false );
								window.addEventListener( 'scroll', window.kadenceConversions.cache[itemData.post_id].scrollHideListener, false );
								window.addEventListener( 'load', window.kadenceConversions.cache[itemData.post_id].scrollHideListener, false );
							}
						}
					}
					window.addEventListener( 'resize', window.kadenceConversions.cache[itemData.post_id].scrollListener, false );
					window.addEventListener( 'scroll', window.kadenceConversions.cache[itemData.post_id].scrollListener, false );
					window.addEventListener( 'load', window.kadenceConversions.cache[itemData.post_id].scrollListener, false );
					break;
				case 'content_end':
					var end_element = document.getElementById( 'kadence-conversion-end-of-content' );
					if ( end_element ) {
						window.kadenceConversions.cache[itemData.post_id].scrollListener = function( e ) {
							var theoffsetTop = window.kadenceConversions.getOffset( end_element ).top;
							if ( window.scrollY >= theoffsetTop - 1000 ) {
								window.kadenceConversions.triggerConversion( itemData );
								window.removeEventListener( 'resize', window.kadenceConversions.cache[itemData.post_id].scrollListener, false );
								window.removeEventListener( 'scroll', window.kadenceConversions.cache[itemData.post_id].scrollListener, false );
								window.removeEventListener( 'load', window.kadenceConversions.cache[itemData.post_id].scrollListener, false );
							}
						}
						window.addEventListener( 'resize', window.kadenceConversions.cache[itemData.post_id].scrollListener, false );
						window.addEventListener( 'scroll', window.kadenceConversions.cache[itemData.post_id].scrollListener, false );
						window.addEventListener( 'load', window.kadenceConversions.cache[itemData.post_id].scrollListener, false );
					}
					break;
				case 'load':
					window.kadenceConversions.triggerConversion( itemData );
					break;
				case 'link':
					var links = document.querySelectorAll( '[href="#' + itemData.unique_id + '"]' );
					if ( ! links.length ) {
						return;
					}
					links.forEach( function( element ) {
						element.addEventListener( 'click', function( e ) {
							e.preventDefault()
							window.kadenceConversions.triggerConversion( itemData );
						} );
					} );
					break;
				default:
					break;
			}
			// Maybe Listen for conditions to change and trigger.
		},
		/**
		 * Init conversions.
		 */
		initConversions: function() {
			// No point if no conversions
			if ( ! window.kadenceConversions.items ) {
				return;
			}
			Object.keys( window.kadenceConversions.items ).forEach( function( key ) {
				window.kadenceConversions.initConversion( window.kadenceConversions.items[key] );
			} );
		},
		/**
		 * Init Cart Watch.
		 */
		 initCartWatch: function() {
			// No point if no cart watch
			if ( ! kadenceConversionsConfig.woocommerce ) {
				return;
			}
			if ( window.jQuery ) {
				jQuery( document.body ).on( 'added_to_cart', function() {
					window.kadenceConversions.initCartUpdate();
				});
			}
		},
		/**
		 * Init Cart Update.
		 */
		 initCartUpdate: function() {
			// No point if no conversion to watch for.
			if ( Object.keys(window.kadenceConversions.wooLiveItems).length === 0 ) {
				return;
			}
			var request = new XMLHttpRequest();
			request.open( 'POST', kadenceConversionsConfig.ajax_url, true );
			request.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
			request.onload = function () {
				if ( this.status >= 200 && this.status < 400 ) {
					// If successful
					var newProductData = JSON.parse( this.response );
					if ( newProductData && undefined !== newProductData.data.cartTotal ) {
						kadenceConversionsConfig.cartTotal = newProductData.data.cartTotal;
						kadenceConversionsConfig.cartProducts = newProductData.data.cartProducts;
						Object.keys( window.kadenceConversions.wooLiveItems ).forEach( function( key ) {
							window.kadenceConversions.initConversion( window.kadenceConversions.wooLiveItems[key] );
						} );
					}
				}
			};
			request.onerror = function() {
				// Connection error
				console.log( 'could not connect' )
			};
			request.send( 'action=kadence_conversions_get_updated_cart&nonce=' + kadenceConversionsConfig.ajax_nonce );
		},
		// Initiate sticky when the DOM loads.
		init: function() {
			window.kadenceConversions.initConversions();
			window.kadenceConversions.initCartWatch();
		}
	}
	if ( 'loading' === document.readyState ) {
		// The DOM has not yet been loaded.
		document.addEventListener( 'DOMContentLoaded', window.kadenceConversions.init );
	} else {
		// The DOM has already been loaded.
		window.kadenceConversions.init();
	}
})();