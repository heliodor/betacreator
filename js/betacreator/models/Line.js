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

goog.provide('bc.model.Line');

goog.require('bc.model.Item');
goog.require('bc.math');
goog.require('bc.array');
goog.require('bc.object');
goog.require('bc.render.DashedLine');
goog.require('bc.uuid');

/**
 * @param {Object=} params
 * @constructor
 * @implements {bc.model.Item}
 */
bc.model.Line = function(params) {
	params = params || {};
	
	this.type = 'line';
	this.id = bc.uuid(params.id);
	this.color = params.color || '#ffff00';
	this.alpha = params.alpha || 1;
	this.lineWidth = params.lineWidth || 3;
	this.controlPoints = params.controlPoints || [];
	this.isDashed = params.isDashed || false;
	this.onLength = params.onLength || 10;
	this.offLength = params.offLength || 10;
	this.curved = params.curved || false;
	
	this.offset = new bc.math.Point(0,0);
	
	/** @type {Array.<bc.math.Point>} */
	this.points = [];
	
	this.updatePoints();
};

/**
* Get points along a curve
* 
* @param {number} sx start x
* @param {number} sy start y
* @param {number} cx Control point x
* @param {number} cy Control point y
* @param {number} x
* @param {number} y
* @param {number} pointDistance
* 
* @return {Array.<bc.math.Point>}
*/
bc.model.Line.prototype.getCurvePoints = function(sx, sy, cx, cy, x, y, pointDistance) {
	/** @type {Array.<bc.math.Point>} */
	var ret = [];
	
	/** @type {number} */
	var segLength = bc.math.Line.curveLength(sx, sy, cx, cy, x, y);
	/** @type {number} */
	var t = 0;
	/** @type {number} */
	var t2 = 0;
	/** @type {Array.<number>} */
	var c;
	
	var remainLength = segLength;
	var fullDashCount = Math.floor(remainLength/pointDistance);
	var ont = pointDistance/segLength;
	
	if (fullDashCount){
		for (var i=0; i<fullDashCount; i++){
			t2 = t + ont;
			c = bc.math.Line.curveSlice(sx, sy, cx, cy, x, y, t, t2);
			ret.push(new bc.math.Point(c[4], c[5]));
			t = t2;
		}
		
		ret.push(new bc.math.Point(x, y));
	}
	
	return ret;
};


/*******************************************************************************
 * 
 * 
 *                         PUBLIC METHODS
 * 
 * 
 ******************************************************************************/

/**
 * Apply the offset to all the control points and return the result
 *
 * @return {Object}
 */
bc.model.Line.prototype.applyOffset = function() {
	// if (this.offset.x == 0 && this.offset.y == 0)
	// 	return;
	
	var cp = [];
	
	bc.array.map(this.controlPoints, function(point) {
		cp.push(new bc.math.Point(point.x + this.offset.x, point.y + this.offset.y));
	});
	
	// this.controlPoints = cp;
	// this.updatePoints();
	this.offset.x = 0;
	this.offset.y = 0;

	return {
		controlPoints: cp
	};
};

/**
 * @param {Object} params
 * @return {Object}
 */
bc.model.Line.parseParams = function(params) {
	params = params || {};
	
	var ret = {
		color:			params['c'],
		alpha:			params['a'],
		lineWidth:		params['lw'],
		isDashed:		params['d'],
		onLength:		params['n'],
		offLength:		params['f']
	};
	
	if (params['cp'] && goog.isArray(params['cp'])) {
		var cp = [];
		bc.array.map(params['cp'], function(point) {
			cp.push(new bc.math.Point(point['x'], point['y']));
		});
		ret.controlPoints = cp;
	}
	
	return ret;
};

/**
 * Set an offset for the stamp
 * @param {bc.math.Point} p
 */
bc.model.Line.prototype.setOffset = function(p) {
	this.offset = p;
};

/**
 * @return {Object}
 */
bc.model.Line.prototype.serializeParams = function() {
	var ret = {
		'c':	this.color,
		'a':	this.alpha,
		'lw':	this.lineWidth,
		'd':	this.isDashed
	};
	
	if (this.isDashed) {
		ret['n'] = this.onLength;
		ret['f'] = this.offLength;
	}
	
	var cp = [];
	bc.array.map(this.controlPoints, function(point) {
		cp.push({
			'x': point.x,
			'y': point.y
		});
	});
	ret['cp'] = cp;
	
	return ret;
};

/**
 * @param {number} x
 * @param {number} y
 * @return {boolean}
 */
bc.model.Line.prototype.hitTest = function(x,y) {
	var p = this.points;
	for(var i = 0, l = p.length - 1; i < l; i++) {
		if(bc.math.distanceFromLineSegment(new bc.math.Point(x,y),p[i],p[i+1]) < 10) {
			return true;
		}
	}
	return false;
};

/**
 * Calculate the bounding box based on the control points and set the 'bb' property.
 */
bc.model.Line.prototype.updateBoundingBox = function() {
	if (this.controlPoints.length == 0) {
		this.bb = null;
		return;
	}
	
	var minX = Number.MAX_VALUE,
		maxX = Number.MIN_VALUE,
		minY = Number.MAX_VALUE,
		maxY = Number.MIN_VALUE;
	
	bc.array.map(this.controlPoints, function(point) {
		minX = Math.min(minX, point.x);
		maxX = Math.max(maxX, point.x);
		minY = Math.min(minY, point.y);
		maxY = Math.max(maxY, point.y);
	});
	
	this.bb = new bc.math.Box(minX, minY, maxX - minX, maxY - minY);
};

/**
 * Get all the points for the line (used in hit test) and set the 'points' 
 * property
 */
bc.model.Line.prototype.updatePoints = function() {
	var me = this;
	
	/** @type {Array.<bc.math.Point>} */
	var ret = [];
	
	var pointDistance = 10;
	
	if (this.curved) {
		var cpLength = this.controlPoints.length;
		bc.array.map(this.controlPoints, function(cp, i) {
			// for first point, just move to it
			if (i == 0) {
				ret.push(new bc.math.Point(cp.x, cp.y));
			}
			else {
				var prevCP = me.controlPoints[i - 1];
				
				// for second point just add a point at half way between it and 
				// the first
				if (i == 1)
					ret.push(new bc.math.Point((cp.x + prevCP.x)/2, (cp.y + prevCP.y)/2));
				// for every other points, get the points for the curve from the 
				// previous half-way pointto the current half-way point
				else
					ret = ret.concat(me.getCurvePoints(
							ret[ret.length-1].x,
							ret[ret.length-1].y,
							prevCP.x,
							prevCP.y,
							(cp.x + prevCP.x)/2,
							(cp.y + prevCP.y)/2,
							pointDistance
						));
				
				// if it's the last point, add it
				if (i == cpLength - 1)
					ret.push(new bc.math.Point(cp.x, cp.y));
			}
		});
	}
	else {
		bc.array.map(this.controlPoints, function(cp, i) {
			ret.push(new bc.math.Point(cp.x, cp.y));
		});
	}
	
	this.points = ret;
};
