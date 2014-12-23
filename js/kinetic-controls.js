module.exports = (function() {
  var Hammer = require('hammerjs');

  var instance = {}, hammertime, cam, camAnchor, minZ = 0;
  var swingX = 0, swingY = 0, wasMoved = false;

  instance.init = function(camera, cameraAnchor, minCamZ, invertX, invertY) {
    var hammertime = new Hammer(document.body, {});

    cam = camera;
    camAnchor = cameraAnchor;
    minZ = minCamZ;

    cam.rotation.order = 'YXZ';

    hammertime.get('pinch').set({ enable: true });

    hammertime.on('pan', function(e) {
      var factor = e.pointerType === 'mouse' ? 0.01 : 0.01;
      var turnY = (invertY ? -1 : 1) * Math.PI * factor * (e.deltaX / window.innerWidth),
          turnX = (invertX ? -1 : 1) * Math.PI * factor * (e.deltaY / window.innerHeight);

      if(camAnchor) {
        camAnchor.rotation.y += turnY;
        camAnchor.rotation.x += turnX;
      } else {
        cam.rotation.y += turnY;
        cam.rotation.x += turnX;
      }
      swingX = turnX;
      swingY = turnY;

      wasMoved = true;
      if(e.stopPropagation) e.stopPropagation();
      if(e.preventDefault) e.preventDefault();
    });


    hammertime.on('pinchmove', function(e) {
      if(e.scale >= 1.0 && camera.position.z <= minZ) return;

      camera.translateZ((1 - e.scale) * 5);
      wasMoved = true;

      if(e.stopPropagation) e.stopPropagation();
      if(e.preventDefault) e.preventDefault();
    });

    window.addEventListener('wheel', function(e) {
      if(e.wheelDelta) { // Chrome
        camera.translateZ(-(e.wheelDelta / 60));
      } else { // IE / Firefox
        camera.translateZ(-1 * Math.max(-10, Math.min(e.deltaY, 10)));
      }
      wasMoved = true;

      e.stopPropagation();
      e.preventDefault();
    });
  };

  instance.update = function() {
    if(!camAnchor) camAnchor = cam;

    if(swingX != 0) {
      camAnchor.rotation.x += swingX;
      if(swingX < -0.0001) {
        swingX += 0.0001;
      } else if(swingX > 0.0001) {
        swingX -= 0.0001;
      } else {
        swingX = 0;
      }
    }

    if(swingY != 0) {
      camAnchor.rotation.y += swingY;
      if(swingY < -0.0001) {
        swingY += 0.0001;
      } else if(swingY > 0.0001) {
        swingY -= 0.0001;
      } else {
        swingY = 0;
      }
    }
  };

  instance.wasMoved = function() { return wasMoved; };

  return instance;
})();
