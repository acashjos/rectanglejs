var expect = require('chai').expect;

let Watchable = require('../watchable');

describe("Watchable", function() {
	baseclass= {
		foo:1,
		invoke: fn => fn(),
		// get drake() { return "ramoray "+this.foo}
	}
	
	a=Watchable(baseclass)
	
	it("Should return a pseudo Object that behaves same as the base class.", () => {
		expect(a).to.be.instanceof(Watchable)
		expect(a.foo).to.equal(baseclass.foo)
	})
	it("Should return the base class when an eventListener is registered.", () => {
		let cb = ()=>{}
		z=a._attachListener(cb);
		expect(z).to.equal(baseclass);
		a._detachListener(cb);
	})


	it("Should update values on set operation and call listeners.", () => {
		let listenerCallCounter = 0;
		let cb = () => listenerCallCounter++;
		a._attachListener(cb)
		let newValue = 35;
		a.foo = newValue;

		
		expect(listenerCallCounter, "listner to be called on value changes").to.equal(1);
		expect(a.foo, "get operation a.foo should return the newly inserted value").to.equal(newValue)
		expect(a.foo, "get operation basecalss.foo should return newly inserted value").to.equal(newValue)
		
		a.invoke(()=>{a.foo = 3; })

		expect(listenerCallCounter, "invoking member functions should buffer despatches until it returns").to.greaterThan(1);
		expect(listenerCallCounter, "invoking member functions should group all despatches until it returns").to.not.greaterThan(2);
		

		a.invoke(()=>{a.bar="newVal"})
		expect(a.bar, "new fields can be inserted from member functions.").to.equal('newVal')

		listenerCallCounter = 0;
		a.bar = {baz: 1, qux: 2};
		expect(listenerCallCounter, "listner to be called on value changes on a newly added field").to.equal(1);
		expect(a.bar, "A child object should be converted to Watchable").to.be.instanceof(Watchable)
		
		a.bar.baz++;
		expect(listenerCallCounter, "listner to be called on value changes on a child watchable").to.equal(2);

		a._detachListener(cb);
	})


})


#1 a map of objects and watchables should be kept to avoid duplicate watchables on same base object
#2 Consider the case when base class includes getters and setters