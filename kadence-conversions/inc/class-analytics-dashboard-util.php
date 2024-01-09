<?php
/**
 * Class Kadence_Conversions\Post_Select_Controller
 *
 * @package Kadence Conversions
 */

namespace Kadence_Conversions;

use WP_Error;
/**
 * Class Analytics_Dashboard_Util
 */
class Analytics_Dashboard_Util {

	const P_24_HOURS = '24-hours';
	const P_WEEK = 'week';
	const P_30_DAYS = 'month';
	const P_90_DAYS = 'quarter';

	private static $_query_cache = array();

	/**
	 * Record an occurrence of an event.
	 *
	 * @param array $data for the event.
	 *
	 * @return bool
	 */
	public static function record_event( $data ) {
		$type      = $data['event'];
		$post_id   = $data['post_id'];
		$day_time  = wp_date( 'Y-m-d', time() );

		global $wpdb;
		$r = $wpdb->query( $wpdb->prepare(
			"INSERT INTO {$wpdb->base_prefix}kadence_conversions_events (`event_type`,`event_post`,`event_time`) VALUES (%s, %d, %s) ON DUPLICATE KEY UPDATE `event_count` = `event_count` + 1",
			$type, $post_id, $day_time
		) );

		return false !== $r;
	}

	/**
	 * Consolidate events.
	 *
	 * We initially track events daily for 3 months, and then consolidate the events into a single month entry.
	 */
	public static function consolidate_events() {

		// We want to ensure we can show the past 30 days of events.

		$now = time(); // 2018-10-05 6:30:00
		$max = $now - 90 * DAY_IN_SECONDS; // 2018-10-03 6:30:00

		$consolidate_before = wp_date( 'Y-m-d 23:59:59', $max ); // 2018-10-03 23:59:59

		global $wpdb;

		$r = $wpdb->query( $wpdb->prepare(
			"INSERT INTO {$wpdb->base_prefix}kadence_conversions_events ( `event_type`, `event_time`, `event_count`, `event_consolidated`)
SELECT 
  `event_type`, 
  str_to_date(concat(year(`event_time`), '-', month(`event_time`), '-', day(`event_time`),'-'), '%%Y-%%m-%%d') as `event_time`, 
  sum(`event_count`) as `event_count`, 
  1 as `event_consolidated` 
FROM {$wpdb->base_prefix}kadence_conversions_events 
WHERE 
  `event_consolidated` = 0 AND 
  `event_time` < %s 
GROUP BY `event_type`, year(`event_time`), month(`event_time`), day(`event_time`)
ON DUPLICATE KEY UPDATE `event_type` = `event_type`",
			$consolidate_before
		) );

		if ( false !== $r ) {
			$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->base_prefix}kadence_conversions_events WHERE `event_consolidated` = 0 AND `event_time` < %s", $consolidate_before ) );
		}
	}

	/**
	 * Count events.
	 *
	 * @param array|string       $slug_or_slugs
	 * @param array|string|false $period
	 *
	 * @return array|int[]|WP_Error
	 */
	public static function count_events( $slug_or_slugs, $conversion = false, $period = false ) {

		if ( false === $period ) {
			$period = array(
				'start' => wp_date( 'Y-m-d', time() - 2 * MONTH_IN_SECONDS ),
				'end'   => wp_date( 'Y-m-d H:i:s', time() ),
			);
		}
		$slugs = (array) $slug_or_slugs;

		if ( is_wp_error( $range = self::_get_range( $period ) ) ) {
			return $range;
		}

		list( $start, $end ) = $range;

		$prepare = array(
			wp_date( 'Y-m-d H:i:s', $start ),
			wp_date( 'Y-m-d H:i:s', $end ),
		);
		$slug_where = implode( ', ', array_fill( 0, count( $slugs ), '%s' ) );
		$prepare    = array_merge( $prepare, $slugs );
		global $wpdb;
		if ( $conversion ) {
			$r = $wpdb->get_results( $wpdb->prepare(
				"SELECT sum(`event_count`) as `c`, `event_type` as `s` FROM {$wpdb->base_prefix}kadence_conversions_events WHERE `event_time` BETWEEN %s AND %s AND `event_type` IN ({$slug_where}) AND `event_post` IN ({$conversion}) GROUP BY `event_type` ORDER BY `event_time` DESC",
				$prepare
			) );
		} else {
			$r = $wpdb->get_results( $wpdb->prepare(
				"SELECT sum(`event_count`) as `c`, `event_type` as `s` FROM {$wpdb->base_prefix}kadence_conversions_events WHERE `event_time` BETWEEN %s AND %s AND `event_type` IN ({$slug_where}) GROUP BY `event_type` ORDER BY `event_time` DESC",
				$prepare
			) );
		}
		if ( false === $r ) {
			return new WP_Error( 'kadence-dashboard-query-count-events-db-error', __( 'Error when querying the database for counting events.', 'kadence-conversions' ) );
		}

		$events = array();

		foreach ( $r as $row ) {
			$events[ $row->s ] = (int) $row->c;
		}

		foreach ( $slugs as $slug ) {
			if ( ! isset( $events[ $slug ] ) ) {
				$events[ $slug ] = 0;
			}
		}

		return $events;
	}

	/**
	 * Retrieve events.
	 *
	 * @param array|string       $slug_or_slugs
	 * @param array|string|false $period
	 *
	 * @return array|int[]|WP_Error
	 */
	public static function query_events( $slug_or_slugs, $conversion = false, $period = false ) {

		if ( false === $period ) {
			$period = array(
				'start' => wp_date( 'Y-m-d 00:00:00', time() - 2 * MONTH_IN_SECONDS ),
				'end'   => wp_date( 'Y-m-d H:i:s', time() ),
			);
		}

		$slugs = (array) $slug_or_slugs;

		if ( is_wp_error( $range = self::_get_range( $period ) ) ) {
			return $range;
		}

		list( $start, $end ) = $range;
		$prepare = array(
			wp_date( 'Y-m-d 00:00:00', $start ),
			wp_date( 'Y-m-d H:i:s', $end ),
		);

		$slug_where = implode( ', ', array_fill( 0, count( $slugs ), '%s' ) );
		$prepare    = array_merge( $prepare, $slugs );

		global $wpdb;
		if ( $conversion ) {
			$r = $wpdb->get_results( $wpdb->prepare(
				"SELECT `event_time` as `t`, `event_count` as `c`, `event_type` as `s` FROM {$wpdb->base_prefix}kadence_conversions_events WHERE `event_time` BETWEEN %s AND %s AND `event_type` IN ({$slug_where}) AND `event_post` IN ({$conversion}) ORDER BY `event_time` DESC",
				$prepare
			) );
		} else {
			$r = $wpdb->get_results( $wpdb->prepare(
				"SELECT `event_time` as `t`, `event_count` as `c`, `event_type` as `s` FROM {$wpdb->base_prefix}kadence_conversions_events WHERE `event_time` BETWEEN %s AND %s AND `event_type` IN ({$slug_where}) ORDER BY `event_time` DESC",
				$prepare
			) );
		}

		if ( false === $r ) {
			return new WP_Error( 'kadence-dashboard-query-events-db-error', __( 'Error when querying the database for events.', 'kadence-conversions' ) );
		}

		if ( self::P_24_HOURS === $period ) {
			$format    = 'Y-m-d H:00:00';
			$increment = '+1 hour';
		} else {
			$format    = 'Y-m-d';
			$increment = '+1 day';
		}

		$events = array_combine( $slugs, array_pad( array(), count( $slugs ), array() ) );

		foreach ( $r as $row ) {
			$key = date( $format, strtotime( $row->t ) );

			if ( isset( $events[ $row->s ][ $key ] ) ) {
				$events[ $row->s ][ $key ] += $row->c; // Handle unconsolidated rows.
			} else {
				$events[ $row->s ][ $key ] = (int) $row->c;
			}
		}

		$retval = array();

		foreach ( $events as $slug => $slug_events ) {
			$slug_events = self::fill_gaps( $slug_events, $start, $end, $format, $increment );

			foreach ( $slug_events as $time => $count ) {
				$retval[ $slug ][] = array(
					'time'  => $time,
					'count' => $count,
				);
			}
		}

		return $retval;
	}

	/**
	 * Retrieve the total number of events.
	 *
	 * @param array|string|false $period
	 *
	 * @return int|WP_Error
	 */
	public static function total_events( $period = false ) {

		if ( false === $period ) {
			$period = array(
				'start' => wp_date( 'Y-m-d', time() - 2 * MONTH_IN_SECONDS ),
				'end'   => wp_date( 'Y-m-d', time() ),
			);
		}

		if ( is_wp_error( $range = self::_get_range( $period ) ) ) {
			return $range;
		}

		list( $start, $end ) = $range;

		$prepare = array(
			wp_date( 'Y-m-d H:i:s', $start ),
			wp_date( 'Y-m-d H:i:s', $end ),
		);

		global $wpdb;
		$count = $wpdb->get_var( $wpdb->prepare(
			"SELECT sum(`event_count`) as `c` FROM {$wpdb->base_prefix}kadence_conversions_events WHERE `event_time` BETWEEN %s AND %s",
			$prepare
		) );

		if ( false === $count ) {
			return new WP_Error( 'kadence-dashboard-total-events-db-error', __( 'Error when querying the database for total events.', 'kadence-conversions' ) );
		}

		return (int) $count;
	}

	/**
	 * Fill the gaps in a range of days
	 *
	 * @param array  $events
	 * @param int    $start
	 * @param int    $end
	 * @param string $format
	 * @param string $increment
	 *
	 * @return array
	 */
	private static function fill_gaps( $events, $start, $end, $format = 'Y-m-d', $increment = '+1 day' ) {

		$now   = date( $format, $start );
		$end_d = date( $format, $end );

		while ( $now < $end_d ) {
			if ( ! isset( $events[ $now ] ) ) {
				$events[ $now ] = 0;
			}

			$now = date( $format, strtotime( "{$now} {$increment}" ) );
		}

		ksort( $events );

		return $events;
	}

	/**
	 * Get the date range for the report query.
	 *
	 * @param string|array $period
	 *
	 * @return int[]|WP_Error
	 */
	public static function _get_range( $period ) {
		if ( is_array( $period ) ) {
			if ( ! isset( $period['start'], $period['end'] ) ) {
				return new WP_Error( 'kadence-dashboard-events-invalid-period', __( 'Invalid Period', 'kadence-conversions' ) );
			}

			if ( false === ( $s = strtotime( $period['start'] ) ) || false === ( $e = strtotime( $period['end'] ) ) ) {
				return new WP_Error( 'kadence-dashboard-events-invalid-period', __( 'Invalid Period', 'kadence-conversions' ) );
			}

			return array( $s, $e );
		}

		switch ( $period ) {
			case self::P_24_HOURS:
				return array(
					( time() - DAY_IN_SECONDS ) - ( ( time() - DAY_IN_SECONDS ) % HOUR_IN_SECONDS ),
					time(),
				);
			case self::P_WEEK:
				return array(
					strtotime( '-7 days', time() ),
					time(),
				);
			case self::P_30_DAYS:
				return array(
					strtotime( '-30 days', time() ),
					time(),
				);
			case self::P_90_DAYS:
				return array(
					strtotime( '-90 days', time() ),
					time(),
				);
		}

		return new WP_Error( 'kadence-dashboard-events-invalid-period', __( 'Invalid Period', 'kadence-conversions' ) );
	}

	/**
	 * Flushes the internal query cache.
	 */
	public static function flush_cache() {
		self::$_query_cache = [];
	}
}
