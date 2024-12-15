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
async function initializePlayback() {
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

                playTrack(deviceId, accessToken, trackID, 0 ).catch((err) =>
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

        await initializePlayback();
        updateTrackDetailsUI(trackData);
    } catch (error) {
        console.error("트랙 데이터 로드 중 오류 발생:", error);
    }

    // Play/Pause 버튼 클릭 이벤트 설정
    playButton.addEventListener("click", async () => {
        if (!spotifyPlayer) {
            // Spotify Player가 초기화되지 않았을 경우 초기화 수행
            await initializePlayback();
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

    // 슬라이더 탐색 이벤트 설정
    // progressBar.addEventListener("input", async (event) => {
    //     if (!spotifyPlayer) {
    //         console.error("Spotify Player가 초기화되지 않았습니다.");
    //         return;
    //     }
    //     await handleSeek(event, spotifyPlayer);
    // });

    // 슬라이더 탐색 이벤트 설정
    // progressBar.addEventListener("input", async (event) => {
    //     if (spotifyPlayer) {
    //         const duration = await spotifyPlayer.getDuration();
    //         const seekPositionMs = (event.target.value / 100) * duration;
    //         await seekPosition(seekPositionMs).catch((err) =>
    //             console.error("위치 탐색 중 오류 발생:", err)
    //         );
    //     }
    // });

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

            case "pip":
                returnToPreviousPage();
                return;
        }

        handlePanelTransition(newPanel, previousPanel, mainContainer); // 패널 전환 처리
        activePanel = newPanel;
        activeButton = button;
    }
});



/*
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
    initializeSpotifyWebPlaybackSDK,
    playTrack,
    seekPosition,
    savePlayerState,
    destroyPlayer,
} from './player.js';

let spotifyPlayer = null; // Spotify Player 인스턴스
let deviceId = null; // Device ID 저장
let accessToken = null;
let trackID = null;
let returnPage = null;

// 재생 관련 초기화 함수
async function initializePlayback() {
    try {
        if (!accessToken) {
            accessToken = getAccessToken();
            if (!accessToken) {
                throw new Error("액세스 토큰을 가져오지 못했습니다.");
            }
        }

        spotifyPlayer = await initializeSpotifyWebPlaybackSDK(accessToken, trackID, {
            onPlayerReady: (id) => {
                console.log("Spotify Player 준비 완료. Device ID:", id);
                deviceId = id;
                playTrack(deviceId, accessToken, trackID);
            },
            onPlayerStateChange: (state) => {
                if (state) updatePlaybackUI(state);
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
        //destroyPlayer();
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

        updateTrackDetailsUI(trackData);
    } catch (error) {
        console.error("트랙 데이터 로드 중 오류 발생:", error);
    }

    // Play/Pause 버튼 클릭 이벤트 설정
    playButton.addEventListener("click", async () => {
        if (!spotifyPlayer) {
            await initializePlayback();
        } else {
            const state = await spotifyPlayer.getCurrentState();
            if (state?.paused) {
                await spotifyPlayer.resume();
                playButton.textContent = "⏸️";
            } else {
                await spotifyPlayer.pause();
                playButton.textContent = "▶️";
            }
        }
    });

    // 슬라이더 탐색 이벤트 설정
    progressBar.addEventListener("input", async (event) => {
        const seekPositionMs = (event.target.value / 100) * spotifyPlayer.getDuration();
        await seekPosition(seekPositionMs).catch((err) =>
            console.error("위치 탐색 중 오류 발생:", err)
        );
    });

    //버튼들에 패널 클릭 이벤트 할당
    sideButtons.forEach(button => {
        button.addEventListener("click", (event) => handlePanelClick(event.currentTarget, trackID, accessToken));
    });

    //패널 클릭 이벤트
    async function handlePanelClick(button, trackID, accessToken) {
        if (activeButton === button) {
            closeActivePanel(activePanel, activeButton, mainContainer);
            return;
        }

        const previousPanel = activePanel; //이전 패널 저장
        const newPanel = createPanel(button.innerText); //새 패널 생성

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
            case "pip":
                returnToPreviousPage();
                return;
        }

        handlePanelTransition(newPanel, previousPanel, mainContainer); // 패널 전환 처리
        activePanel = newPanel;
        activeButton = button;
    }
});
*/




