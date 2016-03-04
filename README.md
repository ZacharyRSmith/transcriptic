# Transcriptic

> My solution to a coding challenge from Transcriptic.

> [Here is the prompt](image_tiling.md).

## Table of Contents

1. [Usage](#usage)
1. [Development](#development)
    1. [Installing Dependencies](#installing-dependencies)

## Usage

### A script that transforms a given image into a set of tile images.

```
example command:
  ./create_tiles super_large.png
```

### A web server with the given endpoints:

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

NOTE: All API endpoints should respond within 250ms.

### Running the server:

- Manually run `app/index.js` or run `npm start` to spin up a one-off node process of `app/index.js`, or `npm run dev` to spin up a nodemon process of the same.

## Development

### Installing Dependencies

From within the root directory:

```sh
npm install
```
