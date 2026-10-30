import { setOptions } from "../core/Util.js";
import { Point } from "../geometry/Point.js";
import { getPointers } from "./DomEvent.PointerEvents.js";
import { off, on } from "./DomEvent.js";
import { disableImageDrag, enableImageDrag, getPosition, getScale, getSizedParentNode, setPosition } from "./DomUtil.js";
import { Evented } from "../core/Events.js";
// src/dom/Draggable.js
/** @import {MaplairEvent, DragEndEvent} from '../core/Events.js' */
/**
* Options of `Draggable`.
* @typedef {object} DraggableOptions
* @property {number} [clickTolerance=3] The max number of pixels a user can shift the
* pointer during a click for it to be considered a valid click (as opposed to a
* pointer drag).
*/
/**
* The event object of `dragstart`, `predrag` and `drag` of `Draggable`.
* @typedef {object} DraggableEvent
* @property {PointerEvent} originalEvent The DOM event of the pointer which drags.
* @extends MaplairEvent
*/
/**
* A class for making DOM elements draggable.
* Used internally for map and marker dragging. Works on any DOM element.
*
* @example
* ```js
* const draggable = new Draggable(elementToDrag);
* draggable.enable();
* ```
*
* @fires down {MaplairEvent} Fired when a drag is about to start.
* @fires dragstart {DraggableEvent} Fired when a drag starts.
* @fires predrag {DraggableEvent} Fired continuously during dragging *before* each
* corresponding update of the element's position.
* @fires drag {DraggableEvent} Fired continuously during dragging.
* @fires dragend {DragEndEvent} Fired when the drag ends (with `noInertia: true` if
* the drag was finished without inertia, e.g. by disabling the draggable).
*/
var Draggable = class Draggable extends Evented {
	static defaultOptions = { clickTolerance: 3 };
	/**
	* Creates a `Draggable` object for moving `element` when you start dragging the
	* `dragStartTarget` element (equals `element` itself by default).
	* @param {HTMLElement} element
	* @param {HTMLElement} [dragStartTarget]
	* @param {DraggableOptions} [options]
	*/
	constructor(element, dragStartTarget, options) {
		if (typeof options === "boolean") throw new Error("Draggable: the preventOutline argument is removed in Maplair. Pass options as the third argument.");
		super();
		setOptions(this, options);
		this._element = element;
		this._dragStartTarget = dragStartTarget ?? element;
		this.callInitHooks(Draggable);
	}
	/**
	* Enables the dragging ability.
	* @returns {void}
	*/
	enable() {
		if (this._enabled) return;
		on(this._dragStartTarget, "pointerdown", this._onDown, this);
		this._enabled = true;
	}
	/**
	* Disables the dragging ability.
	* @returns {void}
	*/
	disable() {
		if (!this._enabled) return;
		if (Draggable._dragging === this) this.finishDrag(true);
		off(this._dragStartTarget, "pointerdown", this._onDown, this);
		this._enabled = false;
		this._moved = false;
	}
	_onDown(e) {
		this._moved = false;
		if (this._element.classList.contains("maplair-zoom-anim")) return;
		if (getPointers().length !== 1) {
			if (Draggable._dragging === this) this.finishDrag();
			return;
		}
		if (Draggable._dragging || e.shiftKey || e.button !== 0 && e.pointerType !== "touch") return;
		Draggable._dragging = this;
		disableImageDrag();
		if (this._moving) return;
		this.fire("down");
		const sizedParent = getSizedParentNode(this._element);
		this._startPoint = new Point(e.clientX, e.clientY);
		this._startPos = getPosition(this._element);
		this._parentScale = getScale(sizedParent);
		on(this._dragStartTarget, "pointermove", this._onMove, this);
		on(this._dragStartTarget, "pointerup pointercancel lostpointercapture", this._onUp, this);
	}
	_onMove(e) {
		if (getPointers().length > 1) {
			this._moved = true;
			return;
		}
		const offset = new Point(e.clientX, e.clientY)._subtract(this._startPoint);
		const dist = Math.abs(offset.x) + Math.abs(offset.y);
		if (!this._moved && (!dist || dist < this.options.clickTolerance)) return;
		offset.x /= this._parentScale.x;
		offset.y /= this._parentScale.y;
		if (e.cancelable) e.preventDefault();
		if (!this._moved) {
			this.fire("dragstart", { originalEvent: e });
			this._moved = true;
			this._draggingContainer = this._element.closest(".maplair-container") ?? this._element;
			this._draggingContainer.classList.add("maplair-dragging");
			this._lastTarget = e.target;
			this._lastTarget.classList.add("maplair-drag-target");
		}
		this._newPos = this._startPos.add(offset);
		this._moving = true;
		this._lastEvent = e;
		this._updatePosition();
	}
	_updatePosition() {
		const e = { originalEvent: this._lastEvent };
		this.fire("predrag", e);
		const dpr = window.devicePixelRatio;
		this._newPos = this._newPos.multiplyBy(dpr)._round()._divideBy(dpr);
		setPosition(this._element, this._newPos);
		this.fire("drag", e);
	}
	_onUp(e) {
		if (e.type === "lostpointercapture" && e.buttons) return;
		this.finishDrag();
	}
	/**
	* Ends the current drag.
	* @internal
	* @param {boolean} [noInertia]
	* @returns {void}
	*/
	finishDrag(noInertia) {
		this._draggingContainer?.classList.remove("maplair-dragging");
		this._draggingContainer = null;
		if (this._lastTarget) {
			this._lastTarget.classList.remove("maplair-drag-target");
			this._lastTarget = null;
		}
		off(this._dragStartTarget, "pointermove", this._onMove, this);
		off(this._dragStartTarget, "pointerup pointercancel lostpointercapture", this._onUp, this);
		enableImageDrag();
		const fireDragend = this._moved && this._moving;
		this._moving = false;
		Draggable._dragging = false;
		if (fireDragend) this.fire("dragend", {
			noInertia,
			distance: this._newPos.distanceTo(this._startPos)
		});
	}
};
export { Draggable };

//# sourceMappingURL=Draggable.js.map