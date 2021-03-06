[**>>> Click here for a live preview <<<**](https://cgmi.github.io/complex-log-projection/)

# Complex Log Projection

This repo implements a showcase for complex logarithmic views for geo polygons.
The actual projection is implemented in another repository:
https://github.com/biosmanager/d3-geo-polygon/

The idea is based on the following papers:

* [Detail‐In‐Context Visualization for Satellite Imagery](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-8659.2008.01156.x)
* [Complex Logarithmic Views for Small Details in Large Contexts](https://ieeexplore.ieee.org/abstract/document/4015438)

## Usage

1. Clone this repository with its submodules

   ```shell
   git clone --recurse-submodules https://github.com/cgmi/complex-log-projection.git
   ```

2. Install [yarn](https://yarnpkg.com/lang/en/)
3. Install all dependencies of the project

   ```shell
   yarn install
   ```

4. Start the dev server by

   ```shell
   yarn dev
   ```

   or run production by

   ```shell
   yarn build
   ```

   You can use `--public-url <path>` to specify the public URL to serve on. See [Parcel CLI](https://parceljs.org/cli.html) for more information and the yarn scripts below. Use `yarn build-local` to build a production bundle that can be used locally without a webserver.

4. Navigate your browser to [localhost:1234](http://localhost:1234)

## yarn scripts

Usage: `yarn run <script>` or `yarn <script>`

| Script              | Description                                                                                                             |
|---------------------|-------------------------------------------------------------------------------------------------------------------------|
| `dev`               | Starts development server                                                                                               |
| `build`             | Builds for production, public URL: `/`                                                                                  |
| `build-local`       | Builds for production, runs locally without a webserver, public URL: `./`                                               |
| `build-github`      | Builds for production and deployment as a GitHub page, public URL: `/complex-log-projection/`                           |
| `deploy`            | Deploys the current build from `build/github` to the [live GitHub page](https://cgmi.github.io/complex-log-projection/) |
| `test`              | Runs all tests                                                                                                          |

## Visual Studio Code specifics

This repository comes with a launch configuration for VS Code to debug using the [Google Chrome debugger](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome).
