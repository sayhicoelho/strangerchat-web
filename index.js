const express = require('express')
const bodyParser = require('body-parser')
const app = express()

app.set('view engine', 'ejs')

app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.render('chat')
})

app.listen(8080, () => console.log('Strangerchat app listening on port 8080!'))
