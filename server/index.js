import express from "express"
import logger from "morgan"

const port = process.env.PORT ?? 1234
const app = express()
app.use(logger('dev'))

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/client/index.html")
})

app.listen(port, () => {
	console.log(`http://localhost:${port}`)
})
