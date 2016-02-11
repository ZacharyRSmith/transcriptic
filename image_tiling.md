# Image Tiling Server for Large Images

## Overview

In Biology, specifically microscopy, it is quite common to generate extremely large images.
Downloading these images becomes impractical as the number of downloads increases.
A better approach is to allow the user to pan and zoom around this mega-image so that
only part of the image needs to be downloaded.

Your task is to create a simplified Google Maps.  Specifically:
 - Build a server that allows a user to query for a specific region of the photo at a specified ZoomLevel.
 - Build a UI, that runs in the browser, that lets the user interact with the image data.

Assuming that these images might not fit into memory, you must first preprocess the image
and create a TileSet for each ZoomLevel for quicker loading.  TileSet and ZoomLevel
are defined below.

Here is a large example image:

  [hubble](http://imgsrc.hubblesite.org/hu/db/images/hs-2015-02-a-full_jpg.jpg)

Please feel free to code in whatever language you are most comfortable.
We are interested in seeing your coding style and structure.

## Definitions

- ZoomLevel:
    An integer identifier that is used to choose which TileSet to
    query from.  The lower the ZoomLevel the lower the resolution
    of the TileSet image.

- Tile:
    A rectangular subsection of an image uniquely identified by its
    ZoomLevel, width, height and origin.  By stitching together all
    of the tiles at a given ZoomLevel the original image can be recreated.

- TileSet:
    A collection of tiles that can be used to stitch together
    any portion of the image.

## Frontend Requirements

1. The UI must run in a web browser, though don't stress trying to make it
   run in all browsers.

2. The users must be able to pan, zoom in, and zoom out.

3. Please avoid using libraries like leaflet, which offer a complete frontend solution.
   We are interested in seeing your code for fetching, stitching, and displaying the tile
   images as well as the UI interaction handlers.


## Server Requirements

1. A script that transforms a given image into a set of tile images.
   It is perfectly fine to use image processing libraries, but
   please avoid using any image tiling software.

       ```
       example command:
         ./create_tiles super_large.png
       ```

2. A web server with the given endpoints:

   GET /zoom-levels

   - Returns the number of tile rows and columns for each ZoomLevel.

       ```
       {
         '0': {rows: 1,  cols: 1},
         '1': {rows: 2,  cols: 2},
         '2': {rows: 4,  cols: 4},
         '3': {rows: 8,  cols: 8},
         '4': {rows: 16, cols: 16}
       }
       ```


   GET /tile?row=2&col=3&zoom=3

   - Returns the tile at the specified row, column, and ZoomLevel.


## NOTES

  - All API endpoints should respond within 250ms.
