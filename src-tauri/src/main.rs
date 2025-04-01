// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::Manager;
use rusqlite::{Connection, params};
use bcrypt::{hash, verify};
use serde::Serialize;

// ------------------- Data Structures -------------------

#[derive(Debug, Serialize)]
struct LoginResponse {
  token: String,
  salt: String,
  twofa_required: bool,
  temp_user_id: Option<i32>,
}

#[derive(Debug, Serialize)]
struct Credential {
  id: i32,
  website: String,
  username: String,
  password: String, // encrypted string
  notes: String,
  created_at: String,
  updated_at: String,
}

#[derive(Debug, Serialize)]
struct CredentialsResponse {
  credentials: Vec<Credential>,
}

#[derive(Debug, Serialize)]
struct SimpleResponse {
  message: String,
}

#[derive(Debug, Serialize)]
struct RegistrationResponse {
  token: String,
  salt: String,
  twofa_secret: Option<String>,
}

// ------------------- Helper Functions -------------------
//
// soon we will verify the JWT token to get the user id.
// For demonstration purposes, we assume the authenticated user has id = 1.
fn get_authenticated_user_id(_token: &str) -> i32 {
  1
}

fn open_db() -> Result<Connection, String> {
  Connection::open("aegis.db").map_err(|e| e.to_string())
}

// ------------------- Tauri Commands -------------------

#[tauri::command]
fn login(username: String, password: String) -> Result<LoginResponse, String> {
  // For simplicity, open the database and attempt to retrieve the user.
  let conn = open_db()?;
  let mut stmt = conn.prepare("SELECT id, password, encryption_salt, twofa_secret FROM users WHERE username=?")
    .map_err(|e| e.to_string())?;
  let user_row = stmt.query_row(params![username], |row| {
    let id: i32 = row.get(0)?;
    let hashed: String = row.get(1)?;
    let salt: String = row.get(2)?;
    let twofa_secret: Option<String> = row.get(3)?;
    Ok((id, hashed, salt, twofa_secret))
  });
  let (user_id, hashed_password, salt, twofa_secret) = user_row.map_err(|e| e.to_string())?;

  // Compare provided password with stored hash.
  if !verify(password, &hashed_password).map_err(|e| e.to_string())? {
    return Err("Invalid username or password".into());
  }

  // If a two-factor secret exists, require 2FA.
  if twofa_secret.is_some() {
    return Ok(LoginResponse{
      token: "".into(),
      salt,
      twofa_required: true,
      temp_user_id: Some(user_id),
    });
  }

  // Otherwise, generate a dummy JWT token (will replace with real JWT generation).
  Ok(LoginResponse {
    token: "dummy-token".into(),
    salt,
    twofa_required: false,
    temp_user_id: None,
  })
}

#[tauri::command]
fn verify_2fa(user_id: i32, token: String) -> Result<LoginResponse, String> {
  // Soon, verify the provided 2FA token.
  // Here we simply check that the token equals "123456" for demonstration.
  if token != "123456" {
    return Err("Invalid 2FA token".into());
  }
  // Generate a dummy JWT token.
  Ok(LoginResponse {
    token: "dummy-token".into(),
    salt: "dummy-salt".into(),
    twofa_required: false,
    temp_user_id: None,
  })
}

#[tauri::command]
fn get_credentials(token: String) -> Result<CredentialsResponse, String> {
  let user_id = get_authenticated_user_id(&token);
  let conn = open_db()?;
  let mut stmt = conn.prepare("SELECT id, website, username, password, notes, created_at, updated_at FROM passwords WHERE user_id = ?")
    .map_err(|e| e.to_string())?;
  let credential_iter = stmt.query_map(params![user_id], |row| {
    Ok(Credential {
      id: row.get(0)?,
      website: row.get(1)?,
      username: row.get(2)?,
      password: row.get(3)?,
      notes: row.get(4)?,
      created_at: row.get(5)?,
      updated_at: row.get(6)?,
    })
  }).map_err(|e| e.to_string())?;
  let mut credentials = Vec::new();
  for cred_result in credential_iter {
    credentials.push(cred_result.map_err(|e| e.to_string())?);
  }
  Ok(CredentialsResponse { credentials })
}

#[tauri::command]
fn create_credential(
  website: String, 
  username: String, 
  password: String, 
  notes: String, 
  token: String
) -> Result<SimpleResponse, String> {
  let user_id = get_authenticated_user_id(&token);
  let conn = open_db()?;
  conn.execute(
    "INSERT INTO passwords (user_id, website, username, password, notes) VALUES (?, ?, ?, ?, ?)",
    params![user_id, website, username, password, notes],
  ).map_err(|e| e.to_string())?;
  Ok(SimpleResponse { message: "Credential added successfully".into() })
}

#[tauri::command]
fn update_credential(
  id: i32, 
  website: String, 
  username: String, 
  password: String, 
  notes: String, 
  token: String
) -> Result<SimpleResponse, String> {
  let user_id = get_authenticated_user_id(&token);
  let conn = open_db()?;
  let affected = conn.execute(
    "UPDATE passwords SET website = ?, username = ?, password = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
    params![website, username, password, notes, id, user_id],
  ).map_err(|e| e.to_string())?;
  if affected == 0 {
    return Err("Credential not found".into());
  }
  Ok(SimpleResponse { message: "Credential updated successfully".into() })
}

#[tauri::command]
fn delete_credential(id: i32, token: String) -> Result<SimpleResponse, String> {
  let user_id = get_authenticated_user_id(&token);
  let conn = open_db()?;
  let affected = conn.execute(
    "DELETE FROM passwords WHERE id = ? AND user_id = ?",
    params![id, user_id],
  ).map_err(|e| e.to_string())?;
  if affected == 0 {
    return Err("Credential not found".into());
  }
  Ok(SimpleResponse { message: "Credential deleted successfully".into() })
}

#[tauri::command]
fn register_user(username: String, email: String, password: String) -> Result<RegistrationResponse, String> {
  let conn = open_db()?;
  // Check if a user with the same username or email exists.
  let mut stmt = conn.prepare("SELECT id FROM users WHERE username = ? OR email = ?")
    .map_err(|e| e.to_string())?;
  let mut rows = stmt.query(params![username, email]).map_err(|e| e.to_string())?;
  if let Some(_) = rows.next().map_err(|e| e.to_string())? {
    return Err("Username or email already exists".into());
  }

  // Generate a new 16-byte encryption salt.
  let salt_bytes: [u8; 16] = rand::random();
  let salt = hex::encode(salt_bytes);

  // Hash the password with bcrypt.
  let hashed = hash(password, 10).map_err(|e| e.to_string())?;

  // Generate a dummy two-factor secret URL.
  let twofa_secret = "otpauth://dummy".to_string();

  // Insert the new user.
  conn.execute(
    "INSERT INTO users (username, email, password, encryption_salt, twofa_secret) VALUES (?, ?, ?, ?, ?)",
    params![username, email, hashed, salt, twofa_secret],
  ).map_err(|e| e.to_string())?;

  // Soon, generate a JWT token here.
  Ok(RegistrationResponse {
    token: "dummy-jwt-token".into(),
    salt,
    twofa_secret: Some(twofa_secret),
  })
}

// ------------------- Main -------------------

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      login, 
      verify_2fa,
      get_credentials, 
      create_credential, 
      update_credential, 
      delete_credential, 
      register_user
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
