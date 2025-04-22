let currentFileHandle = null;

// 获取DOM元素
const readFileBtn = document.getElementById('readFileBtn');
const saveFileBtn = document.getElementById('saveFileBtn');
const saveAsFileBtn = document.getElementById('saveAsFileBtn');
const openFolderBtn = document.getElementById('openFolderBtn');
const fileInfo = document.getElementById('fileInfo');
const fileContent = document.getElementById('fileContent');
const folderInfo = document.getElementById('folderInfo');
const folderContent = document.getElementById('folderContent');
const toast = document.getElementById('toast');

// 显示提示信息
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = `toast ${isError ? 'error' : ''} show`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// 打开文件夹
openFolderBtn.addEventListener('click', async () => {
    try {
        // 检查是否在主窗口中
        if (window.self !== window.top) {
            showToast('请在主窗口中打开此页面', true);
            return;
        }

        // 检查浏览器是否支持 File System Access API
        if (!window.showDirectoryPicker) {
            showToast('您的浏览器不支持文件夹选择功能，请使用最新版本的 Chrome 或 Edge 浏览器', true);
            return;
        }

        const dirHandle = await window.showDirectoryPicker();
        folderInfo.style.display = 'block';
        folderContent.innerHTML = '';
        
        // 显示当前文件夹路径
        const pathDiv = document.createElement('div');
        pathDiv.className = 'current-path';
        pathDiv.innerHTML = `<strong>当前路径：</strong>${dirHandle.name}`;
        folderContent.appendChild(pathDiv);
        
        // 遍历文件夹内容
        for await (const entry of dirHandle.values()) {
            const div = document.createElement('div');
            div.className = 'folder-entry';
            
            if (entry.kind === 'file') {
                const file = await entry.getFile();
                div.innerHTML = `
                    <div class="file-item">
                        <span class="file-name">📄 ${entry.name}</span>
                        <span class="file-size">${formatFileSize(file.size)}</span>
                        <span class="file-date">${new Date(file.lastModified).toLocaleString()}</span>
                    </div>
                `;
            } else if (entry.kind === 'directory') {
                div.innerHTML = `
                    <div class="folder-item">
                        <span class="folder-name">📁 ${entry.name}</span>
                    </div>
                `;
            }
            
            folderContent.appendChild(div);
        }
        
        showToast('文件夹打开成功');
    } catch (error) {
        if (error.name === 'AbortError') {
            // 用户取消选择，不显示错误
            return;
        }
        if (error.name === 'SecurityError') {
            showToast('出于安全考虑，请在主窗口中打开此页面', true);
        } else {
            showToast('打开文件夹失败: ' + error.message, true);
        }
    }
});

// 读取文件
readFileBtn.addEventListener('click', async () => {
    try {
        const [fileHandle] = await window.showOpenFilePicker();
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        fileInfo.textContent = `文件名: ${file.name}\n大小: ${formatFileSize(file.size)}\n修改时间: ${new Date(file.lastModified).toLocaleString()}`;
        fileContent.value = content;
        
        showToast('文件读取成功');
    } catch (error) {
        if (error.name !== 'AbortError') {
            showToast('读取文件失败: ' + error.message, true);
        }
    }
});

// 保存文件
saveAsFileBtn.addEventListener('click', async () => {
    try {
        const fileHandle = await window.showSaveFilePicker();
        const writable = await fileHandle.createWritable();
        await writable.write(fileContent.value);
        await writable.close();
        
        showToast('文件保存成功');
    } catch (error) {
        if (error.name !== 'AbortError') {
            showToast('保存文件失败: ' + error.message, true);
        }
    }
});

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 