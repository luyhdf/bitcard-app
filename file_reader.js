let currentFileHandle = null;

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
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: '文本文件',
                accept: {
                    'text/plain': ['.txt'],
                }
            }]
        });
        currentFileHandle = fileHandle;
        const file = await fileHandle.getFile();
        const contents = await file.text();
        document.getElementById('fileContent').value = contents;
        
        // 更新文件信息
        updateFileInfo(file);
        showToast('文件读取成功');
    } catch (error) {
        if (error.name !== 'AbortError') {
            showToast('无法读取文件：' + error.message, true);
        }
    }
});

// 另存为
document.getElementById('saveAsFileBtn').addEventListener('click', async () => {
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
        await writable.write(document.getElementById('fileContent').value);
        await writable.close();
        
        currentFileHandle = fileHandle;
        const file = await fileHandle.getFile();
        updateFileInfo(file);
        showToast('文件保存成功');
    } catch (error) {
        if (error.name !== 'AbortError') {
            showToast('保存文件失败：' + error.message, true);
        }
    }
});

// 更新文件信息显示
function updateFileInfo(file) {
    if (file) {
        fileInfo.innerHTML = `文件名：${file.name}
文件大小：${formatFileSize(file.size)}
最后修改时间：${new Date(file.lastModified).toLocaleString()}`;
    } else {
        fileInfo.textContent = '未选择文件';
    }
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 