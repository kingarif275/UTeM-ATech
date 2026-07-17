# UTeM ATech

UTeM ATech is a web platform for discovering, hosting, and managing training activities, seminars, workshops, conferences, webinars, meetups, and learning collections.

The web app is built with React, Vite, and Firebase. It includes user profiles, trainer discovery, activity registration, collection publishing, admin moderation tools, and Firebase-backed authentication.

## Tech Stack

- React
- Vite
- Firebase Authentication
- Firebase Realtime Database
- Firebase Storage
- Firebase Hosting
- Firebase Cloud Functions

## Development

Install dependencies:

```bash
npm install
```

Run the local development server:

```bash
npm run dev
```

Run lint checks:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

## Firebase

Firebase configuration is defined in `src/firebase.js`.

Security rules are maintained in:

- `database.rules.json`
- `firestore.rules`
- `storage.rules`

Hosting configuration is maintained in `firebase.json`.
