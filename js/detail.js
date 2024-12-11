import {
    playButton,
    progressBar,
    updateTrackDetailsUI,
    updatePlaybackUI,
    createPanel,
    closeActivePanel,
    handlePanelTransition,
    formatDuration
} from './detail_ui.js';
import { fetchTrackDetails, fetchArtistDetails, fetchAlbumDetails, fetchRecommendations, getAccessToken } from './api.js';


document.addEventListener("DOMContentLoaded", () => {
    const sideButtons = document.querySelectorAll(".side-buttons button");
    const mainContainer = document.querySelector(".main-container");

    let activePanel = null; // 현재 활성 패널
    let activeButton = null; // 현재 활성 버튼

    //const trackId = "5WYgNDkw0VsDIZwfwQWlXp"; //"7pT6WSg4PCt4mr5ZFyUfsF" // 예제 곡 ID

    const urlParams = new URLSearchParams(window.location.search);
    const trackID = urlParams.get("trackID"); // URL에서 trackID 추출

    if (!trackID) {
        console.error("트랙 ID가 없습니다.");
        //alert("트랙 ID가 누락되었습니다. 메인 페이지로 돌아가주세요.");
        return;
    }

    let accessToken;
    try {
        accessToken = getAccessToken();
        if (!accessToken) {
            throw new Error("액세스 토큰을 가져오지 못했습니다.");
        }

        console.log("Access Token:", accessToken);

        const trackData = fetchTrackDetails(trackID, accessToken);
        
        if (!trackData || !trackData.album || !trackData.artists) {
            throw new Error("트랙 데이터가 비정상적입니다.");
            //console.log(trackData);
        }

        console.log("Track Data:", trackData);
        updateTrackDetailsUI(trackData);
    } catch (error) {
        console.error("트랙 정보 로드 중 오류 발생:", error.message);
        //console.log(trackData);
        //alert("트랙 정보를 가져오는 데 실패했습니다. 다시 시도해주세요.");
    }
    

    //프리미엄 api 초기화
    window.onSpotifyWebPlaybackSDKReady = () => {
        const token = localStorage.getItem("spotify_token");
        const player = new Spotify.Player({
            name: 'Web Playback SDK', //플레이어 이름
            getOAuthToken: cb => { cb(token); },
            volume: 0.3 //초기 볼륨
        });

        //플레이어가 준비되면
        player.addListener('ready', ({ device_id }) => {
            playTrack(device_id, token, trackID); //곡 재생
        });

        //플레이어 상태 변경
        player.addListener('player_state_changed', state => {
            if (state) {
                updatePlaybackUI(state); // 재생 상태 UI 업데이트
            }
        });

        player.connect(); //플레이어 연결

        playButton.addEventListener("click", () => {
            player.togglePlay(); //재생상태 토글
        });

        //슬라이더를 움직이면
        progressBar.addEventListener("input", () => {
            player.getCurrentState().then(state => {
                if (state) {
                    const { duration } = state;
                    const seekPosition = (progressBar.value / 100) * duration; //이동 위치
                    player.seek(seekPosition); //해당 위치로 이동
                }
            });
        });
    };

    //곡 정보 불러오기
    loadTrackDetails(trackID, accessToken); 

    //버튼들에 패널 클릭 이벤트 할당
    sideButtons.forEach(button => {
        button.addEventListener("click", (event) => handlePanelClick(event.currentTarget, trackID, accessToken));
    });

    //특정 곡 재생
    async function playTrack(deviceId, token, trackUri) {
        try {
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uris: [`spotify:track:${trackUri}`]
                })
            });
            console.log("곡 재생 시작");
        } catch (error) {
            console.error("곡 재생 중 오류 발생:", error);
        }
    }


    //곡 정보 불러오기
    async function loadTrackDetails(trackID, accessToken) {
        try {
            const trackData = await fetchTrackDetails(trackID, accessToken);
            updateTrackDetailsUI(trackData); //UI 업데이트
        } catch (error) {
            console.error("트랙 정보 요청 중 오류 발생:", error);
        }
    }
    //패널 클릭 이벤트
    async function handlePanelClick(button, trackID, accessToken) {
        if (activeButton === button) {
            closeActivePanel(activePanel, activeButton, mainContainer);
            return;
        }

        const previousPanel = activePanel; //이전 패널 저장
        const newPanel = createPanel(button.innerText); //새 패널 생성

        //버튼 id에 따라 다른 작업 수행
        switch (button.id) {
            case "alb": //앨범 버튼
                try {
                    const albumId = button.dataset.albumId;
                    const albumData = await fetchAlbumDetails(albumId, accessToken);
                    // 앨범 데이터
                    newPanel.innerHTML = `
                        <h2>앨범 정보</h2>
                        <img src="${albumData.images[0]?.url}" alt="앨범 커버" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px;">
                        <p><strong>앨범명:</strong> ${albumData.name}</p>
                        <p><strong>발매일:</strong> ${albumData.release_date}</p>
                        <p><strong>총 트랙 수:</strong> ${albumData.total_tracks}</p>
                        <p><strong>레이블:</strong> ${albumData.label}</p>
                        <p><strong>가수:</strong> ${albumData.artists.map(artist => artist.name).join(", ")}</p>
                        <h3>트랙 리스트</h3>
                        <ul>
                            ${albumData.tracks.items.map(track => `
                                <li>${track.track_number}. ${track.name} (${formatDuration(track.duration_ms)})</li>
                            `).join("")}
                        </ul>
                    `;
                } catch (error) {
                    console.error("앨범 정보를 불러오는 중 오류 발생:", error);
                    newPanel.innerHTML = `
                        <h2>앨범 정보</h2>
                        <p>앨범 정보를 로드하는 중 문제가 발생했습니다.</p>
                    `;
                }
                break;

            case "rec": //추천 버튼, 추가 작업 필요
                
                break;

            case "next": //다음 트랙 버튼, 추가 작업 필요
                newPanel.innerHTML = `<h2>다음 트랙 패널</h2><p>다음 트랙 로딩 실패</p>`;
                break;

            case "art": //아티스트 버튼
                const artistId = button.dataset.artistId;
                if (artistId) {
                    const artistData = await fetchArtistDetails(artistId, accessToken);
                    newPanel.innerHTML = `
                        <h2>Artist</h2>
                        <p>${artistData.name}</p>
                        <p>${artistData.followers.total} followers</p>
                        <img src="${artistData.images[0]?.url}" style="width: 100%; max-height: 200px;">
                    `;
                } else {
                    newPanel.innerHTML = `<h2>아티스트 패널</h2><p>아티스트 로딩 실패</p>`;
                }
                break;
        }

        handlePanelTransition(newPanel, previousPanel, mainContainer); // 패널 전환 처리
        activePanel = newPanel;
        activeButton = button;
    }
});
