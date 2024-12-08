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

        player.addListener('ready', ({ device_id }) => {
            playTrack(device_id, token, trackId);
        });

        player.addListener('player_state_changed', state => {
            if (state) {
                updatePlaybackUI(state); // 재생 상태 UI 업데이트
            }
        });

        player.connect();

        playButton.addEventListener("click", () => {
            player.togglePlay();
        });

        progressBar.addEventListener("input", () => {
            player.getCurrentState().then(state => {
                if (state) {
                    const { duration } = state;
                    const seekPosition = (progressBar.value / 100) * duration;
                    player.seek(seekPosition);
                }
            });
        });
    };

    loadTrackDetails(trackId, accessToken);

    sideButtons.forEach(button => {
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
                    uris: [`spotify:track:${trackUri}`]
                })
            });
            console.log("곡 재생 시작");
        } catch (error) {
            console.error("곡 재생 중 오류 발생:", error);
        }
    }

    async function loadTrackDetails(trackId, accessToken) {
        try {
            const trackData = await fetchTrackDetails(trackId, accessToken);
            updateTrackDetailsUI(trackData); // 곡 정보 UI 업데이트
        } catch (error) {
            console.error("트랙 정보 요청 중 오류 발생:", error);
        }
    }

    async function handlePanelClick(button, trackId, accessToken) {
        if (activeButton === button) {
            closeActivePanel(activePanel, activeButton, mainContainer);
            return;
        }

        const previousPanel = activePanel;
        const newPanel = createPanel(button.innerText);

        switch (button.id) {
            case "alb": //앨범 버튼
                try {
                    const albumId = button.dataset.albumId;
                    const albumData = await fetchAlbumDetails(albumId, accessToken);
                    // 앨범 데이터 가져오기
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

            case "rec": //추천 버튼
                
                break;

            case "next": //다음 트랙 버튼
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
