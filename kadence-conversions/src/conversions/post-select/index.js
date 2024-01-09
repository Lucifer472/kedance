import PropTypes from 'prop-types';
import PostSelectModal from './containers/post-select-modal';

const {
	Component,
	createPortal,
} = wp.element;

const { Button } = wp.components;

class PostSelectButton extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			modalVisible: false,
		};
	}
	render() {
		const {
			children,
			onSelect,
			value,
		} = this.props;

		const { modalVisible } = this.state;

		const onClose = () => this.setState( { modalVisible: false } );

		const btnProps = {
			...this.props.btnProps,
			onClick: () => this.setState( { modalVisible: true } ),
		};

		return ( <div className="post-select">
			<Button { ...btnProps }>{ children }</Button>
			{ modalVisible && (
				createPortal(
					<PostSelectModal
						value={ value }
						{ ...this.props }
						onSelect={ posts => {
							onSelect( posts );
							onClose();
						} }
						onClose={ onClose }
					/>,
					document.getElementById( 'wpbody' )
				)
			) }
		</div> )
	}
}

PostSelectButton.defaultProps = {
	value: [],
	btnProps: {},
}

PostSelectButton.propTypes = {
	onSelect: PropTypes.func.isRequired,
	value: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.number,
		PropTypes.array,
	] ),
	btnProps: PropTypes.object,
}

export default PostSelectButton;
