import {
    getPlayerInstance, 
    playTrack, 
    seekPosition, 
    savePlayerState, 
    destroyPlayer, 
    updatePlaybackUI, 
    waitForSpotifyPlayerInitialization 
} from "./player.js";

let pipSpotifyPlayer = null;
let pipDeviceId = null; // Device ID 저장

// PiP 초기화 함수
export async function initializePiP(accessToken, defaultMusic, lastPosition) {
    const pip = document.getElementById("pip");

    if (!pip) {
        console.error("PiP 요소를 찾을 수 없습니다.");
        return;
    }

    try {
        // Spotify Web Playback SDK 초기화
        pipSpotifyPlayer = await getPlayerInstance(accessToken, defaultMusic.trackID, {
            onPlayerReady: (deviceId) => {
                console.log("PiP 플레이어 준비 완료. Device ID:", deviceId);
                pipDeviceId = deviceId; // Device ID 저장
                if (lastPosition) {
                    seekPosition(lastPosition).catch(err =>
                        console.error("위치 탐색 중 오류 발생:", err)
                    );
                }
            },
            onPlayerStateChange: (state) => {
                if (state) updatePlaybackUI(state); // 상태 변경 시 UI 업데이트
            },
        });

        if (!pipDeviceId) {
            pipDeviceId = await getDeviceId();
        }

        if (!pipSpotifyPlayer) {
            await waitForSpotifyPlayerInitialization();
        }

        if (defaultMusic.trackID && pipDeviceId) {
            updatePiP(defaultMusic);
        }

        setupControlButtons();
    } catch (error) {
        console.error("PiP 초기화 중 오류 발생:", error);
    }
}

// PiP UI 정보 업데이트
export function updatePiP(music) {
    if (!music || !music.trackID || !music.trackName || !music.artistName || !music.albumImage) {
        console.error("updatePiP: 불완전한 음악 정보:", music);
        return;
    }

    const pipImage = document.querySelector("#pip .album-cover");
    const pipTitle = document.querySelector("#pip .music-info p");

    if (pipImage) {
        pipImage.src = music.albumImage || "/default/default-album.png";
        pipImage.alt = `${music.trackName} - ${music.artistName}`;
    }

    if (pipTitle) {
        pipTitle.textContent = `${music.trackName} - ${music.artistName}`;
    }

    if (pipSpotifyPlayer && pipDeviceId) {
        playTrack(pipDeviceId, localStorage.getItem("spotify_token"), music.trackID)
            .catch(err => console.error("곡 재생 중 오류 발생:", err));
    } else {
        console.error("Spotify Player 또는 Device ID가 초기화되지 않았습니다.");
    }
}

// PiP UI 제어
export function showPiP() {
    const pip = document.getElementById("pip");
    if (pip) {
        pip.style.display = "flex";
        pip.style.opacity = "1";
    }
}

export function hidePiP() {
    const pip = document.getElementById("pip");
    if (pip) {
        pip.style.display = "none";
        pip.style.opacity = "0";
    }
}

// PiP 상태 저장
export async function savePiPState(trackID, position) {
    try {
        if (!trackID) {
            console.warn("trackID가 제공되지 않았습니다. 상태를 저장할 수 없습니다.");
            return null;
        }

        const savedState = {
            trackID,
            position,
        };

        console.log("저장된 PiP 상태:", savedState);
        return savedState;
    } catch (error) {
        console.error("PiP 상태 저장 중 오류 발생:", error);
        return null;
    }
}

