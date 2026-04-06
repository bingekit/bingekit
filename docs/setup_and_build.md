# BingeKit Setup Guide

## Prerequisites

Ensure you have the following installed/downloaded before setting up the repository:
- **Bun**
- **AutoHotkey v2 (AHK2)**
- **Ahk2Exe** (AutoHotkey v2 Compiler)

## Setup

1. Navigate to the `gui` directory and install the required frontend dependencies:
   ```bash
   cd gui
   bun install
   ```

## Development

During development (especially when working with styling, creating new components, or modifying Tailwind utility classes), you should run the Tailwind CSS watcher. From the `BingeKit\gui` directory, use:
```bash
bunx @tailwindcss/cli -i ./src/index.css -o ./src/output.css --watch
```

### Running the Application

To run the application during development:

1. Start the frontend development server:
   ```bash
   cd gui
   bun dev
   ```
2. Then, run the main AutoHotkey host script:
   Launch `host/main.ahk`

## Building

To compile the project into a standalone executable:
1. Open `build.ahk` located in the root directory.
2. Set the correct file locations for both your `Ahk2Exe` compiler and the `AutoHotkey` (AHK2) executable within the script.
3. Run `build.ahk` to build the application.
