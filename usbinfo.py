import wmi
import os
import ctypes
import shutil

def format_size(size_in_bytes):
    """根据大小自动选择合适的单位"""
    if size_in_bytes < 1024 * 1024:  # 小于1MB，使用KB
        return f"{size_in_bytes / 1024:.2f} KB"
    elif size_in_bytes < 1024 * 1024 * 1024:  # 小于1GB，使用MB
        return f"{size_in_bytes / (1024 * 1024):.2f} MB"
    else:  # 大于等于1GB，使用GB
        return f"{size_in_bytes / (1024 * 1024 * 1024):.2f} GB"

def format_serial_number(serial):
    """格式化序列号"""
    if not serial:
        return "无序列号"
    try:
        # 尝试将序列号转换为十六进制字符串
        hex_str = ''.join([f'{ord(c):02x}' for c in serial])
        return hex_str
    except:
        return str(serial)

def get_removable_drives():
    drives = []
    bitmask = ctypes.windll.kernel32.GetLogicalDrives()
    for letter in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
        if bitmask & 1:
            drive = f"{letter}:\\"
            if ctypes.windll.kernel32.GetDriveTypeW(drive) == 2:  # DRIVE_REMOVABLE
                drives.append(drive)
        bitmask >>= 1
    return drives

def get_drive_info(drive):
    try:
        total, used, free = shutil.disk_usage(drive)
        return {
            'total': total,
            'free': free,
            'used': used
        }
    except Exception as e:
        print(f"获取驱动器 {drive} 信息时出错: {str(e)}")
    return None

def list_usb_devices():
    try:
        # 创建WMI对象
        c = wmi.WMI()
        
        print("正在查询USB设备信息...")
        
        # 获取可移动驱动器
        removable_drives = get_removable_drives()
        
        if not removable_drives:
            print("未找到可移动驱动器")
            return
            
        print("\n找到以下可移动驱动器：")
        for drive in removable_drives:
            print(f"\n驱动器: {drive}")
            info = get_drive_info(drive)
            if info:
                print(f"总容量: {format_size(info['total'])}")
                print(f"已使用: {format_size(info['used'])}")
                print(f"可用空间: {format_size(info['free'])}")
            print("-" * 50)
            
        # 查询USB设备基本信息
        print("\nUSB设备详细信息：")
        for device in c.Win32_DiskDrive():
            if 'USB' in device.InterfaceType:
                print(f"\nUSB存储设备: {device.Model}")
                print(f"设备ID: {device.DeviceID}")
                print(f"制造商: {device.Manufacturer}")
                print(f"接口类型: {device.InterfaceType}")
                serial = device.ole_object.SerialNumber
                print(f"序列号: {format_serial_number(serial)}")
                if device.Size:
                    print(f"物理设备大小: {format_size(float(device.Size))}")
                print("-" * 50)
            
    except Exception as e:
        print(f"发生错误: {str(e)}")

if __name__ == "__main__":
    print("开始扫描USB设备...")
    list_usb_devices()