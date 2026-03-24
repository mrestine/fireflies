# Fireflies

### a collaboratively zen ambient experience

About 200 fireflies will spawn in nicely, float around the screen and flicker a bit.
When the screen is clicked, the nearby fireflies become excited triggering color effects.

## How does it work?

### the stack

This is a vanilla TypeScript frontend (no React/Angular here) built with Vite. There is a Go backend to handle other users' clicks. No database is needed.

### the flies

The flies are divs. I decided against using canvas so I could rely on CSS animations for fly movement. Using `requestAnimationFrame` would cause the browser to run at its speed instead of giving me control over the flies' max speed. Instead, I run my movement ticks and other calculations every 150ms. The CSS animations for movement are just over 150ms, which leaves some headroom for number crunching that alleviates jitteriness.

I experimented with a few different ways to layer on the different effects (flicking and multiple triggers). I started with `box-shadow` on the the flies, but that ended up being too GPU-intensive because of the behind-the-scenes blur calculations. I wanted as many flies as possible without melting relatively recent hardware. I landed on radial-gradient instead because I could stack effects as needed without pushing my computer too hard. I also found that using `transform: translate()` was cheaper than using `position: absolute` with `top`/`left` for fly positioning.

I have also divided concurrent users into rooms with a max population of 4. To keep rooms equally populated, I fill rooms with bots that click around a bit and change colors from time to time. There's no definitive way to tell from the users' perspective if an actual human or bot is on the other end of the icoming click events, but that's the point.

There's not actually much reason for any of this to exist except for my own edification, but now I can share what I've learned.

Anyway, the Go backend is hosted on Render's free tier, and the frontend is hosted here on GitHub Pages to dodge the extra load time that can happen when Render has to wake up a sleeping app after it's been idle.
