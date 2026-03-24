package main

import (
	"context"
	"encoding/json"
	"math/rand"
	"time"
)

type Bot struct {
	cancel context.CancelFunc
}

type ClickEvent struct {
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	Color string  `json:"color"`
	Type  string  `json:"type"`
}

var colors = []string{"#ff0000", "#ffff00", "#00ff00", "#0000ff", "#ffffff"} 

func newClickEvent() *ClickEvent {
	return &ClickEvent{
		X: rand.Float64(),
		Y: rand.Float64(),
		Color: colors[rand.Intn(len(colors))],
		Type: "click",
	}
}

// random click every 5-30s
func (b *Bot) Run(ctx context.Context, room *Room) {
	for {
		delayTime := rand.Intn(25000) + 5000
		delay := time.Duration(delayTime) * time.Millisecond
		select {
		case <- ctx.Done():
			return
		case <- time.After(delay):
			EmitRandomEvent(room)
		}
	}
}

func EmitRandomEvent(room *Room) {
	clickEvent := newClickEvent()
	payload, _ := json.Marshal(clickEvent)
	for client := range room.clients {
		client.send <- payload
	}
}