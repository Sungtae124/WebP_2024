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

        if (progressBar) {
            progressBar.value = duration ? (position / duration) * 100 : 0;
        }

        if (playButton) {
            playButton.textContent = paused ? "▶️" : "⏸️";
        }
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

// PiP 초기화 및 컨트롤 설정
export async function initializePiP(accessToken, defaultMusic) {
    const pip = document.getElementById("pip");

    if (!accessToken) {
        console.error("Access Token이 필요합니다.");
        return;
    }

    // SpotifyPlayer 초기화
    if (!spotifyPlayer) {
        try {
            spotifyPlayer = new SpotifyPlayer(accessToken);
            await spotifyPlayer.initPlayer();
        } catch (error) {
            console.error("Spotify Player 초기화 실패:", error);
            return;
        }
    }

    if (defaultMusic) {
        updatePiP(defaultMusic);
        pip.style.display = "flex";
        pip.style.opacity = "1";
    } else {
        pip.style.display = "none";
    }

    setupControlButtons();
}

// PiP 정보 업데이트
export function updatePiP(music) {
    const pipImage = document.querySelector("#pip .album-cover");
    const pipTitle = document.querySelector("#pip .music-info p");

    if (!music) {
        console.error("PiP 업데이트를 위한 음악 정보가 없습니다.");
        return;
    }

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