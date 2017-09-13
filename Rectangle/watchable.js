let utils = require('./utils')


let objectMap = new Map();

function Watchable(object, optionalDefaultListener, optionalListOfFieldsToListen) {
	// optionalDefaultListener will be added as the first listener - TO.DO
	if (isWatchable(object)) {
		//if optionalDefaultListener, optionalListOfFieldsToListen are given,
		// attach them on the watchable TO.DO
		return object;
	}
	if (objectMap.has(object)) return objectMap.get(object);

	let reactiveObj;
	let closureFields;

	let blockDespatch = false;
	let hasPendingDespatch = false;
	let listeners = new Set(); // parents
	let lastKnownKeys = new Set(); // properties
	let watchableChildren = new Map();
	let isActive = true;

	let nudgeWatcher = function nudgeWatcher() {
		if (blockDespatch) {
			hasPendingDespatch = true;
			return;
		}
		adaptStructChanges(reactiveObj, closureFields);
		let summary = []; // list of keys changed TO.DO
		listeners.forEach(listener => listener(summary))
	}

	let onNotify = function onNotify(summary) {
		// do something when a nudge is received from a child watchable
		nudgeWatcher();
	}

	let destroy = function destroy() {
		watchableChildren.forEach((watchable, key) => {
			watchable._detachListener(onNotify);
		})
		isActive = false;
	}


	let activateIfDead = function activateIfDead() {
		if (isActive || listeners.size == 0) return;
		watchableChildren.forEach((watchable, key) => {
			watchable._attachListener(onNotify)
		})
		isActive = true;
	}

	closureFields = {
		object,
		set blockDespatch(val) { blockDespatch = val },
		get blockDespatch() { return blockDespatch; },
		// set isActive(val) { isActive = val; },
		get isActive() { return isActive; },
		get hasPendingDespatch() { return hasPendingDespatch; },
		listeners,
		lastKnownKeys,
		watchableChildren,
		nudgeWatcher,
		onNotify,
		activateIfDead,
		destroy,
	}

	reactiveObj = generateReactiveStub(closureFields);
	let nonEnumerableProps = new Set(Object.getOwnPropertyNames(object));

	function onEach(key) {
		let propDescriptor = Object.getOwnPropertyDescriptor(object, key)
		if (propDescriptor.get || propDescriptor.set) {
			if (propDescriptor.configurable) {
				propDescriptor.get = propDescriptor.get.bind(reactiveObj);
				propDescriptor.set = propDescriptor.set.bind(reactiveObj);
				Object.defineProperty(object, key, propDescriptor)
			}
			else throw new TypeError(`Could not modify PropertyDescriptor. \n 
				PropertyDescriptor for \`baseObject.${key}\` contains Getter and/or Setter and is non configurable too. 
			\`WatchIt\` has to modify the getter/setter functions to make things work. `)
		}
		else if (!propDescriptor.writable) return;
		animateField(reactiveObj, key, object[key], closureFields)
		lastKnownKeys.add(key);
	}

	for (var key in object) {
		nonEnumerableProps.delete(key);
		onEach(key);
	}

	nonEnumerableProps.forEach(onEach)
	// ((key) => {
	// 	object.ge
	// 	onEach(key);
	// });

	objectMap.set(object, reactiveObj);
	return reactiveObj;
}

function adaptStructChanges(currentObj, closureFields) {

	let { lastKnownKeys, watchableChildren } = closureFields;
	let currentKeys = new Set();

	for (let key in currentObj) {
		currentKeys.add(key);
	}

	// first detatch removed items
	lastKnownKeys.forEach(key => {
		if (currentKeys.has(key)) { // if both set have them, its not a interesting key.
			currentKeys.delete(key);
		} else {
			lastKnownKeys.delete(key);
			if (watchableChildren.has(key)) {
				watchableChildren.get(key)._detachListener(closureFields.onNotify);
				watchableChildren.delete(key)
			}
		}
	})
	// attach new properties. everything left in currentKeys is new
	currentKeys.forEach(key => {
		animateField(currentObj, key, currentObj[key], closureFields)
	})
}

function animateField(parent, fieldName, value, closureFields) {

	let descriptor = {
		enumerable: true,
		configurable: true
	}

	if (Object.hasOwnProperty(parent, fieldName)) delete parent[fieldName]
	closureFields.object[fieldName] = value;

	if (utils.isFunction(value)) {
		closureFields.object[fieldName] = setApplyTrap(value, parent, closureFields)
	}
	else if (typeof value == "object") {
		value = Watchable(value); // Watchable will return same object if the baseobject is already a watchable
		value._attachListener(closureFields.onNotify)
		closureFields.watchableChildren.set(fieldName, value);
		closureFields.object[fieldName] = value
	}

	// else TO.DO
	descriptor.set = (val) => {
		closureFields.activateIfDead();
		closureFields.object[fieldName] = val;

		if (utils.isFunction(value)) {
			closureFields.object[fieldName] = setApplyTrap(value, parent, closureFields)
		}
		closureFields.nudgeWatcher();
	}
	descriptor.get = () => {
		closureFields.activateIfDead();
		return closureFields.object[fieldName];
	}
	Object.defineProperty(parent, fieldName, descriptor)
}

function setApplyTrap(fn, context, closureFields) {
	// equivalent of `apply` trap
	let boundFn = fn.bind(context);
	return (...args) => {
		if (closureFields.blockDespatch) return boundFn(...args);
		closureFields.blockDespatch = true;
		let result = boundFn(...args);
		closureFields.blockDespatch = false;
		if (closureFields.hasPendingDespatch)
			closureFields.nudgeWatcher();
		return result;
	}
}
function isWatchable(object) {
	return object instanceof Watchable;
}
function generateReactiveStub(closureFields) {
	closureFields.blockDespatch = false;

	let reactiveObj = Object.create(Watchable.prototype);

	Object.defineProperty(reactiveObj, '_attachListener', {
		value: function _attachListener(listener, optionalListOfFieldsToListen) {
			// `optionalListOfFieldsToListen` if given, call listener only if a field in list is updated. TO.DO
			if (utils.isFunction(listener)) {
				closureFields.listeners.add(listener);
				return closureFields.object;
			}
		}
	})


	Object.defineProperty(reactiveObj, '_nudge', {
		value: function _nudge() {
			closureFields.nudgeWatcher();
		}
	})

	Object.defineProperty(reactiveObj, '_detachListener', {
		value: function _detachListener(listener) {
			if (utils.isFunction(listener))
				closureFields.listeners.delete(listener);
			if (closureFields.listeners.size == 0)
				closureFields.destroy();
		}
	})


	// Object.defineProperty(reactiveObj, '_destroy', {
	// 	value: closureFields.destroy
	// })

	return reactiveObj;
}


try {
	window.Rectangle.watchable = Watchable
} catch (e) { module.exports = Watchable }
