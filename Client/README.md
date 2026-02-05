# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # Client (React + Vite)

  ## Local Development

  ```bash
  cd Client
  npm install
  npm run dev
  ```

  The app runs at http://localhost:5173

  ### API Base URL
  By default the frontend calls http://localhost:5058. To override:

  ```bash
  VITE_API_BASE_URL=http://localhost:8080 npm run dev
  ```

  ## Docker (Production Build)

  The frontend is built and served by nginx via docker-compose.

  ```bash
  cd ..
  docker-compose up --build
  ```

  The app runs at http://localhost:3000

  To change the API URL used in the container, update the build arg in docker-compose.yml:

  ```yaml
  services:
    frontend:
      build:
        args:
          VITE_API_BASE_URL: "http://localhost:8080"
  ```
      // Enable lint rules for React