// PiP 이벤트 설정
export function setupControlButtons() {
    const playButton = document.querySelector(".pip-play-button");
    const progressBar = document.querySelector(".progress-bar");

    if (!playButton || !progressBar) {
        console.error("플레이어 제어 버튼 또는 진행 바를 찾을 수 없습니다.");
        return;
    }

    // 재생 버튼 이벤트
    playButton.addEventListener("click", async () => {
        try {
            const state = await pipSpotifyPlayer.getCurrentState();
            if (!state) {
                console.error("플레이어 상태를 가져올 수 없습니다.");
                return;
            }

            if (state.paused) {
                await pipSpotifyPlayer.resume();
                console.log("재생 시작");
                playButton.textContent = "⏸️";
            } else {
                await pipSpotifyPlayer.pause();
                console.log("일시정지");
                playButton.textContent = "▶️";
            }
        } catch (error) {
            console.error("재생 상태 토글 중 오류 발생:", error);
        }
    });

    // 슬라이더 이벤트
    progressBar.addEventListener("input", async () => {
        try {
            const state = await pipSpotifyPlayer.getCurrentState();
            if (state) {
                const { duration } = state;
                const seekPositionValue = Math.floor((progressBar.value / 100) * duration);

                if (!isNaN(seekPositionValue)) {
                    await seekPosition(seekPositionValue);
                    console.log(`슬라이더로 탐색: ${seekPositionValue}ms`);
                } else {
                    console.error("유효하지 않은 탐색 위치");
                }
            } else {
                console.error("플레이어 상태를 가져올 수 없습니다.");
            }
        } catch (error) {
            console.error("슬라이더 탐색 중 오류 발생:", error);
        }
    });

    console.log("PiP 제어 버튼 설정 완료");
}



