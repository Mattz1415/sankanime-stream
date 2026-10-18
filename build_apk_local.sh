#!/bin/bash

# ==============================================================================
# Script Otomatis: Build APK Android Lokal menggunakan PRoot Ubuntu di Termux
# Project: NexusAnime (Next.js + Capacitor)
# ==============================================================================

set -e

# Warna untuk output terminal
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}  NEXUS ANIME - LOCAL ANDROID APK COMPILER (PROOT)  ${NC}"
echo -e "${CYAN}====================================================${NC}"

# 1. Cek apakah script dijalankan langsung dari dalam PRoot Ubuntu atau dari Termux
if [ -f /etc/os-release ] && grep -qi "ubuntu" /etc/os-release; then
    IS_INSIDE_UBUNTU=true
else
    IS_INSIDE_UBUNTU=false
fi

if [ "$IS_INSIDE_UBUNTU" = false ]; then
    echo -e "${YELLOW}[1/2] Terdeteksi berjalan dari Termux.${NC}"
    
    # Pastikan proot-distro terpasang
    if ! command -v proot-distro &> /dev/null; then
        echo -e "${YELLOW}Menginstal proot-distro...${NC}"
        pkg update -y && pkg install -y proot-distro
    fi

    # Pastikan Ubuntu terpasang di proot-distro
    if ! proot-distro list | grep -q "ubuntu (installed)"; then
        echo -e "${YELLOW}Menginstal Ubuntu di proot-distro...${NC}"
        proot-distro install ubuntu
    fi

    echo -e "${GREEN}Meneruskan proses kompilasi ke dalam PRoot Ubuntu...${NC}"
    proot-distro login ubuntu -- bash /data/data/com.termux/files/home/sankanime-stream/build_apk_local.sh
    exit 0
fi

# ==============================================================================
# PROSES DI DALAM PROOT UBUNTU
# ==============================================================================

echo -e "${CYAN}>>> [PRoot Ubuntu] Memeriksa & Menginstal Dependensi Sistem...${NC}"
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y --no-install-recommends \
    openjdk-17-jdk-headless \
    wget \
    unzip \
    curl \
    git \
    ca-certificates

# Konfigurasi Java Home
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-arm64
if [ ! -d "$JAVA_HOME" ]; then
    # Fallback jika nama direktori berbeda
    export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which javac))))
fi
echo -e "${GREEN}✓ Java terdeteksi: $JAVA_HOME${NC}"
java -version

# Konfigurasi Android SDK
export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

echo -e "${CYAN}>>> [PRoot Ubuntu] Memeriksa Android Command Line Tools (SDK)...${NC}"
mkdir -p "$ANDROID_HOME/cmdline-tools"

if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
    echo -e "${YELLOW}Mengunduh Android Command Line Tools...${NC}"
    CMDLINE_ZIP_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
    wget -c -q --show-progress "$CMDLINE_ZIP_URL" -O /tmp/cmdline-tools.zip
    
    echo -e "${YELLOW}Mengekstrak Command Line Tools...${NC}"
    unzip -q /tmp/cmdline-tools.zip -d /tmp/cmdline-tools-extracted
    mv /tmp/cmdline-tools-extracted/cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"
    rm -rf /tmp/cmdline-tools.zip /tmp/cmdline-tools-extracted
    echo -e "${GREEN}✓ Command Line Tools berhasil dipasang.${NC}"
else
    echo -e "${GREEN}✓ Command Line Tools sudah tersedia.${NC}"
fi

# Terima Lisensi Android
echo -e "${CYAN}>>> Menyetujui Lisensi Android SDK...${NC}"
mkdir -p "$ANDROID_HOME/licenses"
yes | sdkmanager --licenses > /dev/null 2>&1 || true

# Pasang Platform & Build-Tools jika belum ada
if [ ! -d "$ANDROID_HOME/platforms/android-34" ]; then
    echo -e "${YELLOW}Mengunduh Android Platform 34 & Build Tools 34.0.0...${NC}"
    yes | sdkmanager "platforms;android-34" "build-tools;34.0.0"
else
    echo -e "${GREEN}✓ Android SDK Platform 34 sudah terpasang.${NC}"
fi

# Pindah ke direktori android project
PROJECT_ANDROID_DIR="/data/data/com.termux/files/home/sankanime-stream/android"
if [ ! -d "$PROJECT_ANDROID_DIR" ]; then
    echo -e "${RED}Error: Direktori $PROJECT_ANDROID_DIR tidak ditemukan!${NC}"
    exit 1
fi

cd "$PROJECT_ANDROID_DIR"

# Buat local.properties jika belum ada
echo "sdk.dir=$ANDROID_HOME" > local.properties

# Berikan izin eksekusi ke gradlew
chmod +x gradlew

echo -e "${CYAN}>>> [PRoot Ubuntu] Menjalankan Gradle Build (assembleDebug)...${NC}"
./gradlew assembleDebug --no-daemon --stacktrace

# Cek hasil APK
APK_OUTPUT="$PROJECT_ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
if [ ! -f "$APK_OUTPUT" ]; then
    echo -e "${RED}Error: File APK tidak ditemukan di $APK_OUTPUT${NC}"
    exit 1
fi

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  ✓ KOMPILASI APK BERHASIL!                         ${NC}"
echo -e "${GREEN}====================================================${NC}"

# Target folder internal HP
TARGET_STORAGE_DIR="/sdcard/Download"
TARGET_APK_NAME="NexusAnime-debug.apk"

if [ -d "$TARGET_STORAGE_DIR" ]; then
    echo -e "${CYAN}Memindahkan APK ke penyimpanan internal ($TARGET_STORAGE_DIR)...${NC}"
    cp -f "$APK_OUTPUT" "$TARGET_STORAGE_DIR/$TARGET_APK_NAME"
    echo -e "${GREEN}✓ APK Tersimpan di: $TARGET_STORAGE_DIR/$TARGET_APK_NAME${NC}"
    echo -e "${YELLOW}Kamu bisa langsung membuka File Manager HP di folder Download untuk menginstal NexusAnime-debug.apk!${NC}"
else
    echo -e "${YELLOW}Catatan: Folder $TARGET_STORAGE_DIR tidak dapat diakses langsung.${NC}"
    echo -e "${YELLOW}Menyimpan salinan ke folder Termux: /data/data/com.termux/files/home/$TARGET_APK_NAME${NC}"
    cp -f "$APK_OUTPUT" "/data/data/com.termux/files/home/$TARGET_APK_NAME"
    echo -e "${GREEN}✓ APK Tersimpan di: ~/sankanime-stream/android/app/build/outputs/apk/debug/app-debug.apk${NC}"
fi

echo -e "${CYAN}Selesai! ✨${NC}"
