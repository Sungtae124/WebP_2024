import { getAccessTokenWithoutLogin } from "./main_api.js";

// 장르 데이터
const genres = ["Kpop dance", "Korean hip-hop", "밴드", "Christmas"];

// Spotify API에서 장르별 앨범 데이터를 가져오는 함수
async function fetchTracksByGenre(genre, token) {
    const url = `https://api.spotify.com/v1/search?q=${genre}&type=track&limit=5`;
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) throw new Error(`Failed to fetch tracks for ${genre}`);
        const data = await response.json();
        return data.tracks.items.map((track) => ({
            image: track.album.images[0]?.url || "/default/default-album.png",
            name: track.name,
        }));
    } catch (error) {
        console.error(error);
        return [];
    }
}

function adjustAlbumOverlap(albumStack) {
    const genreBox = albumStack.parentElement; // 부모 장르 박스
    const genreBoxWidth = genreBox.offsetWidth; // 박스 전체 너비
    const computedStyle = window.getComputedStyle(genreBox);
    const padding = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight); // 패딩 값 계산
    const availableWidth = genreBoxWidth - padding; // 패딩을 제외한 가용 너비
    const images = albumStack.querySelectorAll("img");

    if (images.length === 0) return;

    const totalOverlap = Math.min(availableWidth / (images.length - 1), 60); // 이미지 간의 겹침 정도
    const scaleStep = 0.1; // 크기가 줄어드는 정도

    images.forEach((img, index) => {
        if (index === 0) {
            // 첫 번째 이미지는 명확히 보이도록 설정
            img.style.left = "0"; 
            img.style.transform = "scale(1.0)"; 
        } else {
            // 나머지 이미지는 점진적으로 작아짐
            img.style.left = `${index * totalOverlap}px`; 
            img.style.transform = `scale(${1 - index * scaleStep})`; // 점진적으로 크기 감소
        }
        img.style.zIndex = images.length - index; // 겹치는 순서 반대로 설정
    });

    albumStack.style.width = `${availableWidth}px`; // 앨범 스택의 너비를 박스 내부 너비에 맞춤
}

// 장르 버튼 생성 및 렌더링 함수
export async function renderGenreButtons() {
    const genreContainer = document.getElementById("genre-buttons");
    genreContainer.innerHTML = ""; // 기존 내용 초기화

    const token = await getAccessTokenWithoutLogin();
    if (!token) {
        console.error("Spotify Access Token 발급 실패");
        return;
    }

    for (const genre of genres) {
        // 장르별 앨범 데이터 가져오기
        const albums = await fetchTracksByGenre(genre, token);
        if (!albums.length) {
            console.warn(`장르 ${genre}에 대한 앨범 데이터가 없습니다.`);
            continue;
        }

        // 장르 박스 생성
        const genreBox = document.createElement("div");
        genreBox.className = "genre-box";
        genreBox.dataset.genre = genre;

        // 앨범 이미지 스택 생성
        const albumStack = document.createElement("div");
        albumStack.className = "album-stack";

        albums.forEach((album) => {
            const img = document.createElement("img");
            img.src = album.image;
            img.alt = album.name;
            albumStack.appendChild(img);
        });

        // 장르 텍스트 추가
        const genreText = document.createElement("div");
        genreText.className = "genre-text";
        genreText.textContent = genre.charAt(0).toUpperCase() + genre.slice(1); // 첫 글자 대문자

        // 박스 구성
        genreBox.appendChild(albumStack);
        genreBox.appendChild(genreText);

        // 클릭 이벤트 추가
        genreBox.addEventListener("click", () => {
            window.location.href = `?genre=${genre}`; // 페이지를 해당 장르로 새로고침
        });

        // DOM에 추가
        genreContainer.appendChild(genreBox);

        // 겹침 계산
        adjustAlbumOverlap(albumStack);

        // 창 크기 변경 시 겹침 재조정
        window.addEventListener("resize", () => adjustAlbumOverlap(albumStack));
    }
}
