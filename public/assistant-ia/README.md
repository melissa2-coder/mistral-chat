# Clairva — Assistant IA au quotidien

Site web statique qui exploite l'intelligence artificielle pour les tâches de tous les jours :

- 📄 **Résumé** de texte (court, moyen ou détaillé)
- 📝 **Correction de CV** : fautes, formulations, points forts, suggestions
- 🌍 **Traduction** (détection automatique ou langue source choisie, 6+ langues)
- 💬 **Questions-réponses** en chat avec historique

## Démarrage

Aucune installation nécessaire — ouvrez simplement `index.html` dans votre navigateur.

Ou servez le dossier localement :

```bash
python3 -m http.server 8080
# puis ouvrez http://localhost:8080
```

## Configuration de l'IA

1. Cliquez sur **« Clé API »** en haut à droite.
2. Choisissez le fournisseur :
   - **Mistral AI** : créez une clé sur [console.mistral.ai](https://console.mistral.ai) → API Keys (essai gratuit disponible).
   - **OpenAI** : créez une clé sur [platform.openai.com](https://platform.openai.com) → API Keys.
3. Collez la clé et enregistrez.

La clé est stockée **uniquement dans votre navigateur** (localStorage). Le site n'a aucun serveur : vos textes vont directement au fournisseur d'IA choisi.

## Structure

| Fichier      | Rôle                                            |
| ------------ | ----------------------------------------------- |
| `index.html` | Page unique : hero, outils, FAQ, modale réglages |
| `styles.css` | Design (fond clair, bleu primaire, responsive)   |
| `app.js`     | Onglets, appels API en streaming, chat, copie    |

## Confidentialité

- Aucune donnée n'est stockée par le site (pas de backend, pas de base de données).
- Les textes envoyés transitent uniquement entre votre navigateur et le fournisseur d'IA via HTTPS.
- Vous pouvez supprimer la clé à tout moment depuis la fenêtre de réglages.
