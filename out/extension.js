"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const archiver_1 = __importDefault(require("archiver"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const form_data_1 = __importDefault(require("form-data"));
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.sendZipToAPI', async () => {
        try {
            // 1. Поиск файлов с расширениями .c, .h, .cpp
            const files = await vscode.workspace.findFiles('**/*.{c,h,cpp}');
            if (files.length === 0) {
                vscode.window.showInformationMessage('Файлы для анализа не найдены.');
                return;
            }
            // 2. Создание временного ZIP-архива
            const zipPath = path.join(os.tmpdir(), 'project.zip');
            const output = fs.createWriteStream(zipPath);
            const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
            archive.on('error', (err) => { throw err; });
            archive.pipe(output);
            // Добавление файлов в архив с сохранением относительной структуры
            for (const file of files) {
                const relativePath = vscode.workspace.asRelativePath(file);
                archive.file(file.fsPath, { name: relativePath });
            }
            await archive.finalize();
            // 3. Создание FormData и добавление ZIP-архива
            const form = new form_data_1.default();
            form.append('file', fs.createReadStream(zipPath), {
                filename: 'project.zip',
                contentType: 'application/zip'
            });
            // 4. Отправка запроса на FastAPI сервер
            const apiUrl = 'http://127.0.0.1:8000/classify';
            console.log("Отправка запроса на: ", apiUrl);
            const response = await (0, node_fetch_1.default)(apiUrl, {
                method: 'POST',
                body: form // Заголовок Content-Type устанавливается автоматически
            });
            if (!response.ok) {
                throw new Error(`Ошибка API: ${response.statusText}`);
            }
            const result = await response.text();
            vscode.window.showInformationMessage(`CWE: ${result}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Ошибка: ${error}`);
        }
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map