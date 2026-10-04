# GameBox — EmulatorJS Browser Game Library

This is a browser-based ROM library and EmulatorJS frontend.

## Features

- Add game files from a phone or computer.
- Stores the game in IndexedDB in that browser.
- Library menu with search and system filtering.
- Play a saved game without selecting the file again.
- Delete games from the library.
- Mobile-friendly layout and touch controls supplied by EmulatorJS.
- Uses EmulatorJS from its current CDN.

EmulatorJS's current CDN provides the loader and core data used by this project.

## Run

For local development:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

For a phone, put this folder on an HTTPS static host such as your own web hosting/GitHub Pages, then open the site's URL in Safari.

## Important

The game files are stored in the browser's IndexedDB. They are not uploaded to a server by this project.

Clearing the site's browser data can remove the saved library.

The emulator engine itself is loaded from the EmulatorJS CDN, so internet access is required when launching games unless you later self-host the EmulatorJS assets.

Only use game files you have the legal right to use.
