# CWE Analyzer

**CWE Analyzer** is a Visual Studio Code extension that sends C/C++ source files to a remote API for automated vulnerability classification (CWE labels). When activated, the extension packages your source code into a ZIP and performs an HTTP POST to a configurable endpoint. The server returns a JSON array of CWE identifiers, and the extension displays them in a notification.

---

## How It Works (Client-Server)

1. **Scan & Collect**  
   When you invoke **“Scan project for CWE”**, the extension searches your workspace for all `*.c`, `*.cpp`, and `*.h` files.

2. **Create ZIP Archive**  
   All found source files are added into a temporary ZIP file (e.g. `project.zip` in the OS temp directory).

3. **Send HTTP POST**  
   The extension constructs an HTTP POST request using `multipart/form-data` and attaches the ZIP under the form field `file`.

4. **Remote Server Inference**  
   Your API endpoint (FastAPI, Flask, Node.js, etc.) must:  
   - Accept a `POST /classify` request with a `file` field containing the ZIP.  
   - Unpack the ZIP, run the CWE classification pipeline (tokenization, model inference, postprocessing).  
   - Return a JSON payload with a top-level key `vulnerabilities`, for example:  
     ```json
     {
       "vulnerabilities": ["CWE-119", "CWE-120", "CWE-469"]
     }
     ```

5. **Parse & Display Results**  
   The extension reads the server’s JSON response, extracts the array under `vulnerabilities`, and shows a VS Code information message 

---

## Installation and Setup

1. **Clone or download the extension repository**  
   ```bash
   git clone https://github.com/yourusername/cwe-analyzer-vscode.git
   cd cwe-analyzer-vscode
    ```
2. **Update the API endpoint in extension.ts**
    - Open `src/extension.ts` (or `extension.ts` if no src folder exists).
    - Locate the line:
        ```bash
        const apiUrl = 'http://localhost:8000/classify';
        ```
    - Replace it with your own endpoint, for example:
        ```bash
        const apiUrl = 'https://api.yourserver.com/v1/classify';
        ```
        **NOTE**: inference pipeline from [this repository](https://github.com/miglss/cwe-server) must be deployed on your endpoint
    - Install Node.js dependencies and compile TypeScript:
        ```bash
        npm install
        npm run compile
        ```
    - Package the extension into a .vsix:
        ```bash
        npm install -g vsce
        vsce package
        ```
3. **Install the generated VSIX in VS Code**
    - Open VS Code
    - Press `Ctrl+Shift+P` and select **Extensions: Install from VSIX....**
    - Choose the `cwe-analyzer-*.vsix` file you just created
    - After installation, you will see **“CWE Analyzer”** in your Extensions list
4. **Use the extension**
    - Open a folder containing C/C++ source files
    - Press `Ctrl+Shift+P`, type **“Scan project for CWE”**, and press Enter
    - The extension will ZIP all `*.c`, `*.cpp`, `*.h` files, send them to your configured API, and display the returned CWE list in a notification
