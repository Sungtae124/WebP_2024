// PiP 정보 업데이트 함수
export function updatePiP(music) {
    const pipImage = document.querySelector("#pip .album-cover");
    const pipTitle = document.querySelector("#pip .music-info p");

    if (!music) {
        console.error("PiP 업데이트를 위한 음악 정보가 없습니다.");
        return;
    }

    // PiP 요소 업데이트
    pipImage.src = music.albumImage || "/default/default-album.png"; // 기본 이미지 경로
    pipImage.alt = `${music.title} - ${music.artist}`;
    pipTitle.textContent = `${music.title} - ${music.artist}`;
}

// PiP 초기화 함수 (필요할 경우 추가)
export function initializePiP(defaultMusic) {
    if (!defaultMusic) {
        console.warn("초기화할 기본 음악 정보가 없습니다.");
        return;
    }
    updatePiP(defaultMusic);
}
