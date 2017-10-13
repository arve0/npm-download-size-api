const express = require('express')

const app = express()

app.use('/api', require('./index'))

app.listen(3000)
