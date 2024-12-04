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
    pipImage.alt = `${music.trackName} - ${music.artistName}`;
    pipTitle.textContent = `${music.trackName} - ${music.artistName}`;
}

// PiP를 화면에 표시
export function showPiP() {
    const pip = document.getElementById("pip");
    pip.style.display = "flex"; // PiP를 보이도록 설정
    pip.style.opacity = "1"; // 투명도 설정
}

// PiP를 화면에서 숨기기
export function hidePiP() {
    const pip = document.getElementById("pip");
    pip.style.display = "none"; // PiP를 숨기도록 설정
    pip.style.opacity = "0"; // 완전히 숨기기
}

// PiP 초기화 함수
export function initializePiP(defaultMusic) {
    const pip = document.getElementById("pip");
    if (defaultMusic) {
        updatePiP(defaultMusic); // 기본 음악 정보로 업데이트
        pip.style.display = "flex"; // 초기화 시 PiP 표시
        pip.style.opacity = "1";
    } else {
        console.warn("초기화할 기본 음악 정보가 없습니다.");
        pip.style.display = "none"; // 초기 상태에서는 숨기기
    }
}