import { fetchTrackDetails, fetchArtistDetails, fetchAlbumDetails, getAccessToken } from './api.js';

document.addEventListener("DOMContentLoaded", () => {
    const sideButtons = document.querySelectorAll(".side-buttons button");
    const mainContainer = document.querySelector(".main-container");
    const albumCover = document.getElementById("album-cover");
    const songTitle = document.getElementById("song-title");
    const artistName = document.getElementById("artist-name");
    const playButton = document.getElementById("play-button");
    const progressBar = document.getElementById("song-progress");
    const body = document.body;

    songTitle.textContent = "Web Project"; // 노래 제목
    artistName.textContent = "Park SeoYeon"; // 아티스트 이름

    let activePanel = null; // 현재 활성 패널
    let activeButton = null; // 현재 활성 버튼

    const trackId = "7pT6WSg4PCt4mr5ZFyUfsF"; // 예제 곡 ID

    const accessToken = getAccessToken();
    if (!accessToken) {
        console.log("Token이 없음");
        return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
        const token = localStorage.getItem("spotify_token");
        const player = new Spotify.Player({
            name: 'Web Playback SDK',
            getOAuthToken: cb => { cb(token); },
            volume: 0.3
        });

        // 플레이어 연결 성공 여부 확인
        player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);

            // 특정 트랙 재생
            playTrack(device_id, token, trackId);
        });

        player.addListener('player_state_changed', state => {
            if (state) {
                const { position, duration, paused } = state;
                progressBar.value = (position / duration) * 100;
                playButton.textContent = paused ? '▶️' : '⏸️';
            }
        });

        player.connect();

        // 재생 버튼 클릭 이벤트
        playButton.addEventListener("click", () => {
            player.togglePlay();
        });

        // 슬라이더 위치 변경
        progressBar.addEventListener("input", () => {
            player.getCurrentState().then(state =>{
                if (state) {
                    const { duration } = state;
                    const seekPosition = (progressBar.value / 100) * duration;
                    player.seek(seekPosition);
                }
            });
        });

    };

    loadTrackDetails(trackId, accessToken); //곡 정보 가져오기

    // 각 버튼에 이벤트 리스너 추가
    sideButtons.forEach((button) => {
        button.addEventListener("click", (event) => handlePanelClick(event.currentTarget, trackId, accessToken));
    });

    async function playTrack(deviceId, token, trackUri) {
        try {
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uris: [`spotify:track:${trackUri}`] // 재생할 곡의 Spotify URI
                })
            });
            console.log("곡 재생 시작");
        } catch (error) {
            console.error("곡 재생 중 오류 발생:", error);
        }
    }

    // 곡 정보 가져오기 함수
    async function loadTrackDetails(trackId, accessToken) {
        try {
            const trackData = await fetchTrackDetails(trackId, accessToken);

            // 페이지에 곡 정보 업데이트
            songTitle.textContent = trackData.name;
            artistName.textContent = trackData.artists[0].name;
            albumCover.src = trackData.album.images[0]?.url;

            document.getElementById("art").dataset.artistId = trackData.artists[0].id;
        } catch (error) {
            console.error("트랙 정보 요청 중 오류 발생:", error);
        }
    }


    // 패널 클릭 이벤트 처리
    async function handlePanelClick(button, trackId, accessToken) {
        // 같은 버튼을 클릭하면 패널 닫기
        if (activeButton === button) {
            closeActivePanel();
            return;
        }

        const previousPanel = activePanel;
        const newPanel = createPanel(button.innerText);

        switch (button.id) {
            case "lyr":
                newPanel.innerHTML = `
                <h2>가사 패널</h2>
                <p>가사 로딩 실패</p>
                `;
                break;

            case "rec":
                newPanel.innerHTML = `
                <h2>추천 패널</h2>
                <p>추천 로딩 실패</p>
                `;
                break;

            case "next":
                newPanel.innerHTML = `
                <h2>다음 트랙 패널</h2>
                <p>다음 트랙 로딩 실패</p>
                `;
                break;

            case "art":
                const artistId = button.dataset.artistId;
                if (artistId) {
                    const artistData = await fetchArtistDetails(artistId, accessToken);
                    newPanel.innerHTML += `
                    <h3>아티스트 정보</h3>
                    <p>이름: ${artistData.name}</p>
                    <p>팔로워: ${artistData.followers.total}</p>
                    <img src="${artistData.images[0]?.url}" alt="아티스트 이미지" style="width: 100%; max-height: 200px; object-fit: cover;">
                `;
                } else {
                    newPanel.innerHTML += `<p>아티스트 로딩 실패</p>`
                }
                break;
        }

        // 새 패널 DOM에 추가
        body.appendChild(newPanel);

        // 새 패널 애니메이션 시작
        setTimeout(() => {
            newPanel.style.opacity = "1";
        }, 10);

        // 메인 컨테이너 이동
        mainContainer.style.transform = "translateX(-350px)";

        // 기존 패널 제거
        if (previousPanel) {
            previousPanel.style.opacity = "0";
            setTimeout(() => {
                previousPanel.remove();
            }, 500);
        }

        // 새 패널 활성화
        activePanel = newPanel;
        activeButton = button;
    }

    // 새 패널 생성 함수
    function createPanel(content) {
        const panel = document.createElement("div");
        panel.classList.add("side-panel");
        panel.innerHTML = `<h2>${content} 패널</h2>`;
        panel.style.opacity = "0"; // 초기 투명
        return panel;
    }

    // 기존 패널 닫기 함수
    function closeActivePanel() {
        if (activePanel) {
            activePanel.style.opacity = "0"; // 패널 숨김
            setTimeout(() => {
                activePanel.remove(); // DOM에서 제거
            }, 500); // 애니메이션 후 제거
            activePanel = null;
            activeButton = null;
            mainContainer.style.transform = "translateX(0)"; // 메인 컨테이너 복귀
        }
    }
});

window.addEventListener('load', () => {
    const songTitle = document.getElementById('song-title');
    const scrollContainer = document.querySelector('.scroll-container');
    
    // 제목 길이가 컨테이너 너비를 초과하면 애니메이션 적용
    if (songTitle.scrollWidth > scrollContainer.clientWidth) {
        songTitle.style.animation = 'scroll-title 10s linear infinite';
    } else {
        songTitle.style.animation = 'none'; // 스크롤 제거
    }
});