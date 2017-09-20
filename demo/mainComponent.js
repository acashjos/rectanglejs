
const Main = Rectangle.createComponent(
	window.mainTemplate, // a functional component as template
	['a', 'b', 'c', /*propTypes*/], // also be {a: String, b:Number, c: [String,null,Array], d:{enum:['e1',e2']}, e: Rectangle}
	(context) => { // the controller

		// `this` is the react `lifecycle` object, on which all the lifecycle events are defined.
		// `context` is the state,props combined. It is the only stuff available in template. 
		// All props are Object.assign()'ed in the context. these are mutable and triggeres update when mutated.
		// 

	},
	{ // Lifecycle event handlers.
		// all these fns will be bound to controller context.
		// The idea is that lifecycle events will be isolated from controller functions.
		// However lifecycle event handlers will have access to controller fns but not vice versa.
		// This is by no means a requirement. YOu can still define lifecycle event handlers inside the controller. But I think this will be better.
		componentDidMount: (props) => {
			// did mount logic.
		}
	}
)



// Second syntax

const Main2 = Rectangle.componentBuilder()
.template(window.mainTemplate)
.propTypes(['a','b','c'])
.controller( context => {
	// do stuff
})
.onComponentDidMount( props => {
	//handler
})
.build();