(function ($, R, _) {
	var rootNS = this;
	var TOO_SMALL = 2;
	var CLOSE_ENOUGH = 8;
	var EPSILON = 10e-6;
	// TODO: make these configurable
	var INIT_ATTRS = {"stroke-width": "1px", "stroke": "#a12fae"};
	var SELECTED_ATTRS = {"stroke-width": "1px", "stroke": "#ff6666"};

	function _makePathStr(ps) {
		return "M " + _.map(ps, function(p) {return p.x + " " + p.y;}).join(" L ");
	}

	function _whereLinesIntersect(a1, a2, b1, b2) {
		var bXdiff = b1.x-b2.x, bYdiff = b1.y-b2.y;
		var aXdiff = a1.x-a2.x, aYdiff = a1.y-a2.y;
		var aDet = a1.x*a2.y - a1.y*a2.x, bDet = b1.x*b2.y - b1.y*b2.x,
			denom = aXdiff*bYdiff - aYdiff*bXdiff;
		var interX = (aDet*bXdiff - aXdiff*bDet)/denom,
			interY = (aDet*bYdiff - aYdiff*bDet)/denom;
		return {x: interX, y: interY};
	}

	// given the endpoints (a1,a2,b1,b2) of two line segments,
	// determine if they intersect
	function _lineSegsIntersect(a1, a2, b1, b2) {
		var i = _whereLinesIntersect(a1, a2, b1, b2);
		// check if it's within the segment
		return i.x > _.min([a1.x,a2.x]) && i.x < _.max([a1.x,a2.x]) &&
			i.y > _.min([a1.y,a2.y]) && i.y < _.max([a1.y,a2.y]) &&
			i.x > _.min([b1.x,b2.x]) && i.x < _.max([b1.x,b2.x]) &&
			i.y > _.min([b1.y,b2.y]) && i.y < _.max([b1.y,b2.y]);
	}

	function _eachPoint(pathStr, func) {
		// copy without the beginning "M " or ending " z", then split on " L "
		var parts = pathStr.substr(2, path.length-4).split(" L ");
		var np = _makePathStr(_.map(parts, function(p){
			var xy = p.split(" ");
			return func({x: xy[0]*1, y: xy[1]*1});
		}));
		return np + " z";

	}



	function _relScale(vd, o) {
		return vd._scale/o.scale;
	}

	function _pointDistSq(a, b) {
		var dx = a.x-b.x, dy = a.y-b.y;
		return dx*dx + dy*dy;
	}

	function _pointNearLineSegment(l, p) {
		// easy case: we're within range of the endpoints
		if (_.any(l, function (lp) {
				return _pointDistSq(lp, p) < CLOSE_ENOUGH*CLOSE_ENOUGH;
			}))
			return true;

		// calculate nearest point on the line (point such that it
		// and the queried point form a line segment orthogonal to
		// the queried line segment)
		var ldx = l[0].x-l[1].x, ldy = l[0].y-l[1].y;
		var lslope = ldx/ldy;

		var dump; // dummy point
		if (isFinite(lslope)) {
			dump = (lslope < EPSILON && lslope > -EPSILON) ?
				{x: p.x + 10, y: p.y} : {x: p.x - 10*lslope, y: p.y+10};
		} else {
			dump = {x: p.x, y: p.y + 10};
		}

		var i = _whereLinesIntersect(l[0], l[1], dump, p);

		// is this point actually within the queried line segment?
		if (i.x < _.min([l[0].x, l[1].x]) ||
			i.x > _.max([l[0].x, l[1].x]) ||
			i.y < _.min([l[0].y, l[1].y]) ||
			i.y > _.max([l[0].y, l[1].y]))
			return false;

		return _pointDistSq(i, p) < CLOSE_ENOUGH*CLOSE_ENOUGH;
	}
	function _createPointsFromPath(path){
		
		var curPairs = path.toString().substring(1, path.length-2).split("L");
			var curPoints = [];
			_.each(curPairs,function(thisPair){
			
				var pair = thisPair.split(",");
			
				curPoints.push({"x":parseFloat(pair[0]),"y":parseFloat(pair[1])});
			});
		return curPoints;	
	}
	function _pointDistFromEllipse(po, eo) {
		// algorithm described in
		// "Quick computation of the distance between a point and an ellipse"
		// by L. Maisonobe <luc@spaceroots.org>
		// September 2003, revised May 2005, minor revision February 2006

		var one_third = 1/3;
		var cube_root = function(n) {
			var cube_root_abs_n = Math.pow(Math.abs(n), one_third);
			return n < 0? -cube_root_abs_n : cube_root_abs_n;
		};

		// ae = major axis
		// ap = minor axis
		// r = distance from center along major axis
		// z = distance from center along minor axis
		var ae, ap, r, z;
		
		if (eo.attr("rx") > eo.attr("ry")) {
			ae = eo.attr("rx");
			ap = eo.attr("ry");
			r = po.x-eo.attr("cx");
			z = po.y-eo.attr("cy");
		} else {
			ae = eo.attr("ry");
			ap = eo.attr("rx");
			r = po.y-eo.attr("cy");
			z = po.x-eo.attr("cx");
		}
		// by symmetry, we don't care about signs
		r = Math.abs(r);
		z = Math.abs(z);

		// f = flattening
		var f = 1 - ap/ae;
		var one_minus_f_sq = Math.pow((1-f), 2);

		var p_dist_center = Math.sqrt(r*r + z*z);

		// near center requires special handling
		if (p_dist_center < EPSILON)
			return ap;

		var cos_zeta = r/p_dist_center,
			sin_zeta = z/p_dist_center,
			t = z/(r + p_dist_center);
		var a = one_minus_f_sq*cos_zeta*cos_zeta + sin_zeta*sin_zeta,
			b = one_minus_f_sq*r*cos_zeta + z*sin_zeta,
			c = one_minus_f_sq*(r*r - ae*ae) + z*z;
		var k = c/(b + Math.sqrt(b*b - a*c));
		var phi = Math.atan2(z - k*sin_zeta, one_minus_f_sq*(r-k*cos_zeta));
		var one_minus_f_sq_times_diff_r_sq_ae_sq_plus_z_sq = c;

		if (Math.abs(k) < EPSILON*p_dist_center) {
			return k;
		}

		var inside = one_minus_f_sq_times_diff_r_sq_ae_sq_plus_z_sq <= 0;

		var calc_tilde_phi = function(z_, tilde_t_, r_, k_) {
			var tilde_t_sq = tilde_t_*tilde_t_;
			return Math.atan2(z_*(1+tilde_t_sq)-2*k_*tilde_t_,
					one_minus_f_sq*(r_*(1+tilde_t_sq) - k_*(1-tilde_t_sq)));
		};

		var d;
		for (var iter = 0; iter < 100; iter++) {
			// paper Java differ on computing a and c. Java works
			a = one_minus_f_sq_times_diff_r_sq_ae_sq_plus_z_sq + one_minus_f_sq*(2*r + k)*k;
			b = -4*k*z/a;
			c = 2*(one_minus_f_sq_times_diff_r_sq_ae_sq_plus_z_sq + (1 + f*(2-f))*k*k)/a;
			d = b;

			// paper and Java differ here too. Again, Java works
			b += t;
			c += t*b;
			d += t*c;

			// find the other real root
			var Q = (3*c - b*b)/9,
				R = (b*(9*c - 2*b*b) - 27*d)/54;
			var D = Q*Q*Q + R*R;
			var tilde_t, tilde_phi;
			if (D >= 0) {
				var sqrt_D = Math.sqrt(D);
				tilde_t = cube_root(R + sqrt_D) + cube_root(R - sqrt_D) - b/3;
				tilde_phi = calc_tilde_phi(z, tilde_t, r, k);
			} else {
				Q = -Q;
				var sqrt_Q = Math.sqrt(Q);
				var theta = Math.acos(R/(Q*sqrt_Q));
				tilde_t = 2*sqrt_Q*Math.cos(theta/3) - b/3;
				tilde_phi = calc_tilde_phi(z, tilde_t, r, k);
				if (tilde_phi*phi < 0) {
					tilde_t = 2*sqrt_Q*Math.cos((theta + 2*Math.PI)/3) - b/3;
					tilde_phi = calc_tilde_phi(z, tilde_t, r, k);
					if (tilde_phi*phi < 0) {
						tilde_t = 2*sqrt_Q*Math.cos((theta + 4*Math.PI)/3) - b/3;
						tilde_phi = calc_tilde_phi(z, tilde_t, r, k);
					}
				}
			}

			var delta_phi = Math.abs(tilde_phi - phi)/2;
			phi = Math.abs(tilde_phi + phi)/2;

			var cos_phi = Math.cos(phi), sin_phi = Math.sin(phi);
			var sin_phi_sq = sin_phi*sin_phi;
			var sqrt_stuff = Math.sqrt(1 - f*(2-f)*sin_phi_sq);
			if (delta_phi < EPSILON) {
				return r*cos_phi + z*sin_phi - ae*sqrt_stuff;
			}

			var delta_r = r - (ae*cos_phi)/sqrt_stuff,
				delta_z = z - (ae*one_minus_f_sq*sin_phi)/sqrt_stuff;
			k = Math.sqrt(delta_r*delta_r + delta_z*delta_z);
			if (inside) k = -k;
			t = delta_z/(delta_r + k);
		}

		// instead of emitting an error, return our best
		return r*cos_phi + z*sin_phi - ae*sqrt_stuff;
	}

	// TODO: object-ify our shapes
	function _isNear(p, o,rs) {

		if (o.type == "rect") {
			var farX = o.attr("x")+o.attr("width"), farY = o.attr("y")+o.attr("height");
			var ul = {x: o.attr("x"), y: o.attr("y")}, ur = {x: farX, y:o.attr("y")},
				ll = {x: o.attr("x"), y: farY}, lr = {x: farX, y:farY};
			
			return _.any([[ul, ur], [ur, lr], [lr, ll], [ll, ul]], function (seg){
				return _pointNearLineSegment(seg, p);
			});
		} else if (o.type == "ellipse") {
			return Math.abs(_pointDistFromEllipse(p, o)) < CLOSE_ENOUGH;
		} else if (o.type == "path") {
			var path = o.attr("path").toString();
			//var path = o.attr("path");
		
		
			var curPairs = (path.substring(1, path.length-2)).split("L");
			
			var curPoints = [];
			_.each(curPairs,function(thisPair){
				
				var pair = thisPair.split(",");
			
				curPoints.push({"x":parseFloat(pair[0]),"y":parseFloat(pair[1])});
			});
			// convert list of points into pairs of points for line segments
			var line_segs = _.map(curPoints, function (po, i){
				return [i?curPoints[i-1] : _.last(curPoints), po];
			});
			return _.any(line_segs, function (l){
				return _pointNearLineSegment(l, p);
			});
		} else {
			throw "no shape, should not be reached";
		}
	}
	
	
	
	// NODE
	var Node = function(args){
			var self =this;
		
			var pos=args.pos;
			var offsets=args.offsets;
			var shape=args.shape;
			self.vd=args.vd;
			self._loc = self.vd._cont;
			self._shape = shape;
			self._pos = {
				x: pos.x,
				y: pos.y
			};
			self._yOff = offsets.offsetTop;
			self._xOff = offsets.offsetLeft;
			self._html = "<div class='axe_node'></div>";
			self.setHTML();
		};
	Node.constructor = Node;
	Node.prototype = {};
	$.extend(Node.prototype, {	
	//overwriting the setHTML function in order to apply scheme to TILE interface
	setHTML:function(){
		var self=this;
		var newId = $(".axe_node:last").attr("id");
		if (newId){
			newId = parseInt(newId.substring(4),10)+1;
			newId="node"+newId;
		}
		else{
			newId="node0";
		}
	
		$(self._html).appendTo((self._loc)).attr("id",newId);
		$("#"+newId).mouseenter(function(){	
	
		 	$(this).removeClass("axe_node");
			$(this).addClass("axe_node_selected");
		    $(this).bind("killNode",function(e){
				var ssp = self._shape.points;
				for (n=0;n<ssp.length;n++) {

					if (((ssp[n].x == self._pos.x) && (ssp[n].y == self._pos.y)) && (confirm("Delete this point?"))){

						ssp.splice(n,1);
						self._shape.cur.attr({
						path:_makePathStr(ssp)+"z"
						});
						self._shape.args=[makePathStr(ssp)+"z"];
						self._shape.points=ssp;

						break;

					}
				}
				$(this).remove();
			});
		}).mouseleave(function(){
$(this).removeClass("axe_node_selected");
			$(this).addClass("axe_node");
			
		}).draggable({
		
			stop: function(e,ui){

				var ssp = self._shape.points;
				for (n=0;n<ssp.length;n++) {
					if ((ssp[n].x == self._pos.x) && (ssp[n].y == self._pos.y)){

						self._pos.x = ssp[n].x = parseFloat(ui.offset.left)-self._xOff;
						self._pos.y = ssp[n].y = parseFloat(ui.offset.top)-self._yOff;

						self._shape.attr({
						path:_makePathStr(ssp)+"z"
						});
						
						self._shape.points=ssp;
						
						break;

					}
				}
				self.vd._updateJSONShape(self._shape.id);

			}
		});
		
		$("#"+newId).css({
			left: parseFloat(self._pos.x),
			//+parseFloat(self._xOff),
			top: parseFloat(self._pos.y)
			//+parseFloat(self._yOff)
		});
	}
	});
	
	
	
	
		function VectorDrawer(args){
			/*
			 * args:
			 * 	overElm:  Element over which to place the canvas
			 *  initScale:  initial scale of canvas
			 */
			
			
			var self = this;
		 var elm = $(args.overElm)
			this._over = {
	             elm: elm,
	             offset: {left:elm.offset().left,top:elm.offset().top}
	           //  origWidth: args.startsize[0]*args.initScale,
	           //  origHeight: args.startsize[1]*args.initScale,
			 	// startWidth:args.startsize[0],
				// startHeight:args.startsize[1]
			};
			
			this._allObjs = {};
			this._activeShapes = {};
			this._buildCanvas(this);
			this._scale=1;
			//call other bound elements that we are done
			this._over.elm.trigger("VDCanvasDONE",[self._canvas.elm]);
			
		}
		VectorDrawer.constructor = VectorDrawer;
		VectorDrawer.prototype = {};
		$.extend(VectorDrawer.prototype, {
		
		_buildCanvas: function() {
			
			var self = this;
			
			
			self._cont = self._cont || $("<div class=\"vd-container\"></div>").appendTo("body");
			self._cont.css({left: self._over.offset.left, top: self._over.offset.top, position: "absolute"});
			
			self._paper = R(self._cont[0],
				self._over.elm.width(), self._over.elm.height());
			self._canvas = {elm:$(self._paper.canvas)};
			self._canvas.off = self._canvas.elm.offset();
			self._over.offset = self._over.elm.offset();
			self._installHandlers();
			
		
		},
		setDrawMode: function(mode){
			this._drawMode = mode;
		},
		importShapes: function(shapes){
			
			_.each(self._allObjs, function (o) {
                /*if (self._paper[o.con]){
				o.cur = self._paper[o.con].apply(self._paper, o.args);
				var rs = _relScale(self, o);
				o.cur.scale(rs, rs, 0, 0);
				o.cur.attr(INIT_ATTRS);
                }
                */
		})
		},
		exportShapes: function(){
			var self=this;
			alert(JSON.stringify(self._allObjs));
		},
		clearShapes: function(){
			
		},
		hideShapes: function(){
			  _.each(self._activeShapes, function (o) {
			 	
                 o.hide();
                 //o = null;
             });
		},
		showShapes: function(){
			  _.each(self._activeShapes, function (o) {
			 	
                 o.show();
                 //o = null;
             });
		},
		scale: function(x) {
             var self = this;
			 _.each(self._activeShapes,function(o){
			 	//scale = self._allObjs[o.id].scale;
			 	
				o.scale(x*self._scale,x*self._scale);
				
			 });
			 self._scale = self._scale*x;
			 $(".axe_node").remove();
			 $(".axe_selected_node").remove();
			 $("#selBB").remove();
			 
             /*if (newScale == null || newScale < 0) {
                 return self._scale;
             }

             self._scale = newScale;

			//NEW: added startWidth and startHeight as modifiers to scaling method
             var newSize = {
                 width: self._over.startWidth*self._scale,
                 height: self._over.startHeight*self._scale
             };
			self._over.elm.css(newSize);
			//NEW: ONLY FOR TILE INTERFACE
			//correcting the <SVG> and <SCROLLER> overlap problem - <SVG> swallows all mouse events
			//	if(newSize.height>$("#scroller").position().top) newSize.height=($("#scroller").position().top-self._over.elm.offset().top-5);

             _.each(self._activeShapes, function (o) {
			
                 o.remove();
				 	
                 //o = null;
             });
		
             self._canvas.elm.remove();
			//get rid of resize/drag box - if there
			$("#selBB").remove();
			
			 //NEW: feeding buildCanvas w/h vars to force resizing
			//setTimeout to make sure that the src is loaded by the time the raphael canvas is made
			setTimeout(function(obj,w,h){
				obj._buildCanvas(w,h);
			},1,this,newSize.width,newSize.height);
             // this._buildCanvas(newSize.width,newSize.height);

             return self._scale;*/
         },	
		_updateJSONShape: function(id){
				var posInfo;
				var type = this._allObjs[id].type;
				var domShape = this._activeShapes[id];
				if (type == 'rect') {
                    var as = domShape.attr(["x", "y", "width", "height"]);
					 posInfo = {"x":as.x,"y":as.y,"width":as.width,"height":as.height};
                } else if (type == 'ellipse') {
                    var as = domShape.attr(["cx", "cy", "rx", "ry"]);
					 posInfo = {"cx":as.cx,"cy":as.cy,"rx":as.rx,"ry":as.ry};
                }	
				else if (type == 'path') {
                    var path = ""+domShape.attr("path");
					
					 pathstr = path.substring(1,path.length-2);
					pathstr=pathstr.replace(/ L /g,"L");
					pathstr=pathstr.replace(/ /g,",");
					pathstr="M"+pathstr+"Z";
					 posInfo = {
					 	"path": pathstr
					 };
                }	
				this._allObjs[id].posInfo = posInfo;		
							 
		},
		_getCanvasXY: function (e) {
			var self = this;
			return {
				x: (e.clientX-self._canvas.off.left)+parseFloat($(document).scrollLeft()),
				y: (e.clientY-self._canvas.off.top)+parseFloat($(document).scrollTop())
			};
		},
		_installHandlers:function(){
			var self=this;
            self._cont.unbind();
			self._cont.mousedown(function(e) {
                 if (1 != e.which) {
				 	// No right click				 	
					return;
				 };
                 e.preventDefault();
                 var cur = self._getCanvasXY(e);
                 if (self._drawMode == 'r') {
				
                     self._start = cur;
                     self._obj = self._paper.rect(self._start.x, self._start.y, 0, 0);
					
						var randD=new Date(); 
						var id=randD.getTime()+"_"+_.size(self._allObjs);
						$.data(self._obj.node,'uid',id);
						self._obj.node.id=id;
                     //self._obj.attr(SHAPE_ATTRS);
					 
                 } else if (self._drawMode == 'e') {
                     self._start = cur;
                     self._obj = self._paper.ellipse(self._start.x, self._start.y, 0, 0);
						var randD=new Date(); 
						var id=randD.getTime()+"_"+_.size(self._allObjs);
						$.data(self._obj.node,'uid',id);
						self._obj.node.id=id;
                    // self._obj.attr(SHAPE_ATTRS);
                 } else if (self._drawMode == 'p') {
                     if (self._points) {
                         var f = _.first(self._points);
                         var a = cur.x - f.x,
                             b = cur.y - f.y;
                         var maybeClosing = false;
                         if (Math.sqrt(a*a + b*b) < CLOSE_ENOUGH) {
                             maybeClosing = true;
                         }
                         if (self._points.length > 2) {
                             // if we're closing the polygon,
                             // then we skip the first line
                             var inter = false,
                                 ps = self._points.slice(maybeClosing? 2:1, -2),
                                 lp = self._points[maybeClosing? 1 : 0],
                                 pcur = self._points[self._points.length-2];
                             _.each(ps, function(cp) {
                                 if (_lineSegsIntersect(lp, cp, pcur, cur)) {
                                     inter = true;
                                     _.breakLoop();
                                 }
                                 lp = cp;
                             });
                             // intersection detected, don't use this
                             if (inter) return;
                         }
                         if (maybeClosing) {
                             self._points.pop();
                             var path =_makePathStr(self._points) + " z";
                             self._obj.attr({"path": path});
							 pathstr = path.substring(2,path.length-2);
							 pathstr=pathstr.replace(/ L /g,"L");
							  pathstr=pathstr.replace(/ /g,",");
							 pathstr="M"+pathstr+"Z";
							
                             var bbox = self._obj.getBBox();
                             if (bbox.width > TOO_SMALL && bbox.height > TOO_SMALL) {
								//shape complete - update shape array and send to 
								//TILE tag
                         		var randD=new Date(); 
								var id=randD.getTime()+"_"+_.size(self._allObjs);
								self._obj.node.id=id;
								
                                newPoly={
									"id":id,
									"type": "path",
									"posInfo": {
										"path": pathstr
									}, 
									scale: self._scale
								};
								self._allObjs[id] = newPoly;
								self._activeShapes[id]=self._obj;
								$("body:first").trigger("shapeDrawn",[newPoly]);
                             }
							 $(".axe_node").remove();
							$(".axe_start_node").remove();
							$("#axe_start_node").remove();
                             self._obj = self._points = null;
                             return; // done!
                         }
						 // GENERATE TILE NODE
				
							node = new Node({pos:{
									x: cur.x,
									y: cur.y
								},shape:self._obj,vd:self,offsets:{offsetTop: self._over.offset.top, offsetLeft: self._over.offset.left}});
                     } else {
                         self._points = [cur];
                         self._obj = self._paper.path(_makePathStr(self._points));
                         self._obj.attr(self._INIT_ATTRS);
						$("<div id='axe_start_node' class='axe_start_node'></div>").appendTo((self._cont)).mouseenter(function(){
							$(this).removeClass("axe_start_node");
				$(this).addClass("axe_start_node_selected");
						//	$(this).css({'width':'10px', 'height':'10px','background-image':'url("../images/axe_red_large.png")'});
						}).mouseleave(function(){
									$(this).addClass("axe_start_node");
				$(this).removeClass("axe_start_node_selected");
						//	$(this).css({'width':'7px', 'height':'7px','background-image':'url("../images/axe_red_small.png")'});
						});
						$("#axe_start_node").css({"top":self._points[0].y,"left":self._points[0].x});
                     }
                     self._points.push({x: cur.x, y: cur.y});
                 } else if (self._drawMode == 's') {
					
					//NEW METHOD for selecting shapes:
					if (!(e.target.id == "selBB")) {
						if (self._obj) {
							//self._obj.cur.attr(INIT_ATTRS);
							
						}
						self._obj = null;

						targetObj = _.first(_.select(self._activeShapes, function(o){
						
							var rs = _relScale(self, o);
							
							return _isNear(cur, o,rs);
						}));
						if (!targetObj) {
							$("#selBB").remove();
							return;
						}
						
						
						self._obj = targetObj;
						self._start = cur;
						
						// Create bounding box
						$(".axe_node").remove();
						if (targetObj.type=="path"){
						
						
							targetObj.points = _createPointsFromPath(targetObj.attr("path").toString());
					
							_.each(targetObj.points, function(p){
							
							 var node = new Node({pos:{
									x: p.x,
									y: p.y
								},shape:targetObj,vd:self,offsets:{offsetTop: self._over.offset.top, offsetLeft: self._over.offset.left}});
							
							
								
						});
					}
					
					//var bb = targetObj.cur.getBBox();
					//var bb = $("#"+targetObj.id+":first")[0].getBBox();
					var bb = targetObj.getBBox();
					var bbH = parseInt(bb.height,10);
					var bbW = parseInt(bb.width,10);
					var bbL = parseInt(bb.x,10);
					var bbT = parseInt(bb.y,10);
					
			
					//FOR TILE: container of entire canvas is the raphael div - id: raphael - OLD
					var vd = $(".vd-container")[0];
					if (!($("#selBB").attr('id'))) {
						$(vd).append("<div id='selBB'></div>");
					}
					$("#selBB").css({
						"height": bbH,
						"width": bbW,
						"top":bbT,
						"left":bbL
					});
					$("#selBB").offset({
						left: bbL,
						top: bbT
					});
			
					if (self._obj){
						self._tarObj = self._obj;
					}
					
					$("#selBB").draggable({
						containment: self._cont,
						start: function(e,ui){
							
							cur = self._getCanvasXY(e);
							
							self._start = {
								x: cur.x,
								y: cur.y
							};
							
							$(".axe_node").remove();
							$(".axe_start_node").remove();
							tobj = self._tarObj;
						
							tobj.scale = parseFloat(self._scale);
						
						},
						drag: function(e, ui){
							tobj = self._tarObj;
							var rs = _relScale(self, tobj);
							xDiff = parseFloat(ui.offset.left,10)-parseFloat(self._over.offset.left);
							yDiff = parseFloat(ui.offset.top,10)-parseFloat(self._over.offset.top);
							if (tobj.type == "rect") {
								//self._activeShapes[tobj.id].attr({
								tobj.attr({
									x: xDiff,
									y: yDiff
								});
								//tobj.x = xDiff;
								//tobj.y = yDiff;					
								//tobj.args = [xDiff, yDiff, $("#selBB").width(), $("#selBB").height()];
							}
							else 
								if (tobj.type == "ellipse") {
									newCX = ui.offset.left + ($("#selBB").width() / 2) - self._over.offset.left;
									newCY = ui.offset.top + ($("#selBB").height() / 2) - self._over.offset.top;
									
									tobj.attr({
											cx: newCX,
											cy: newCY
										});
								}
							else 
								if (tobj.type == "path") {
									cur = self._getCanvasXY(e);
										diffX = self._start.x-cur.x;
										diffY = self._start.y-cur.y;
										
									
										var points = _createPointsFromPath(tobj.attrs.path.toString());
										
										shifted = _.each(points, function(p){
											
											p.x = (parseFloat(p.x)-diffX);											
											p.y = (parseFloat(p.y)-diffY);
									
											nx = p.x;
											ny = p.y;
											return {x:nx,y:ny};
										});
									
										$("#debug").html("<div>"+JSON.stringify(points)+"</div><div>"+_makePathStr(shifted)+"</div><div>"+tobj.attr("path")+"</div>");
										tobj.attr({
											"path":_makePathStr(shifted)+"z"
										});
										self._start.x=cur.x;
											self._start.y=cur.y;
										

									}
						},
						stop:function(e,ui){
						
							//signal to the logbar that the shape is finished dragging - send new coords
							//self._updateJSONShape(tobj.id);
					
							$(this).trigger("shapeChanged",[tobj.id]);
							
						
						}
					});
					
					if (self._tarObj.type != "path") {
						
						$("#selBB").resizable({
							handles:'all',
							start: function(e, ui){
								tobj = self._tarObj;
								tobj.scale = parseFloat(self._scale);
								var rs = _relScale(self, tobj);
								ui.size.width = (tobj.attr("rx"))*2;
								ui.size.height = (tobj.attr("ry"))*2;
								
								//alert(JSON.stringify(ui));
								$(".axe_node").remove();
								$(".axe_start_node").remove();
							},
							resize: function(e, ui){
								tobj = self._tarObj;
								var rs = _relScale(self, tobj);
								if (tobj.type == "rect") {
									tobj.attr({
										width: ui.size.width,
										height: ui.size.height
									});
							 	}
								else 
									if (tobj.type == "ellipse") {
										
										tobj.attr({
											ry: ui.size.height / 2,
											rx: ui.size.width / 2
										});
									
									}
									else 
										{
										throw "should not be reached";
										}
								
								
							},
							stop:function(e,ui){
								//signal to the logbar that the shape is finished resizing - send new coords
								//self._updateJSONShape(tobj.id);
								$(this).trigger("shapeChanged",[tobj.id]);
							}
						});
					}
					self._obj = targetObj;
						}
                 } else {
                     throw "should not be reached";
                 }
             }).mouseup(function (e) {
	//At mouseup, that's when the user has finished drawing a shape (Click and Drag and Done)
                 if ((1 != e.which) || ($(e.target).hasClass("axe_node"))) return;
                 e.preventDefault();

                 if (self._drawMode == 'r' || self._drawMode == 'e') {
                     if (!self._obj) return;
					 var posInfo = {};
					 var shapeObj={};
                     if (self._drawMode == 'r') {
                         var as = self._obj.attr(["x", "y", "width", "height"]);
						 id=$.data(self._obj.node,"uid");
						 posInfo = {"x":as.x,"y":as.y,"width":as.width,"height":as.height};
						 shapeObj = {"id": id, "type":"rect", "scale": self._scale,"posInfo": posInfo};
						 $("body:first").trigger("shapeDrawn",[id]);
                     } else if (self._drawMode == 'e') {
                         var as = self._obj.attr(["cx", "cy", "rx", "ry"]);
						 var id=$.data(self._obj.node,"uid");
						 posInfo = {"cx":as.cx,"cy":as.cy,"rx":as.rx,"ry":as.ry};
                         shapeObj = {"id": id, "type":"ellipse", "scale": self._scale,"posInfo": posInfo};	
						$("body:first").trigger("shapeDrawn",[id]);
                     } else {
                         throw "should not be reached";
                     }
                     var bbox = self._obj.getBBox();
			
                     if (bbox.width > TOO_SMALL && bbox.height > TOO_SMALL) {
					 	self._allObjs[id]=shapeObj;
					 	self._activeShapes[id] = self._obj;
					 }
                     self._start = self._obj = null;
                 } else if (self._drawMode == 'p') {
                     // do nothing
                 } else if (self._drawMode == 's') {
                     self._start = null; // stop moving
                     var o = self._obj;
					 if (o && o.newO) {
						//replace the older values with the new ones
                         _.each(["scale", "con", "args", "x", "y", "width", "height",
                             "points", "cx", "cy", "rx", "ry"],
                             function (p) {if (p in o){ 
								o[p] = o.newO[p];
																	}
							});
							self._canvas.elm.trigger(o.shapeChangeCall,[o]);
                     }
                 } else {
                     throw "should not be reached";
                 }
             }).mousemove(function (e) {
                 if ((!self._obj)|| ($(e.target).hasClass("axe_node")))  return;
				 if((self._drawMode!='p')&&(!self._start)) return; //some firebug errors resulting from 'self._start' null
                 e.preventDefault();

                 var cur = self._getCanvasXY(e);
                 if (self._drawMode == 'r' || self._drawMode == 'e') {
						//return; //make the user use the selBB element instead to drag around box/ellipse
                     if (!self._obj) return;

                     var tl = {x: _.min([cur.x, self._start.x]), y: _.min([cur.y, self._start.y])},
                     br = {x: _.max([cur.x, self._start.x]), y: _.max([cur.y, self._start.y])},
                     halfWidth = (br.x-tl.x)/2,
                     halfHeight = (br.y-tl.y)/2;

                     if (self._drawMode == 'r') {
                         self._obj.attr({
                             x: tl.x, y: tl.y,
                             width: br.x - tl.x,
                             height: br.y - tl.y
                         });
                     } else if (self._drawMode == 'e') {
                         self._obj.attr({
                             cx: tl.x + halfWidth,
                             cy: tl.y + halfHeight,
                             rx: halfWidth,
                             ry: halfHeight
                         });
                     } else {
                         throw "should not be reached";
                     }
                 } else if (self._drawMode == 'p') {
                     if (!self._points) return;

                     var lp = _.last(self._points);
                     lp.x = cur.x;
                     lp.y = cur.y;
                     self._obj.attr({"path":_makePathStr(self._points)});
                 } else if (self._drawMode == 's') {
      
                 } else {
                     throw "should not be reached";
                 }
             });
             // doesn't figure out if our canvas has focus
             // having multiple ops (in different canvases) seems pretty FUBAR, tho
             $(document).keydown(function(e) {
                 // we use this to avoid acting on the same event repeatedly
				var PREV_VAL = 1132423;
				if (e.result == PREV_VAL) return PREV_VAL;
					if (e.keyCode === 27) {
					
					}
				return 1132423;
             });
			 
			 }});
			 rootNS.VectorDrawer = VectorDrawer;
			 
			 
})(jQuery, Raphael, _);