export default function ColorOutput( string ) {
	if ( string && string.startsWith( 'palette' ) ) {
		string = 'var(--global-' + string + ')';
	}
	return string;
}