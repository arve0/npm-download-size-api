const express = require('express')

const app = express()

app.use('/', require('./v2'))

app.listen(3000)
