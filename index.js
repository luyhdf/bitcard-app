let currentDirHandle = null;
let currentFileHandle = null;

// 获取DOM元素
const readFileBtn = document.getElementById('readFileBtn');
const saveAsFileBtn = document.getElementById('saveAsFileBtn');
const openFolderBtn = document.getElementById('openFolderBtn');
const showHiddenFiles = document.getElementById('showHiddenFiles');
const fileInfo = document.getElementById('fileInfo');
const fileContent = document.getElementById('fileContent');
const folderInfo = document.getElementById('folderInfo');
const folderContent = document.getElementById('folderContent');
const currentPath = document.getElementById('currentPath');
const toast = document.getElementById('toast');

// 显示提示信息
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = `toast ${isError ? 'error' : ''} show`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// 读取文件内容
async function readFile(fileHandle) {
    try {
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        fileInfo.textContent = `文件名: ${file.name}\n大小: ${formatFileSize(file.size)}\n修改时间: ${new Date(file.lastModified).toLocaleString()}`;
        fileContent.value = content;
        
        currentFileHandle = fileHandle;
        showToast('文件读取成功');
    } catch (error) {
        showToast('读取文件失败: ' + error.message, true);
    }
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
            showToast(showHiddenFiles.checked ? '已显示隐藏文件' : '已隐藏隐藏文件');
        } catch (error) {
            console.error('切换显示隐藏文件时出错:', error);
            showToast('切换显示隐藏文件失败: ' + error.message, true);
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
                console.log('隐藏文件:', entry.name); // 调试用
                continue;
            }
            
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
                
                // 添加点击事件
                div.addEventListener('click', async () => {
                    // 移除其他选中项
                    document.querySelectorAll('.folder-entry.selected').forEach(el => {
                        el.classList.remove('selected');
                    });
                    // 添加当前选中项
                    div.classList.add('selected');
                    
                    // 读取文件
                    await readFile(entry);
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
        showToast('刷新文件列表失败: ' + error.message, true);
    }
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
            showToast('出于安全考虑，请在主窗口中打开此页面', true);
        } else {
            showToast('打开文件夹失败: ' + error.message, true);
        }
    }
});

// 读取文件按钮
readFileBtn.addEventListener('click', async () => {
    try {
        const [fileHandle] = await window.showOpenFilePicker();
        await readFile(fileHandle);
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