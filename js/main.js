var THREE    = require('three'),
    World    = require('three-world'),
    Controls = require('./kinetic-controls');

module.exports = (function() {
  var instance = {}, speed = 0.005, animation = false, isClustered = false,
      earth, onRender, container, clusterGridSize;

  // Internals

  var earthGeo = new THREE.BufferGeometry(),
      marker = new THREE.BufferGeometry(),
      origin = new THREE.Vector3(0, 0, 0),
      anchor = new THREE.Object3D();

  var markers = [], markerMaterials = {};

  // Fill the marker geometry with a box geometry
  var tmpGeo = new THREE.BoxGeometry(5, 5, 1);
  marker.fromGeometry(tmpGeo);
  tmpGeo.dispose();

  // Fill the earth geometry with a sphere geometry
  tmpGeo = new THREE.SphereGeometry(600, 64, 64);
  earthGeo.fromGeometry(tmpGeo);
  tmpGeo.dispose();

  function update() {
    Controls.update();

    if(animation) {
      for(var i=0; i<markers.length;i++) {
        if(markers[i].offset < 0) continue;
        if(markers[i].offset === 0) {
          markers[i].offset = -1;
          continue;
        }

        markers[i].translateZ(animation.speed);
        markers[i].offset -= animation.speed;
      }
    }

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

  function createClusters(gridSize) {
    for(var lat=-180; lat<180; lat+=gridSize) {
      for(var lng=-90; lng<90; lng+=gridSize) {
        instance.add(lat, lng, 0, 0x00ff00);
      }
    }
  }

  // Public API

  instance.init = function(mapImg, rotationSpeed, options) {
    if(!options) options = {};

    speed = rotationSpeed;
    onRender = options.onRender;
    animation = options.animation;

    World.init({
      clearColor: (options.bgColor === undefined ? 0xffffff : options.bgColor),
      camDistance: 2500,
      farPlane: 6000,
      ambientLight: options.ambientLight === undefined ? 0x111111 : options.ambientLight,
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

    Controls.init(World.getCamera(), earth, 1200, options.container, false, false);

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

    if(options.clustered) {
      clusterGridSize = options.clusterGridSize;
      createClusters(clusterGridSize);
      isClustered = true;
    }

    World.add(earth);
    World.startRenderLoop();
  }

  instance.add = function(lat, lng, height, markerColor) {
    if(isClustered && height > 0) {
      // Round to fit isClustered
      lat = Math.round(lat/clusterGridSize);
      lng = Math.round(lng/clusterGridSize);

      // Identify marker in cluster at desired location...
      var currentMarker = markers[((lat + (180/clusterGridSize)) * (180/clusterGridSize)) + lng + (90/clusterGridSize)];
      if(currentMarker.scale.z === 0) earth.add(currentMarker); // add marker if it has been inactive so far
      currentMarker.scale.set(1, 1, currentMarker.scale.z + height); // scale
      currentMarker.translateZ(height/-2); // move upwards, so it still sits on top of the globe

      return;
    }

    if(markerMaterials[markerColor]) {
      var material = markerMaterials[markerColor];
    } else {
      var material = new THREE.MeshBasicMaterial({color: markerColor});
      markerMaterials[markerColor] = material;
    }
    var newMarker = new THREE.Mesh(marker, material);
    newMarker.scale.set(1, 1, height);

    var pos = latLongToVector3(lat, lng, 600, (animation ? animation.offset + height / 2 : height / 2));
    newMarker.position.set(pos.x, pos.y, pos.z);
    newMarker.lookAt(origin);
    if(animation) {
      newMarker.offset = animation.offset;
      newMarker.height = height;
    }

    if(height > 0) earth.add(newMarker);
    markers.push(newMarker);

    return newMarker;
  }

  instance.remove = function(marker) {
    earth.remove(marker);
  }

  instance.resize = function() {
    World.recalculateSize();
  }

  // For non-browserify
  if(window.compat || (document.currentScript && document.currentScript.dataset && document.currentScript.dataset.compat)) {
    console.log("[globe.js] Compat mode");
    window.Globe = instance;
  }

  return instance;
})();
