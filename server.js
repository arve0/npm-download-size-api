const express = require('express')

const app = express()

app.use('/', require('./'))

app.listen(process.env.PORT || 3000)