/*
import {
    playButton,
    progressBar,
    updateTrackDetailsUI,
    updatePlaybackUI,
    createPanel,
    closeActivePanel,
    handlePanelTransition,
    formatDuration,
    artistName
} from './detail_ui.js';
import { fetchTrackDetails, fetchArtistDetails, fetchAlbumDetails, fetchRecommendations, getAccessToken } from './api.js';
import { showPiP } from './pip.js';
import { initializeSpotifyWebPlaybackSDK, playTrack, savePlayerState, seekPosition, destroyPlayer } from './player.js';


document.addEventListener("DOMContentLoaded", async () => {
    const sideButtons = document.querySelectorAll(".side-buttons button");
    const mainContainer = document.querySelector(".main-container");

    let activePanel = null; // 현재 활성 패널
    let activeButton = null; // 현재 활성 버튼

    const urlParams = new URLSearchParams(window.location.search);
    const trackID = urlParams.get("trackID") || "5WYgNDkw0VsDIZwfwQWlXp"; // URL에서 trackID 추출
    const returnPage = urlParams.get("returnPage") || "/index.html"; // URL에서 returnPage 추출 - pip 연결을 위함

    console.log(trackID, returnPage);

    if (!trackID) {
        console.error("트랙 ID가 없습니다.");
        //alert("트랙 ID가 누락되었습니다. 메인 페이지로 돌아가주세요.");
        return;
    }

    let accessToken;
    let spotifyPlayer;
    let deviceId;

    // 액세스 토큰 가져오기 및 초기화
    try {
        accessToken = getAccessToken();
        if (!accessToken) {
            throw new Error("액세스 토큰을 가져오지 못했습니다.");
        }

        // Spotify Player 초기화
        spotifyPlayer = await initializeSpotifyWebPlaybackSDK(accessToken, trackID, {
            onPlayerReady: (id) => {
                console.log("플레이어 준비 완료. Device ID:", id);
                deviceId = id;
                playTrack(deviceId, accessToken, trackID);
            },
            onPlayerStateChange: (state) => {
                if (state) updatePlaybackUI(state); // 상태 변경 시 UI 업데이트
            },
        });

        const trackData = await fetchTrackDetails(trackID, accessToken);
        if (!trackData || !trackData.album || !trackData.artists) {
            throw new Error("트랙 데이터가 비정상적입니다.");
        }

        updateTrackDetailsUI(trackData); // UI 업데이트

    } catch (error) {
        console.error("초기화 중 오류 발생:", error);
        return;
    }

    // Play/Pause 버튼 이벤트
    playButton.addEventListener("click", async () => {
        if (!spotifyPlayer) return;
        const state = await spotifyPlayer.getCurrentState();
        if (state?.paused) {
            await spotifyPlayer.resume();
            console.log("재생 시작");
            playButton.textContent = "⏸️";
        } else {
            await spotifyPlayer.pause();
            console.log("일시 정지");
            playButton.textContent = "▶️";
        }
    });

    // 슬라이더 탐색 이벤트 설정
    progressBar.addEventListener("input", async (event) => {
        const positionMs = (event.target.value / 100) * spotifyPlayer.getDuration();
        await seekPosition(positionMs).catch(err => console.error("위치 탐색 중 오류 발생:", err));
    });

    async function returnToPreviousPage() {
        try {
            const currentState = await savePlayerState();
            const lastPosition = currentState ? currentState.position : 0;

            const music = {
                trackID: currentState?.track_window?.current_track?.id || "",
                albumImage: currentState?.track_window?.current_track?.album?.images[0]?.url || "/default/default-album.png",
                trackName: currentState?.track_window?.current_track?.name || "Unknown Track",
                artistName: currentState?.track_window?.current_track?.artists?.map(a => a.name).join(", ") || "Unknown Artist",
            };

            if (!music.trackID) {
                console.error("트랙 ID가 누락되었습니다. 이전 페이지로 돌아갈 수 없습니다.");
                return;
            }

            const params = new URLSearchParams({
                fromDetail: "true",
                trackID: encodeURIComponent(music.trackID),
                lastPosition,
                albumImage: encodeURIComponent(music.albumImage),
                trackName: encodeURIComponent(music.trackName),
                artistName: encodeURIComponent(music.artistName),
            });

            console.log("Returning to", returnPage, "with params:", params.toString());
            destroyPlayer();

            const returnUrl = `${returnPage}?${params.toString()}`;
            window.location.href = returnUrl;
        } catch (error) {
            console.error("이전 페이지로 돌아가는 중 오류 발생:", error);
        }
    }

    //곡 정보 불러오기
    loadTrackDetails(trackID, accessToken); 

    //버튼들에 패널 클릭 이벤트 할당
    sideButtons.forEach(button => {
        button.addEventListener("click", (event) => handlePanelClick(event.currentTarget, trackID, accessToken));
    });

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
            case "pip":
                returnToPreviousPage();
                return;
        }

        handlePanelTransition(newPanel, previousPanel, mainContainer); // 패널 전환 처리
        activePanel = newPanel;
        activeButton = button;
    }
});
*/

