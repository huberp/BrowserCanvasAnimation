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
        this.setManager = function (manager, idx) {
            this.objectManager = manager;
            this.idx = idx;
        };
        this.remove = function () {
            objectManager.remove(this);
            this.state = PKG.STATE.UNMANAGED_PENDING;
        };
        this.getState = function () {
            return this.state;
        };
        this.setState = function (state) {
            this.state = state;
        };
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
        this.add = function (animObj) {
            this.additions.push(animObj);
            if (typeof animObj.setManager === 'function') {
                animObj.setManager(this, this.counter++);
            }
        };
        this.remove = function (animObj) {
            this.deletions.push(animObj);
            animObj.setState(PKG.STATE.UNMANAGED_PENDING);
        };
        this.getAnimations = function () {
            return this.animations;
        };
        /**
         * add and remove will store changes in seperate array
         * only until a call to commit at the end of each game loop.
         * This is sort of a transaction.
         */
        this.commit = function () {
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
            this.additions = new Array();
            this.deletions = new Array();
            //console.log(this.animations.length);
        };
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
        //console.log(this.listeners);
        this.addListener = function (listener) {
            this.listeners.push(listener);
            return this;
        };
        this.fire = function (eventType, event) {
            this.listeners.forEach(function (elem, idx, array) {
                fireSingel(elem, idx, array, eventType, event);
            });
        };
        this.fireAsync = function (eventType, event) {
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
    };
    PKG.ObjectListenerSupport.inheritsFrom(PKG.ManagedObject);
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
        this.par = null;
        this.setParent = function (parent) {
            this.par = parent;
        };
        this.getParent = function () {
            return this.par;
        };
        this.init = function () {
            return this;
        };
    };
    PKG.AnimationComponent.inheritsFrom(PKG.ObjectListenerSupport);
//
//
    /**
     * Composition of two AnimationComponent object. This CompositionObject
     * is itself a AnimationComponent
     * @param {type} componentA
     * @param {type} componentB
     * @returns {undefined}
     */
    PKG.CompositeAnimationComponent = function (componentA, componentB) {
        PKG.AnimationComponent.call(this);
        this.par = null;
        this.init = function () {
            var self = this;
            componentA.init();
            componentB.init();
            if (typeof componentA.setParent === 'function') {
                componentA.setParent(self);
            }
            if (typeof componentB.setParent === 'function') {
                componentB.setParent(self);
            }
            return this;
        };
        this.setParent = function (parent) {
            this.par = parent;
            if (typeof componentA.setParent === 'function') {
                componentA.setParent(parent);
            }
            if (typeof componentB.setParent === 'function') {
                componentB.setParent(parent);
            }
        };
        this.getParent = function () {
            return this.par;
        };
    };
    PKG.CompositeAnimationComponent.inheritsFrom(PKG.AnimationComponent);
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
        this.init = function () {
            var self = this;
            paintable.init();
            if (typeof paintable.setParent === 'function') {
                paintable.setParent(self);
            }
            return this;
        };
        this.update = function (current) {
            paintable.update(current);
            return this.getState();
        };
        this.paint = function (ctx) {
            paintable.paint(ctx);
        };
        this.getState = function () {
            if (objectStateIndicator && typeof objectStateIndicator.getState === 'function') {
                return objectStateIndicator.getState();
            } else {
                return this.state;
            }
        };
    };
    PKG.PaintableWithStateIndicator.inheritsFrom(PKG.AnimationComponent);
    /**
     * PaintableCombination combines two paintables (top level objects)
     * @param {type} paintableA 1st paintable object 
     * @param {type} paintableB 2nd paintable object
     * @param {type} objectStateIndicator 
     * @returns {animation_L50.PaintableCombination}
     */
    PKG.PaintableCombination = function (paintableA, paintableB) {
        PKG.CompositeAnimationComponent.call(this, paintableA, paintableB);
        this.update = function (current) {
            paintableA.update(current);
            paintableB.update(current);
            return this.getState();
        };
        this.paint = function (ctx) {
            paintableA.paint(ctx);
            paintableB.paint(ctx);
        };
    };
    PKG.PaintableCombination.inheritsFrom(PKG.CompositeAnimationComponent);
