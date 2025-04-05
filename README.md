# X-SCRAPER-backend
A powerful Node.js tool designed for scraping the latest assets from the web version of the [x.com](https://x.com/) platform that tracks platform flags and monitor changes across multiple release platforms with ease.

## Features
- Scrape and download the latest assets from x.com.
- Track platform flags across multiple releases (Web, Android, iOS / Stable, Beta, Alpha).

## Requirements
- Node.js (23.6.0)
- npm (10.9.2)

## Installation
1. Clone the repository:
    ```bash
    git clone https://github.com/DzikStar/X-SCRAPER-backend.git
    ```
2. Navigate to the project directory:
    ```bash
    cd X-SCRAPER-backend
    ```
3. Install dependencies:
    ```bash
    npm install
    ```

## Usage
1. Configure xscraper.config.json.
2. Rename `.env.example` to `.env` and setup all required elements.
3. Build X-SCRAPER tool
```bash
node run build
```
4. Run X-SCRAPER
```bash
node run start
```

## Contributing
Contributions are welcome! Feel free to fork the repository and submit a pull request.

## License
This project is licensed under the [MIT License](LICENSE).