/*
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
import { initializeSpotifyPlayer } from "./player";

document.addEventListener("DOMContentLoaded", async () => {
    const sideButtons = document.querySelectorAll(".side-buttons button");
    const mainContainer = document.querySelector(".main-container");

    let activePanel = null; // 현재 활성 패널
    let activeButton = null; // 현재 활성 버튼

    const urlParams = new URLSearchParams(window.location.search);
    const trackID = urlParams.get("trackID"); // URL에서 trackID 추출

    if (!trackID) {
        console.error("트랙 ID가 없습니다.");
        return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
        console.error("액세스 토큰을 가져오지 못했습니다.");
        return;
    }

    // Spotify Player 초기화
    const playerInstance = await initializeSpotifyPlayer(accessToken);

    try {
        const trackData = await fetchTrackDetails(trackID, accessToken);
        console.log("Track Data:", trackData);
        updateTrackDetailsUI(trackData); // UI 업데이트

        // 곡 재생
        if (playerInstance && playerInstance.player) {
            await playerInstance.player.play(`spotify:track:${trackID}`);
        }
    } catch (error) {
        console.error("트랙 정보 로드 중 오류 발생:", error.message);
    }

    // 버튼 이벤트 등록
    sideButtons.forEach(button => {
        button.addEventListener("click", async (event) => {
            handlePanelClick(event.currentTarget, trackID, accessToken, spotifyPlayer);
        });
    });

    // 특정 곡 재생
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

    // 패널 클릭 이벤트 처리
    async function handlePanelClick(button, trackID, accessToken, spotifyPlayer) {
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

        
        // result 페이지로 이동
        async function navigateToResult(player, accessToken) {
            const savedState = await savePlayerState(player);

            if (savedState) {
                const queryParams = new URLSearchParams({
                    fromDetail: true,
                    trackID: savedState.trackID || "",
                    lastPosition: savedState.position || 0,
                    albumImage: encodeURIComponent(savedState.albumImage),
                    trackName: encodeURIComponent(savedState.trackName),
                    artistName: encodeURIComponent(savedState.artistName),
                });

                const resultURL = `/result.html?${queryParams.toString()}`;
                console.log("Result 페이지로 이동:", resultURL);

                // 이동 전 Spotify Player 해제
                //player.disconnect();
                //spotifyPlayer = null; // 전역 참조 해제

                window.location.href = resultURL; // 이동
            } else {
                console.error("Result 페이지로 이동 중 저장할 상태를 찾지 못했습니다.");
            }
}


        // 버튼 ID에 따라 다른 작업 수행
        switch (button.id) {
            case "alb": // 앨범 버튼
                try {
                    const albumId = button.dataset.albumId;
                    const albumData = await fetchAlbumDetails(albumId, accessToken);
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

            case "rec": // 추천 버튼
                // 추천 로직 추가 필요
                newPanel.innerHTML = `<h2>추천 패널</h2>`;
                break;

            case "art": // 아티스트 버튼
                try {
                    const artistId = button.dataset.artistId;
                    const artistData = await fetchArtistDetails(artistId, accessToken);
                    newPanel.innerHTML = `
                        <h2>Artist</h2>
                        <p>${artistData.name}</p>
                        <p>${artistData.followers.total} followers</p>
                        <img src="${artistData.images[0]?.url}" style="width: 100%; max-height: 200px;">
                    `;
                } catch (error) {
                    console.error("아티스트 정보를 불러오는 중 오류 발생:", error);
                    newPanel.innerHTML = `<h2>아티스트 패널</h2><p>아티스트 정보를 로드하는 데 실패했습니다.</p>`;
                }
                break;

            case "pip": // PiP 전환 버튼
                if (spotifyPlayer && spotifyPlayer.player) {
                    await navigateToResult(spotifyPlayer.player, accessToken);
                } else {
                    console.error("Spotify Player가 초기화되지 않았습니다.");
                }
                /*
                const currentPosition = await spotifyPlayer.player.getCurrentState().then((state) => {
                    return state?.position || 0;
                });

                const resultURL = `/result.html?fromDetail=true&trackID=${encodeURIComponent(trackID)}&lastPosition=${currentPosition}&albumImage=${encodeURIComponent(albumImage)}&trackName=${encodeURIComponent(trackName)}&artistName=${encodeURIComponent(artistName)}`;
                window.location.href = resultURL;
                return;
                
        }

        handlePanelTransition(newPanel, previousPanel, mainContainer); // 패널 전환 처리
        activePanel = newPanel;
        activeButton = button;
    }
});
*/



