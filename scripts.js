// Music 클래스 정의
class Music {
    constructor(albumImage, artist, title) {
        this.albumImage = albumImage; // 앨범 자켓 경로
        this.artist = artist;        // 가수명
        this.title = title;          // 음악명
    }
}

// Music 객체 배열 생성
const musicList = [
    new Music("Albums/jacket/YdBB1.jpg", "YdBB", "Song 1"),
    new Music("Albums/jacket/YdBB-IGNITE.jpg", "YdBB", "Song 2"),
    new Music("Albums/jacket/Hanroro-HOME.jpg", "Hanroro", "Song 3"),
    new Music("Albums/jacket/Hanroro-compass.jpg", "Hanroro", "Song 4"),
    new Music("Albums/jacket/Hanroro-TakeOff.jpg", "Hanroro", "Song 5"),
    new Music("Albums/jacket/Hanroro-EvenIfYouLeave.jpg", "Hanroro", "Song 6"),
    new Music("Albums/jacket/Touched-Addiction.jpg", "Touched", "Song 7")
];

// 추천 목록 박스 렌더링
function renderMusicBoxes(musicList) {
    const grid = document.querySelector(".recommendation-grid"); // 그리드 선택

    musicList.forEach((music, index) => {
        const musicBox = document.createElement("div");

        // 박스 크기 설정 (2x2, 2x1, 1x1 비율)
        if (index === 0) {
            musicBox.className = "large-box"; // 2x2 크기
        } else if (index <= 2) {
            musicBox.className = "medium-box"; // 2x1 크기
        } else {
            musicBox.className = "small-box"; // 1x1 크기
        }

        // 박스 내용 삽입
        musicBox.innerHTML = `
            <img src="${music.albumImage}" alt="${music.title}" class="album-image">
            <div class="music-info">
                <h4>${music.title}</h4>
                <p>${music.artist}</p>
            </div>
        `;

        // 박스 클릭 이벤트로 PiP 업데이트
        musicBox.addEventListener("click", () => {
            updatePiP(music);
        });

        // 그리드에 추가
        grid.appendChild(musicBox);
    });
}
// PiP 정보 업데이트 함수
function updatePiP(music) {
    const pipImage = document.querySelector("#pip .album-cover");
    const pipTitle = document.querySelector("#pip .music-info p");

    // PiP 요소 업데이트
    pipImage.src = music.albumImage;
    pipImage.alt = `${music.title} - ${music.artist}`;
    pipTitle.textContent = `${music.title} - ${music.artist}`;
}

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
    renderMusicBoxes(musicList);

    // 초기 PiP를 임시로 첫 번째 음악으로 설정
    updatePiP(musicList[0]);
});

