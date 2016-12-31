# svg.pathmorphing2.js

Another plugin for the [svg.js](http://svgjs.com) library to enable path morphing / animation.

The algorithm used by this plugin is based on the Interpolate extension of
Inkscape.

Compared to the other path morphing plugin for svg.js, this plugin feature
better support for the arc command but it might be a little bit slower.

## Installation
```
npm install --save svg.pathmorphing2.js
```
## Usage
### How to include
#### In Html
Include this plugin after including svg.js and svg.point.js in your html
document.

#### CommonJs
You can just require this plugin, it will take care of requiring its
dependencies (svg.js and svg.point.js), perform the necessary modification and
return you the modified `SVG` object.
```javascript
var SVG = require('svg.pathmorphing2.js')
```

Or, you can require this plugin after having required svg.js.
```javascript
var SVG = require('svg.js')
require('svg.pathmorphing2.js')
```
If you are using npm3, the two require in the code above would return a
reference to the same object since npm3 install secondary dependencies in a
flat way. That would not be the case if you are using npm2 since it installs
all dependencies in a nested way.

```javascript
// If using npm3
var SVG1 = require('svg.js')
var SVG2 = require('svg.pathmorphing2.js')
SVG1 === SVG2 // true
SVG1.Utils.makePathsMorphable != null // true

// If using npm2
var SVG1 = require('svg.js')
var SVG2 = require('svg.pathmorphing2.js')
SVG1 === SVG2 // false
SVG1.Utils.makePathsMorphable != null // false
```

Long story short, to avoid issues you should use npm3 if you plan to use this
plugin with a CommonJs module bundler.


### Animating paths
Animating paths is done the same way as all other animation explained in the
svg.js docs:

```javascript
// create path
var path = draw.path('m 382,339 a 155,175 0 0 1 -17,112 c 0,0 -175,-31 -100,-160')

// animate path
path.animate().plot('m 503,363 74,-42 64,64 z')
```


### makePathsMorphable()
This plugin provide the function `makePathsMorphable` in `SVG.utils` that take
two path string (or any format supported by the `SVG.PathArray` constructor)
that don't have the same commands (which mean that they cannot be morphed in
one another) and return an array of two `SVG.PathArray` that represent two
paths that are equivalent to the passed paths (meaning that they produce the
same shapes) and that have the same commands (moveto and curveto).

```javascript
var path1 = "M 90,119 71,88 41,107 54,73 20,61 54,50 43,16 l 29,19 19,-30 3,35 35,-3 -25,24 24,25 -34,-4 z"
  , path2 = "m 18,208 109,0 0,77 -109,0 z"
  , pathsMorphable = SVG.utils.makePathsMorphable(path1, path2)

  // pathsMorphable[0] is equivalent to path1
  pathsMorphable[0].toString() // "M90 119C90 119 71 88 71 88C71 88 41 107 41 107 ...
  // pathsMorphable[1] is equivalent to path2
  pathsMorphable[1].toString() // "M18 208C18 208 26.885065510170534 208 39.581696141082865 208 ...

  // And they use the same commands
  pathsMorphable[0].equalCommands(pathsMorphable[1]) // true
```


## Dependencies
svg.js >= v2.3.6
svg.point.js >= v0.0.1

## License
svg.pathmorphing2.js is licensed under the [MIT License](LICENSE).
