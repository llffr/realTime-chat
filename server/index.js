import express from "express"
import logger from "morgan"
//tursodb
import { createClient } from "@libsql/client"

import { Server } from "socket.io"
import { createServer } from "node:http"

const port = process.env.PORT ?? 1234
const app = express()
const server = createServer(app)
const io = new Server(server, {
	connectionStateRecovery: {}, // evitar no perder informacion | usuario offline
})

// turso db
const db = createClient({
	url: process.env.DB_URL,
	authToken: process.env.DB_TOKEN
})

await db.execute(`create table if not exists messages(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	content TEXT,
	user TEXT
);`)

// evento del server
// Emitir el evento a todos los clientes que tenemos conectados:
io.on("connection", async (socket) => {
	console.log("user connected")
	const username = socket.handshake.auth.username?.trim() || "anonymous"

	// comunicacion cliente a servidor y servidos a clientes
	// guarda cada mensage enviado
	socket.on("chat message", async (msg) => {

		if (!msg?.trim()) return

		let result
		let username = socket.handshake.auth.username ?? "anonymous"
		try {
			result = await db.execute({
				sql: "insert into messages (content, user) values(:msg, :username);",
				args: { msg, username }
			})
		} catch (e) {
			console.log(e)
			return
		}

		io.emit('chat message', msg, result.lastInsertRowid.toString(), username)
	})

	//recuperar mensajes si el usuario perdio conexion
	if (!socket.recovered) {
		try {
			const results = await db.execute({
				sql: "select id, content, user from messages where id>?",
				args: [socket.handshake.auth.serverOffset ?? 0]
			})
			results.rows.forEach(row => {
				socket.emit("chat message", row.content, row.id.toString(), row.user)
			})
		} catch (e) {
			console.log(e)
		}
	}
})

app.use(logger('dev'))

app.get("/", (req, res) => {
	res.sendFile(process.cwd() + "/client/index.html")
})

server.listen(port, () => {
	console.log(`http://localhost:${port}`)
})
