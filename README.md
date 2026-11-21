# mistral-chat

Mini application de chat avec l'API Mistral, en TypeScript.

- Modèle : `mistral-small-latest`
- SDK officiel : [@mistralai/mistralai](https://www.npmjs.com/package/@mistralai/mistralai)
- La clé `MISTRAL_API_KEY` reste côté serveur, jamais exposée au navigateur.

## Installation

```bash
npm install
cp .env.example .env
```

Puis renseignez votre clé dans `.env` :

```
MISTRAL_API_KEY=votre-cle-api-ici
```

## Lancement

```bash
npm run dev
```

L'interface est disponible sur http://localhost:3000.

Pour la production : `npm start` (le port se règle avec `PORT` dans `.env`).

## Structure

| Fichier | Rôle |
|---|---|
| `server.ts` | Serveur Express : sert l'interface et expose `POST /api/chat` |
| `public/index.html` | Interface de chat autonome |
| `.env.example` | Modèle de configuration |
