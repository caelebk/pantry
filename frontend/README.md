# Pantry Frontend Application

A modern inventory management and meal planning application built with Angular and Tailwind CSS.

## 🛠️ Technologies Used

This project leverages a robust stack of modern web technologies:

- **Framework:** [Angular v20](https://angular.dev) - A platform for building mobile and desktop web applications.
- **Styling:**
  - [Tailwind CSS v4](https://tailwindcss.com) - A utility-first CSS framework for rapid UI development.
  - [PrimeNG v20](https://primeng.org) - A rich set of open-source UI components for Angular.
  - [PrimeIcons](https://primeng.org/icons) - The icon library for PrimeNG.
- **Internationalization:** [Transloco](https://ngneat.github.io/transloco/) - The internationalization (i18n) library for Angular.
- **Code Quality:**
  - [ESLint](https://eslint.org/) - For identifying and reporting on patterns found in ECMAScript/JavaScript code.
  - [Prettier](https://prettier.io/) - An opinionated code formatter.
- **Testing:**
  - [Jasmine](https://jasmine.github.io/) & [Karma](https://karma-runner.github.io) - For unit testing.
  - [Playwright](https://playwright.dev/) - For reliable end-to-end (E2E) testing.
- **Utilities:**
  - [RxJS](https://rxjs.dev) - Reactive Extensions for JavaScript.

## 📂 Project Structure

The codebase is organized into a modular structure within `src/app`:

```text
src/app/
├── components/      # Shared, reusable UI components (Header, Stat Cards, Tabs, etc.)
├── models/          # TypeScript interfaces and DTO definitions
├── pages/           # Main application views
│   ├── dashboard/   # Dashboard view with summary stats and quick actions
│   ├── inventory/   # Inventory management interface
│   ├── meal-planner/# Meal planning functionality
│   └── recipes/     # Recipe management and displays
├── services/        # Angular services for API communication and state management
└── utility/         # Helper functions, mappers, and form utilities
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Development Server

Run the development server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

```bash
npm start
# or
ng serve
```

## 📜 Available Scripts

Here is a list of available `npm` commands:

| Command                | Description                                                  |
| :--------------------- | :----------------------------------------------------------- |
| `npm start`            | Starts the development server on port 4200.                  |
| `npm run build`        | Compiles the application into an output directory (`dist/`). |
| `npm test`             | Runs unit tests via [Karma](https://karma-runner.github.io). |
| `npx playwright test`  | Runs end-to-end tests via Playwright.                        |
| `npm run lint`         | Runs ESLint to check for code quality issues.                |
| `npm run lint:fix`     | Runs ESLint and attempts to automatically fix issues.        |
| `npm run format`       | Formats all supported files using Prettier.                  |
| `npm run format:check` | Checks if files are formatted according to Prettier rules.   |

## 🧪 End-to-End Testing

We use **Playwright** for E2E testing to ensure the application works as expected from a user's perspective.

### Running E2E Tests

1.  **Run all tests:**
    ```bash
    npx playwright test
    ```
2.  **Run with UI Mode (Interactive):**
    ```bash
    npx playwright test --ui
    ```
3.  **Show Test Report:**
    ```bash
    npx playwright show-report
    ```

> **Note:** E2E tests are configured to **mock the backend API**. You do not need the backend server running to run these tests.

## 📐 Code Style & Quality

We enforce code quality through **ESLint** and **Prettier**.

- **Linting:** We use standard Angular linting rules coupled with custom configurations. Always run `npm run lint` before committing.
- **Formatting:** Code style is consistent thanks to Prettier. You can format your code at any time with `npm run format`.
