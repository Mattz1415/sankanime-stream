#!/bin/bash

# ==============================================================================
# Script Otomatis: Build APK Android Lokal menggunakan PRoot Ubuntu di Termux
# Project: NexusAnime (Next.js + Capacitor)
# Target Output: sankanime-stream/Hasilapk/
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}====================================================${NC}"
echo -e "${CYAN}  NEXUS ANIME - LOCAL ANDROID APK COMPILER (PROOT)  ${NC}"
echo -e "${CYAN}====================================================${NC}"

# 1. Cek apakah script dijalankan dari dalam PRoot Ubuntu atau dari Termux
if [ -f /etc/os-release ] && grep -qi "ubuntu" /etc/os-release; then
    IS_INSIDE_UBUNTU=true
else
    IS_INSIDE_UBUNTU=false
fi

if [ "$IS_INSIDE_UBUNTU" = false ]; then
    echo -e "${YELLOW}[Termux] Mempersiapkan lingkungan PRoot Ubuntu...${NC}"
    
    if ! command -v proot-distro &> /dev/null; then
        echo -e "${YELLOW}Menginstal proot-distro...${NC}"
        pkg update -y && pkg install -y proot-distro
    fi

    if ! proot-distro list 2>&1 | grep -q "ubuntu"; then
        echo -e "${YELLOW}Menginstal Ubuntu di proot-distro...${NC}"
        proot-distro install ubuntu
    fi

    echo -e "${GREEN}Menjalankan kompilasi di dalam PRoot Ubuntu...${NC}"
    proot-distro login ubuntu -- bash /data/data/com.termux/files/home/sankanime-stream/build_apk_local.sh
    exit 0
fi

# ==============================================================================
# PROSES DI DALAM PROOT UBUNTU
# ==============================================================================

echo -e "${CYAN}>>> [1/5] Memeriksa & Menginstal Dependensi Sistem...${NC}"
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y --no-install-recommends \
    openjdk-21-jdk-headless \
    wget \
    unzip \
    curl \
    git \
    ca-certificates

# Konfigurasi Java 21 (Diperlukan oleh Capacitor 7 & AndroidX terbaru)
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-arm64
if [ ! -d "$JAVA_HOME" ]; then
    export JAVA_HOME=$(dirname $(dirname $(readlink -f $(which javac))))
fi
echo -e "${GREEN}✓ Java terdeteksi: $JAVA_HOME${NC}"
java -version

# Konfigurasi Android SDK
export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

echo -e "${CYAN}>>> [2/5] Memeriksa Android Command Line Tools (SDK)...${NC}"
mkdir -p "$ANDROID_HOME/cmdline-tools"

if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
    echo -e "${YELLOW}Mengunduh Android Command Line Tools...${NC}"
    CMDLINE_ZIP_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
    wget -c -q --show-progress "$CMDLINE_ZIP_URL" -O /tmp/cmdline-tools.zip
    
    echo -e "${YELLOW}Mengekstrak Command Line Tools...${NC}"
    rm -rf /tmp/cmdline-tools-extracted
    unzip -q /tmp/cmdline-tools.zip -d /tmp/cmdline-tools-extracted
    mv /tmp/cmdline-tools-extracted/cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"
    rm -rf /tmp/cmdline-tools.zip /tmp/cmdline-tools-extracted
    echo -e "${GREEN}✓ Command Line Tools berhasil dipasang.${NC}"
else
    echo -e "${GREEN}✓ Command Line Tools sudah tersedia.${NC}"
fi

# Terima Lisensi Android
echo -e "${CYAN}>>> [3/5] Menyetujui Lisensi Android SDK...${NC}"
mkdir -p "$ANDROID_HOME/licenses"
yes | sdkmanager --licenses > /dev/null 2>&1 || true

# Pasang Platform 36 & Build-Tools jika belum ada
if [ ! -d "$ANDROID_HOME/platforms/android-36" ]; then
    echo -e "${YELLOW}Mengunduh Android Platform 36...${NC}"
    yes | sdkmanager "platforms;android-36" "build-tools;35.0.0" || true
else
    echo -e "${GREEN}✓ Android SDK Platform 36 sudah terpasang.${NC}"
fi

# Pindah ke direktori android project
PROJECT_DIR="/data/data/com.termux/files/home/sankanime-stream"
PROJECT_ANDROID_DIR="$PROJECT_DIR/android"
if [ ! -d "$PROJECT_ANDROID_DIR" ]; then
    echo -e "${RED}Error: Direktori $PROJECT_ANDROID_DIR tidak ditemukan!${NC}"
    exit 1
fi

cd "$PROJECT_ANDROID_DIR"

# Buat local.properties jika belum ada
echo "sdk.dir=$ANDROID_HOME" > local.properties

# Berikan izin eksekusi ke gradlew
chmod +x gradlew

echo -e "${CYAN}>>> [4/5] Menjalankan Gradle Build (assembleDebug)...${NC}"
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

# Target folder Hasilapk (sesuai permintaan user)
echo -e "${CYAN}>>> [5/5] Menyalin file APK ke folder Hasilapk...${NC}"
HASIL_DIR="$PROJECT_DIR/Hasilapk"
mkdir -p "$HASIL_DIR"

cp -f "$APK_OUTPUT" "$HASIL_DIR/NexusAnime-debug.apk"
cp -f "$APK_OUTPUT" "$HASIL_DIR/app-debug.apk"
echo -e "${GREEN}✓ Tersalin ke: $HASIL_DIR/NexusAnime-debug.apk${NC}"
echo -e "${GREEN}✓ Tersalin ke: $HASIL_DIR/app-debug.apk${NC}"

# Opsional: Salin juga ke /storage/download dan ~/storage/downloads jika ada
if [ -d "/storage/emulated/0/Download" ]; then
    cp -f "$APK_OUTPUT" "/storage/emulated/0/Download/NexusAnime-debug.apk" 2>/dev/null || true
fi
if [ -d "/data/data/com.termux/files/home/storage/downloads" ]; then
    cp -f "$APK_OUTPUT" "/data/data/com.termux/files/home/storage/downloads/NexusAnime-debug.apk" 2>/dev/null || true
fi

echo -e "${CYAN}====================================================${NC}"
echo -e "${GREEN}Selesai! File APK tersimpan di:${NC}"
echo -e "${YELLOW}📂 $HASIL_DIR/NexusAnime-debug.apk${NC}"
echo -e "${CYAN}====================================================${NC}"
