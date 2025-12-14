# lavage-auto

A full-stack web application built with Next.js, designed to manage aspects related to car wash services. It utilizes Supabase for robust user authentication and Prisma for efficient database interactions.

## Installation

Follow these steps to set up and run the project locally:

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/LeoLaborie/lavage-auto.git
    cd lavage-auto
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root of the project and add the following variables:
    ```env
    # Prisma Database Connection String
    DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

    # Supabase Project Credentials
    NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```
    Replace the placeholder values with your actual database and Supabase project credentials.

4.  **Set Up Database Schema**
    Apply your Prisma schema to your database:
    ```bash
    npx prisma db push
    ```

5.  **Start the Development Server**
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000`.

## Usage

Once the development server is running, you can access the application in your web browser.

Available scripts:

*   `npm run dev`: Starts the application in development mode with hot-reloading.
*   `npm run build`: Builds the application for production deployment.
*   `npm start`: Starts the Next.js production server after building.
*   `npm run lint`: Runs ESLint to check for code quality and style issues.

## Features

*   Full-stack web application developed with Next.js.
*   User authentication system powered by Supabase.
*   Database management facilitated by Prisma ORM.
*   Modern and responsive user interface built with React and Tailwind CSS.

## Tech Stack

*   **Languages**: TypeScript, JavaScript
*   **Frameworks**: Next.js, React, Tailwind CSS, Prisma
*   **Tools**: ESLint
*   **Package Manager**: npm

## Configuration

The project utilizes several configuration files for various aspects:

*   `.env`: Stores environment-specific variables, including database connection strings and API keys.
*   `next.config.js`: Configures Next.js settings, such as `reactStrictMode`.
*   `tailwind.config.js`: Defines Tailwind CSS customizations, including themes and plugins.
*   `postcss.config.js`: Configures PostCSS for processing CSS.
*   `tsconfig.json`: Specifies TypeScript compiler options for the project.
*   `.eslintrc.js`: Contains ESLint rules for maintaining code quality and consistency.

## API Documentation

No explicit public API endpoints or documentation are currently provided within this project.

## Contributing

Contributions are welcome! If you'd like to contribute, please follow these guidelines:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature-name`).
3.  Make your changes and ensure they adhere to the project's coding standards.
4.  Commit your changes with a clear and concise message (`git commit -m 'Add new feature'`).
5.  Push your branch to your forked repository (`git push origin feature/your-feature-name`).
6.  Open a Pull Request to the main repository, describing your changes in detail.

## License

This project does not currently specify a license.

## Badges

![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square)
![npm](https://img.shields.io/badge/Package%20Manager-npm-red?style=flat-square)