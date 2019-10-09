# Complex Log Projection

This repo implements a complex log view for geo polygons.

The idea is based on the following papers:

* [Detail‐In‐Context Visualization for Satellite Imagery](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-8659.2008.01156.x)
* [Complex Logarithmic Views for Small Details in Large Contexts](https://ieeexplore.ieee.org/abstract/document/4015438)

## Usage

1. Install [yarn](https://yarnpkg.com/lang/en/)
2. Install all dependencies of the project

   ```shell
   yarn install
   ```

3. Start the dev server by

   ```shell
   yarn dev
   ```

   or run production by

   ```shell
   yarn build
   ```

   You can use `--public-url <path>` to specify the public URL to serve on. See [Parcel CLI](https://parceljs.org/cli.html) for more information. Use `yarn build --build-url ./` to build a production bundle that can be used locally without a webserver.

4. Navigate your browser to [localhost:1234](http://localhost:1234)

## Visual Studio Code specifics

This repository comes with a launch configuration for VS Code to debug using the [Google Chrome debugger](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome).
