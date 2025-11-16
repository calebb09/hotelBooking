# Hotel Booking API

RESTful API for hotel and accommodation bookings — a Node.js + Express backend using MongoDB.

**Status:** Development

**Requires:** Node >= 22.21.0, MongoDB

## Quickstart

- Clone the repo:

```powershell
git clone <repo-url>
cd hotelBooking
```

- Install dependencies:

```powershell
npm install
```

- Create an `.env` file in the project root (see Environment variables below).

- Start the server:

```powershell
npm start
```

The API entrypoint is `app.js` by default.

## Scripts

- `npm start` — Starts the server (`node app.js`).
- `npm run docs` — Generate API docs using `apidoc` from the `routes/` folder.
- `npm test` — Placeholder test script (no tests configured).

## Environment variables

Create a `.env` with at least the following keys (names here are suggestions based on common patterns used by the project):

- `PORT` — port to run the server (default 3000)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWTs
- `STRIPE_KEY` — Stripe API key (if using Stripe)
- `CHAPA_API_KEY` — Chapa/Payments API key (if applicable)
- `FIREBASE_*` — Firebase config values (if push notifications are used)

Note: This project keeps configuration files under `config/` (e.g., `config/db.js`, `config/index.js`, `config/ssl.js`, `config/swagger.js`) — review them for exact env var names.

## Architecture & Key Directories

- `app.js` — application entrypoint
- `config/` — environment, DB and SSL configuration
- `src/controllers/` — route controllers (booking, user, room, payment, etc.)
- `src/dal/` — data access layer
- `src/models/` — Mongoose models
- `routes/` — API route definitions
- `lib/` and `utils/` — helpers and utilities
- `services/` — third-party integrations (Amadeus, Chapa, Telegram, etc.)
- `jobs/` — scheduled jobs and cron tasks

## Important Files

- `app.js` — bootstraps Express and middleware
- `package.json` — lists scripts and dependencies (Node engine >= 22.21.0)
- `templates/views/` — email templates and styles

## Generating API Docs

Generate API documentation (requires `apidoc`):

```powershell
npm run docs
```

Docs output will be written to the `docs` folder (see `package.json` script).

## Running in Development

- Recommended: use a process manager or `nodemon` (install globally or as a dev dependency) for auto-reload during development:

```powershell
npm i -D nodemon
npx nodemon app.js
```

## Notes on Payments & Integrations

This project includes integrations for several payment providers and services (see `src/services/` and `src/functions/`):

- Chapa
- Stripe
- TransferWise / Wise
- Firebase (push notifications)

Review `src/functions/` and `src/services/` for concrete implementation details and required credentials.

## Contributing

- Fork and create a feature branch: `git checkout -b feature/your-feature`
- Run linters/tests locally (no tests configured currently)
- Open a pull request describing the change

## Troubleshooting

- If Mongo fails to connect, verify `MONGO_URI` and network access to MongoDB.
- Check `config/` files for environment-specific overrides.

## License

This project is licensed under the `MIT` license (see `LICENSE`).

## Contact

Author: Caleb Bogale <calebb090@gmail.com>

---

If you'd like, I can:
- Add a `.env.example` with common variables,
- Add a simple dev `nodemon` script to `package.json`, or
- Generate `apidoc` documentation and commit it under `docs/`.

# hotelBooking