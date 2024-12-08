// ui.js: UI 관련 코드 분리
export const songTitle = document.getElementById("song-title");
export const artistName = document.getElementById("artist-name");
export const albumCover = document.getElementById("album-cover");
export const playButton = document.getElementById("play-button");
export const progressBar = document.getElementById("song-progress");
const mainContainer = document.querySelector(".main-container");
const body = document.body;


// 곡 정보 UI 업데이트
export function updateTrackDetailsUI(trackData) {
    songTitle.textContent = trackData.name;
    artistName.textContent = trackData.artists[0].name;
    albumCover.src = trackData.album.images[0]?.url;

    document.getElementById("art").dataset.artistId = trackData.artists[0].id;
    document.getElementById("alb").dataset.albumId = trackData.album.id;
}

// 재생 상태 UI 업데이트
export function updatePlaybackUI(state) {
    const { position, duration, paused } = state;
    progressBar.value = (position / duration) * 100;
    playButton.textContent = paused ? '▶️' : '⏸️';
}

// 패널 UI 생성
export function createPanel(content) {
    const panel = document.createElement("div");
    panel.classList.add("side-panel");
    panel.innerHTML = `<h2>${content} 패널</h2>`;
    panel.style.opacity = "0"; // 초기 투명
    return panel;
}

// 기존 패널 닫기
export function closeActivePanel(activePanel, activeButton, mainContainer) {
    if (activePanel) {
        activePanel.style.opacity = "0";
        setTimeout(() => {
            activePanel.remove();
        }, 500);
        activePanel = null;
        activeButton = null;
        mainContainer.style.transform = "translateX(0)";
    }
}

// 패널 전환 애니메이션 처리
export function handlePanelTransition(newPanel, previousPanel, mainContainer) {
    body.appendChild(newPanel);
    setTimeout(() => {
        newPanel.style.opacity = "1";
    }, 10);
    mainContainer.style.transform = "translateX(-350px)";
    if (previousPanel) {
        previousPanel.style.opacity = "0";
        setTimeout(() => {
            previousPanel.remove();
        }, 500);
    }
}

export function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
}
