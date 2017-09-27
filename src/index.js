let utils = require('./utils')
let WatchO = require('watcho')




key ideas.
**********
- ability to configure h function. hyperscript compatible.
- middlewares that take {props,lifecycleEventHandlers} as params and returns modified (or not) props. it can call lifecycleEventHandlers to make decisions on props modification








// window.Rectangle = window.Rectangle || {}
let proptor = {}
proptor.createComponent = function CreateComponent(
	template, proptypes, controller, lifecycleEvents) 
{
	({ template, proptypes, controller, lifecycleEvents } 
		= verifyParams(this, arguments))

	

	function initialize(props,ctx) {
		let updateState = (state) => {
			// do something
			this.setState(state)
		}

		const context = {};
		controller.bind(context)(context);
	}

	return generateClass(initialize)
}

function generateClass (initialize) {

	return class RectangleComponent extends React.Component{
		constructor(props){
			super(props);
			initialize.bind(this)()
		}
	
		render() {
			return <h1>Hello, {this.props.name}</h1>;
		  }
	
	}
}

function expandProptypes(proptypes) {
	return {};
}

function sanitizeLifecycleEvts(lyfEvts) {
	return {};
}



function verifyParams(_this, args) {
	if (_this.constructor.name == "CreateComponent")
		throw new TypeError("Rectangle.createComponent is a factory function. It should not be called with `new`");

	if (args.length < 2)
		throw new TypeError("Rectangle.createComponent Expects atleast two parameters, 1: template, 2: controller");
	[template, proptypes, controller, lifecycleEvents] = args;

	if (args.length < 4 && utils.isFunction(proptypes)) {
		controller = proptypes;
		delete proptypes;
	} else {

	}

	if (!utils.isFunction(controller)) {
		throw new TypeError(
			"Rectangle.createComponent expects a controller `Function` as 2nd parameter ( 3rd parameter if proptypes are included ). Got " 
			+ (typeof controller))
	}

	proptypes = expandProptypes(proptypes);
	lifecycleEvents = sanitizeLifecycleEvts(lifecycleEvents)
	// if (!expandedProps) {
	// 	throw new TypeError("expected proptypes (2nd param) to be an `Array`. Got " + (typeof proptypes))
	// }


	return {
		template, proptypes, controller, lifecycleEvents
	};
}

proptor.UI = preact;

