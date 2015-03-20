//==============================================================================
// Now setup the animations and run it
(function () {
    var ANIM = window.ANIMATION;

    var canvas = document.getElementById('myCanvas');
    var context = canvas.getContext('2d');
//
//http://freegameassets.blogspot.de/
    var asteroid1 = new Image();
    var asteroid3 = new Image();
    var asteroid4 = new Image();
    var explosion = new Image();
    var background = new Image();
//http://www.codeproject.com/Articles/677417/Shootem-Up-NET
    var explosion2 = new Image();
    var ship = new Image();
//
    asteroid1.src = "img/asteroid1_72x72.png";
    asteroid3.src = "img/asteroid3_32x32.png";
    asteroid4.src = "img/asteroid4_32x32.png";
    explosion.src = "img/explosion01_set_64x64.png";
    background.src = "img/maxresdefault.jpg";
    explosion2.src = "img/explosion02_96x96.png";
    ship.src = "img/smallfighter0006.png";

    objectManager = new ANIM.ObjectManager();

    yCoords = new Array();
    dir = -1;
    //
    //background
    objectManager.add(
            new ANIM.PaintableWithAnimation(
                    new ANIM.ImgPainter(background, 1080, 1920),
                    new ANIM.XYAnimation(
                            new ANIM.FixValueAnimation(0),
                            new ANIM.PathAnimation2(-1320, 0, 0.02)
                            )
                    ).setOrder(0)
            );
    objectManager.add(
            new ANIM.PaintableWithAnimation(
                    new ANIM.ImgPainter(ship, 95, 151),
                    new ANIM.XYAnimation(
                            new ANIM.BouncingPathAnimation(00, 600 - 95, 0.1),
                            new ANIM.FixValueAnimation(600 - 151)
                            )
                    ).setOrder(100)
            );
    //
    //A Listener which listens to OFF_SCREEN events
    var listener = {
        eventType: ANIMATION.EVENT_TYPES.OFF_SCREEN,
        listen: function (eventType, event) {
            event.getParent().remove();
            var idx = Math.floor(Math.random() * 120);
            dir = dir - 2 * dir;
            var composite = createObject(idx, dir);
            composite.init();
            objectManager.add(composite);
            objectManager.commit();
        }
    };

    var createObject = function (idx, dir) {
        //
        var yAnimation = new ANIM.PathAnimation2(-72, 600, 0.05 + 0.1 * Math.random()).addListener(listener);
        var xAnimation = new ANIM.FixValueAnimation(Math.random() * 520);
        var xyBaseAnimation = new ANIM.XYAnimation(xAnimation, yAnimation);

        var spriteAnimation;
        //
        if (idx >= 1 && idx < 24) {
            spriteAnimation = new ANIM.SpriteAnimation(asteroid1, 72, 72, 5, 19, dir, false, 150 + 150 * Math.random(), 1);
        } else if (idx >= 24 && idx < 48) {
            spriteAnimation = new ANIM.SpriteAnimation(asteroid3, 32, 32, 5, 19, dir, false, 50 + 150 * Math.random(), 1);
        } else if (idx >= 48 && idx < 72) {
            spriteAnimation = new ANIM.SpriteAnimation(asteroid4, 32, 32, 5, 19, dir, false, 50 + 150 * Math.random(), 1);
        } else if (idx >= 72 && idx < 108) {
            spriteAnimation = new ANIM.SpriteAnimation(explosion, 64, 64, 10, 100, 1, true, 50 + 50 * Math.random(), 0.5);
        } else {
            spriteAnimation = new ANIM.SpriteAnimation(explosion2, 96, 96, 5, 20, 1, true, 100 + 200 * Math.random(), 0.7);
        }

        var compositeMain = new ANIM.PaintableWithAnimation(
                spriteAnimation,
                xyBaseAnimation
                );

        if (idx >= 1 && idx < 24) {
            //build two circling sattelites around a asteroid
            var speed = 0.1 + 0.1 * Math.random();
            var circleAnimation1 = new ANIM.CirclePathAnimation(65, 0, dir, speed);
            var circleAnimation2 = new ANIM.CirclePathAnimation(65, 180, dir, speed);
            //not quite sure why the XYCorrection parameters have to be 16,16 here? it should be 36,36????
            var relativeXYAnimation1 = new ANIM.XYCorrection(new ANIM.RelativeXYAnimation(xyBaseAnimation, circleAnimation1), 16, 16);
            var relativeXYAnimation2 = new ANIM.XYCorrection(new ANIM.RelativeXYAnimation(xyBaseAnimation, circleAnimation2), 16, 16);
            var circlePainter = new ANIM.CirclePainter(8, 65, new ANIM.XYCorrection(xyBaseAnimation, 36, 36));
            //now it gets funky - let's build a circeling satelite around a sattelite
            var circleAnimation1_1 = new ANIM.CirclePathAnimation(32, 180, dir - 2 * dir, speed + 0.06);
            var relativeXYAnimation1_1 = new ANIM.RelativeXYAnimation(relativeXYAnimation1, circleAnimation1_1);
            var circlePainter1_1 = new ANIM.CirclePainter(8, 32, new ANIM.XYCorrection(relativeXYAnimation1, 16, 16));

            var satelliteAnimation = new ANIM.SpriteAnimation(asteroid3, 32, 32, 5, 19, dir, false, 50 + 150 * Math.random(), 1);
            var compositeSub1 = new ANIM.PaintableWithAnimation(satelliteAnimation, relativeXYAnimation1);
            var compositeSub2 = new ANIM.PaintableWithAnimation(satelliteAnimation, relativeXYAnimation2);
            var compositeSub1_1 = new ANIM.PaintableWithAnimation(satelliteAnimation, relativeXYAnimation1_1);
            return new ANIM.PaintableWithStateIndicator(
                    new ANIM.PaintableCombination(
                            [compositeMain,
                                circlePainter,
                                compositeSub2,
                                compositeSub1,
                                circlePainter1_1,
                                compositeSub1_1]), yAnimation);
        } else {
            return compositeMain;
        }
    };

    for (i = 1; i < 10; i++) {
        objectManager.add(createObject(i, dir).setOrder(50));
        dir = dir - 2 * dir;
    }
    objectManager.commit();
    objectManager.getAnimations().forEach(function (elem) {
        elem.init();
    });

    var handleKeyPress = function (e) {
        var code = e.keyCode;
        switch (code) {
            case 37:
                alert("Left");
                break; //Left key
            case 38:
                alert("Up");
                break; //Up key
            case 39:
                alert("Right");
                break; //Right key
            case 40:
                alert("Down");
                break; //Down key
            default:
                alert(code); //Everything else
        }
    };
    canvas.addEventListener('keypress', handleKeyPress);
    canvas.addEventListener('keyup', handleKeyPress);

    //==========================================================================
    // Run everything now
    //
    var lastTime = performance.now();
    anim = function (current) {
        myCurrent = performance.now();
        window.requestAnimationFrame(anim, canvas);
        delta = current - lastTime;
        lastTime = performance.now();
        //context.clearRect(0, 0, canvas.width, canvas.height);
        objectManager.getAnimations().forEach(function (elem) {
            var retState = elem.update(myCurrent);
            if (retState && retState === ANIM.STATE.INACTIVE_PENDING) {
                objectManager.remove(elem);
            }
        });
        objectManager.getAnimations().forEach(function (elem) {
            elem.paint(context);
        });
        objectManager.commit();
    };
    window.requestAnimationFrame(anim, canvas);
})();

