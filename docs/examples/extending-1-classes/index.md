---
layout: tutorial_v2
title: Extending Maplair, Class Theory
---

## Extending Maplair

Maplair has literally hundreds of plugins. These expand the capabilities of Maplair: sometimes in a generic way, sometimes in a very use-case-specific way. Part of the reason there are so many plugins is that Maplair is easy to extend. This tutorial will cover the most commonly used ways of doing so.

Please note that this tutorial assumes you have a good grasp of [JavaScript](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting), and especially [JavaScript classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes).

## Maplair architecture

Let's have a look at a simplified UML Class diagram for Maplair. There are more than 60 classes, so the diagram is a bit big. Luckily we can make a zoomable image with an `ImageOverlay`:

{% include frame.html url="class-diagram.html" %}

From a technical point of view, Maplair can be extended in different ways:

* The most common: creating a new subclass of `Layer`, `Handler` or `Control`.
	* Layers move when the map is moved/zoomed
	* Handlers are invisible and interpret browser events
	* Controls are fixed interface elements
* Including more, or replacing functionality (methods, fields) of an existing class with `Class.include()`
* Using `Class.addInitHook()` to run additional constructor code of existing classes.

## Extending Maplair Classes

JavaScript is a bit of a weird language. It's not really object-oriented in the traditional sense, but handles inheritance using a [prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain). Only at a later point during its lifetime [syntax was added](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) to allow more 'class-like' inheritance.

Almost all classes in Maplair extend from a base class called `Class`, as well as most classes you'll find in plugins. It adds a few utilities to standard JavaScript classes: default options, mixins and constructor hooks.

### Creating a subclass

`Class`, or other built-in Maplair classes derived from it (such as `Layer`, `Handler`, `Control`, etc.), can be extended in the same manner as any other JavaScript class, by using the [`extends`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends) keyword and a standard [`constructor()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor):

```js
class RotateMarker extends Marker {
	constructor(latlng, rotation, options) {
		super(latlng, options);
		this._rotation = rotation;
	}
}
```

(Leaflet 1 used a special `initialize()` method instead; with Maplair, use `constructor()`.)

### Naming conventions

When creating Maplair classes, adhere to these conventions:

* Class names should be in `UpperCamelCase`.
* Method and property names should be in `lowerCamelCase`.
* Private properties and methods start with an underscore (`_`). This indicates they're internal and shouldn't be used directly.

### Setting default options

All classes that extend from `Class` can be provided with default options by calling `setDefaultOptions()` in a [static initialization block](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Static_initialization_blocks):

```js
class MyBox extends Class {
	static {
		this.setDefaultOptions({
			width: 1,
			height: 1
		});
	}

	constructor(name, options) {
		super();
		Util.setOptions(this, options);
		this.name = name;
	}
}

const instance = new MyBox('Red', {width: 10});

console.log(instance.name); // Outputs "Red"
console.log(instance.options.width); // Outputs "10"
console.log(instance.options.height); // Outputs "1", the default
```

These options are inherited from parent classes, and merged automatically:

```js
class MyCube extends MyBox {
	static {
		this.setDefaultOptions({
			depth: 1
		});
	}
}

const cube = new MyCube('Blue');

console.log(cube.options.width); // Outputs "1", parent class default
console.log(cube.options.height); // Outputs "1", parent class default
console.log(cube.options.depth); // Outputs "1"
```

### `Class.include()`

Maplair provides `.include()` to add or override methods in existing classes. This is useful for monkey-patching or adding functionality to base classes:

```js
class MyLayer extends Layer {
	constructor(options) {
		super();
		Util.setOptions(this, options);
		this._count = 0;
	}

	incrementCount() {
		return ++this._count;
	}
}

// Add new methods or override existing ones
MyLayer.include({
	_getCountStep() {
		return 2;
	},

	incrementCount() {
		return this._count += this._getCountStep();
	}
});

const instance = new MyLayer();
console.log(instance.incrementCount()); // Outputs "2"
```

Note: Use `.include()` sparingly, as modifying base classes can have unexpected side effects. As a general rule of thumb, try to extend existing classes instead.

### Initialization hooks

Use `addInitHook()` to run additional code at the end of the constructor of a class — typically of an existing class, e.g. to add an editing handler to every `Polyline`. This is useful for setup that depends on state from the class being modified (e.g. using `.include()`).

The hooks of a class run when its constructor calls `this.callInitHooks()`, which all Maplair classes do at the end of their constructor. Hooks of parent classes run first, and each hook runs once per object. To support hooks on your own classes, call `this.callInitHooks()` at the end of their constructor:

```js
class MyBox extends Class {
	static {
		this.setDefaultOptions({
			width: 1,
			height: 1
		});
	}

	constructor(options) {
		super();
		Util.setOptions(this, options);
		this.callInitHooks();
	}
}

MyBox.addInitHook(function() {
	this._area = this.options.width * this.options.height;
});

MyBox.include({
	getArea() {
		return this._area;
	}
});

const box = new MyBox({width: 5, height: 10});
console.log(box.getArea()); // Outputs "50"
```

`addInitHook()` can also call a named method with arguments:

```js
class MyCube extends MyBox {
	static {
		this.setDefaultOptions({
			depth: 1
		});
	}

	_calculateVolume(multiplier/*, arg2, arg3. etc. */) {
		this._volume = this.options.width * this.options.height * this.options.depth * multiplier;
	}
}
// MyCube has no constructor of its own, so the MyBox constructor runs its hooks too

MyCube.addInitHook('_calculateVolume', 1/*, arg2, arg3. etc. */);

const cube = new MyCube({width: 2, height: 3, depth: 4});
console.log(cube._volume); // Outputs "24"
```
