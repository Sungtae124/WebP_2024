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
    //곡 제목, 아티스트 이름, 앨범커버 업데이트
    songTitle.textContent = trackData.name;
    artistName.textContent = trackData.artists[0].name;
    albumCover.src = trackData.album.images[0]?.url;
    //UI를 업데이트 하면서 각 버튼들에 ID도 할당해줌
    document.getElementById("art").dataset.artistId = trackData.artists[0].id;
    document.getElementById("alb").dataset.albumId = trackData.album.id;
}

// 재생 상태 UI 업데이트
export async function updatePlaybackUI(state) {
    if (!state) {
        console.warn("Player state가 null이거나 유효하지 않습니다.");
        return;
    }

    const { position, duration, paused } = state;

    // 슬라이더 위치 업데이트
    if (progressBar && duration) {
        progressBar.value = (position / duration) * 100; // 퍼센트 계산
    }

    // 재생 버튼 상태 업데이트
    if (playButton) {
        playButton.textContent = paused ? "▶️" : "⏸️"; // 일시 정지 또는 재생 아이콘
    }

    // 디버그 로그
    console.log(
        `Playback UI 업데이트: 
        위치: ${position}ms, 
        총 길이: ${duration}ms, 
        상태: ${paused ? "일시 정지" : "재생 중"}`
    );
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

//밀리초를 분:초 형식으로 변환(앨범 패널에서 사용)
export function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
}
