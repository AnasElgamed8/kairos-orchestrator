#!/bin/bash
set -e

echo "🚀 Starting Kairos Build Process..."

# 1. Fix Rust Toolchain
echo "🛠 Configuring Rust toolchain..."
rustup default stable || { echo "Rustup not found. Installing..."; curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y; source $HOME/.cargo/env; }

# 2. Install System Dependencies
echo "📦 Installing system dependencies..."
sudo pacman -S --noconfirm base-devel curl wget git webkit2gtk

# 3. Setup Project
echo "📂 Preparing project directory..."
if [ ! -d "src-tauri" ]; then
    git clone https://github.com/AnasElgamed8/kairos-orchestrator .
fi

# 4. Build Frontend & Backend
echo "🏗 Building Kairos..."
npm install
npm run tauri build

echo "✅ Build complete! Your binary is in src-tauri/target/release/kairos"