//
//
    PKG.PaintableWithAnimation = function (paintable, xyPosition) {
        PKG.CompositeAnimationComponent.call(this, paintable, xyPosition);
        this.update = function (current) {
            paintable.update(current);
            xyPosition.update(current);
        };
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
    PKG.RelativeXYAnimation = function (relativeXYAnimation, baseXYAnimation) {
        PKG.CompositeAnimationComponent.call(this, relativeXYAnimation, baseXYAnimation);
        this.update = function (current) {
            relativeXYAnimation.update(current);
            baseXYAnimation.update(current);
        };
        this.getX = function () {
            return baseXYAnimation.getX() + relativeXYAnimation.getX();
        };
        this.getY = function () {
            return baseXYAnimation.getY() + relativeXYAnimation.getY();
        };
        this.setX = function (x) {
            baseXYAnimation.setPos(x);
            return this;
        };
        this.setY = function (y) {
            baseXYAnimation.setPos(y);
            return this;
        };
    };
    PKG.RelativeXYAnimation.inheritsFrom(PKG.CompositeAnimationComponent);
//
//
    PKG.XYCorrection = function (xyAnimation, deltaX, deltaY) {
        PKG.AnimationComponent.call(this);
        this.init = function () {
            var self = this;
            xyAnimation.init().setParent(self);
            return this;
        };
        this.update = function (current) {
            xyAnimation.update(current);
        };
        this.getX = function () {
            return deltaX + xyAnimation.getX();
        };
        this.getY = function () {
            return deltaY + xyAnimation.getY();
        };
        this.setX = function (x) {
            xyAnimation.setPos(x);
            return this;
        };
        this.setY = function (y) {
            xyAnimation.setPos(y);
            return this;
        };
    };
    PKG.XYCorrection.inheritsFrom(PKG.AnimationComponent);
//
//
    PKG.XYAnimation = function (xAnimation, yAnimation) {
        PKG.CompositeAnimationComponent.call(this, xAnimation, yAnimation);
        this.init = function () {
            var self = this;
            xAnimation.init().setParent(self);
            yAnimation.init().setParent(self);
            return this;
        };
        this.update = function (current) {
            xAnimation.update(current);
            yAnimation.update(current);
        };
        this.getX = function () {
            return xAnimation.getPos();
        };
        this.getY = function () {
            return yAnimation.getPos();
        };
        this.setX = function (x) {
            xAnimation.setPos(x);
            return this;
        };
        this.setY = function (y) {
            yAnimation.setPos(y);
            return this;
        };
    };
    PKG.XYAnimation.inheritsFrom(PKG.CompositeAnimationComponent);

//
//
    PKG.XYAnimationPath = function (startX, startY, animationParts) {
        PKG.AnimationComponent.call(this);
        this.currentPart = null;
        this.init = function () {
            this.currentPart = animationParts.pop();
            this.currentPart.setParent(this.getParent());
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
            xAnimation.setParent(self);
            yAnimation.setParent(self);
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

    }
//==========================================================================
//Conrete Animation Implementations
//
//
    PKG.CirclePathAnimation = function (radius, startDeg, direction, degPerMs) {
        PKG.AnimationComponent.call(this);
        var PI_PER_DEG = Math.PI / 180;
        //last update time - we do updates only each "updateDelay" milliseconds
        this.lastUpdateTime = 0;
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
        //last update time - we do updates only each "updateDelay" milliseconds
        this.lastUpdateTime = 0;
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
        //last update time - we do updates only each "updateDelay" milliseconds
        this.lastUpdateTime = 0;
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
                this.fire(PKG.EVENT_TYPES.OFF_SCREEN, this);
                this.currentPos = from;
                this.setState(PKG.STATE.INACTIVE_PENDING);
                return this.getState();
            }
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
        this.update = function (current) {
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
        //last update time - we do updates only each "updateDelay" milliseconds
        this.lastUpdateTime = 0;
        //animBase is 0 if direction is +1 and nosprites if direction is -1
        //this allows for backward and forward animation
        this.animBase = direction === -1 ? nosprites - 1 : 0;
        this.init = function () {
            lastUpdateTime = performance.now();
        };
        this.update = function (current) {
            //only update if updateDelay has benn exceeded. this allows for different
            //update sppeds. but be aware that the delay may exceed one sprite-step
            //so we have to check if we have to do more than one step here
            var delay = current - this.lastUpdateTime;
            if (delay > updateDelay) {
                this.currentPos = this.currentPos + Math.floor(delay / updateDelay);
                if (oneTime) {
                    if (this.currentPos > nosprites || this.currentPos < 0) {
                        this.fire(PKG.EVENT_TYPES.OFF_SCREEN, this);
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
            ctx.globalAlpha = alpha;
            ctx.drawImage(img, x * sx, y * sy, sx, sy, px, py, sx, sy);
        };
    };
    PKG.SpriteAnimation.inheritsFrom(PKG.AnimationComponent);
//
//
    PKG.ImgPainter = function (img, width, height) {
        this.init = function () {
            return this;
        };
        this.update = function (current) {
        };
        this.paint = function (ctx, px, py) {
            ctx.drawImage(img, px, py, width, height);
        };
    };
//


    PKG.CirclePainter = function (color, radius, position) {
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
})(window.ANIMATION = window.ANIMATION || {});