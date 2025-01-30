import express from "express"
import logger from "morgan"

import { Server } from "socket.io"
import { createServer } from "node:http"

const port = process.env.PORT ?? 1234
const app = express()
const server = createServer(app)
const io = new Server(server)

io.on("connection", (socket) => {
	console.log("user connected")

	//comunicacion cliente a servidor | servidos a clientes
	socket.on("chat message", (msg) => {
		console.log(msg)
		io.emit("chat message", msg)
	})
})


app.use(logger('dev'))

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/client/index.html")
})

server.listen(port, () => {
	console.log(`http://localhost:${port}`)
})
