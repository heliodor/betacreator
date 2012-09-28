/**
 *  Copyright 2012 Alma Madsen
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
goog.provide('bc.mode.Select');

goog.require('bc.Mode');
goog.require('goog.math.Coordinate');

/**
 * @param {bc.model.Canvas} canvas
 * @param {number} id
 *
 * @constructor
 * @extends {bc.Mode}
 */
bc.mode.Select = function(canvas, id) {
	bc.Mode.call(this, canvas, id);

	/** @type {goog.math.Coordinate|null} */
	this.mouseDownPoint = null;
};
goog.inherits(bc.mode.Select, bc.Mode);

/**
 * Called each time the mode is deactivated
 */
bc.mode.Select.prototype.onDeactivate = function() {
	this.mouseDownPoint = null;
};

/**
 * @inheritDoc
 */
bc.mode.Select.prototype.mouseDown = function(point) {
	// just in case
	if (this.mouseDownPoint)
		this.mouseUp(point);

	this.mouseDownPoint = point;

	for (var i = 0, l = this.canvas.items.length; i < l; i++) {
		if (this.canvas.items[i].hitTest(point.x, point.y)) {
			this.canvas.selectItem(this.canvas.items[i]);
			return;
		}
	}

	this.canvas.deselectAll();
};

/**
 * @inheritDoc
 */
bc.mode.Select.prototype.mouseMove = function(point) {
	var me = this;
	if (this.mouseDownPoint) {
		goog.array.forEach(this.canvas.getSelectedItems(), function(item, i) {
			item.setOffset(new goog.math.Coordinate(point.x - me.mouseDownPoint.x, point.y - me.mouseDownPoint.y));
		});
		bc.Client.pubsub.publish(bc.Client.pubsubTopics.CANVAS_RENDER);
	}
};

/**
 * @inheritDoc
 */
bc.mode.Select.prototype.mouseUp = function(point) {
	var me = this;
	if (this.mouseDownPoint) {
		goog.array.forEach(this.canvas.getSelectedItems(), function(item, i) {
			var changed = item.applyOffset(new goog.math.Coordinate(point.x - me.mouseDownPoint.x, point.y - me.mouseDownPoint.y));
			changed.id = item.id;
			me.canvas.runAction(new bc.model.Action(bc.model.ActionType.EditItem, changed));
		});
	}

	this.mouseDownPoint = null;
};


