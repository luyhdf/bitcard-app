let currentFilePath = null;

// 获取DOM元素
const readFileBtn = document.getElementById('readFileBtn');
const saveFileBtn = document.getElementById('saveFileBtn');
const saveAsFileBtn = document.getElementById('saveAsFileBtn');
const fileContent = document.getElementById('fileContent');
const fileInfo = document.getElementById('fileInfo');
const toast = document.getElementById('toast');

// Toast提示函数
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 读取文件
document.getElementById('readFileBtn').addEventListener('click', async () => {
    try {
        const { invoke } = await import('@tauri-apps/api/tauri');
        const filePath = await invoke('open_file');
        currentFilePath = filePath;
        
        const contents = await invoke('read_file', { path: filePath });
        document.getElementById('fileContent').value = contents;
        
        // 更新文件信息
        updateFileInfo(filePath);
        showToast('文件读取成功');
    } catch (error) {
        showToast(error, true);
    }
});

// 保存文件
document.getElementById('saveFileBtn').addEventListener('click', async () => {
    if (!currentFilePath) {
        showToast('请先选择文件', true);
        return;
    }
    
    try {
        const { invoke } = await import('@tauri-apps/api/tauri');
        const contents = document.getElementById('fileContent').value;
        await invoke('save_file', { 
            path: currentFilePath,
            contents: contents
        });
        showToast('文件保存成功');
    } catch (error) {
        showToast(error, true);
    }
});

// 另存为
saveAsFileBtn.addEventListener('click', async () => {
    try {
        const fileHandle = await window.showSaveFilePicker({
            types: [{
                description: '文本文件',
                accept: {
                    'text/plain': ['.txt'],
                }
            }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(fileContent.value);
        await writable.close();
        currentFilePath = fileHandle.name;
        updateFileInfo(fileHandle.name);
        showToast('文件保存成功！');
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('保存文件失败', error);
            showToast('保存文件失败：' + error.message, true);
        }
    }
});

// 更新文件信息显示
function updateFileInfo(filePath) {
    fileInfo.innerHTML = `文件路径：${filePath}`;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 