/*
import { getDeviceId, initializeSpotifyWebPlaybackSDK, playTrack, seekPosition, savePlayerState, destroyPlayer, updatePlaybackUI, waitForSpotifyPlayerInitialization } from "./player.js";

let pipSpotifyPlayer = null;
let pipDeviceId = null; // Device ID 저장


// PiP 초기화 함수
export async function initializePiP(accessToken, defaultMusic, lastPosition) {
    const pip = document.getElementById("pip");

    if (!pip) {
        console.error("PiP 요소를 찾을 수 없습니다.");
        return;
    }

    try {
        // Spotify Web Playback SDK 초기화
        pipSpotifyPlayer = await initializeSpotifyWebPlaybackSDK(accessToken, defaultMusic.trackID, {
            onPlayerReady: (deviceId) => {
                console.log("PiP 플레이어 준비 완료. Device ID:", deviceId);
                pipDeviceId = deviceId; // Device ID 저장
                if (lastPosition) {
                    seekPosition(lastPosition).catch(err =>
                        console.error("위치 탐색 중 오류 발생:", err)
                    );
                }
            },
            //onPlayerStateChange: (state) => {
                //if (state) {
                //    updatePlaybackUI(state);
                //}
            //},
        });

        if (!pipDeviceId) {
            pipDeviceId = await getDeviceId();
        }

        if(!pipSpotifyPlayer) {
            await waitForSpotifyPlayerInitialization();
        }

        if (defaultMusic.trackID && pipDeviceId) {
            updatePiP(defaultMusic);
        }

        setupControlButtons();
    } catch (error) {
        console.error("PiP 초기화 중 오류 발생:", error);
    }
}

// PiP UI 정보 업데이트
export function updatePiP(music) {
    if (!music || !music.trackID || !music.trackName || !music.artistName || !music.albumImage) {
        console.error("updatePiP: 불완전한 음악 정보:", music);
        return;
    }

    const pipImage = document.querySelector("#pip .album-cover");
    const pipTitle = document.querySelector("#pip .music-info p");

    if (pipImage) {
        pipImage.src = music.albumImage || "/default/default-album.png";
        pipImage.alt = `${music.trackName} - ${music.artistName}`;
    }

    if (pipTitle) {
        pipTitle.textContent = `${music.trackName} - ${music.artistName}`;
    }

    if (pipSpotifyPlayer && pipDeviceId) {
        playTrack(pipDeviceId, localStorage.getItem("spotify_token"), music.trackID)
            .catch(err => console.error("곡 재생 중 오류 발생:", err));
    } else {
        console.error("Spotify Player 또는 Device ID가 초기화되지 않았습니다.");
    }
}

// PiP UI 제어
export function showPiP() {
    const pip = document.getElementById("pip");
    if (pip) {
        pip.style.display = "flex";
        pip.style.opacity = "1";
    }
}

export function hidePiP() {
    const pip = document.getElementById("pip");
    if (pip) {
        pip.style.display = "none";
        pip.style.opacity = "0";
    }
}

// PiP 상태 저장
export async function savePiPState(trackID, position) {
    try {
        if (!trackID) {
            console.warn("trackID가 제공되지 않았습니다. 상태를 저장할 수 없습니다.");
            return null;
        }

        const savedState = {
            trackID,
            position,
        };

        console.log("저장된 PiP 상태:", savedState);
        return savedState;
    } catch (error) {
        console.error("PiP 상태 저장 중 오류 발생:", error);
        return null;
    }
}

async function waitForPlayerReady(player, timeout = 5000) {
    const startTime = Date.now();
    while (!player || !player._options || !player._options.getOAuthToken) {
        if (Date.now() - startTime > timeout) {
            throw new Error("Player 초기화 시간 초과");
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    return true;
}

// PiP 이벤트 설정
export function setupControlButtons() {
    const playButton = document.querySelector(".pip-play-button");
    const progressBar = document.querySelector(".progress-bar");

    if (!playButton || !progressBar) {
        console.error("플레이어 제어 버튼 또는 진행 바를 찾을 수 없습니다.");
        return;
    }

    // 재생 버튼 이벤트
    playButton.addEventListener("click", async () => {
        try {
            if (!pipSpotifyPlayer) {
                console.error("Spotify Player가 초기화되지 않았습니다.");
                pipSpotifyPlayer = await waitForSpotifyPlayerInitialization();
            }

            const state = await pipSpotifyPlayer.getCurrentState();
            if (!state) {
                console.error("플레이어 상태를 가져올 수 없습니다.");
                return;
            }

            if (state.paused) {
                await pipSpotifyPlayer.resume();
                console.log("재생 시작");
                playButton.textContent = "⏸️";
            } else {
                await pipSpotifyPlayer.pause();
                console.log("일시정지");
                playButton.textContent = "▶️";
            }
        } catch (error) {
            console.error("재생 상태 토글 중 오류 발생:", error);
        }

        //if (!pipSpotifyPlayer) {
        //    console.error("Spotify Player가 초기화되지 않았습니다.");
        //     pipSpotifyPlayer = await waitForSpotifyPlayerInitialization();
        // }

        // await waitForPlayerReady(pipSpotifyPlayer);
        // pipSpotifyPlayer.togglePlay().catch(err =>
        //     console.error("재생 상태 토글 중 오류 발생:", err)
        // );
    });

    //슬라이더 이벤트
    progressBar.addEventListener("input", async () => {
        try {
            if (!pipSpotifyPlayer) {
                console.error("Spotify Player가 초기화되지 않았습니다.");
                pipSpotifyPlayer = await waitForSpotifyPlayerInitialization();
            }

            const state = await pipSpotifyPlayer.getCurrentState();
            if (state) {
                const { duration } = state;
                const seekPositionValue = Math.floor((progressBar.value / 100) * duration);

                if (!isNaN(seekPositionValue)) {
                    await seekPosition(seekPositionValue);
                    console.log(`슬라이더로 탐색: ${seekPositionValue}ms`);
                } else {
                    console.error("유효하지 않은 탐색 위치");
                }
            } else {
                console.error("플레이어 상태를 가져올 수 없습니다.");
            }
        } catch (error) {
            console.error("슬라이더 탐색 중 오류 발생:", error);
        }
        // if (!pipSpotifyPlayer) {
        //     console.error("Spotify Player가 초기화되지 않았습니다.");
        //     await waitForSpotifyPlayerInitialization();
        // }

        // pipSpotifyPlayer.getCurrentState()
        //     .then((state) => {
        //         if (state) {
        //             const { duration } = state;
        //             const seekPositionValue = (progressBar.value / 100) * duration;
        //             if (!isNaN(seekPositionValue)) {
        //                 seekPosition(seekPositionValue).catch(err =>
        //                     console.error("슬라이더 탐색 중 오류 발생:", err)
        //                 );
        //                 console.log(`슬라이더로 탐색: ${seekPositionValue}ms`);
        //             } else {
        //                 console.error("유효하지 않은 탐색 위치");
        //             }
        //         } else {
        //             console.error("플레이어 상태를 가져올 수 없습니다.");
        //         }
        //     })
        //     .catch((error) => {
        //         console.error("플레이어 상태 확인 중 오류 발생:", error);
        //     });
    });

    console.log("PiP 제어 버튼 설정 완료");
}
*/


