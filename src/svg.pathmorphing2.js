var SVG = require('svg.js')
  , CSP = require('./cubicsuperpath')

module.exports = SVG


// This method will be removed when the version 2.3.7 of svg.js is released since it will be built-in
SVG.extend(SVG.PathArray, {
  // Test if the passed path array use the same path data commands as this path array
  equalCommands: function(pathArray) {
    var i, il, equalCommands

    pathArray = new SVG.PathArray(pathArray)

    equalCommands = this.value.length === pathArray.value.length
    for(i = 0, il = this.value.length; equalCommands && i < il; i++) {
      equalCommands = this.value[i][0] === pathArray.value[i][0]
    }

    return equalCommands
  }
})



// Take two path array that don't have the same commands (which mean that they
// cannot be morphed in one another) and return 2 equivalent path array (meaning
// that they produce the same shape as the passed path array) that have the
// same commands (moveto and curveto)
//
// Algorithm used:
// First, convert every path segment of the two passed paths into equivalent cubic Bezier curves.
// Then, calculate the positions relative to the total length of the path of the endpoint of all those cubic Bezier curves.
// After that, split the Bezier curves of the source at the positions that the destination have that are not common to the source and vice versa.
// Finally, make the source and destination have the same number of subpaths.
SVG.utils.makePathsMorphable = function (sourcePathArray, destinationPathArray) {
  var source, sourcePositions, sourcePositionsToSplitAt
    , destination, destinationPositions, destinationPositionsToSplitAt
    , i, il, j, jl
    , s, d
    , sourceSubpath, destinationSubpath, lastSegPt

  // Convert every path segments into equivalent cubic Bezier curves
  source = CSP.cubicSuperPath(sourcePathArray)
  destination = CSP.cubicSuperPath(destinationPathArray)

  // The positions relative to the total length of the path is calculated for the endpoint of all those cubic bezier curves
  sourcePositions = CSP.positions(source)
  destinationPositions = CSP.positions(destination)

  // Find the positions that the destination have that are not in the source and vice versa
  sourcePositionsToSplitAt = []
  destinationPositionsToSplitAt = []
  i = 0, il = sourcePositions.length
  j = 0, jl = destinationPositions.length
  while(i < il && j < jl) {
    // Test if the two values are equal taking into account the imprecision of floating point number
    if (Math.abs(sourcePositions[i] - destinationPositions[j]) < 0.000001) {
      i++
      j++
    } else if(sourcePositions[i] > destinationPositions[j]){
      sourcePositionsToSplitAt.push(destinationPositions[j++])
    } else {
      destinationPositionsToSplitAt.push(sourcePositions[i++])
    }
  }
  // If there are still some destination positions left, they all are not in the source and vice versa
  sourcePositionsToSplitAt = sourcePositionsToSplitAt.concat(destinationPositions.slice(j))
  destinationPositionsToSplitAt = destinationPositionsToSplitAt.concat(sourcePositions.slice(i))

  // Split the source and the destination at the positions they don't have in common
  CSP.splitAtPositions(source, sourcePositions, sourcePositionsToSplitAt)
  CSP.splitAtPositions(destination, destinationPositions, destinationPositionsToSplitAt)


  // Break paths so that corresponding subpaths have an equal number of segments
  s = source, source = [], sourceSubpath = s[i = 0]
  d = destination, destination = [], destinationSubpath = d[j = 0]
  while (sourceSubpath && destinationSubpath) {
    // Push REFERENCES to the current subpath arrays in their respective array
    source.push(sourceSubpath)
    destination.push(destinationSubpath)

    il = sourceSubpath.length
    jl = destinationSubpath.length

    // If the current subpath of the source and the current subpath of the destination don't
    // have the same length, that mean that the biggest of the two must be split in two
    if(il > jl) {
      lastSegPt = sourceSubpath[jl-1]
      // Perform the split using splice that change the content of the array by removing elements and returning them in an array
      sourceSubpath = sourceSubpath.splice(jl)
      sourceSubpath.unshift(lastSegPt) // The last segment point is duplicated since these two segments must be joined together
      destinationSubpath = d[++j] // This subpath has been accounted for, past to the next
    } else if(il < jl) {
      lastSegPt = destinationSubpath[il-1]
      destinationSubpath = destinationSubpath.splice(il)
      destinationSubpath.unshift(lastSegPt)
      sourceSubpath = s[++i]
    } else {
      sourceSubpath = s[++i]
      destinationSubpath = d[++j]
    }
  }

  // Convert in path array and return
  return [CSP.uncubicSuperPath(source), CSP.uncubicSuperPath(destination)]
}


SVG.extend(SVG.PathArray, {
  // Make path array morphable
  morph: function(pathArray) {
    var pathsMorphable

    this.destination = new SVG.PathArray(pathArray)

    if(this.equalCommands(this.destination)) {
      this.sourceMorphable = this
      this.destinationMorphable = this.destination
    } else {
      pathsMorphable = SVG.utils.makePathsMorphable(this.value, this.destination)
      this.sourceMorphable = pathsMorphable[0]
      this.destinationMorphable = pathsMorphable[1]
    }

    return this
  }
  // Get morphed path array at given position
, at: function(pos) {
    // Make sure a destination, a morphable source and a morphable destination are defined
    // Also, when pos is 0, we don't return sourceMorphable since the "real" path (this) may have
    // closepath commands which differs in behavior from "manually" closing a path (what sourceMorphable does)
    // For more details, see: https://www.w3.org/TR/SVG11/paths.html#PathDataClosePathCommand
    if (pos === 0 || !(this.destination && this.sourceMorphable && this.destinationMorphable)) {
      return this
    } else if(pos === 1) {
      // destination is used here for the same reason stated above
      return this.destination
    } else {
      var sourceArray = this.sourceMorphable.value
        , destinationArray = this.destinationMorphable.value
        , array = [], pathArray = new SVG.PathArray()
        , i, il, j, jl

      // Animate has specified in the SVG spec
      // See: https://www.w3.org/TR/SVG11/paths.html#PathElement
      for (i = 0, il = sourceArray.length; i < il; i++) {
        array[i] = [sourceArray[i][0]]
        for(j=1, jl = sourceArray[i].length; j < jl; j++) {
          array[i][j] = sourceArray[i][j] + (destinationArray[i][j] - sourceArray[i][j]) * pos
        }
        // For the two flags of the elliptical arc command, the SVG spec say:
        // Flags and booleans are interpolated as fractions between zero and one, with any non-zero value considered to be a value of one/true
        // Elliptical arc command as an array followed by corresponding indexes:
        // ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
        //   0    1   2        3                 4             5      6  7
        if(array[i][0] === 'A') {
          array[i][4] = +(array[i][4] != 0)
          array[i][5] = +(array[i][5] != 0)
        }
      }

      // Directly modify the value of a path array, this is done this way for performance
      pathArray.value = array
      return pathArray
    }
  }
})