/*
import {
    playButton,
    progressBar,
    updateTrackDetailsUI,
    updatePlaybackUI,
    createPanel,
    closeActivePanel,
    handlePanelTransition,
    formatDuration,
    artistName
} from './detail_ui.js';
import { fetchTrackDetails, fetchArtistDetails, fetchAlbumDetails, fetchRecommendations, getAccessToken } from './api.js';
import { showPiP } from './pip.js';


document.addEventListener("DOMContentLoaded", () => {
    const sideButtons = document.querySelectorAll(".side-buttons button");
    const mainContainer = document.querySelector(".main-container");

    let activePanel = null; // 현재 활성 패널
    let activeButton = null; // 현재 활성 버튼

    //const trackId = "5WYgNDkw0VsDIZwfwQWlXp"; //"7pT6WSg4PCt4mr5ZFyUfsF" // 예제 곡 ID

    const urlParams = new URLSearchParams(window.location.search);
    const trackID = urlParams.get("trackID") || "5WYgNDkw0VsDIZwfwQWlXp"; // URL에서 trackID 추출
    const returnPage = urlParams.get("returnPage") || "/index.html"; // URL에서 returnPage 추출 - pip 연결을 위함

    console.log(trackID, returnPage);

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

        //console.log("Access Token:", accessToken);

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
    
    let player = null;

    //프리미엄 api 초기화
    window.onSpotifyWebPlaybackSDKReady = () => {
        const token = localStorage.getItem("spotify_token");
        player = new Spotify.Player({
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

    function destroyPlayer() {
        if (player) {
            player.disconnect(); // 플레이어 연결 해제
            console.log("Spotify Player 연결 해제 완료");
            player = null; // 참조 제거
        }
    }

    async function returnToPreviousPage(player, returnPage) {
            try {
                // 플레이어 상태 가져오기
                const currentState = await player.getCurrentState();
                const lastPosition = currentState ? currentState.position : 0;
        
                // 현재 재생 중인 곡 정보 추출
                const music = {
                    trackID: currentState?.track_window?.current_track?.id || "",
                    albumImage: currentState?.track_window?.current_track?.album?.images[0]?.url || "/default/default-album.png",
                    trackName: currentState?.track_window?.current_track?.name || "Unknown Track",
                    artistName: currentState?.track_window?.current_track?.artists?.map(artist => artist.name).join(", ") || "Unknown Artist",
                };
        
                // 곡 정보가 없으면 리턴하지 않음
                if (!music.trackID) {
                    console.error("트랙 ID가 누락되었습니다. 이전 페이지로 돌아갈 수 없습니다.");
                    return;
                }

                console.log(music.trackID, music.albumImage, music.trackName, music.artistName);

                console.log("Encoded trackID:", encodeURIComponent(music.trackID));
                console.log("Encoded albumImage:", encodeURIComponent(music.albumImage));
        
                // URL에 파라미터 추가
                const params = new URLSearchParams({
                    fromDetail: "true",
                    trackID: encodeURIComponent(music.trackID),
                    lastPosition,
                    albumImage: encodeURIComponent(music.albumImage),
                    trackName: encodeURIComponent(music.trackName),
                    artistName: encodeURIComponent(music.artistName),
                });

                if(!returnPage){
                    console.warn("returnPage가 제공되지 않았습니다. 기본값으로 설정합니다.");
                    returnPage = "/index.html"; // 기본값 설정
                }

                console.log("Returning to", returnPage);
                console.log("With params", params.toString());
        
                const returnUrl = `${returnPage}?${params.toString()}`;

                console.log(returnUrl);

                destroyPlayer();

                // 이전 페이지로 이동
                window.location.href = `${returnPage}?${params.toString()}`;
            } catch (error) {
                console.error("이전 페이지로 돌아가는 중 오류 발생:", error);
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
            case "pip":
                returnToPreviousPage(player, returnPage);
                return;
        }

        handlePanelTransition(newPanel, previousPanel, mainContainer); // 패널 전환 처리
        activePanel = newPanel;
        activeButton = button;
    }
});
*/