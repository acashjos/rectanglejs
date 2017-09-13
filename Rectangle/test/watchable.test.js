var expect = require('chai').expect;

let Watchable = require('../watchable');

describe("Watchable", function () {
	let baseclass = {
		foo: 1,
		invoke: fn => fn(),
		// get drake() { return "ramoray "+this.foo}
	}

	let a = Watchable(baseclass)

	it("Should return a pseudo Object that behaves same as the base class.", () => {
		expect(a).to.be.instanceof(Watchable)
		expect(a.foo).to.equal(baseclass.foo)

		//more tests needed
	})

	it("Should should return same watchable instance when repeatedly called with same baseObject", () => {

		let base = {};
		let watchable1 = Watchable(base);
		let watchable2 = Watchable(base);

		expect(watchable1).equals(watchable2);
	})
});

describe("Watchable object", function () {
	baseclass = {
		foo: 1,
		quak: 2,
		invoke: fn => fn(),
		// get drake() { return "ramoray "+this.foo}
	}
	let a = Watchable(baseclass)

	it("Should return the base class when an eventListener is registered.", () => {
		let cb = () => { }
		z = a._attachListener(cb);
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

		a.invoke(() => { a.foo = 3; a.quak = 8 }) //normally this will call listeners twice.

		expect(listenerCallCounter, "invoking member functions should buffer despatches until it returns").greaterThan(1);
		expect(listenerCallCounter, "invoking member functions should group all despatches until it returns").not.greaterThan(2);

		a._detachListener(cb);
	})

	it("Can have new properties added from member functions and get listeners called in response .", () => {
		let listenerCallCounter = 0;
		let cb = () => listenerCallCounter++;
		a._attachListener(cb)

		let newValue = { baz: 1, qux: 2 };

		a.car = "newCar";
		expect(
			listenerCallCounter,
			"listner not to be called when new property is added to a watchable object"
		).to.equal(0);

		a._nudge();
		expect(listenerCallCounter, "new property in the watchable object should be added during nudge call").to.equal(1)

		a.invoke(() => { a.bar = newValue })
		expect(
			listenerCallCounter,
			"new fields inserted from member functions should trigger listener calls"
		).to.equal(2)
		expect(a.bar, "A child object should be converted to Watchable")
			.to.be.instanceof(Watchable)

		listenerCallCounter = 0;
		a.bar = { baz: 1, qux: 2 };
		expect(listenerCallCounter, "listner to be called on value changes on a newly added field").to.equal(1);
		expect(a.bar, "A child object should be converted to Watchable").to.be.instanceof(Watchable)

		a.bar.baz++;
		expect(listenerCallCounter, "listner to be called on value changes on a child watchable").to.equal(2);

		a._detachListener(cb);
	})



	it("Should handle getters/setters in baseclass", () => {

		baseclass = {
			foo: 1,
			quak: 2,
			invoke: fn => fn(),
			get drake() { this.quake = 3; return "ramoray " + this.foo },
			set drake(value) { this.foo = value; }
		}

		let a = Watchable(baseclass)

		let listenerCallCounter = 0;
		let cb = () => listenerCallCounter++;
		a._attachListener(cb)

		let temp = a.drake;
		expect(listenerCallCounter, "modifying a property in a getter in baseclass should call listener").to.equal(1);
		a.drake = 54;
		expect(listenerCallCounter, "modifying a property in a setter in baseclass should call listener").to.equal(3);
		expect(baseclass.foo, "modifying a property in a setter in baseclass should correctly modify properties in baseclass").to.equal(54);


		let baseClassWithNonConfigurableSetter = {};
		Object.defineProperty(baseClassWithNonConfigurableSetter, 'foo', {
			get: () => 55,
			set: () => { },
			configurable: false,
			enumerable: true
		})

		expect(Watchable.bind(null, baseClassWithNonConfigurableSetter),
			"Should throw type error if base class has non-configurable propertyDescriptor with getters or setters"
		).to.throw(TypeError);
		a._detachListener(cb);
	})


	it("Should handle non-enumerable own properties in baseclass", () => {



		let baseClassWithNonEnumerableProps = {};
		Object.defineProperty(baseClassWithNonEnumerableProps, 'foo', {
			value: 10,
			writable: true,
			configurable: false,
			enumerable: false
		})
		Object.defineProperty(baseClassWithNonEnumerableProps, 'bar', {
			value: 10,
			writable: false,
			configurable: false,
			enumerable: false
		})
		Object.defineProperty(baseClassWithNonEnumerableProps, 'baz', {
			get: () => 55,
			set: () => { },
			configurable: true,
			enumerable: false
		})


		let a = Watchable(baseClassWithNonEnumerableProps)

		let listenerCallCounter = 0;
		let cb = () => listenerCallCounter++;
		a._attachListener(cb)

		a.foo = "new";
		expect(listenerCallCounter,
			"Should call listener when setting a value on non-enumerable field"
		).to.equal(1);


		a.bar = "new";
		expect(listenerCallCounter,
			"Should not call listener when setting a value on non-enumerable non-editable field"
		).to.equal(1);


		a.baz = "new";
		expect(listenerCallCounter,
			"Should call listener when setting a value through setter on non-enumerable field"
		).to.equal(2);


		let temp=a.baz;
		expect(listenerCallCounter,
			"Should call listener when getting a value through getter on non-enumerable field"
		).to.equal(2);


		baseClassWithNonEnumerableProps = {}
		Object.defineProperty(baseClassWithNonEnumerableProps, 'quaz', {
			get: () => 55,
			set: () => { },
			configurable: false,
			enumerable: false
		})


		expect(Watchable.bind(null, baseClassWithNonEnumerableProps),
			"Should throw type error if base class has non-configurable propertyDescriptor with getters or setters"
		).to.throw(TypeError);
		a._detachListener(cb);
	})


})


// #1  Handle non-enumerable immediate-child properties too.