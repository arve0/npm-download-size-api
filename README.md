# npm download size
API for [npm download size](https://arve0.github.io/npm-download-size).

## Usage
```sh
npm i arve0/npm-download-size-api
```

```js
const express = require('express')
const app = express()
const api = require('npm-download-size-api')

app.use('/api', api)

app.listen(process.env.PORT || 3000)
```

```sh
curl localhost:3000/api/package
```

## License
MIT
