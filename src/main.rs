#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::fs;
use std::path::Path;

#[tauri::command]
async fn open_file() -> Result<String, String> {
    let file = tauri::api::dialog::FileDialogBuilder::new()
        .add_filter("Text", &["txt"])
        .pick_file()
        .ok_or_else(|| "用户取消选择".to_string())?;
    
    Ok(file.to_string_lossy().to_string())
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents)
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_file, read_file, save_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 