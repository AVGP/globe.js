var THREE    = require('three'),
    World    = require('three-world'),
    Controls = require('./kinetic-controls');

module.exports = (function() {
  var instance = {}, onRender, speed = 0.005, earth;

  // Internals

  var earthGeo = new THREE.SphereGeometry(600, 64, 64),
      light  = new THREE.DirectionalLight(0x888888, 3.5, 500 ),
      light2 = new THREE.DirectionalLight(0x888888, 3.5, 500 ),
      light3 = new THREE.DirectionalLight(0x888888, 3.5, 500 ),
      marker = new THREE.BoxGeometry(5, 5, 1),
      origin = new THREE.Vector3(0, 0, 0),
      anchor = new THREE.Object3D();

  light2.position.set(600, 0, 0);
  light2.target.position.set(0,0,0);
  light3.position.set(-600, 0, 0);
  light3.target.position.set(0,0,0);

  function update() {
    Controls.update();
    if(!Controls.wasMoved()) earth.rotation.y += speed;
    if(onRender) onRender();
  }

  function latLongToVector3(lat, lon, radius, heigth) {
    var phi = (lat)*Math.PI/180;
    var theta = (lon-180)*Math.PI/180;

    var x = -(radius+heigth) * Math.cos(phi) * Math.cos(theta);
    var y = (radius+heigth) * Math.sin(phi);
    var z = (radius+heigth) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3(x,y,z);
  }

  // Public API

  instance.init = function(mapImg, rotationSpeed, options) {
    if(!options) options = {};

    speed = rotationSpeed;
    onRender = options.onRender;

    World.init({
      clearColor: (options.bgColor === undefined ? 0xffffff : options.bgColor),
      camDistance: 2500,
      farPlane: 6000,
      ambientLight: 0x111111,
      renderCallback: update,
      container: options.container
    });

    anchor.add(World.getCamera());
    World.add(anchor);

    var planetTexture = THREE.ImageUtils.loadTexture( mapImg );
    var mat =  new THREE.MeshPhongMaterial( {
          map: planetTexture,
          color: 0x888888,
          shininess: 0.8,
          transparent: options.transparent || false,
          side: THREE.FrontSide
        });

    earth = new THREE.Mesh(earthGeo, mat);

    Controls.init(World.getCamera(), earth, 1200, false, false);

    // Artifacts with THREE.DoubleSide and transparent materials have ugly artifacts
    // so we cheat by having 2 meshes, one with FrontSide, one with BackSide
    if(options.transparent) {
      var mat2 =  new THREE.MeshPhongMaterial( {
            map: planetTexture,
            color: 0xffffff,
            shininess: 0.8,
            transparent: true,
            opacity: 1.0,
            side: THREE.BackSide
      }),
      earthInner = new THREE.Mesh(earthGeo, mat2);
      earth.add(earthInner);
    }

    World.add(earth);
    World.startRenderLoop();
  }

  instance.add = function(lat, lng, height, markerColor) {
    var newMarker = new THREE.Mesh(marker, new THREE.MeshBasicMaterial({color: markerColor}));
    newMarker.scale.set(1, 1, height);

    var pos = latLongToVector3(lat, lng, 600, height / 2);
    newMarker.position.set(pos.x, pos.y, pos.z);
    newMarker.lookAt(origin);
    earth.add(newMarker);

    return newMarker;
  }

  instance.remove = function(marker) {
    earth.remove(marker);
  }

  // For non-browserify
  console.log(document, document.currentScript, document.currentScript.dataset);
  if(window.compat || (document.currentScript && document.currentScript.dataset && document.currentScript.dataset.compat)) {
    console.log("Compat mode");
    window.Globe = instance;
  }

  return instance;
})();
