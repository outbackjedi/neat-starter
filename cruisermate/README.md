# CruiserMate landing page

A static landing page for **CruiserMate**, a factory-look OBD2 logger with a touch bar display and app control, built for the 70 Series Land Cruiser.

There's no build step. Open `index.html` in a browser, or serve the folder:

```
npx serve .
```

- `index.html`: page markup
- `styles.css`: styles (dark, factory-matte theme with an amber accent)
- `main.js`: live-simulated gauges, the gauge customiser, the app sparkline and the interest form

The interest form doesn't send anything yet. Connect it to a form service (for example Netlify Forms or Formspree) before launch.
