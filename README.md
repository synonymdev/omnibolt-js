# omnibolt-js


## Install

```
yarn add git+ssh://git@github.com/synonymdev/omnibolt-js

or

npm i -S git+ssh://git@github.com/synonymdev/omnibolt-js
```

## Usage

```
import { ObdApi } from "omnibolt-js";

const obdapi = new ObdApi();
const connectResponse = await obdapi.connect();
```


