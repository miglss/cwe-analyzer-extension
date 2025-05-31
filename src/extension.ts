import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import archiver from 'archiver';
import fetch from 'node-fetch';
import FormData from 'form-data';

export function activate(context: vscode.ExtensionContext) {
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
            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.on('error', (err: Error) => { throw err; });
            archive.pipe(output);

            // Добавление файлов в архив с сохранением относительной структуры
            for (const file of files) {
                const relativePath = vscode.workspace.asRelativePath(file);
                archive.file(file.fsPath, { name: relativePath });
            }

            await archive.finalize();

            // 3. Создание FormData и добавление ZIP-архива
            const form = new FormData();
            form.append('file', fs.createReadStream(zipPath), {
                filename: 'project.zip',
                contentType: 'application/zip'
            });

            // 4. Отправка запроса на FastAPI сервер
            const apiUrl = 'http://127.0.0.1:8000/classify';
            console.log("Отправка запроса на: ", apiUrl);
            const response = await fetch(apiUrl, {
                method: 'POST',
                body: form // Заголовок Content-Type устанавливается автоматически
            });

            if (!response.ok) {
                throw new Error(`Ошибка API: ${response.statusText}`);
            }

            const result = await response.text();
            vscode.window.showInformationMessage(`CWE: ${result}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Ошибка: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