/*
import { initializeSpotifyWebPlaybackSDK, playTrack, seekTrack, savePlayerState, destroyPlayer, updatePlaybackUI } from "./player.js";

let pipSpotifyPlayer = null;

// PiP 초기화 함수
export async function initializePiP(accessToken, defaultMusic, lastPosition) {
    const pip = document.getElementById("pip");

    if (!pip) {
        console.error("PiP 요소를 찾을 수 없습니다.");
        return;
    }

    pipSpotifyPlayer = await initializeSpotifyWebPlaybackSDK(accessToken, defaultMusic.trackID, {
        onPlayerReady: (deviceId) => {
            console.log("PiP 플레이어 준비 완료. Device ID:", deviceId);
            if (lastPosition) {
                seekTrack(lastPosition);
            }
        },
        onPlayerStateChange: (state) => {
            if (state) {
                updatePlaybackUI(state);
            }
        },
    });

    if (defaultMusic.trackID) {
        updatePiP(defaultMusic);
    }
}

// PiP UI 정보 업데이트
export function updatePiP(music) {
    if (!music || !music.trackID || !music.trackName || !music.artistName || !music.albumImage) {
        console.error("updatePiP: 불완전한 음악 정보:", music);
        return;
    }

    const pipImage = document.querySelector("#pip .album-cover");
    const pipTitle = document.querySelector("#pip .music-info p");

    if (pipImage) {
        pipImage.src = music.albumImage || "/default/default-album.png";
        pipImage.alt = `${music.trackName} - ${music.artistName}`;
    }

    if (pipTitle) {
        pipTitle.textContent = `${music.trackName} - ${music.artistName}`;
    }

    if (pipSpotifyPlayer) {
        //playTrack(pipSpotifyPlayer.deviceId, music.trackID);
        getDeviceId()
            .then((deviceId) => {
                if (deviceId) {
                    playTrack(deviceId, localStorage.getItem("spotify_token"), music.trackID);
                } else {
                    console.error("Device ID를 가져올 수 없습니다.");
                }
            })
            .catch((error) => {
                console.error("Device ID 가져오기 실패:", error);
            });
    }
}

// PiP UI 제어
export function showPiP() {
    const pip = document.getElementById("pip");
    if (pip) {
        pip.style.display = "flex";
        pip.style.opacity = "1";
    }
}

export function hidePiP() {
    const pip = document.getElementById("pip");
    if (pip) {
        pip.style.display = "none";
        pip.style.opacity = "0";
    }
}

// PiP 상태 저장
export async function savePiPState() {
    const state = await savePlayerState();
    if (state) {
        console.log("PiP 상태 저장 완료:", state);
        return state;
    }
    return null;
}

// PiP 이벤트 설정
export function setupControlButtons() {
    const playButton = document.querySelector(".pip-play-button");
    const progressBar = document.querySelector(".progress-bar");

    if (!playButton || !progressBar) {
        console.error("플레이어 제어 버튼 또는 진행 바를 찾을 수 없습니다.");
        return;
    }

    playButton.addEventListener("click", () => {
        if (pipSpotifyPlayer) pipSpotifyPlayer.togglePlay();
        else console.error("Spotify Player가 초기화되지 않았습니다.");
    });

    progressBar.addEventListener("input", () => {
        if (!pipSpotifyPlayer) {
            console.error("Spotify Player가 초기화되지 않았습니다.");
            return;
        }

        pipSpotifyPlayer.getCurrentState().then((state) => {
            if (state) {
                const { duration } = state;
                const seekPosition = (progressBar.value / 100) * duration;
                if (!isNaN(seekPosition)) {
                    seekTrack(seekPosition);
                    console.log(`슬라이더로 탐색: ${seekPosition}ms`);
                } else {
                    console.error("유효하지 않은 탐색 위치");
                }
            } else {
                console.error("플레이어 상태를 가져올 수 없습니다.");
            }
        });
    });

    console.log("PiP 제어 버튼 설정 완료");
}
*/







