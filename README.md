# npm download size
API for [npm download size](https://arve0.github.io/npm-download-size).

## Usage
```
const express = require('express')
const app = express()
const api = require('./index')

app.use('/api', api)

app.listen(3000)
```

```sh
curl localhost:3000/api/package
```

## License
MIT
