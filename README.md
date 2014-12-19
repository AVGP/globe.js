# globe.js
## Simple way to visualise things on a 3D globe

## Usage

### Get it from NPM

```shell
npm install globejs
```

### Using with Browserify or without it

This package can be used with browserify like this:

```javascript
var Globe = require('globejs');

Globe.init("world.jpg", 0.005);
```

or in vanilla Javascript like this:

```html
<script src="globe.js" data-compat="true"></script>
<script>
  window.Globe.init("world.jpg", 0.005);
</script>
```

### Simple example

In the simplest case, you can get things on the globe like this:

```html
<!doctype html>
<html>
<body>
  <script src="globe.js" data-compat="true"></script>
  <script>
    var latitude = 47.367347, longitude = 8.550002, height = 200, color = 0x0000ff;
    window.Globe.init("world.jpg", 0.005);
    window.Globe.add(latitude, longitude, height, color); // blue marker on Zurich
  </script>
</body>
</html>
```

### Using more advanced options

In this case, we will add it into a container, have it transparent and with a red background colour.
We will also specify a callback that is called when a frame is rendered, that just logs to console.

```html
<!doctype html>
<html>
<body>
  <div id="worldcontainer" style="width:500px; height:500px"></div>

  <script src="globe.js" data-compat="true"></script>
  <script>
    var latitude = 47.367347, longitude = 8.550002, height = 200, color = 0x0000ff;

    window.Globe.init("world.png", 0.005, {
      bg: 0xff0000,
      transparent: true,
      onRender: function() { console.log("Rendered."); },
      container: document.getElementById("worldcontainer")
    });

    window.Globe.add(latitude, longitude, height, color); // blue marker on Zurich
  </script>
</body>
</html>
```

### Adding and removing markers

Markers can be added like this:

```javascript
var marker = window.Globe.add(latitude, longitude, height, color);
```
Where:
* `latitude` and `longitude` are decimal degrees between -90/+90 (latitude) and -180/+180 (longitude), e.g. `47.367347` and `8.550002` for Zurich.
* height is the height of the marker sticking out of the globe. For comparison: The globe has a radius of 600 canvas pixels...
* color is a hex number representing the RGB color, e.g. `0xff0000` for red, `0x00ff00` for green, etc.

Markers can also be removed later on:

```javascript
window.Globe.remove(marker);
```

## Hack it / Contribute

### Hacking

1. Clone this repository
2. Install all the dependencies
3. Run the `dev` task to watch and auto-rewrite the browserify bundle while hacking

Like this:

```shell
git clone https://github.com/avgp/globe.js.git
cd globe
npm install
npm run dev
```
Then run the static file server of your choice, e.g. `python -m SimpleHTTPServer` and tweak it to your needs.

### Contributing

All contributions welcome - if you're not sure about something, please don't hesitate to open an issue or pull request!

To get started for contributing, do:

1. Fork the repo on github
2. Clone your fork
3. Create a new branch for the thing you'll be working on
4. Code code code
5. Push to your fork
6. Make a pull request against the `gh-pages` branch of this repository.

Thank you very much!