/*
import { initializeSpotifyPlayer } from "./player";

export class SpotifyPlayer {
    constructor(accessToken) {
        this.accessToken = accessToken;
        this.player = null;
        this.deviceId = null;
    }

    // Spotify Web Playback SDK 초기화
    async initPlayer() {
        return new Promise((resolve, reject) => {
            if (!window.Spotify || !window.onSpotifyWebPlaybackSDKReady) {
                console.error("Spotify Web Playback SDK가 로드되지 않았습니다.");
                return reject("SDK 미로드");
            }

            this.player = new Spotify.Player({
                name: "Web Playback SDK",
                getOAuthToken: cb => cb(this.accessToken),
                volume: 0.3,
            });

            // 준비 완료 이벤트
            this.player.addListener("ready", ({ device_id }) => {
                this.deviceId = device_id;
                console.log("Spotify Player 준비 완료, Device ID:", this.deviceId);
                resolve(this.player);
            });

            // 준비되지 않은 이벤트
            this.player.addListener("not_ready", ({ device_id }) => {
                console.warn("Spotify Player 준비되지 않음, Device ID:", device_id);
            });

            // 상태 변경 이벤트
            this.player.addListener("player_state_changed", state => {
                if (state) {
                    this.updatePlaybackUI(state);
                }
            });

            this.player.connect().catch(err => {
                console.error("Spotify Player 연결 실패:", err);
                reject(err);
            });
        });
    }

    destroyPlayer() {
        if (this.player) {
            this.player.disconnect();
            console.log("Spotify Player 해제 완료");
            this.player = null;
        }
    }

    // 곡 재생
    async play(trackUri) {
        if (!this.deviceId) {
            console.error("Device ID를 찾을 수 없습니다.");
            return;
        }

        try {
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ uris: [trackUri] }),
            });
            console.log("재생 시작:", trackUri);
        } catch (error) {
            console.error("곡 재생 중 오류 발생:", error);
        }
    }

    // 탐색
    async seek(positionMs) {
        if (!this.player) {
            console.error("Player가 초기화되지 않았습니다.");
            return;
        }

        try {
            await this.player.seek(positionMs);
            console.log(`위치로 이동: ${positionMs}ms`);
        } catch (error) {
            console.error("탐색 중 오류 발생:", error);
        }
    }

    // 재생 상태 UI 업데이트
    updatePlaybackUI(state) {
        const { position, duration, paused } = state;
        const progressBar = document.querySelector(".progress-bar");
        const playButton = document.querySelector(".pip-play-button");
        const escapePipButton = document.querySelector(".escape-pip-button");

        if (progressBar) {
            progressBar.value = duration ? (position / duration) * 100 : 0;
        }

        if (playButton) {
            playButton.textContent = paused ? "▶️" : "⏸️";
        }

        
        escapePipButton.addEventListener("click", () => {
            gotoDetail()
        })
        
    }

    // 재생 상태 토글
    async togglePlay() {
        if (!this.player) {
            console.error("Player가 초기화되지 않았습니다.");
            return;
        }

        try {
            await this.player.togglePlay();
        } catch (error) {
            console.error("재생 상태 토글 중 오류 발생:", error);
        }
    }
}

let spotifyPlayer = null;

export async function initializePiP(accessToken, defaultMusic, lastPosition) {
    console.log(lastPosition);

    const pip = document.getElementById("pip");

    spotifyPlayer = await initializeSpotifyPlayer(accessToken);
    
    if (defaultMusic.trackID) {

        updatePiP(defaultMusic);

        if (lastPosition) {
            spotifyPlayer.seek(lastPosition);
        }
    }
}

// PiP 정보 업데이트
export function updatePiP(music) {
    if (!music || !music.trackID || !music.trackName || !music.artistName || !music.albumImage) {
        console.error("updatePiP: 불완전한 음악 정보:", music);
        return;
    }

    const pipImage = document.querySelector("#pip .album-cover");
    const pipTitle = document.querySelector("#pip .music-info p");

    pipImage.src = music.albumImage || "/default/default-album.png";
    pipImage.alt = `${music.trackName} - ${music.artistName}`;
    pipTitle.textContent = `${music.trackName} - ${music.artistName}`;

    if (spotifyPlayer) {
        spotifyPlayer.play(`spotify:track:${music.trackID}`);
    }
}

function setupControlButtons() {
    const playButton = document.querySelector(".pip-play-button");
    const progressBar = document.querySelector(".progress-bar");

    // 기존 리스너 제거 및 클론
    const newPlayButton = playButton.cloneNode(true);
    const newProgressBar = progressBar.cloneNode(true);

    playButton.replaceWith(newPlayButton);
    progressBar.replaceWith(newProgressBar);

    // 새 버튼 리스너 설정
    newPlayButton.addEventListener("click", () => {
        if (spotifyPlayer) spotifyPlayer.togglePlay();
        else console.error("SpotifyPlayer가 초기화되지 않았습니다.");
    });

    // 슬라이더 입력으로 탐색
    newProgressBar.addEventListener("input", () => {
        if (!spotifyPlayer || !spotifyPlayer.player) {
            console.error("SpotifyPlayer가 초기화되지 않았습니다.");
            return;
        }

        spotifyPlayer.player.getCurrentState().then((state) => {
            if (state) {
                const { duration } = state;
                const seekPosition = (newProgressBar.value / 100) * duration;
                if (!isNaN(seekPosition)) {
                    spotifyPlayer.seek(seekPosition);
                    console.log(`슬라이더로 탐색: ${seekPosition}ms`);
                } else {
                    console.error("유효하지 않은 탐색 위치");
                }
            } else {
                console.error("플레이어 상태를 가져올 수 없습니다.");
            }
        }).catch((error) => {
            console.error("getCurrentState 호출 중 오류 발생:", error);
        });
    });

    // 진행바 상태 주기적 업데이트
    setInterval(() => {
        if (spotifyPlayer && spotifyPlayer.player) {
            spotifyPlayer.player.getCurrentState().then((state) => {
                if (state) {
                    const { position, duration } = state;
                    newProgressBar.value = duration ? (position / duration) * 100 : 0;
                }
            }).catch((error) => {
                console.error("플레이어 상태 업데이트 중 오류 발생:", error);
            });
        }
    }, 1000);
}

// PiP UI 제어
export function showPiP() {
    const pip = document.getElementById("pip");
    pip.style.display = "flex";
    pip.style.opacity = "1";
}

export function hidePiP() {
    const pip = document.getElementById("pip");
    pip.style.display = "none";
    pip.style.opacity = "0";
}
*/