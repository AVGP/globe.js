var THREE    = require('three'),
    World    = require('three-world'),
    Controls = require('./kinetic-controls');

module.exports = (function() {
  var instance = {}, speed = 0.005, animation = false,
      earth, onRender, container, maxPoints = 150000;

  // Internals

  var earthGeo   = new THREE.BufferGeometry(),
      markersGeo = new THREE.BufferGeometry(),
      origin     = new THREE.Vector3(0, 0, 0),
      anchor     = new THREE.Object3D();

  var markersVertices = null,
      markersDestinations = null,
      markersColours  = null;

  var markerCount = 0;

  // Fill the earth geometry with a sphere geometry
  tmpGeo = new THREE.SphereGeometry(600, 64, 64);
  earthGeo.fromGeometry(tmpGeo);
  tmpGeo.dispose();

  function update() {
    Controls.update();

    if(animation) {
      for(var i=0; i<markerCount; i++) {
        var distX = markersGeo.attributes.position.array[i * 3]     - markersGeo.attributes.destination.array[i * 3],
            distY = markersGeo.attributes.position.array[i * 3 + 1] - markersGeo.attributes.destination.array[i * 3 + 1],
            distZ = markersGeo.attributes.position.array[i * 3 + 2] - markersGeo.attributes.destination.array[i * 3 + 2];

        if(Math.abs(distX) > 10) markersGeo.attributes.position.array[i * 3]     -= distX / Math.abs(distX) * 10;
        if(Math.abs(distY) > 10) markersGeo.attributes.position.array[i * 3 + 1] -= distY / Math.abs(distY) * 10;
        if(Math.abs(distZ) > 10) markersGeo.attributes.position.array[i * 3 + 2] -= distZ / Math.abs(distZ) * 10;

        if(Math.abs(distX) > 10 || Math.abs(distY) > 10 || Math.abs(distZ) > 10) markersGeo.attributes.position.needsUpdate = true;
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

  // Public API

  instance.init = function(mapImg, rotationSpeed, options) {
    if(!options) options = {};

    speed = rotationSpeed;
    onRender = options.onRender;
    animation = options.animation;
    if(options.maxPoints) maxPoints = options.maxPoints;

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

    markersVertices     = new Float32Array(maxPoints * 3);
    markersColours      = new Float32Array(maxPoints * 3);
    markersDestinations = new Float32Array(maxPoints * 3);


    markersGeo.dynamic = true;
    markersGeo.addAttribute('position', new THREE.BufferAttribute(markersVertices, 3));
    markersGeo.addAttribute('destination', new THREE.BufferAttribute(markersDestinations, 3));
    markersGeo.addAttribute('color', new THREE.BufferAttribute(markersColours, 3));

    var markers = new THREE.Points(markersGeo, new THREE.PointsMaterial({side: THREE.DoubleSide, size: options.particleSize || 20, vertexColors: THREE.VertexColors}));
    earth.add(markers);
    World.add(earth);
    World.start();
  }

  instance.add = function(lat, lng, height, markerColor) {

    var pos  = latLongToVector3(lat, lng, 600, height),
        dest = latLongToVector3(lat, lng, 600,   0);

    markersVertices[markerCount * 3    ] = pos.x;
    markersVertices[markerCount * 3 + 1] = pos.y;
    markersVertices[markerCount * 3 + 2] = pos.z;

    markersDestinations[markerCount * 3    ] = dest.x;
    markersDestinations[markerCount * 3 + 1] = dest.y;
    markersDestinations[markerCount * 3 + 2] = dest.z;

    markersColours[markerCount * 3    ] = ((markerColor >> 16) & 0xff) / 255.0;
    markersColours[markerCount * 3 + 1] = ((markerColor >> 8)  & 0xff) / 255.0;
    markersColours[markerCount * 3 + 2] = (markerColor & 0xff) / 255.0;

    markersGeo.attributes.position.needsUpdate = true;
    markersGeo.attributes.color.needsUpdate = true;

    markerCount = (markerCount + 1) % maxPoints;
  };

  instance.remove = function(marker) {
    earth.remove(marker);
  };

  instance.resize = function() {
    World.recalculateSize();
  };

  // For non-browserify
  if(window.compat || (document.currentScript && document.currentScript.dataset && document.currentScript.dataset.compat)) {
    console.log("[globe.js] Compat mode");
    window.Globe = instance;
  }

  return instance;
})();
