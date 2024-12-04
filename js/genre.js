import { getAccessToken } from "./main_api.js";

// 장르 데이터
const genres = ["k-pop", "hip-hop", "jazz", "pop"];

// Spotify API에서 장르별 앨범 데이터를 가져오는 함수
async function fetchAlbumsByGenre(genre, token) {
    const url = `https://api.spotify.com/v1/search?q=genre:${genre}&type=album&limit=5`;
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            console.error(`장르 ${genre}의 앨범 데이터를 가져오는 데 실패했습니다.`);
            return [];
        }

        const data = await response.json();
        return data.albums.items.map((album) => ({
            image: album.images[0]?.url || "/default/default-album.png",
            name: album.name,
        }));
    } catch (error) {
        console.error(`장르 ${genre}의 앨범 데이터를 가져오는 동안 오류가 발생했습니다:`, error);
        return [];
    }
}

// 장르 버튼 생성 및 렌더링 함수
export async function renderGenreButtons() {
    const genreContainer = document.getElementById("genre-buttons");
    genreContainer.innerHTML = ""; // 기존 내용 초기화

    const token = await getAccessToken();
    if (!token) {
        console.error("Spotify Access Token 발급 실패");
        return;
    }

    for (const genre of genres) {
        // 장르별 앨범 데이터 가져오기
        const albums = await fetchAlbumsByGenre(genre, token);
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

        albums.forEach((album, index) => {
            const img = document.createElement("img");
            img.src = album.image;
            img.alt = album.name;
            img.style.position = "absolute";
            img.style.left = `${index * 20}px`;
            img.style.zIndex = index;
            img.style.width = "50px";
            img.style.height = "50px";
            img.style.borderRadius = "5px";
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
            console.log(`${genre} 장르 선택됨`);
            // 선택된 장르에 대한 추가 동작 구현 가능
        });

        // DOM에 추가
        genreContainer.appendChild(genreBox);
    }
}
