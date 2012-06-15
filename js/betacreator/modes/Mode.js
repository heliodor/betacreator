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
goog.provide('bc.Mode');

//goog.require('bc.model.Canvas');

/**
 * @param {bc.model.Canvas} canvas
 * @constructor
 */
bc.Mode = function(canvas) {
	this.canvas = canvas;
}

/**
 * @param {bc.math.Point} point
 */
bc.Mode.prototype.mouseDown = function(point) {
	
}

/**
 * @param {bc.math.Point} point
 */
bc.Mode.prototype.mouseMove = function(point) {
	
}

/**
 * @param {bc.math.Point} point
 */
bc.Mode.prototype.mouseUp = function(point) {
	
}

/**
 * @return {string}
 */
bc.Mode.prototype.getCursor = function() {
	return 'default';
}
