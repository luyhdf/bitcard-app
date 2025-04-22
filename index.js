let currentDirHandle = null;
let currentFileHandle = null;

// 获取DOM元素
const saveAsFileBtn = document.getElementById('saveAsFileBtn');
const saveFileBtn = document.getElementById('saveFileBtn');
const openFolderBtn = document.getElementById('openFolderBtn');
const showHiddenFiles = document.getElementById('showHiddenFiles');
const fileInfo = document.getElementById('fileInfo');
const fileContent = document.getElementById('fileContent');
const folderInfo = document.getElementById('folderInfo');
const folderContent = document.getElementById('folderContent');
const currentPath = document.getElementById('currentPath');
const toast = document.getElementById('toast');
const saveFileTip = document.getElementById('saveFileTip');
const saveAsFileTip = document.getElementById('saveAsFileTip');
const openFileTip = document.getElementById('openFileTip');

// 显示提示信息
function showTip(element, message, isError = false) {
    element.textContent = message;
    element.className = `button-tip ${isError ? 'error' : ''} show`;
    setTimeout(() => {
        element.className = 'button-tip';
    }, 3000);
}

// 检查是否是隐藏文件
function isHiddenFile(name) {
    // Windows 系统隐藏文件判断
    if (name.startsWith('.') || 
        name === 'System Volume Information' || 
        name === '$RECYCLE.BIN' || 
        name === 'System Volume Information' ||
        name.toLowerCase() === 'thumbs.db') {
        return true;
    }
    return false;
}

// 监听显示隐藏文件开关变化
showHiddenFiles.addEventListener('change', async () => {
    if (currentDirHandle) {
        try {
            await refreshFileList();
            showTip(toast, showHiddenFiles.checked ? '已显示隐藏文件' : '已隐藏隐藏文件');
        } catch (error) {
            console.error('切换显示隐藏文件时出错:', error);
            showTip(toast, '切换显示隐藏文件失败: ' + error.message, true);
        }
    }
});

// 刷新文件列表
async function refreshFileList() {
    if (!currentDirHandle) return;
    
    folderContent.innerHTML = '';
    
    try {
        // 遍历文件夹内容
        for await (const entry of currentDirHandle.values()) {
            // 如果隐藏文件开关关闭，且是隐藏文件，则跳过
            if (!showHiddenFiles.checked && isHiddenFile(entry.name)) {
                continue;
            }
            
            const div = document.createElement('div');
            div.className = 'folder-entry';
            
            if (entry.kind === 'file') {
                const file = await entry.getFile();
                const fileName = entry.name || file.name;
                div.innerHTML = `
                    <div class="file-item">
                        <span class="file-name">📄 ${fileName}</span>
                        <span class="file-size">${formatFileSize(file.size)}</span>
                        <span class="file-date">${new Date(file.lastModified).toLocaleString()}</span>
                    </div>
                `;
                
                // 添加点击事件
                div.addEventListener('click', async () => {
                    // 如果当前选中的是同一个文件，则不处理
                    if (currentFileHandle && currentFileHandle.name === fileName) {
                        return;
                    }

                    // 移除其他选中项
                    document.querySelectorAll('.folder-entry.selected').forEach(el => {
                        el.classList.remove('selected');
                    });
                    // 添加当前选中项
                    div.classList.add('selected');
                    
                    try {
                        const file = await entry.getFile();
                        const content = await file.text();
                        
                        fileInfo.textContent = `文件名: ${fileName}\n大小: ${formatFileSize(file.size)}\n修改时间: ${new Date(file.lastModified).toLocaleString()}`;
                        fileContent.value = content;
                        
                        currentFileHandle = entry;
                        showTip(openFileTip, `已打开文件: ${fileName}`);
                    } catch (error) {
                        showTip(openFileTip, '打开文件失败: ' + error.message, true);
                    }
                });
            } else if (entry.kind === 'directory') {
                div.innerHTML = `
                    <div class="folder-item">
                        <span class="folder-name">📁 ${entry.name}</span>
                    </div>
                `;
            }
            
            folderContent.appendChild(div);
        }
    } catch (error) {
        console.error('刷新文件列表时出错:', error);
        showTip(toast, '刷新文件列表失败: ' + error.message, true);
    }
}

// 打开文件夹
openFolderBtn.addEventListener('click', async () => {
    try {
        // 检查是否在主窗口中
        if (window.self !== window.top) {
            showTip(toast, '请在主窗口中打开此页面', true);
            return;
        }

        // 检查浏览器是否支持 File System Access API
        if (!window.showDirectoryPicker) {
            showTip(toast, '您的浏览器不支持文件夹选择功能，请使用最新版本的 Chrome 或 Edge 浏览器', true);
            return;
        }
        
        // 打开目录选择器
        currentDirHandle = await window.showDirectoryPicker({
            startIn: 'documents' // 从文档目录开始
        });
        
        folderInfo.style.display = 'block';
        
        // 显示当前文件夹路径
        currentPath.innerHTML = `<strong>当前路径：</strong>${currentDirHandle.name}`;
        
        // 刷新文件列表
        await refreshFileList();
        
    } catch (error) {
        if (error.name === 'AbortError') {
            // 用户取消选择，不显示错误
            return;
        }
        if (error.name === 'SecurityError') {
            showTip(toast, '出于安全考虑，请在主窗口中打开此页面', true);
        } else {
            showTip(toast, '打开文件夹失败: ' + error.message, true);
        }
    }
});

// 保存文件
saveFileBtn.addEventListener('click', async () => {
    if (!fileContent.value) {
        showTip(saveFileTip, '没有内容可保存', true);
        return;
    }

    if (!currentFileHandle) {
        showTip(saveFileTip, '请先打开或另存为文件', true);
        return;
    }

    try {
        const writable = await currentFileHandle.createWritable();
        await writable.write(fileContent.value);
        await writable.close();
        showTip(saveFileTip, '文件保存成功');
    } catch (error) {
        showTip(saveFileTip, '保存文件失败: ' + error.message, true);
    }
});

// 保存文件
saveAsFileBtn.addEventListener('click', async () => {
    if (!fileContent.value) {
        showTip(saveAsFileTip, '没有内容可保存', true);
        return;
    }

    try {
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: currentFileHandle ? currentFileHandle.name : 'untitled.txt',
            types: [{
                description: '文本文件',
                accept: {
                    'text/plain': ['.txt']
                }
            }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(fileContent.value);
        await writable.close();
        
        currentFileHandle = fileHandle;
        showTip(saveAsFileTip, '文件保存成功');
    } catch (error) {
        if (error.name !== 'AbortError') {
            showTip(saveAsFileTip, '保存文件失败: ' + error.message, true);
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