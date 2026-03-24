package main

import "context"

const MAX_USERS_PER_ROOM = 4

type BroadcastMessage struct {
	sender  *Client
	payload []byte
}

type Room struct {
	clients  map[*Client]bool
	bots     []*Bot
}

type Hub struct {
	rooms			 map[*Room]bool
	broadcast  chan BroadcastMessage
	register   chan *Client
	unregister chan *Client
}

func newHub() *Hub {
	return &Hub{
		rooms:			make(map[*Room]bool),
		broadcast:  make(chan BroadcastMessage, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		// client enter. add to room with < max clients or create new room
		case client := <-h.register:
			var roomToAdd *Room
			for room := range h.rooms {
				if len(room.clients) < MAX_USERS_PER_ROOM {
					roomToAdd = room
					// remove bot from existing room
					removeBotFromRoom(room)
					break
				}
			}
			if roomToAdd == nil {
				roomToAdd = &Room{clients: make(map[*Client]bool)}
				h.rooms[roomToAdd] = true
				// fill the rest of the room with bots
				for i := 0; i < 3; i++ {
					addBotToRoom(roomToAdd)
				}
			}
			client.room = roomToAdd
			roomToAdd.clients[client] = true

		// client leave. cancel bots and delete room if empty, otherwise add bot to replace user
		case client := <-h.unregister:
			room := client.room
			if room != nil {
				delete(room.clients, client)
				close(client.send)
				if len(room.clients) == 0 {
					for _, bot := range room.bots {                       
						bot.cancel()                                                                                                                                                                  
					}
					delete(h.rooms, room)
				} else {
					addBotToRoom(room)
				}
			}

		case msg := <-h.broadcast:
			for client := range msg.sender.room.clients {
				if client == msg.sender {
					continue
				}
				select {
				case client.send <- msg.payload:
				default:
					close(client.send)
					delete(msg.sender.room.clients, client)
				}
			}
		}
	}
}

func addBotToRoom(room *Room) {
	ctx, cancel := context.WithCancel(context.Background()) 
	bot := &Bot{cancel: cancel}
	room.bots = append(room.bots, bot)
	go bot.Run(ctx, room)
}

func removeBotFromRoom(room *Room) {
	if (len(room.bots) > 0) {
		room.bots[0].cancel()
		room.bots = room.bots[1:]
	}
}
