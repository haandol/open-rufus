# Web Frontend (`packages/web`)

This package contains the frontend web application for the OpenRufus project, built with Nuxt 3.

## Tech Stack

- **Framework:** [Nuxt 3](https://nuxt.com/) (Static Site Generation - SSG)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI Framework:** [DaisyUI v5](https://daisyui.com/) (using [Tailwind CSS](https://tailwindcss.com/))
- **Icons:** [PrimeIcons](https://primevue.org/icons/)
- **State Management:** [Pinia](https://pinia.vuejs.org/)
- **Utilities:** [Lodash](https://lodash.com/)
- **Linting/Formatting:** ESLint

## Core Features

- Real-time chat interface
- Product search and recommendation display

## Project Structure & Conventions

This project follows specific conventions outlined in the development guidelines:

- **Components:** PascalCase naming (`components/ui/BaseButton.vue` -> `<UiBaseButton />`), separation of layout (template) and visual (style tag) Tailwind classes.
- **Composables:** `use[Name]` naming convention.
- **State Management:** Pinia stores with `storeToRefs` for reactivity.
- **Data Fetching:** `useFetch`, `$fetch`, `useAsyncData` based on the use case.
- **Styling:** Primarily Tailwind CSS, with limited custom CSS in `<style>` tags.

## Setup

Ensure you have [Node.js](https://nodejs.org/) and [Yarn](https://yarnpkg.com/) installed.

Install the dependencies:

```bash
yarn install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
yarn dev
```

The application utilizes Nuxt's auto-imports for components and composables.

## Production

Build the application for production (generates static files in `.output/public`):

```bash
yarn build
```

Locally preview the production build:

```bash
yarn preview
```

## Deployment

The application is built as static files (SSG) and is intended for deployment on services like AWS S3 & CloudFront, Vercel, Netlify, or similar static hosting platforms.

Refer to the [Nuxt Deployment Documentation](https://nuxt.com/docs/getting-started/deployment) for more details on deploying Nuxt applications.
