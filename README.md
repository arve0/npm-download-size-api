# npm download size
API for [download-size](https://github.com/arve0/download-size).

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
