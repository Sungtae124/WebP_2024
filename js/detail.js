import {
    playButton,
    progressBar,
    updateTrackDetailsUI,
    updatePlaybackUI,
    createPanel,
    closeActivePanel,
    handlePanelTransition,
    formatDuration,
} from './detail_ui.js';
import { fetchTrackDetails, fetchArtistDetails, fetchAlbumDetails, getAccessToken } from './api.js';
import {
    getPlayerInstance,
    playTrack,
    seekPosition,
    savePlayerState,
    
} from './player.js';

let spotifyPlayer = null; // Spotify Player 인스턴스
let deviceId = null; // Device ID 저장
let accessToken = null;
let trackID = null;
let returnPage = null;

// 재생 관련 초기화 함수
async function initializePlayback(lastPosition) {
    try {
        if (!accessToken) {
            accessToken = getAccessToken();
            if (!accessToken) {
                throw new Error("액세스 토큰을 가져오지 못했습니다.");
            }
        }

        // Spotify Web Playback SDK 초기화
        spotifyPlayer = await getPlayerInstance(accessToken, trackID, {
            onPlayerReady: async (id) => {
                console.log("Spotify Player 준비 완료. Device ID:", id);
                deviceId = id;

                playTrack(deviceId, accessToken, trackID, lastPosition ).catch((err) =>
                    console.error("곡 재생 중 오류 발생:", err)
                );
            },
            onPlayerStateChange: (state) => {
                if (state) updatePlaybackUI(state); // 상태 변경 시 UI 업데이트
            },
        });
    } catch (error) {
        console.error("Spotify Player 초기화 중 오류 발생:", error);
    }
}

// "이전으로" 버튼 이벤트 함수
async function returnToPreviousPage() {
    try {
        const state = await savePlayerState();
        console.log(state);

        const params = new URLSearchParams({
            fromDetail: "true",
            trackID: encodeURIComponent(state.trackID),
            lastPosition: state.position,
            albumImage: encodeURIComponent(state.albumImage),
            trackName: encodeURIComponent(state.trackName),
            artistName: encodeURIComponent(state.artistName),
        });

        const returnUrl = `${returnPage}?${params.toString()}`;
        console.log(returnUrl);
        // destroyPlayer(); // 필요 시 활성화
        window.location.href = returnUrl;
    } catch (error) {
        console.error("이전 페이지로 돌아가는 중 오류 발생:", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const sideButtons = document.querySelectorAll(".side-buttons button");
    const mainContainer = document.querySelector(".main-container");

    let activePanel = null;
    let activeButton = null;

    const urlParams = new URLSearchParams(window.location.search);
    trackID = urlParams.get("trackID") || "5WYgNDkw0VsDIZwfwQWlXp";
    returnPage = urlParams.get("returnPage") || "/index.html";
    const fromReturnPage = urlParams.get("fromReturnPage") || false;
    const lastPosition = fromReturnPage ? urlParams.get("lastPosition") || 0 : 0;

    if(fromReturnPage) {
        const albumImage = decodeURIComponent(urlParams.get("albumImage") || "/default/default-album.png");
        const trackName = decodeURIComponent(urlParams.get("trackName") || "Unknown Track");
        const artistName = decodeURIComponent(urlParams.get("artistName") || "Unknown Artist");

        console.log("Detail 페이지로 전달된 데이터:", {
            trackID,
            lastPosition,
            albumImage,
            trackName,
            artistName,
        });

        if (!trackID) {
            console.error("트랙 ID가 누락되었습니다.");
            return;
        }

        try {
            await initializePlayback(lastPosition);
            // UI 업데이트
            updateTrackDetailsUI({ trackName, artistName, albumImage });
        } catch (error) {
            console.error("Detail 페이지 초기화 중 오류 발생:", error);
        }
    }

    if (!trackID) {
        console.error("트랙 ID가 없습니다.");
        return;
    }

    try {
        accessToken = getAccessToken();
        if (!accessToken) {
            throw new Error("액세스 토큰을 가져오지 못했습니다.");
        }

        const trackData = await fetchTrackDetails(trackID, accessToken);
        if (!trackData) {
            throw new Error("트랙 데이터를 가져오지 못했습니다.");
        }

        await initializePlayback(0);
        updateTrackDetailsUI(trackData);
    } catch (error) {
        console.error("트랙 데이터 로드 중 오류 발생:", error);
    }

    // Play/Pause 버튼 클릭 이벤트 설정
    playButton.addEventListener("click", async () => {
        if (!spotifyPlayer) {
            // Spotify Player가 초기화되지 않았을 경우 초기화 수행
            await initializePlayback(0);
        } else {
            // 재생 상태 토글
            try {
                const state = await spotifyPlayer.getCurrentState();
                if (state?.paused) {
                    await spotifyPlayer.resume();
                    playButton.textContent = "⏸️"; // UI 업데이트
                } else {
                    await spotifyPlayer.pause();
                    playButton.textContent = "▶️"; // UI 업데이트
                }
            } catch (error) {
                console.error("재생 상태 토글 중 오류 발생:", error);
            }
        }
    });

    //슬라이더를 움직이면
    progressBar.addEventListener("input", () => {
        spotifyPlayer.getCurrentState().then(state => {
            if (state) {
                const { duration } = state;
                const seekPosition = (progressBar.value / 100) * duration; //이동 위치
                spotifyPlayer.seek(seekPosition); //해당 위치로 이동
            }
        });
    });

    // 버튼들에 패널 클릭 이벤트 할당
    sideButtons.forEach((button) => {
        button.addEventListener("click", (event) =>
            handlePanelClick(event.currentTarget, trackID, accessToken)
        );
    });

    // 패널 클릭 이벤트
    async function handlePanelClick(button, trackID, accessToken) {
        if (activeButton === button) {
            closeActivePanel(activePanel, activeButton, mainContainer);
            return;
        }

        const previousPanel = activePanel; // 이전 패널 저장
        const newPanel = createPanel(button.innerText); // 새 패널 생성

        let albumImage = "/default/default-album.png";
        let trackName = "Unknown Track";
        let artistName = "Unknown Artist";

        try {
            const trackData = await fetchTrackDetails(trackID, accessToken);
            albumImage = trackData.album.images[0]?.url || albumImage;
            trackName = trackData.name || trackName;
            artistName = trackData.artists[0]?.name || artistName;
        } catch (error) {
            console.error("트랙 데이터를 가져오는 중 오류 발생:", error);
        }

        // 버튼 id에 따라 다른 작업 수행
        switch (button.id) {
            case "alb": // 앨범 버튼
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
                        <p><strong>가수:</strong> ${albumData.artists.map((artist) => artist.name).join(", ")}</p>
                        <h3>트랙 리스트</h3>
                        <ul>
                            ${albumData.tracks.items
                                .map(
                                    (track) => `
                                <li>${track.track_number}. ${track.name} (${formatDuration(
                                        track.duration_ms
                                    )})</li>
                            `
                                )
                                .join("")}
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

            case "pip":
                returnToPreviousPage();
                return;
        }

        handlePanelTransition(newPanel, previousPanel, mainContainer); // 패널 전환 처리
        activePanel = newPanel;
        activeButton = button;
    }
});