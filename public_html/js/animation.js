//==============================================================================
// Animation Classes
(function (PKG, undefined) {

    PKG.EVENT_TYPES = {
        OFF_SCREEN: {}
    };

    PKG.STATE = {
        UNKNOWN: {value: 0},
        NEW: {value: 1},
        RUN: {value: 2},
        INACTIVE_PENDING: {value: 4},
        INACTIVE: {value: 8},
        UNMANAGED_PENDING: {value: 16},
        UNMANAGED: {value: 32}
    };
    /**
     * Base Class for a object managed by ObjectManager.
     * @returns {undefined}
     */
    PKG.ManagedObject = function () {
        this.objectManager;
        this.idx;
        this.state = PKG.STATE.UNKNOWN;
    };
    PKG.ManagedObject.prototype.setManager = function (manager, idx) {
        this.objectManager = manager;
        this.idx = idx;
    };
    PKG.ManagedObject.prototype.remove = function () {
        objectManager.remove(this);
        this.state = PKG.STATE.UNMANAGED_PENDING;
    };
    PKG.ManagedObject.prototype.getState = function () {
        return this.state;
    };
    PKG.ManagedObject.prototype.setState = function (state) {
        this.state = state;
    };

    /**
     * Manages the Objects, mostly this should be Paintable top level objects.
     * @returns {undefined}
     */
    PKG.ObjectManager = function () {
        this.counter = 0;
        this.animations = new Array();
        this.additions = new Array();
        this.deletions = new Array();
    };
    PKG.ObjectManager.prototype.add = function (animObj) {
        this.additions.push(animObj);
        if (typeof animObj.setManager === 'function') {
            animObj.setManager(this, this.counter++);
        }
    };
    PKG.ObjectManager.prototype.remove = function (animObj) {
        this.deletions.push(animObj);
        animObj.setState(PKG.STATE.UNMANAGED_PENDING);
    };
    PKG.ObjectManager.prototype.getAnimations = function () {
        return this.animations;
    };
    PKG.ObjectManager.prototype.pause = function () {

    };
    PKG.ObjectManager.prototype.resume = function () {
        var len = this.animations.length;
        for (var i = 0; i < len; i++) {
            if (typeof this.animations[i].resume === 'function') {
                this.animations[i].resume();
            }
        }
    };
    /**
     * add and remove will store changes in seperate array
     * only until a call to commit at the end of each game loop.
     * This is sort of a transaction.
     */
    PKG.ObjectManager.prototype.commit = function () {
        var len = this.deletions.length;
        for (var i = 0; i < len; i++) {
            var len2 = this.animations.length;
            for (var j = 0; j < len2; j++) {
                if (this.animations[j].idx === this.deletions[i].idx) {
                    this.deletions[i].setState(PKG.STATE.UNMANAGED);
                    this.animations.splice(j, 1);
                    break;
                }
            }
        }
        this.animations = this.animations.concat(this.additions);
        this.animations.sort(PKG.AnimationComponent.sortComparator);
        this.additions = new Array();
        this.deletions = new Array();
        //console.log(this.animations.length);
    };
    /**
     * Defines interface for an Object Listener
     * @returns {undefined}
     */
    PKG.ObjectListener = function () {
        this.eventType = function () {
        };
        this.listen = function (eventType, event) {
        };
    };

    /**
     * Base Class for objects that emit events and support listeners.
     * Subclass of ManagedObject
     * @returns {undefined}
     */
    PKG.ObjectListenerSupport = function () {
        PKG.ManagedObject.call(this);
        this.listeners = new Array();
    };
    PKG.ObjectListenerSupport.inheritsFrom(PKG.ManagedObject);
    //console.log(this.listeners);
    PKG.ObjectListenerSupport.prototype.addListener = function (listener) {
        this.listeners.push(listener);
        return this;
    };
    PKG.ObjectListenerSupport.prototype.fire = function (eventType, event) {
        this.listeners.forEach(function (elem, idx, array) {
            fireSingel(elem, idx, array, eventType, event);
        });
    };
    PKG.ObjectListenerSupport.prototype.fireAsync = function (eventType, event) {
        var len = this.listeners.length;
        for (var i = 0; i < len; i++) {
            timeout(function () {
                fireSingle(this.listeners[i], i, this.listeners, eventType, event);
            }, 2);
        }
    };
    var fireSingel = function (listener, idx, array, eventType, event) {
        if (listener.eventType === eventType) {
            listener.listen(eventType, event);
        }
    };

//
//
    /**
     * Base Class for an AnimationComponent. It's only purpose is
     * to manage a relationship to a parent of a composition tree.
     * Subclass of ObjectListenerSupport
     * @returns {undefined}
     */
    PKG.AnimationComponent = function () {
        PKG.ObjectListenerSupport.call(this);
        this.root = null;
        //something like a z-order, order in which objects are about to be painted
        //pbjects that are painted "later" might hide parts of objects that have been
        //painted earlier
        this.order = 0;
        //last update time - we do updates only each "updateDelay" milliseconds
        this.lastUpdateTime = 0;

    };
    PKG.AnimationComponent.inheritsFrom(PKG.ObjectListenerSupport);
    PKG.AnimationComponent.prototype.init = function () {
        this.lastUpdateTime = performance.now();
    };
    PKG.AnimationComponent.prototype.update = function (current) {
        this.lastUpdateTime = current;
    };
    PKG.AnimationComponent.prototype.pause = function () {
        //nothing to do here
    };
    PKG.AnimationComponent.prototype.resume = function () {
        this.lastUpdateTime = performance.now();
    };
    PKG.AnimationComponent.prototype.setRoot = function (parent) {
        this.root = parent;
    };
    PKG.AnimationComponent.prototype.getRoot = function () {
        return this.root;
    };
    PKG.AnimationComponent.prototype.init = function () {
        return this;
    };
    PKG.AnimationComponent.prototype.setOrder = function (order) {
        this.order = order;
        return this;
    };
    PKG.AnimationComponent.prototype.getOrder = function () {
        return this.order;
    };
    PKG.AnimationComponent.sortComparator = function (a, b) {
        return a.order - b.order;
    };
//
//
    /**
     * Composition of two or more AnimationComponent object. This CompositionObject
     * is itself a AnimationComponent
     * @param {type} components
     * @returns {undefined}
     */
    PKG.CompositeAnimationComponent = function (components) {
        PKG.AnimationComponent.call(this);
        this.components = components;
    };
    PKG.CompositeAnimationComponent.inheritsFrom(PKG.AnimationComponent);
    PKG.CompositeAnimationComponent.prototype.init = function () {
        var len = this.components.length;
        for (var i = 0; i < len; i++) {
            this.components[i].init();
        }
        this.setRoot(this);
        return this;
    };
    PKG.CompositeAnimationComponent.prototype.update = function (current) {
        var len = this.components.length;
        for (var i = 0; i < len; i++) {
            this.components[i].update(current);
        }
        return PKG.AnimationComponent.prototype.update.call(this, current);
    };
    PKG.CompositeAnimationComponent.prototype.setRoot = function (parent) {
        this.root = parent;
        var len = this.components.length;
        for (var i = 0; i < len; i++) {
            if (typeof this.components[i].setRoot === 'function') {
                this.components[i].setRoot(parent);
            }
        }
    };
    PKG.CompositeAnimationComponent.prototype.getRoot = function () {
        return this.root;
    };
    PKG.CompositeAnimationComponent.prototype.resume = function () {
        var len = this.components.length;
        for (var i = 0; i < len; i++) {
            if (typeof this.components[i].resume === 'function') {
                this.components[i].resume();
            }
        }
    };
//
//
    /**
     * PaintableWithStateIndicator combines a Paintable with a StateIndicator
     * @param {type} paintable
     * @param {type} objectStateIndicator optional state indicator. If provided this state indicators
     *                  getState method is called to provide return values for this.getState() and this.update()
     *                  State should be on of values of enum STATE. Such a StateIndicator could be a deaply nested PathAnimation which
     *                  triggers when if falls off the screen. Keep in mind - even if StateIndicator is a PathAnimatzion it won't be updated here!
     * @returns {animation_L50.PaintableWithStateIndicator}
     */
    PKG.PaintableWithStateIndicator = function (paintable, objectStateIndicator) {
        PKG.AnimationComponent.call(this);
        this.paintable = paintable;
        this.objectStateIndicator = objectStateIndicator;
    };
    PKG.PaintableWithStateIndicator.inheritsFrom(PKG.AnimationComponent);
    PKG.PaintableWithStateIndicator.prototype.init = function () {
        var self = this;
        this.paintable.init();
        this.setRoot(self);
        return this;
    };
    PKG.PaintableWithStateIndicator.prototype.update = function (current) {
        this.paintable.update(current);
        return this.getState();
    };
    PKG.PaintableWithStateIndicator.prototype.paint = function (ctx) {
        this.paintable.paint(ctx);
    };
    PKG.PaintableWithStateIndicator.prototype.getState = function () {
        if (this.objectStateIndicator && typeof this.objectStateIndicator.getState === 'function') {
            return this.objectStateIndicator.getState();
        } else {
            return this.state;
        }
    };
    PKG.PaintableWithStateIndicator.prototype.resume = function () {
        this.paintable.resume();
    };


    /**
     * PaintableCombination combines two or more paintables (top level objects)
     * @param {type} paintables array of paintable objects 
     * @returns {animation_L50.PaintableCombination}
     */
    PKG.PaintableCombination = function (paintables) {
        PKG.CompositeAnimationComponent.call(this, paintables);
        this.update = function (current) {
            var len = paintables.length;
            for (var i = 0; i < len; i++) {
                paintables[i].update(current);
            }
            return this.getState();
        };
        this.paint = function (ctx) {
            var len = paintables.length;
            for (var i = 0; i < len; i++) {
                paintables[i].paint(ctx);
            }
        };
    };
    PKG.PaintableCombination.inheritsFrom(PKG.CompositeAnimationComponent);
//
//
    PKG.PaintableWithAnimation = function (paintable, xyPosition) {
        PKG.CompositeAnimationComponent.call(this, [paintable, xyPosition]);
        this.paint = function (ctx) {
            paintable.paint(ctx, xyPosition.getX(), xyPosition.getY());
        };
        this.getX = function () {
            return xyPosition.getX();
        };
        this.getY = function () {
            return xyPosition.getY();
        };
    };
    PKG.PaintableWithAnimation.inheritsFrom(PKG.CompositeAnimationComponent);
//
//
    /**
     * 
     * @param {type} relativeXYAnimation
     * @param {type} baseXYAnimation
     * @returns {undefined}
     */
    PKG.RelativeXYAnimation = function (relativeXYAnimation, baseXYAnimation) {
        PKG.CompositeAnimationComponent.call(this, [relativeXYAnimation, baseXYAnimation]);
        this.baseXYAnimation = baseXYAnimation;
        this.relativeXYAnimation = relativeXYAnimation;
    };
    PKG.RelativeXYAnimation.inheritsFrom(PKG.CompositeAnimationComponent);
    PKG.RelativeXYAnimation.prototype.getX = function () {
        return this.baseXYAnimation.getX() + this.relativeXYAnimation.getX();
    };
    PKG.RelativeXYAnimation.prototype.getY = function () {
        return this.baseXYAnimation.getY() + this.relativeXYAnimation.getY();
    };
    PKG.RelativeXYAnimation.prototype.setX = function (x) {
        this.baseXYAnimation.setPos(x);
        return this;
    };
    PKG.RelativeXYAnimation.prototype.setY = function (y) {
        this.baseXYAnimation.setPos(y);
        return this;
    };
//
//
    /**
     * 
     * @param {type} xyAnimation
     * @param {type} deltaX
     * @param {type} deltaY
     * @returns {undefined}
     */
    PKG.XYCorrection = function (xyAnimation, deltaX, deltaY) {
        PKG.AnimationComponent.call(this);
        this.xyAnimation = xyAnimation;
        this.deltaX = deltaX;
        this.deltaY = deltaY;
    };
    PKG.XYCorrection.inheritsFrom(PKG.AnimationComponent);
    PKG.XYCorrection.prototype.init = function () {
        var self = this;
        this.xyAnimation.init().setRoot(self);
        return this;
    };
    PKG.XYCorrection.prototype.update = function (current) {
        return this.xyAnimation.update(current);
    };
    PKG.XYCorrection.prototype.getX = function () {
        return this.deltaX + this.xyAnimation.getX();
    };
    PKG.XYCorrection.prototype.getY = function () {
        return this.deltaY + this.xyAnimation.getY();
    };
    PKG.XYCorrection.prototype.setX = function (x) {
        this.xyAnimation.setPos(x);
        return this;
    };
    PKG.XYCorrection.prototype.setY = function (y) {
        this.xyAnimation.setPos(y);
        return this;
    };
    PKG.XYCorrection.prototype.resume = function () {
        this.xyAnimation.resume();
    };

//
//
    PKG.XYAnimation = function (xAnimation, yAnimation) {
        PKG.CompositeAnimationComponent.call(this, [xAnimation, yAnimation]);
        this.xAnimation = xAnimation;
        this.yAnimation = yAnimation;
    }
    PKG.XYAnimation.inheritsFrom(PKG.CompositeAnimationComponent);
    PKG.XYAnimation.prototype.getX = function () {
        return this.xAnimation.getPos();
    };
    PKG.XYAnimation.prototype.getY = function () {
        return this.yAnimation.getPos();
    };
    PKG.XYAnimation.prototype.setX = function (x) {
        this.xAnimation.setPos(x);
        return this;
    };
    PKG.XYAnimation.prototype.setY = function (y) {
        this.yAnimation.setPos(y);
        return this;
    };


//
//
    PKG.XYAnimationPath = function (startX, startY, animationParts) {
        PKG.AnimationComponent.call(this);
        this.currentPart = null;
        this.init = function () {
            this.currentPart = animationParts.pop();
            this.currentPart.setRoot(this.getRoot());
            this.currentPart.init().setX(startX).setY(startY);
            return this;
        };
        this.update = function (current) {
            var retVal = this.currentPart.update(current);
            if (retVal === XYAnimationPathPart.PART_STATE.STOP) {
                if (animationParts.length > 0) {
                    this.init();
                } else {
                    this.fire(EVENT_TYPES.OFF_SCREEN, this);
                }
            }
        };
        this.getX = function () {
            return currentPart.getPos();
        };
        this.getY = function () {
            return currentPart.getPos();
        };
    };
    PKG.XYAnimationPath.inheritsFrom(PKG.AnimationComponent);
//
//TODO
    PKG.XYAnimationPathPart = function () {
        this.PART_STATE = {
            CONTINUE: {},
            STOP: {}
        };
        this.init = function () {
            var self = this;
            xAnimation.init();
            yAnimation.init();
            xAnimation.setRoot(self);
            yAnimation.setRoot(self);
            return this;
        };
        this.update = function (current) {

        };
        this.getX = function () {
            return xAnimation.getPos();
        };
        this.getY = function () {
            return yAnimation.getPos();
        };

    };
//==============================================================================
//Conrete Animation Implementations
//
//
    PKG.OnOffIntervalls = function (eachMsec, forMsec) {
        PKG.AnimationComponent.call(this);
        this.elapsed = 0;
        this.addedMsec = eachMsec + forMsec;
        this.on = false;
        this.eachMsec = eachMsec;
    };
    PKG.OnOffIntervalls.inheritsFrom(PKG.AnimationComponent);
    PKG.OnOffIntervalls.prototype.update = function (current) {
        this.elapsed += (current - this.lastUpdateTime);
        if (this.elapsed > this.eachMsec) {
            if (this.elapsed > this.addedMsec) {
                this.elapsed = 0;
                this.value = 0;
                this.on = false;
            } else {
                this.on = true;
            }
        }
        return PKG.AnimationComponent.prototype.update.call(this, current);
    };
    PKG.OnOffIntervalls.prototype.isOn = function () {
        return this.on;
    };
//
//
    PKG.PosShake = function (onOffControl, shakeValue) {
        PKG.CompositeAnimationComponent.call(this, [onOffControl]);
        this.value = 0;
        this.mult = 1;
        this.onOffControl = onOffControl;
        this.shakeValue = shakeValue;
    };
    PKG.PosShake.inheritsFrom(PKG.CompositeAnimationComponent);
    PKG.PosShake.prototype.update = function (current) {
        if (this.onOffControl.isOn()) {
            this.mult = this.mult - 2 * this.mult;
            this.value = this.mult * this.shakeValue;
        } else {
            this.value = 0;
        }
        return PKG.CompositeAnimationComponent.prototype.update.call(this, current);
    };
    PKG.PosShake.prototype.getPos = function () {
        return this.value;
    };
    //
    //
    PKG.SumPosition = function (positionA, positionB) {
        PKG.CompositeAnimationComponent.call(this, [positionA, positionB]);
        this.getPos = function () {
            return positionA.getPos() + positionB.getPos();
        };
    };
    PKG.SumPosition.inheritsFrom(PKG.CompositeAnimationComponent);


    PKG.Accellerator = function (lowSpeed, highSpeed, speedIncPerMs) {
        PKG.AnimationComponent.call(this);
        this.currentSpeed = lowSpeed;
        this.init = function () {
            this.lastUpdateTime = performance.now();
            return this;
        };
        this.update = function (current) {
            var delta = current - this.lastUpdateTime;
            this.currentSpeed += delta * speedIncPerMs;
            if (this.currentSpeed > highSpeed) {
                this.currentSpeed = highSpeed;
            }
        };
        this.getSpeed = function () {
            return this.currentSpeed;
        };
    };
    PKG.Accellerator.inheritsFrom(PKG.AnimationComponent);
//
//
    PKG.CirclePathAnimation = function (radius, startDeg, direction, degPerMs) {
        PKG.AnimationComponent.call(this);
        var PI_PER_DEG = Math.PI / 180;
        //current pos
        this.currentArc = startDeg * PI_PER_DEG;
        this.arcPerMs = degPerMs * PI_PER_DEG;
        this.init = function () {
            lastUpdateTime = performance.now();
            return this;
        };
        this.update = function (current) {
            var delta = current - this.lastUpdateTime;
            this.currentArc = (this.currentArc + direction * delta * this.arcPerMs);
            this.lastUpdateTime = current;
        };
        this.getX = function () {
            return radius * Math.cos(this.currentArc);
        };
        this.getY = function () {
            return radius * Math.sin(this.currentArc);
        };
    };
    PKG.CirclePathAnimation.inheritsFrom(PKG.AnimationComponent);
//
//
    PKG.BouncingPathAnimation = function (posMin, posMax, pixelPerMs) {
        PKG.AnimationComponent.call(this);
        //current pos
        this.currentPos = posMin;
        this.direction = (posMax - posMin) / Math.abs(posMax - posMin);
        this.init = function () {
            lastUpdateTime = performance.now();
            return this;
        };
        this.update = function (current) {
            var delta = current - this.lastUpdateTime;
            this.currentPos = this.currentPos + this.direction * delta * pixelPerMs;
            if (this.currentPos >= posMax)
                this.direction = -1;
            if (this.currentPos <= posMin)
                this.direction = 1;
            this.lastUpdateTime = current;
        };
        this.getPos = function () {
            return this.currentPos;
        };
    };
    PKG.BouncingPathAnimation.inheritsFrom(PKG.AnimationComponent);
//
//
    PKG.PathAnimation2 = function (from, to, pixelPerMs) {
        PKG.AnimationComponent.call(this);
        //current pos
        this.currentPos = from;
        this.direction = (to - from) / Math.abs(to - from);
        this.init = function () {
            this.currentPos = from;
            this.lastUpdateTime = performance.now();
            return this;
        };
        this.update = function (current) {
            var delta = current - this.lastUpdateTime;
            this.lastUpdateTime = current;
            //console.log(delta);
            this.currentPos = this.currentPos + this.direction * delta * pixelPerMs;
            if (compare(this.currentPos, to)) {
                if (this.getState() !== PKG.STATE.INACTIVE_PENDING) {
                    this.fire(PKG.EVENT_TYPES.OFF_SCREEN, this);
                }
                this.setState(PKG.STATE.INACTIVE_PENDING);
            }
            return this.getState();
        };
        this.getPos = function () {
            return this.currentPos;
        };
        var compareNeg = function (cur, to) {
            return cur <= to;
        };
        var comparePos = function (cur, to) {
            return cur >= to;
        };
        var compare = this.direction <= 0 ? compareNeg : comparePos;
    };
    PKG.PathAnimation2.inheritsFrom(PKG.AnimationComponent);
//
//
    PKG.FixValueAnimation = function (value) {
        PKG.AnimationComponent.call(this);
        this.init = function () {
            return this;
        };
        this.getPos = function () {
            return value;
        };
        this.setPos = function (pos) {
            //use this for XYAnimationPathPart
            value = pos;
        };
    };
    PKG.FixValueAnimation.inheritsFrom(PKG.AnimationComponent);
//
//
    PKG.SpriteAnimation = function (img, sx, sy, gridx, nosprites, direction, oneTime, updateDelay, alpha) {
        PKG.AnimationComponent.call(this);
        //current index into spritephases - nosprites is maximum
        this.currentPos = 0;
        //animBase is 0 if direction is +1 and nosprites if direction is -1
        //this allows for backward and forward animation
        this.animBase = direction === -1 ? nosprites - 1 : 0;
        this.init = function () {
            this.lastUpdateTime = performance.now();
        };
        this.update = function (current) {
            //only update if updateDelay has benn exceeded. this allows for different
            //update sppeds. but be aware that the delay may exceed one sprite-step
            //so we have to check if we have to do more than one step here
            var delay = current - this.lastUpdateTime;
            if (delay > updateDelay) {
                this.currentPos = this.currentPos + Math.floor(delay / updateDelay);
                if (oneTime) {
                    //console.log("Sprite: "+nosprites+"; "+this.currentPos+"; "+(direction)+"; "+delay+"; "+updateDelay);
                    if ((direction === 1 && this.currentPos >= nosprites) || (direction === -1 && this.currentPos <= 0)) {
                        if (this.getState() !== PKG.STATE.INACTIVE_PENDING) {
                            this.fire(PKG.EVENT_TYPES.OFF_SCREEN, this);
                        }
                        this.setState(PKG.STATE.INACTIVE_PENDING);
                    }
                }
                this.currentPos = this.currentPos % nosprites;
                this.lastUpdateTime = current;
            }
        };
        this.paint = function (ctx, px, py) {
            //compute idx based on animBase and direction - this allows for forward and backward animation
            var idx = (this.animBase + direction * this.currentPos);
            var y = Math.floor(idx / gridx);
            var x = Math.floor(idx % gridx);
            var currentAlpha = ctx.globalAlpha;
            ctx.globalAlpha = alpha;
            ctx.drawImage(img, x * sx, y * sy, sx, sy, px, py, sx, sy);
            ctx.globalAlpha = currentAlpha;
        };
    };
    PKG.SpriteAnimation.inheritsFrom(PKG.AnimationComponent);
//
//
    PKG.ImgPainter = function (img, width, height) {
        PKG.AnimationComponent.call(this);
        this.init = function () {
            return this;
        };
        this.update = function (current) {
        };
        this.paint = function (ctx, px, py) {
            ctx.drawImage(img, px, py, width, height);
        };
    };
    PKG.ImgPainter.inheritsFrom(PKG.AnimationComponent);
//


    PKG.CirclePainter = function (color, radius, position) {
        PKG.AnimationComponent.call(this);
        this.init = function () {
            return this;
        };
        this.update = function (current) {
        };
        this.paint = function (ctx, px, py) {
            ctx.beginPath();
            ctx.arc(position.getX(), position.getY(), radius, 0, 2 * Math.PI, false);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();
        };
    };
    PKG.CirclePainter.inheritsFrom(PKG.AnimationComponent);

    PKG.FPSRenderer = function () {
        PKG.AnimationComponent.call(this);
        this.paints = 0;
        this.accumulatedDelay = 0;
        this.fps = 0;
        this.msec = 2000;
        this.init = function () {
            return this;
        };
        this.update = function (current) {

        };
        this.paint = function (ctx) {
            this.paints++;
            var current = performance.now();
            var elapsed = current - this.lastUpdateTime;
            this.accumulatedDelay += elapsed;
            this.lastUpdateTime = current;
            if (this.accumulatedDelay >= this.msec) {
                this.fps = (this.paints / this.accumulatedDelay) * 1000;
                this.accumulatedDelay = 0;
                this.paints = 0;
            }
            ctx.font = '20pt Calibri';
            ctx.fillStyle = 'red';
            ctx.fillText(this.fps.toFixed(1)/*+"; "+elapsed.toFixed(2)*/, 50, 50);
        };
    };
    PKG.FPSRenderer.inheritsFrom(PKG.AnimationComponent);

})(window.ANIMATION = window.ANIMATION || {});